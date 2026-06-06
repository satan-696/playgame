import random
import copy
import time
from typing import Optional
from app.games.base import GameEngine
from app.games.registry import register_game

_COLORS = ["red", "green", "blue", "yellow"]
_ACTIONS = ["skip", "reverse", "draw2"]
_INITIAL_DEAL_CARD_SECONDS = 0.12
_INITIAL_DEAL_REVEAL_SECONDS = 0.74


def _build_deck() -> list[dict]:
    deck: list[dict] = []
    cid = 0
    for color in _COLORS:
        deck.append({"id": str(cid), "color": color, "value": "0"})
        cid += 1
        for val in [str(n) for n in range(1, 10)]:
            for _ in range(2):
                deck.append({"id": str(cid), "color": color, "value": val})
                cid += 1
        for val in _ACTIONS:
            for _ in range(2):
                deck.append({"id": str(cid), "color": color, "value": val})
                cid += 1
    for val in ["wild", "wild_draw4"]:
        for _ in range(4):
            deck.append({"id": str(cid), "color": "wild", "value": val})
            cid += 1
    return deck


def _chaos_shuffle(deck: list) -> list:
    random.shuffle(deck)
    cut = random.randint(len(deck) // 4, 3 * len(deck) // 4 - 1)
    deck = deck[cut:] + deck[:cut]
    mid = len(deck) // 2
    left, right = list(deck[:mid]), list(deck[mid:])
    result: list = []
    while left and right:
        take_left = random.random() < (len(left) / (len(left) + len(right)))
        result.append(left.pop(0) if take_left else right.pop(0))
    result.extend(left or right)
    random.shuffle(result)
    return result


def _refill_deck(state: dict) -> None:
    top = state["discard"][-1]
    rest = state["discard"][:-1]
    random.shuffle(rest)
    state["deck"] = rest
    state["discard"] = [top]


def _draw_cards(state: dict, player_id: str, count: int) -> None:
    for _ in range(count):
        if not state["deck"]:
            _refill_deck(state)
        if state["deck"]:
            state["hands"][player_id].append(state["deck"].pop())
    # Bug Fix 4: pending_uno_check not cleared when hand grows
    if state.get("pending_uno_check") == player_id and len(state["hands"][player_id]) > 1:
        state["pending_uno_check"] = None
        state["uno_check_window_started"] = None
        state["uno_declared"].pop(player_id, None)


def _current_color(discard: list[dict]) -> str:
    for card in reversed(discard):
        if "chosen_color" in card:
            return card["chosen_color"]
        if card["color"] != "wild":
            return card["color"]
    return "red"


def _can_play(card: dict, top: dict, color: str, pending: int) -> bool:
    # Draw-stack guard: when active, only matching draw type can be stacked
    if pending > 0:
        if top["value"] == "draw2":
            return card["value"] == "draw2"
        if top["value"] == "wild_draw4":
            return card["value"] == "wild_draw4"
        # Stale pending (top is not a draw card) — fall through to normal rules
    # Wilds are free when no stack is active
    if card["value"] == "wild" or card["color"] == "wild":
        return True
    return card["color"] == color or card["value"] == top["value"]


def _advance(idx: int, direction: int, n: int) -> int:
    return (idx + direction) % n


def _set_next_turn(state: dict, new_idx: int) -> None:
    state["current_player_index"] = new_idx
    state["turn_started_at"] = time.time()
    state["drawn_this_turn"] = False
    state["drawn_card_id"] = None
    # Prune uno_declared to only players currently at 1 card
    state["uno_declared"] = {
        pid: v for pid, v in state.get("uno_declared", {}).items()
        if len(state["hands"].get(pid, [])) == 1
    }
    # Escalate turn timer based on minimum hand size in play
    min_hand = min(
        len(h) if isinstance(h, list) else 0
        for h in state["hands"].values()
    )
    if min_hand <= 2:
        state["turn_duration"] = 15
    elif min_hand <= 4:
        state["turn_duration"] = 20
    else:
        state["turn_duration"] = 30


def _score_hand(hand: list[dict]) -> int:
    total = 0
    for card in hand:
        val = card["value"]
        if val in ("wild", "wild_draw4"):
            total += 50
        elif val in _ACTIONS:
            total += 20
        else:
            try:
                total += int(val)
            except ValueError:
                pass
    return total


@register_game("uno")
class UnoEngine(GameEngine):
    def get_initial_state(self, players: list[dict], rules: dict = None) -> dict:
        if len(players) < 2:
            raise ValueError("UNO requires at least 2 players")
        if len(players) > 10:
            raise ValueError("UNO supports a maximum of 10 players")
        deck = _chaos_shuffle(_build_deck())
        
        if rules is None:
            rules = {
                "seven_zero": False,
                "jump_in": False,
                "must_play_drawn": False,
            }
            
        order = [p["id"] for p in players]
        names = {p["id"]: p.get("name", p["id"]) for p in players}
        random.shuffle(order)
        hands: dict[str, list] = {pid: [] for pid in order}
        for _ in range(7):
            for pid in order:
                hands[pid].append(deck.pop())

        # Fix 2: starting card must be a plain number card — no action, no wild
        _no_start = {"wild_draw4", "wild", "skip", "reverse", "draw2"}
        while True:
            top = deck.pop()
            if top["value"] not in _no_start:
                break
            deck.insert(0, top)

        last_action: Optional[dict] = None
        discard = [top]
        pending = 0
        direction = 1
        idx = 0
        n = len(order)

        now = time.time()
        initial_deal_ends_at = now + (7 * len(order) * _INITIAL_DEAL_CARD_SECONDS) + _INITIAL_DEAL_REVEAL_SECONDS

        return {
            "deck": deck,
            "discard": discard,
            "hands": hands,
            "player_names": names,
            "turn_order": order,
            "current_player_index": idx,
            "direction": direction,
            "pending_draw": pending,
            "status": "playing",
            "winner": None,
            "winner_name": None,
            "last_action": last_action,
            "drawn_this_turn": False,
            "drawn_card_id": None,
            "turn_started_at": initial_deal_ends_at,
            "turn_duration": 30.0,
            "initial_deal_ends_at": initial_deal_ends_at,
            "uno_declared": {},
            "pending_uno_check": None,
            "uno_check_window_started": None,
            "awaiting_swap": None,
            "pending_wd4_challenge": None,
            "scores": {pid: 0 for pid in order},
            "round_score": 0,
            "rules": rules,
        }

    def apply_action(self, state: dict, player_id: str, action: dict) -> dict:
        state = copy.deepcopy(state)
        
        # Auto-penalty check for UNO before processing new action
        pending_uno = state.get("pending_uno_check")
        uno_started = state.get("uno_check_window_started")
        if pending_uno and uno_started and pending_uno != player_id and not state.get("uno_declared", {}).get(pending_uno):
            if (time.time() - uno_started) > 5.0:
                _draw_cards(state, pending_uno, 2)
                state["last_action"] = {
                    "type": "UNO_PENALTY",
                    "player_id": pending_uno,
                    "caught_by": "system",
                    "count": 2,
                }
                state["pending_uno_check"] = None
                state["uno_check_window_started"] = None

        t = action.get("type")

        # Bug Fix 14: RESTART_GAME preserves original order & cumulative scores
        if t == "RESTART_GAME":
            players = [{"id": pid, "name": name} for pid, name in state["player_names"].items()]
            rules = state.get("rules")
            if rules:
                new_state = self.get_initial_state(players, rules=rules)
            else:
                new_state = self.get_initial_state(players)
                
            if state.get("overall_winner"):
                # Full match restart
                new_state["scores"] = {pid: 0 for pid in state["player_names"]}
                new_state["cumulative_scores"] = {pid: 0 for pid in state["player_names"]}
            else:
                # Next round
                new_state["scores"] = state.get("scores", {})
                new_state["cumulative_scores"] = state.get("cumulative_scores", {})
                
            new_state["last_action"] = {"type": "RESTART_GAME"}
            return new_state

        if t == "DECLARE_UNO":
            return self._declare_uno(state, player_id, action)

        order = state["turn_order"]
        n = len(order)
        idx = state["current_player_index"]
        deal_ends_at = state.get("initial_deal_ends_at")

        if isinstance(deal_ends_at, (int, float)) and time.time() < deal_ends_at:
            if t == "TIMEOUT":
                return state
            raise ValueError("Cards are still being dealt")

        if t == "TIMEOUT":
            if order[idx] != player_id:
                return state
            return self._handle_timeout(state, player_id, n)

        if t == "JUMP_IN":
            return self._jump_in(state, player_id, action, n)

        if t == "CHALLENGE_WD4":
            return self._challenge_wd4(state, player_id, action, n)

        if order[idx] != player_id:
            raise ValueError("Not your turn")

        if state.get("awaiting_swap") == player_id and t == "SWAP_HAND":
            return self._swap_hand(state, player_id, action, n)

        if t == "PLAY_CARD":
            return self._play_card(state, player_id, action, n)
        if t == "DRAW_CARD":
            return self._draw_card(state, player_id, n)
        if t == "PASS":
            return self._pass(state, player_id, n)
        raise ValueError(f"Unknown action: {t}")

    def _handle_timeout(self, state: dict, player_id: str, n: int) -> dict:
        idx = state["current_player_index"]

        # Case 1: Player is the eligible WD4 challenger — auto-accept
        challenge = state.get("pending_wd4_challenge")
        if challenge and challenge.get("eligible_challenger") == player_id:
            _draw_cards(state, player_id, state["pending_draw"])
            state["pending_draw"] = 0
            state["pending_wd4_challenge"] = None
            state["last_action"] = {
                "type": "WD4_ACCEPTED",
                "player_id": player_id,
                "played_by": challenge["played_by"],
            }
            _set_next_turn(state, _advance(idx, state["direction"], n))
            return state

        # Case 2: Player is awaiting a swap — skip the swap, advance turn
        if state.get("awaiting_swap") == player_id:
            state["awaiting_swap"] = None
            state["last_action"] = {"type": "TIMEOUT_SWAP_SKIPPED", "player_id": player_id}
            _set_next_turn(state, _advance(idx, state["direction"], n))
            return state

        # Case 3: Player already drew but didn't play — advance without drawing again
        if state.get("drawn_this_turn"):
            state["drawn_this_turn"] = False
            state["drawn_card_id"] = None
            state["pending_draw"] = 0
            state["last_action"] = {"type": "TIMEOUT", "player_id": player_id, "count": 0}
            _set_next_turn(state, _advance(idx, state["direction"], n))
            return state

        # Case 4: Normal timeout — draw pending or 1 card
        pending = state["pending_draw"]
        count = pending if pending > 0 else 1
        _draw_cards(state, player_id, count)
        state["pending_draw"] = 0
        state["last_action"] = {"type": "TIMEOUT", "player_id": player_id, "count": count}
        _set_next_turn(state, _advance(idx, state["direction"], n))
        return state

    def _play_card(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        if state.get("pending_wd4_challenge"):
            raise ValueError("Must respond to Wild Draw 4 challenge first")
        card_id: str = action.get("card_id", "")
        chosen: Optional[str] = action.get("chosen_color")
        swap_target: Optional[str] = action.get("swap_target_id")
        hand: list = state["hands"][player_id]
        card = next((c for c in hand if c["id"] == card_id), None)
        if card is None:
            raise ValueError("Card not in hand")
        top = state["discard"][-1]
        color = _current_color(state["discard"])
        pending = state["pending_draw"]
        # Fix 3: WD4 server-side legality — cannot play if a color match exists
        if card["value"] == "wild_draw4":
            has_color_match = any(
                c["color"] == color and c["id"] != card["id"]
                for c in hand
            )
            if has_color_match:
                raise ValueError("Cannot play Wild Draw 4 when you have a card matching the current color")
        if not _can_play(card, top, color, pending):
            raise ValueError("Cannot play that card")
        if card["color"] == "wild" and not chosen:
            raise ValueError("Must choose a color for wild")
            
        hand.remove(card)
        played = dict(card)
        if chosen:
            played["chosen_color"] = chosen
        state["discard"].append(played)
        state["last_action"] = {"type": "PLAY_CARD", "player_id": player_id, "card": played}
        state["drawn_this_turn"] = False
        state["drawn_card_id"] = None
        state["awaiting_swap"] = None

        if len(hand) == 1:
            state["pending_uno_check"] = player_id
            state["uno_check_window_started"] = time.time()
            state["uno_declared"][player_id] = False
            # New Feature 11: UNO Alert
            state["last_action"]["uno_alert"] = True
        elif len(hand) == 0:
            state["status"] = "finished"
            state["winner"] = player_id
            state["winner_name"] = state["player_names"].get(player_id, player_id)
            round_score = sum(_score_hand(h) for pid, h in state["hands"].items() if pid != player_id)
            state["scores"][player_id] = state["scores"].get(player_id, 0) + round_score
            state["round_score"] = round_score
            state["turn_started_at"] = time.time()
            return state

        order = state["turn_order"]
        direction = state["direction"]
        idx = state["current_player_index"]
        val = card["value"]

        if state.get("rules", {}).get("seven_zero"):
            if val == "0":
                return self._zero_rotate(state, direction, n, idx)
            if val == "7":
                if swap_target and swap_target != player_id and swap_target in state["hands"]:
                    state["hands"][player_id], state["hands"][swap_target] = (
                        state["hands"][swap_target], state["hands"][player_id]
                    )
                    state["last_action"] = {
                        "type": "SWAP_HAND",
                        "player_id": player_id,
                        "target_id": swap_target,
                        "card": played,
                    }
                else:
                    state["awaiting_swap"] = player_id
                state["pending_draw"] = 0
                _set_next_turn(state, _advance(idx, direction, n))
                return state

        if val == "skip":
            state["pending_draw"] = 0
            _set_next_turn(state, _advance(_advance(idx, direction, n), direction, n))
        elif val == "reverse":
            state["pending_draw"] = 0
            state["direction"] = -direction
            if n == 2:
                # Reverse = Skip in 2-player: same player goes again
                _set_next_turn(state, idx)
            else:
                _set_next_turn(state, _advance(idx, state["direction"], n))
        elif val == "draw2":
            state["pending_draw"] += 2
            _set_next_turn(state, _advance(idx, direction, n))
        elif val == "wild_draw4":
            next_idx = _advance(idx, direction, n)
            # Store pending_draw BEFORE incrementing so challenge knows prior stack depth
            pending_before = state["pending_draw"]
            state["pending_draw"] += 4
            state["pending_wd4_challenge"] = {
                "played_by": player_id,
                "eligible_challenger": order[next_idx],
                "hand_snapshot": copy.deepcopy(state["hands"][player_id]),
                "pending_at_play": pending_before,
            }
            _set_next_turn(state, next_idx)
        else:
            state["pending_draw"] = 0
            _set_next_turn(state, _advance(idx, direction, n))

        return state

    def _zero_rotate(self, state: dict, direction: int, n: int, idx: int) -> dict:
        order = state["turn_order"]
        hands = state["hands"]
        rotated: dict = {}
        for i, pid in enumerate(order):
            dest = order[(i + direction) % n]
            rotated[dest] = hands[pid]
        state["hands"] = rotated
        state["pending_draw"] = 0

        for pid, hand in state["hands"].items():
            if isinstance(hand, list) and len(hand) == 0:
                state["status"] = "finished"
                state["winner"] = pid
                state["winner_name"] = state["player_names"].get(pid, pid)
                round_score = sum(_score_hand(h) for p, h in state["hands"].items() if p != pid)
                state["scores"][pid] = state["scores"].get(pid, 0) + round_score
                state["round_score"] = round_score
                state["turn_started_at"] = time.time()
                return state

        _set_next_turn(state, _advance(idx, direction, n))
        return state

    def _draw_card(self, state: dict, player_id: str, n: int) -> dict:
        if state.get("pending_wd4_challenge"):
            raise ValueError("Must respond to Wild Draw 4 challenge first")
        pending = state["pending_draw"]
        drawn = state.get("drawn_this_turn", False)
        if drawn:
            raise ValueError("Already drew, play or pass")
        count = pending if pending > 0 else 1
        _draw_cards(state, player_id, count)
        state["last_action"] = {"type": "DRAW_CARD", "player_id": player_id, "count": count}
        state["pending_draw"] = 0
        if pending > 0:
            _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
        else:
            state["drawn_this_turn"] = True
            state["drawn_card_id"] = state["hands"][player_id][-1]["id"]
        return state

    def _pass(self, state: dict, player_id: str, n: int) -> dict:
        if state.get("pending_wd4_challenge"):
            raise ValueError("Must respond to Wild Draw 4 challenge first")
        if not state.get("drawn_this_turn", False):
            raise ValueError("Must draw before passing")
            
        # New Rule 9: Must Play Drawn Card
        if state.get("rules", {}).get("must_play_drawn"):
            drawn_id = state.get("drawn_card_id")
            top = state["discard"][-1]
            color = _current_color(state["discard"])
            drawn_card = next((c for c in state["hands"][player_id] if c["id"] == drawn_id), None)
            if drawn_card and _can_play(drawn_card, top, color, 0):
                raise ValueError("Must play the drawn card when it is playable")
                
        state["last_action"] = {"type": "PASS", "player_id": player_id}
        state["drawn_this_turn"] = False
        state["drawn_card_id"] = None
        _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
        return state

    def _declare_uno(self, state: dict, player_id: str, action: dict) -> dict:
        state["uno_declared"][player_id] = True
        if state.get("pending_uno_check") == player_id:
            state["pending_uno_check"] = None
            state["uno_check_window_started"] = None
        return state

    def _swap_hand(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        target_id: str = action.get("target_player_id", "")
        if not target_id or target_id == player_id or target_id not in state["hands"]:
            raise ValueError("Invalid swap target")
        state["hands"][player_id], state["hands"][target_id] = (
            state["hands"][target_id],
            state["hands"][player_id],
        )
        state["awaiting_swap"] = None
        state["last_action"] = {
            "type": "SWAP_HAND",
            "player_id": player_id,
            "target_id": target_id,
        }
        _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
        return state
        
    def _challenge_wd4(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        challenge = state.get("pending_wd4_challenge")
        if not challenge or challenge["eligible_challenger"] != player_id:
            raise ValueError("No active Wild Draw 4 challenge available to you")

        accept: bool = action.get("accept", True)
        played_by = challenge["played_by"]
        snapshot = challenge["hand_snapshot"]
        pending_at_play = challenge["pending_at_play"]
        state["pending_wd4_challenge"] = None

        if accept:
            _draw_cards(state, player_id, state["pending_draw"])
            state["pending_draw"] = 0
            state["last_action"] = {
                "type": "WD4_ACCEPTED",
                "player_id": player_id,
                "played_by": played_by,
            }
            _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))
            return state

        # Challenge: reconstruct the color and top before the WD4 was played
        top_before = state["discard"][-2] if len(state["discard"]) >= 2 else state["discard"][-1]
        color_before = _current_color(state["discard"][:-1])
        had_legal = any(
            _can_play(c, top_before, color_before, pending_at_play)
            for c in snapshot
            if c["value"] != "wild_draw4"
        )

        if had_legal:
            # Challenge succeeds: played_by draws 4, challenger plays normally
            _draw_cards(state, played_by, 4)
            state["pending_draw"] = 0
            state["last_action"] = {
                "type": "WD4_CHALLENGE_SUCCESS",
                "challenger": player_id,
                "played_by": played_by,
                "drew": 4,
            }
            # Challenger's turn continues — timer already running, reset draw state
            state["drawn_this_turn"] = False
            state["drawn_card_id"] = None
        else:
            # Challenge fails: challenger draws 6 (4 + 2 penalty)
            _draw_cards(state, player_id, 6)
            state["pending_draw"] = 0
            state["last_action"] = {
                "type": "WD4_CHALLENGE_FAILED",
                "challenger": player_id,
                "played_by": played_by,
                "drew": 6,
            }
            _set_next_turn(state, _advance(state["current_player_index"], state["direction"], n))

        return state
        
    def _jump_in(self, state: dict, player_id: str, action: dict, n: int) -> dict:
        if not state.get("rules", {}).get("jump_in"):
            raise ValueError("Jump-In rule is not enabled")
        if state.get("pending_wd4_challenge"):
            raise ValueError("Cannot Jump-In during a Wild Draw 4 challenge window")
        if state.get("awaiting_swap"):
            raise ValueError("Cannot Jump-In while a swap is pending")
        if state.get("pending_draw", 0) > 0:
            raise ValueError("Cannot Jump-In into a draw stack")

        if player_id not in state["turn_order"]:
            raise ValueError("Player not in game")

        card_id: str = action.get("card_id", "")
        hand = state["hands"].get(player_id, [])
        card = next((c for c in hand if c["id"] == card_id), None)
        if card is None:
            raise ValueError("Card not in hand")

        top = state["discard"][-1]
        # Block wilds explicitly
        if card["color"] == "wild" or card["value"] in ("wild", "wild_draw4"):
            raise ValueError("Cannot Jump-In with a wild card")
        # Require exact match: same color AND same value
        if card["color"] != top["color"] or card["value"] != top["value"]:
            raise ValueError("Jump-In requires an exact match (color and value)")

        hand.remove(card)
        played = dict(card)
        state["discard"].append(played)
        state["last_action"] = {"type": "JUMP_IN", "player_id": player_id, "card": played}
        state["pending_draw"] = 0

        # Win check
        if len(hand) == 0:
            state["status"] = "finished"
            state["winner"] = player_id
            state["winner_name"] = state["player_names"].get(player_id, player_id)
            round_score = sum(_score_hand(h) for pid, h in state["hands"].items() if pid != player_id)
            state["scores"][player_id] = state["scores"].get(player_id, 0) + round_score
            state["round_score"] = round_score
            state["turn_started_at"] = time.time()
            return state

        if len(hand) == 1:
            state["pending_uno_check"] = player_id
            state["uno_check_window_started"] = time.time()
            state["uno_declared"][player_id] = False
            state["last_action"]["uno_alert"] = True

        # Apply action card effects from the jump-in
        new_idx = state["turn_order"].index(player_id)
        direction = state["direction"]
        val = card["value"]

        if val == "skip":
            _set_next_turn(state, _advance(_advance(new_idx, direction, n), direction, n))
        elif val == "reverse":
            state["direction"] = -direction
            if n == 2:
                _set_next_turn(state, new_idx)
            else:
                _set_next_turn(state, _advance(new_idx, state["direction"], n))
        elif val == "draw2":
            state["pending_draw"] += 2
            _set_next_turn(state, _advance(new_idx, direction, n))
        else:
            _set_next_turn(state, _advance(new_idx, direction, n))

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
        current = state["turn_order"][idx]
        view["is_my_turn"] = current == player_id
        ids: list[str] = []
        # Removed deal_finished check — frontend handles deal lock via isDealLocked/canAct
        if view["is_my_turn"] and state.get("awaiting_swap") != player_id and not state.get("pending_wd4_challenge"):
            top = state["discard"][-1]
            color = _current_color(state["discard"])
            pending = state["pending_draw"]
            drawn_only_id = state.get("drawn_card_id") if state.get("drawn_this_turn") else None
            
            for card in state["hands"].get(player_id, []):
                if isinstance(card, dict) and _can_play(card, top, color, pending):
                    if drawn_only_id is None or card["id"] == drawn_only_id:
                        ids.append(card["id"])
        view["playable_card_ids"] = ids
        view["deck_count"] = len(state.get("deck", []))
        view["deck_low"] = len(state.get("deck", [])) < 5

        challenge = state.get("pending_wd4_challenge")
        if challenge:
            view["pending_wd4_challenge"] = {
                "played_by": challenge["played_by"],
                "eligible_challenger": challenge["eligible_challenger"],
            }
        else:
            view["pending_wd4_challenge"] = None

        # Fix 6: expose swap targets when 7 is pending
        if state.get("awaiting_swap") == player_id:
            view["swap_targets"] = [pid for pid in state["turn_order"] if pid != player_id]
        else:
            view["swap_targets"] = []

        return view

    def is_game_over(self, state: dict) -> bool:
        return state["status"] == "finished"

    def get_winner(self, state: dict) -> Optional[str]:
        return state["winner"]
