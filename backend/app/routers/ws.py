import asyncio
import copy
import time
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.shell.connection_manager import ConnectionManager
from app.shell.room_manager import RoomManager
from app.shell.models import Player

router = APIRouter()
connection_manager = ConnectionManager()
room_manager = RoomManager()

# Background task storage per room
_room_timers: dict[str, asyncio.Task] = {}
_room_uno_tasks: dict[str, asyncio.Task] = {}


def _make_room_payload(room_code: str, players, host_id: str, game_state, game_id, status: str) -> dict:
    """Build a consistent ROOM_UPDATE payload, always including game_id."""
    return {
        "room_code": room_code,
        "players": [{"id": p.id, "name": p.name, "is_host": p.is_host} for p in players],
        "host_id": host_id,
        "game_id": game_id,
        "game_state": game_state,
        "status": status,
    }


async def _timer_worker(room_code: str, current_player_id: str, delay_seconds: float = 30.0):
    await asyncio.sleep(delay_seconds)
    # Perform TIMEOUT action
    room = room_manager.get_room(room_code)
    if room and room.status == "playing" and room.game_id and room.game_state:
        try:
            from app.games.registry import get_engine
            engine_cls = get_engine(room.game_id)
            engine = engine_cls()

            room.game_state = engine.apply_action(room.game_state, current_player_id, {"type": "TIMEOUT"})

            host_player = next((p for p in room.players if p.is_host), None)
            host_id = host_player.id if host_player else ""

            # Broadcast new state
            for p in room.players:
                player_ws = connection_manager.active_connections.get(p.id)
                if player_ws:
                    player_view = engine.get_player_view(room.game_state, p.id)
                    await player_ws.send_json({
                        "type": "ROOM_UPDATE",
                        "payload": _make_room_payload(
                            room_code, room.players, host_id,
                            player_view, room.game_id, room.status
                        )
                    })

            # Check next timer setup
            if room.game_state.get("status") == "playing":
                new_curr = room.game_state.get("turn_order")[room.game_state.get("current_player_index")]
                _start_timer_task(room_code, new_curr)
        except Exception:
            pass


async def _uno_penalty_worker(room_code: str, player_id: str):
    await asyncio.sleep(5.0)
    # Clear pending uno check
    room = room_manager.get_room(room_code)
    if room and room.game_state:
        if room.game_state.get("pending_uno_check") == player_id:
            room.game_state["pending_uno_check"] = None
            room.game_state["uno_check_window_started"] = None
            # Broadcast the cleared window
            try:
                from app.games.registry import get_engine
                engine_cls = get_engine(room.game_id)
                engine = engine_cls()
                host_player = next((p for p in room.players if p.is_host), None)
                host_id = host_player.id if host_player else ""
                for p in room.players:
                    player_ws = connection_manager.active_connections.get(p.id)
                    if player_ws:
                        player_view = engine.get_player_view(room.game_state, p.id)
                        await player_ws.send_json({
                            "type": "ROOM_UPDATE",
                            "payload": _make_room_payload(
                                room_code, room.players, host_id,
                                player_view, room.game_id, room.status
                            )
                        })
            except Exception:
                pass


def _start_timer_task(room_code: str, current_player_id: str, delay_seconds: float = 30.0):
    _cancel_timer_task(room_code)
    task = asyncio.create_task(_timer_worker(room_code, current_player_id, delay_seconds))
    _room_timers[room_code] = task


def _cancel_timer_task(room_code: str):
    task = _room_timers.pop(room_code, None)
    if task:
        task.cancel()


def _start_uno_penalty_task(room_code: str, player_id: str):
    old_task = _room_uno_tasks.pop(room_code, None)
    if old_task:
        old_task.cancel()
    task = asyncio.create_task(_uno_penalty_worker(room_code, player_id))
    _room_uno_tasks[room_code] = task


@router.websocket("/{player_id}")
async def websocket_endpoint(websocket: WebSocket, player_id: str):
    await websocket.accept()
    room_code = None
    try:
        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type")
            payload = data.get("payload", {})

            if msg_type == "JOIN_ROOM":
                room_code = payload.get("room_code", "").upper()
                player_name = payload.get("player_name", "")

                room = room_manager.get_room(room_code)
                if not room:
                    await websocket.send_json({
                        "type": "ERROR",
                        "payload": {"message": "Room not found"}
                    })
                    continue

                connection_manager.active_connections[player_id] = websocket
                connection_manager.player_rooms[player_id] = room_code

                existing_player = next((p for p in room.players if p.id == player_id), None)
                if not existing_player:
                    is_host_val = len(room.players) == 0
                    room.players.append(Player(id=player_id, name=player_name, is_host=is_host_val))

                host_player = next((p for p in room.players if p.is_host), None)
                host_id = host_player.id if host_player else ""

                await connection_manager.broadcast_to_room(room_code, {
                    "type": "PLAYER_JOINED",
                    "payload": {"player_id": player_id, "player_name": player_name}
                })

                # Send personalized view to each player so playable_card_ids is correct
                if room.game_state and room.game_id:
                    try:
                        from app.games.registry import get_engine
                        engine_cls = get_engine(room.game_id)
                        engine = engine_cls()
                        for p in room.players:
                            player_ws = connection_manager.active_connections.get(p.id)
                            if player_ws:
                                player_view = engine.get_player_view(room.game_state, p.id)
                                await player_ws.send_json({
                                    "type": "ROOM_UPDATE",
                                    "payload": _make_room_payload(
                                        room_code, room.players, host_id,
                                        player_view, room.game_id, room.status
                                    )
                                })
                    except Exception:
                        # Fallback: broadcast raw state (pre-game lobby)
                        await connection_manager.broadcast_to_room(room_code, {
                            "type": "ROOM_UPDATE",
                            "payload": _make_room_payload(
                                room_code, room.players, host_id,
                                room.game_state, room.game_id, room.status
                            )
                        })
                else:
                    # No game started yet — broadcast lobby state normally
                    await connection_manager.broadcast_to_room(room_code, {
                        "type": "ROOM_UPDATE",
                        "payload": _make_room_payload(
                            room_code, room.players, host_id,
                            room.game_state, room.game_id, room.status
                        )
                    })

            elif msg_type == "LEAVE_ROOM":
                if room_code:
                    updated_room = room_manager.leave_room(room_code, player_id)
                    await connection_manager.broadcast_to_room(room_code, {
                        "type": "PLAYER_LEFT",
                        "payload": {"player_id": player_id}
                    })
                    if updated_room:
                        host_player = next((p for p in updated_room.players if p.is_host), None)
                        host_id = host_player.id if host_player else ""
                        await connection_manager.broadcast_to_room(room_code, {
                            "type": "ROOM_UPDATE",
                            "payload": _make_room_payload(
                                room_code, updated_room.players, host_id,
                                updated_room.game_state, updated_room.game_id, updated_room.status
                            )
                        })
                    connection_manager.disconnect(player_id)
                break

            elif msg_type == "START_GAME":
                if room_code:
                    room = room_manager.get_room(room_code)
                    if not room:
                        await websocket.send_json({
                            "type": "ERROR",
                            "payload": {"message": "Room session expired or server restarted. Please recreate the room."}
                        })
                        continue
                    if room and len(room.players) >= 2:
                        player = next((p for p in room.players if p.id == player_id), None)
                        if player and player.is_host:
                            try:
                                room.status = "playing"
                                room.game_id = payload.get("game_id", "uno")
                                from app.games.registry import get_engine
                                engine_cls = get_engine(room.game_id)
                                engine = engine_cls()
                                players_dicts = [{"id": p.id, "name": p.name} for p in room.players]
                                rules = payload.get("rules")
                                if rules is not None:
                                    room.game_state = engine.get_initial_state(players_dicts, rules=rules)
                                else:
                                    room.game_state = engine.get_initial_state(players_dicts)
                                host_player = next((p for p in room.players if p.is_host), None)
                                host_id = host_player.id if host_player else ""

                                # Send personalised game state view to each player
                                for p in room.players:
                                    player_ws = connection_manager.active_connections.get(p.id)
                                    if player_ws:
                                        player_view = engine.get_player_view(room.game_state, p.id)
                                        await player_ws.send_json({
                                            "type": "ROOM_UPDATE",
                                            "payload": _make_room_payload(
                                                room_code, room.players, host_id,
                                                player_view, room.game_id, room.status
                                            )
                                        })

                                # Start the initial turn countdown
                                if room.game_state.get("status") == "playing":
                                    initial_curr = room.game_state.get("turn_order")[room.game_state.get("current_player_index")]
                                    deal_delay = max(0.0, float(room.game_state.get("initial_deal_ends_at", time.time())) - time.time())
                                    turn_duration = float(room.game_state.get("turn_duration", 30.0))
                                    _start_timer_task(room_code, initial_curr, deal_delay + turn_duration)
                            except Exception as e:
                                import traceback
                                traceback.print_exc()
                                await websocket.send_json({
                                    "type": "ERROR",
                                    "payload": {"message": f"Error starting game: {str(e)}"}
                                })

            elif msg_type == "GAME_ACTION":
                if room_code:
                    room = room_manager.get_room(room_code)
                    if room and room.status == "playing" and room.game_id and room.game_state:
                        try:
                            from app.games.registry import get_engine
                            engine_cls = get_engine(room.game_id)
                            engine = engine_cls()

                            # Apply action to state
                            old_state = copy.deepcopy(room.game_state)
                            room.game_state = engine.apply_action(room.game_state, player_id, payload)

                            # Handle side effects of the action / state updates (e.g. broadcast penalties)
                            if room.game_state.get("last_action", {}).get("type") == "UNO_PENALTY":
                                target_id = room.game_state["last_action"]["player_id"]
                                caught_by = room.game_state["last_action"]["caught_by"]
                                target_player = next((p for p in room.players if p.id == target_id), None)
                                target_name = target_player.name if target_player else target_id
                                await connection_manager.broadcast_to_room(room_code, {
                                    "type": "UNO_PENALTY",
                                    "payload": {
                                        "player_id": target_id,
                                        "player_name": target_name,
                                        "caught_by": caught_by,
                                        "count": 2
                                    }
                                })

                            host_player = next((p for p in room.players if p.is_host), None)
                            host_id = host_player.id if host_player else ""

                            # Update client views
                            for p in room.players:
                                player_ws = connection_manager.active_connections.get(p.id)
                                if player_ws:
                                    player_view = engine.get_player_view(room.game_state, p.id)
                                    await player_ws.send_json({
                                        "type": "ROOM_UPDATE",
                                        "payload": _make_room_payload(
                                            room_code, room.players, host_id,
                                            player_view, room.game_id, room.status
                                        )
                                    })

                            # Manage timer task
                            old_curr = old_state.get("turn_order")[old_state.get("current_player_index")] if old_state and old_state.get("turn_order") else None
                            new_curr = room.game_state.get("turn_order")[room.game_state.get("current_player_index")] if room.game_state and room.game_state.get("turn_order") else None
                            if old_curr != new_curr or room.game_state.get("status") == "finished":
                                # Re-create/cancel timer task
                                _cancel_timer_task(room_code)
                                if room.game_state.get("status") == "playing":
                                    _start_timer_task(room_code, new_curr)

                            # Manage UNO penalty window task
                            old_pending = old_state.get("pending_uno_check") if old_state else None
                            new_pending = room.game_state.get("pending_uno_check")
                            if new_pending and new_pending != old_pending:
                                _start_uno_penalty_task(room_code, new_pending)

                        except Exception as e:
                            await websocket.send_json({
                                "type": "ERROR",
                                "payload": {"message": str(e)}
                            })

    except WebSocketDisconnect:
        if room_code:
            updated_room = room_manager.leave_room(room_code, player_id)
            await connection_manager.broadcast_to_room(room_code, {
                "type": "PLAYER_LEFT",
                "payload": {"player_id": player_id}
            })
            if updated_room:
                host_player = next((p for p in updated_room.players if p.is_host), None)
                host_id = host_player.id if host_player else ""
                # Cancel timer tasks if empty or no longer playing
                if not updated_room.players or updated_room.status != "playing":
                    _cancel_timer_task(room_code)
                await connection_manager.broadcast_to_room(room_code, {
                    "type": "ROOM_UPDATE",
                    "payload": _make_room_payload(
                        room_code, updated_room.players, host_id,
                        updated_room.game_state, updated_room.game_id, updated_room.status
                    )
                })
            else:
                _cancel_timer_task(room_code)
            connection_manager.disconnect(player_id)
    except Exception:
        connection_manager.disconnect(player_id)
