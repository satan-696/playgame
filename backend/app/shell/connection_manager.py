from typing import Optional, Dict
from fastapi import WebSocket

class ConnectionManager:
    _instance: Optional["ConnectionManager"] = None

    def __new__(cls) -> "ConnectionManager":
        if cls._instance is None:
            cls._instance = super(ConnectionManager, cls).__new__(cls)
            cls._instance.active_connections = {}
            cls._instance.player_rooms = {}
        return cls._instance

    def __init__(self) -> None:
        pass

    async def connect(self, websocket: WebSocket, player_id: str, room_code: str) -> None:
        await websocket.accept()
        self.active_connections[player_id] = websocket
        self.player_rooms[player_id] = room_code

    def disconnect(self, player_id: str) -> None:
        self.active_connections.pop(player_id, None)
        self.player_rooms.pop(player_id, None)

    async def broadcast_to_room(self, room_code: str, message: dict) -> None:
        targets = [pid for pid, rcode in self.player_rooms.items() if rcode == room_code]
        for pid in targets:
            ws = self.active_connections.get(pid)
            if ws:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass

    async def send_to_player(self, player_id: str, message: dict) -> None:
        ws = self.active_connections.get(player_id)
        if ws:
            try:
                await ws.send_json(message)
            except Exception:
                pass
