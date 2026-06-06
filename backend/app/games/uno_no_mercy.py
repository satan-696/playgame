import random
import copy
import time
from typing import Optional
from app.games.base import GameEngine
from app.games.registry import register_game
from app.games.uno import (
    _chaos_shuffle,
    _refill_deck,
    _draw_cards,
    _current_color,
    _advance,
    _set_next_turn,
)

_COLORS = ["red", "green", "blue", "yellow"]
_INITIAL_DEAL_CARD_SECONDS = 0.12
_INITIAL_DEAL_REVEAL_SECONDS = 0.74

# Draw card values for stack validation (value must be >= last draw card to stack)
_DRAW_VALUES: dict[str, int] = {
    "draw2": 2,
    "wild_draw4": 4,
    "wild_draw6": 6,
    "wild_draw10": 10,
}


def _build_no_mercy_deck() -> list[dict]:
    """Build ~168 card No Mercy deck."""
    deck: list[dict] = []
    cid = 0

    for color in _COLORS:
        # One 0
        deck.append({"id": str(cid), "color": color, "value": "0"})
        cid += 1
        # Two each of 1-9
        for val in [str(n) for n in range(1, 10)]:
            for _ in range(2):
                deck.append({"id": str(cid), "color": color, "value": val})
                cid += 1
        # 3 each of draw2, skip, reverse
        for val in ["draw2", "skip", "reverse"]:
            for _ in range(3):
                deck.append({"id": str(cid), "color": color, "value": val})
                cid += 1
        # 1 discard_all per color
        deck.append({"id": str(cid), "color": color, "value": "discard_all"})
        cid += 1

    # Wild cards — 8 of each type to reach ~168
    # 4 colors × (19 + 9 + 1) = 4 × 29 = 116 colored
    # We need 168 - 116 = 52 wild cards → ~10-11 each of 5 types
    # Use 10 of each for 50 + 4 extras across first 2 types
    wild_counts = {
        "wild": 8,
        "wild_draw4": 8,
        "wild_draw6": 8,
        "wild_draw10": 8,
        "wild_color_roulette": 8,
    }
    # 116 + 40 = 156; add 4 more to wild and wild_draw4
    wild_counts["wild"] += 2
    wild_counts["wild_draw4"] += 2
    # 116 + 44 = 160; add 2 more wild_draw6
    wild_counts["wild_draw6"] += 2
    # 116 + 46 = 162; 2 more wild_draw10
    wild_counts["wild_draw10"] += 2
    # 116 + 48 = 164; 4 more wild_color_roulette
    wild_counts["wild_color_roulette"] += 4
    # Total: 116 + 52 = 168

    for val, count in wild_counts.items():
        for _ in range(count):
            deck.append({"id": str(cid), "color": "wild", "value": val})
            cid += 1

    return deck


def _can_play_mercy(card: dict, top: dict, color: str, pending_value: int) -> bool:
    """
    No Mercy stacking: a draw card can stack only if its value >= last draw card value.
    """
    val = card["value"]
    top_val = top["value"]

    if pending_value > 0:
        card_draw_val = _DRAW_VALUES.get(val, 0)
        last_draw_val = _DRAW_VALUES.get(top_val, 0)
        if card_draw_val > 0 and card_draw_val >= last_draw_val:
            return True
        return False

    if val in ("wild", "wild_draw4", "wild_draw6", "wild_draw10", "wild_color_roulette"):
        return True
    # discard_all only playable when no active draw stack
    if val == "discard_all":
        return pending_value == 0
    return card["color"] == color or val == top_val


def _check_mercy(state: dict, player_id: str) -> None:
    """Eliminate a player if they hold 25+ cards."""
    hand = state["hands"].get(player_id, [])
    if isinstance(hand, list) and len(hand) >= 25 and player_id not in state["eliminated"]:
        state["eliminated"].append(player_id)
        existing = state.get("last_action") or {}
        state["last_action"] = {
            **existing,
            "eliminated": player_id,
        }


def _remove_eliminated(state: dict) -> None:
    """Remove all newly-eliminated players from turn_order and fix current_player_index."""
    for pid in list(state["eliminated"]):
        if pid in state["turn_order"]:
            idx_of_removed = state["turn_order"].index(pid)
            state["turn_order"].remove(pid)
            if len(state["turn_order"]) == 0:
                break
            current = state["current_player_index"]
            if current >= len(state["turn_order"]):
                state["current_player_index"] = 0
            elif idx_of_removed < current:
                state["current_player_index"] = max(0, current - 1)


def _draw_and_check(state: dict, player_id: str, count: int) -> None:
    """Draw cards and immediately check mercy + remove eliminated (Fix 4)."""
    _draw_cards(state, player_id, count)
    _check_mercy(state, player_id)
    _remove_eliminated(state)


def _execute_color_roulette(state: dict, target_id: str, chosen_color: str) -> None:
    """Draw cards one by one until a card of chosen_color is drawn."""
    drawn = 0
    while True:
        if not state["deck"]:
            _refill_deck(state)
        if not state["deck"]:
            break
        card = state["deck"].pop()
        state["hands"][target_id].append(card)
        drawn += 1
        state["roulette_drawn_count"] = drawn  # live update
        _check_mercy(state, target_id)
        _remove_eliminated(state)
        if target_id in state["eliminated"]:
            break
        card_color = card["color"]
        if card_color != "wild" and card_color == chosen_color:
            break
        if drawn > 108:
            break
    state["roulette_drawn_count"] = 0
    state["last_action"]["drawn_count"] = drawn
    state["pending_color_roulette"] = None


def _shift_hands(state: dict, direction: int) -> None:
    order = state["turn_order"]  # eliminated players already removed
    if len(order) <= 1:
        return
    hands = state["hands"]
    n = len(order)
    rotated: dict = {}
    for i, pid in enumerate(order):
        dest = order[(i + direction) % n]
        rotated[dest] = hands.get(pid, [])
    for pid, hand in rotated.items():
        state["hands"][pid] = hand


def _score_mercy_hand(hand: list[dict]) -> int:
    total = 0
    for card in hand:
        val = card["value"]
        if val in ("wild", "wild_color_roulette"):
            total += 50
        elif val == "wild_draw4":
            total += 50
        elif val == "wild_draw6":
            total += 60
        elif val == "wild_draw10":
            total += 80
        elif val in ("draw2", "skip", "reverse"):
            total += 20
        elif val == "discard_all":
            total += 40
        else:
            try:
                total += int(val)
            except (ValueError, TypeError):
                pass
    return total


@register_game("uno_no_mercy")
class UnoNoMercyEngine(GameEngine):
    def get_initial_state(self, players: list[dict], rules: dict = None) -> dict:
        if len(players) < 2:
            raise ValueError("UNO No Mercy requires at least 2 players")
        if len(players) > 6:
            raise ValueError("UNO No Mercy supports a maximum of 6 players")

        deck = _chaos_shuffle(_build_no_mercy_deck())
        order = [p["id"] for p in players]
        names = {p["id"]: p.get("name", p["id"]) for p in players}
        random.shuffle(order)
        hands: dict[str, list] = {pid: [] for pid in order}
        for _ in range(7):
            for pid in order:
                hands[pid].append(deck.pop())

        # Starting card must be a plain number card
        _no_start = {"wild_draw4", "wild_draw6", "wild_draw10", "wild", "skip", "reverse",
                     "draw2", "discard_all", "wild_color_roulette"}
        while True:
            top = deck.pop()
            if top["value"] not in _no_start and top["color"] != "wild":
                break
            deck.insert(0, top)

        direction = 1
        idx = 0
        n = len(order)
        now = time.time()
        initial_deal_ends_at = now + (7 * n * _INITIAL_DEAL_CARD_SECONDS) + _INITIAL_DEAL_REVEAL_SECONDS

        return {
            "deck": deck,
            "discard": [top],
            "hands": hands,
            "player_names": names,
            "turn_order": order,
            "current_player_index": idx,
            "direction": direction,
            "pending_draw": 0,
            "pending_draw_value": 0,
            "eliminated": [],
            "pending_color_roulette": None,
            "roulette_drawn_count": 0,
            "status": "playing",
            "winner": None,
            "winner_name": None,
            "last_action": None,
            "drawn_this_turn": False,
            "drawn_card_id": None,
            "turn_started_at": initial_deal_ends_at,
            "turn_duration": 30.0,
            "initial_deal_ends_at": initial_deal_ends_at,
            "uno_declared": {},
            "pending_uno_check": None,
            "uno_check_window_started": None,
            "awaiting_swap": None,
            "swap_targets": [],
            "scores": {pid: 0 for pid in order},
            "cumulative_scores": {pid: 0 for pid in order},
            "target_score": 1000,
            "overall_winner": None,
            "round_score": 0,
        }

    def apply_action(self, state: dict, player_id: str, action: dict) -> dict:
        state = copy.deepcopy(state)

        # UNO penalty check
        pending_uno = state.get("pending_uno_check")
        uno_started = state.get("uno_check_window_started")
        if pending_uno and uno_started and pending_uno != player_id and not state.get("uno_declared", {}).get(pending_uno):
            if (time.time() - uno_started) > 5.0:
                _draw_and_check(state, pending_uno, 2)
                state["last_action"] = {
                    "type": "UNO_PENALTY",
                    "player_id": pending_uno,
                    "caught_by": "system",
                    "count": 2,
                }
                state["pending_uno_check"] = None
                state["pending_uno_check_name"] = None
                state["uno_check_window_started"] = None

        t = action.get("type")
        order = state["turn_order"]
        n = len(order)
        idx = state["current_player_index"]

        if t == "RESTART_GAME":
            all_players = [{"id": pid, "name": name} for pid, name in state["player_names"].items()]
            new_state = self.get_initial_state(all_players)
            if state.get("overall_winner"):
                new_state["scores"] = {pid: 0 for pid in state["player_names"]}
                new_state["cumulative_scores"] = {pid: 0 for pid in state["player_names"]}
            else:
                new_state["scores"] = state.get("scores", {})
                new_state["cumulative_scores"] = state.get("cumulative_scores", {})
            new_state["last_action"] = {"type": "RESTART_GAME"}
            return new_state

        if t == "DECLARE_UNO":
            state["uno_declared"][player_id] = True
            if state.get("pending_uno_check") == player_id:
                state["pending_uno_check"] = None
                state["pending_uno_check_name"] = None
                state["uno_check_window_started"] = None
            return state

        deal_ends_at = state.get("initial_deal_ends_at")
        if isinstance(deal_ends_at, (int, float)) and time.time() < deal_ends_at:
            if t == "TIMEOUT":
                return state
            raise ValueError("Cards are still being dealt")

        if t == "TIMEOUT":
            if order[idx] != player_id:
                return state
            return self._handle_timeout(state, player_id, n)

        # Color roulette guard
        roulette = state.get("pending_color_roulette")
        if roulette and roulette.get("target_id") == player_id:
            if t == "PLAY_CARD":
                raise ValueError("A Wild Color Roulette is targeting you — send DRAW_CARD to resolve it")
            if t in ("DRAW_CARD", "TIMEOUT"):
                return self._execute_roulette_action(state, player_id, n)

        if t == "SWAP_HAND":
            return self._swap_hand(state, player_id, action, n)

        if order[idx] != player_id:
            raise ValueError("Not your turn")

        if t == "PLAY_CARD":
            return self._play_card(state, player_id, action, n)
        if t == "DRAW_CARD":
            return self._draw_card_mercy(state, player_id, n)
        if t == "PASS":
            return self._pass(state, player_id, n)
        if t == "DISCARD_ALL":
            return self._discard_all(state, player_id, action, n)
        raise ValueError(f"Unknown action: {t}")

    def _execute_roulette_action(self, state: dict, player_id: str, n: int) -> dict:
        roulette = state["pending_color_roulette"]
        target_id = roulette["target_id"]
        chosen_color = roulette["chosen_color"]
        state["last_action"] = {"type": "DRAW_CARD", "player_id": target_id}
        _execute_color_roulette(state, target_id, chosen_color)
        # Check if game ends due to only 1 player remaining
        if len(state["turn_order"]) <= 1:
            return self._handle_last_player(state)
        idx = state["turn_order"].index(target_id) if target_id in state["turn_order"] else state["current_player_index"]
        _set_next_turn(state, _advance(idx, state["direction"], n))
        return state

    def _swap_hand(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        target_id = action.get("target_id")
        if not target_id or target_id not in state["turn_order"]:
            raise ValueError("Invalid target for swap")
        
        # Swap hands
        temp = state["hands"][player_id]
        state["hands"][player_id] = state["hands"][target_id]
        state["hands"][target_id] = temp
        
        state["last_action"]["type"] = "SWAP_HAND"
        state["last_action"]["target_id"] = target_id
        state["last_action"]["awaiting_swap"] = False
        state["awaiting_swap"] = None
        state["swap_targets"] = []
        
        idx = state["current_player_index"]
        _set_next_turn(state, _advance(idx, state["direction"], n))
        return state

    def _handle_timeout(self, state: dict, player_id: str, n: int) -> dict:
        idx = state["current_player_index"]

        if state.get("awaiting_swap") == player_id:
            # Auto-skip swap on timeout
            targets = state.get("swap_targets", [])
            if targets:
                import random as _r
                chosen_target = _r.choice(targets)
                temp = state["hands"][player_id]
                state["hands"][player_id] = state["hands"][chosen_target]
                state["hands"][chosen_target] = temp
                state["last_action"] = {
                    "type": "SWAP_HAND",
                    "player_id": player_id,
                    "target_id": chosen_target,
                    "auto": True,
                }
            state["awaiting_swap"] = None
            state["swap_targets"] = []
            _set_next_turn(state, _advance(idx, state["direction"], n))
            return state

        if state.get("drawn_this_turn"):
            state["drawn_this_turn"] = False
            state["drawn_card_id"] = None
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            state["last_action"] = {"type": "TIMEOUT", "player_id": player_id, "count": 0}
            _set_next_turn(state, _advance(idx, state["direction"], n))
            return state

        pending = state["pending_draw"]
        count = pending if pending > 0 else 1
        _draw_and_check(state, player_id, count)
        state["pending_draw"] = 0
        state["pending_draw_value"] = 0
        state["last_action"] = {"type": "TIMEOUT", "player_id": player_id, "count": count}
        n = len(state["turn_order"])  # may have changed after elimination
        if n <= 1:
            return self._handle_last_player(state)
        _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
        return state

    def _play_card(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        card_id: str = action.get("card_id", "")
        chosen: Optional[str] = action.get("chosen_color")
        hand: list = state["hands"][player_id]
        card = next((c for c in hand if c["id"] == card_id), None)
        if card is None:
            raise ValueError("Card not in hand")

        top = state["discard"][-1]
        color = _current_color(state["discard"])
        pending = state["pending_draw"]
        pending_value = state["pending_draw_value"]
        val = card["value"]

        # Discard All is handled by its own action
        if val == "discard_all":
            raise ValueError("Use DISCARD_ALL action to play Discard All")

        if not _can_play_mercy(card, top, color, pending_value):
            raise ValueError("Cannot play that card")
        if card["color"] == "wild" and not chosen and val not in ("discard_all",):
            raise ValueError("Must choose a color for wild")

        hand.remove(card)
        played = dict(card)
        if chosen:
            played["chosen_color"] = chosen
        state["discard"].append(played)
        state["last_action"] = {"type": "PLAY_CARD", "player_id": player_id, "card": played}
        state["drawn_this_turn"] = False
        state["drawn_card_id"] = None

        if len(hand) == 1:
            state["pending_uno_check"] = player_id
            state["pending_uno_check_name"] = state["player_names"].get(player_id, player_id)
            state["uno_check_window_started"] = time.time()
            state["uno_declared"][player_id] = False
            state["last_action"]["uno_alert"] = True
        elif len(hand) == 0:
            return self._declare_winner(state, player_id)

        order = state["turn_order"]
        direction = state["direction"]
        idx = state["current_player_index"]

        if val == "skip":
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            _set_next_turn(state, _advance(_advance(idx, direction, n), direction, n))

        elif val == "reverse":
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            state["direction"] = -direction
            if n == 2:
                _set_next_turn(state, idx)
            else:
                _set_next_turn(state, _advance(idx, state["direction"], n))

        elif val == "draw2":
            state["pending_draw"] += 2
            state["pending_draw_value"] = 2
            _set_next_turn(state, _advance(idx, direction, n))

        elif val == "wild_draw4":
            state["pending_draw"] += 4
            state["pending_draw_value"] = 4
            _set_next_turn(state, _advance(idx, direction, n))

        elif val == "wild_draw6":
            state["pending_draw"] += 6
            state["pending_draw_value"] = 6
            _set_next_turn(state, _advance(idx, direction, n))

        elif val == "wild_draw10":
            state["pending_draw"] += 10
            state["pending_draw_value"] = 10
            _set_next_turn(state, _advance(idx, direction, n))

        elif val == "wild_color_roulette":
            next_idx = _advance(idx, direction, n)
            next_player = order[next_idx]
            state["pending_color_roulette"] = {
                "target_id": next_player,
                "chosen_color": chosen,
            }
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            _set_next_turn(state, next_idx)

        elif val == "0":
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            _shift_hands(state, direction)
            _set_next_turn(state, _advance(idx, direction, n))

        elif val == "7":
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            state["awaiting_swap"] = player_id
            state["swap_targets"] = [p for p in order if p != player_id]
            state["last_action"]["awaiting_swap"] = True
            # DO NOT ADVANCE TURN YET

        else:
            # wild or number
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            _set_next_turn(state, _advance(idx, direction, n))

        return state

    def _discard_all(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        chosen_color = action.get("chosen_color")
        if not chosen_color:
            raise ValueError("Must choose a color to discard")
        hand: list = state["hands"][player_id]
        to_discard = [c for c in hand if c["color"] == chosen_color]
        if not to_discard:
            raise ValueError(f"No cards of color {chosen_color} in hand")

        # Check that the discard_all card itself is in hand
        discard_all_card = next(
            (c for c in hand if c["value"] == "discard_all" and c["color"] == chosen_color), None
        )
        if discard_all_card is None:
            raise ValueError("No Discard All card of that color in hand")

        discard_all_card = next(
            (c for c in to_discard if c["value"] == "discard_all"), None
        )
        other_cards = [c for c in to_discard if c["value"] != "discard_all"]

        for c in other_cards:
            hand.remove(c)
            state["discard"].append(c)
        if discard_all_card:
            hand.remove(discard_all_card)
            state["discard"].append(discard_all_card)

        state["last_action"] = {
            "type": "PLAY_CARD",
            "player_id": player_id,
            "card": {"color": chosen_color, "value": "discard_all", "id": discard_all_card["id"]},
        }
        state["pending_draw"] = 0
        state["pending_draw_value"] = 0
        state["drawn_this_turn"] = False
        state["drawn_card_id"] = None

        if len(hand) == 0:
            return self._declare_winner(state, player_id)

        idx = state["current_player_index"]
        _set_next_turn(state, _advance(idx, state["direction"], n))
        return state

    def _draw_card_mercy(self, state: dict, player_id: str, n: int) -> dict:
        pending = state["pending_draw"]

        if pending > 0:
            _draw_and_check(state, player_id, pending)
            state["pending_draw"] = 0
            state["pending_draw_value"] = 0
            state["last_action"] = {"type": "DRAW_CARD", "player_id": player_id, "count": pending}
            n = len(state["turn_order"])
            if n <= 1:
                return self._handle_last_player(state)
            _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
            return state

        # Draw until playable card found
        top = state["discard"][-1]
        color = _current_color(state["discard"])
        drawn = 0
        found_playable = False

        while True:
            if not state["deck"]:
                _refill_deck(state)
            if not state["deck"]:
                break  # deck truly exhausted
            card = state["deck"].pop()
            state["hands"][player_id].append(card)
            drawn += 1
            _check_mercy(state, player_id)
            _remove_eliminated(state)
            if player_id in state["eliminated"]:
                state["last_action"] = {
                    "type": "DRAW_CARD",
                    "player_id": player_id,
                    "count": drawn,
                    "eliminated": player_id,
                }
                n_final = len(state["turn_order"])
                if n_final <= 1:
                    return self._handle_last_player(state)
                _set_next_turn(state, state["current_player_index"] % n_final)
                return state
            n_now = len(state["turn_order"])
            if n_now <= 1:
                state["last_action"] = {"type": "DRAW_CARD", "player_id": player_id, "count": drawn}
                return self._handle_last_player(state)
            if _can_play_mercy(card, top, color, 0):
                found_playable = True
                state["drawn_this_turn"] = True
                state["drawn_card_id"] = card["id"]
                break
            if drawn > 108:
                break

        state["last_action"] = {"type": "DRAW_CARD", "player_id": player_id, "count": drawn}

        if not found_playable:
            # Fix 3: deck exhausted, no playable card found — advance turn
            state["drawn_this_turn"] = False
            state["drawn_card_id"] = None
            n_final = len(state["turn_order"])
            _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n_final))

        return state

    def _pass(self, state: dict, player_id: str, n: int) -> dict:
        if not state.get("drawn_this_turn", False):
            raise ValueError("Must draw before passing")
        state["last_action"] = {"type": "PASS", "player_id": player_id}
        state["drawn_this_turn"] = False
        state["drawn_card_id"] = None
        _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
        return state

    def _declare_winner(self, state: dict, player_id: str) -> dict:
        state["status"] = "finished"
        state["winner"] = player_id
        state["winner_name"] = state["player_names"].get(player_id, player_id)
        round_score = sum(
            _score_mercy_hand(h)
            for pid, h in state["hands"].items()
            if pid != player_id
        )
        state["scores"][player_id] = state["scores"].get(player_id, 0) + round_score
        state["round_score"] = round_score
        cumulative = state["cumulative_scores"]
        cumulative[player_id] = cumulative.get(player_id, 0) + round_score
        if cumulative[player_id] >= state["target_score"]:
            state["overall_winner"] = player_id
        state["turn_started_at"] = time.time()
        return state

    def _handle_last_player(self, state: dict) -> dict:
        """When only 1 player remains after eliminations, they win."""
        remaining = state["turn_order"]
        if len(remaining) == 1:
            return self._declare_winner(state, remaining[0])
        if len(remaining) == 0:
            state["status"] = "finished"
            state["turn_started_at"] = time.time()
        return state

    def get_player_view(self, state: dict, player_id: str) -> dict:
        view = copy.deepcopy(state)
        view.pop("deck", None)
        hands_view: dict = {}
        for pid, hand in state["hands"].items():
            if pid == player_id:
                hands_view[pid] = hand
            else:
                count = len(hand) if isinstance(hand, list) else hand.get("card_count", 0)
                hands_view[pid] = {"player_id": pid, "card_count": count}
        view["hands"] = hands_view

        idx = state["current_player_index"]
        current = state["turn_order"][idx] if state["turn_order"] else ""
        view["is_my_turn"] = current == player_id
        view["eliminated"] = state.get("eliminated", [])
        view["pending_color_roulette"] = state.get("pending_color_roulette")
        view["roulette_drawn_count"] = state.get("roulette_drawn_count", 0)

        ids: list[str] = []
        roulette = state.get("pending_color_roulette")
        roulette_targeting_me = roulette and roulette.get("target_id") == player_id

        if view["is_my_turn"] and not roulette_targeting_me:
            top = state["discard"][-1]
            color = _current_color(state["discard"])
            pending_value = state["pending_draw_value"]
            drawn_only_id = state.get("drawn_card_id") if state.get("drawn_this_turn") else None
            for card in state["hands"].get(player_id, []):
                if isinstance(card, dict) and _can_play_mercy(card, top, color, pending_value):
                    if drawn_only_id is None or card["id"] == drawn_only_id:
                        ids.append(card["id"])

        view["playable_card_ids"] = ids
        view["deck_count"] = len(state.get("deck", []))
        view["deck_low"] = len(state.get("deck", [])) < 5

        # my_hand: flat list for current player
        view["my_hand"] = list(state["hands"].get(player_id, []))

        # opponent_card_counts: flat dict {player_id: count}
        view["opponent_card_counts"] = {
            pid: (len(h) if isinstance(h, list) else h.get("card_count", 0))
            for pid, h in state["hands"].items()
            if pid != player_id
        }

        # players: list of player info for opponent positioning
        view["players"] = [
            {"id": pid, "name": name, "is_host": False}
            for pid, name in state["player_names"].items()
        ]

        # current_player_name: for turn indicator display
        turn_order = state.get("turn_order", [])
        cur_idx = state.get("current_player_index", 0)
        cur_id = turn_order[cur_idx] if turn_order else ""
        view["current_player_name"] = state["player_names"].get(cur_id, "")

        return view

    def is_game_over(self, state: dict) -> bool:
        return state["status"] == "finished"

    def get_winner(self, state: dict) -> Optional[str]:
        return state.get("overall_winner") or state.get("winner")
