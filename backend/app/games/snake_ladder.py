import copy
import random
import time
from typing import Optional

from app.games.base import GameEngine
from app.games.registry import register_game

# Ladders: {foot: head} — land on foot, climb to head
_LADDERS = {
    4: 14,
    9: 31,
    20: 38,
    28: 84,
    40: 59,
    51: 67,
    63: 81,
    71: 91,
}

# Snakes: {mouth: tail} — land on mouth, slide to tail
_SNAKES = {
    17: 7,
    54: 34,
    62: 19,
    64: 60,
    87: 24,
    93: 73,
    95: 75,
    99: 78,
}

_BOARD_SIZE = 100
_START = 0       # players begin off-board at position 0
_WIN  = 100      # first to reach exactly 100 wins


def _roll_dice() -> int:
    return random.randint(1, 6)


@register_game("snake_ladder")
class SnakeLadderEngine(GameEngine):
    def get_initial_state(self, players: list[dict], **kwargs) -> dict:
        if len(players) < 2:
            raise ValueError("Snake & Ladder requires at least 2 players")
        if len(players) > 6:
            raise ValueError("Snake & Ladder supports a maximum of 6 players")

        order = [p["id"] for p in players]
        names = {p["id"]: p.get("name", p["id"]) for p in players}

        return {
            "player_names":          names,
            "turn_order":            order,
            "current_player_index":  0,
            "positions":             {pid: 0 for pid in order},
            "status":                "playing",
            "winner":                None,
            "winner_name":           None,
            "last_action":           None,
            "last_roll":             None,        # [die1, die2]
            "consecutive_doubles":   {pid: 0 for pid in order},
            "skip_next_turn":        [],          # list of player_ids to skip
            "scores":                {pid: 0 for pid in order},
            "turn_started_at":       time.time(),
            "turn_duration":         30,
            "rolls_this_turn":       0,           # tracks extra rolls from doubles
            "move_history":          [],          # list of {player_id, from, to, roll, event}
            "rankings":              [],          # players who finished, in order
        }

    def apply_action(self, state: dict, player_id: str, action: dict) -> dict:
        state = copy.deepcopy(state)
        t = action.get("type")

        if t == "RESTART_GAME":
            players = [{"id": pid, "name": name}
                       for pid, name in state["player_names"].items()]
            new_state = self.get_initial_state(players)
            # Preserve scores across rounds
            new_state["scores"] = state.get("scores", {pid: 0 for pid in new_state["turn_order"]})
            return new_state

        order = state["turn_order"]
        n = len(order)
        idx = state["current_player_index"]

        if t == "TIMEOUT":
            if order[idx] != player_id:
                return state
            return self._handle_timeout(state, player_id, n)

        if order[idx] != player_id:
            raise ValueError("Not your turn")

        if t == "ROLL_DICE":
            return self._roll(state, player_id, n)

        raise ValueError(f"Unknown action: {t}")

    def _roll(self, state: dict, player_id: str, n: int) -> dict:
        idx = state["current_player_index"]
        order = state["turn_order"]

        # Skip penalty
        if player_id in state["skip_next_turn"]:
            state["skip_next_turn"].remove(player_id)
            state["last_action"] = {
                "type": "SKIP_TURN",
                "player_id": player_id,
                "reason": "three_doubles",
            }
            state["consecutive_doubles"][player_id] = 0
            self._advance_turn(state, n)
            return state

        d1 = _roll_dice()
        roll_sum = d1
        is_doubles = False

        old_pos = state["positions"][player_id]
        new_pos = old_pos + roll_sum

        event = None
        event_from = None

        # Can't overshoot 100 — must roll exact or stay
        if new_pos > _WIN:
            new_pos = old_pos  # bounce back rule: stay in place
            event = "bounce"
        else:
            # Check ladder
            if new_pos in _LADDERS:
                event_from = new_pos
                new_pos = _LADDERS[new_pos]
                event = "ladder"
            # Check snake
            elif new_pos in _SNAKES:
                event_from = new_pos
                new_pos = _SNAKES[new_pos]
                event = "snake"

        state["positions"][player_id] = new_pos
        state["last_roll"] = [d1]

        state["last_action"] = {
            "type":      "ROLL_DICE",
            "player_id": player_id,
            "dice":      [d1],
            "roll_sum":  roll_sum,
            "from":      old_pos,
            "to":        new_pos,
            "event":     event,          # "ladder" | "snake" | "bounce" | None
            "event_from": event_from,
            "is_doubles": is_doubles,
        }

        state["move_history"].append(state["last_action"])

        # Win condition — must land exactly on 100
        if new_pos == _WIN:
            state["rankings"].append(player_id)
            
            remaining = [pid for pid in order if pid not in state["rankings"]]
            if len(remaining) <= 1:
                # Add the last remaining player(s) to rankings
                state["rankings"].extend(remaining)
                
                state["status"] = "finished"
                winner = state["rankings"][0]
                state["winner"] = winner
                state["winner_name"] = state["player_names"].get(winner, winner)
                
                # Score: position in rankings
                for i, pid in enumerate(state["rankings"]):
                    # Add to existing scores
                    state["scores"][pid] = state["scores"].get(pid, 0) + max(0, len(order) - i) * 100
                state["last_action"]["won"] = True
            else:
                state["last_action"]["ranked"] = len(state["rankings"])
                # If finished early, advance turn, but no extra roll for doubles since player is out
                self._advance_turn(state, n)
            return state

        # Doubles handling
        if is_doubles:
            state["consecutive_doubles"][player_id] = \
                state["consecutive_doubles"].get(player_id, 0) + 1
            if state["consecutive_doubles"][player_id] >= 3:
                # Three doubles — skip next turn
                state["skip_next_turn"].append(player_id)
                state["last_action"]["three_doubles_penalty"] = True
                state["consecutive_doubles"][player_id] = 0
                self._advance_turn(state, n)
            else:
                # Extra roll — stay on current player
                state["last_action"]["extra_roll"] = True
                state["turn_started_at"] = time.time()
                state["rolls_this_turn"] = state.get("rolls_this_turn", 0) + 1
        else:
            state["consecutive_doubles"][player_id] = 0
            self._advance_turn(state, n)

        return state

    def _advance_turn(self, state: dict, n: int) -> None:
        order = state["turn_order"]
        idx = state["current_player_index"]
        # Skip players who have already won (are in rankings)
        next_idx = (idx + 1) % n
        attempts = 0
        while order[next_idx] in state["rankings"] and attempts < n:
            next_idx = (next_idx + 1) % n
            attempts += 1
        state["current_player_index"] = next_idx
        state["turn_started_at"] = time.time()
        state["rolls_this_turn"] = 0
        
        # Timer escalation based on game progress
        max_pos = max(state["positions"].values()) if state["positions"] else 0
        if max_pos >= 80:
            state["turn_duration"] = 15
        elif max_pos >= 50:
            state["turn_duration"] = 20
        else:
            state["turn_duration"] = 30

    def _handle_timeout(self, state: dict, player_id: str, n: int) -> dict:
        state["last_action"] = {"type": "TIMEOUT", "player_id": player_id}
        self._advance_turn(state, n)
        return state

    def get_player_view(self, state: dict, player_id: str) -> dict:
        view = copy.deepcopy(state)
        idx = state["current_player_index"]
        current = state["turn_order"][idx]
        view["is_my_turn"] = current == player_id
        view["can_roll"] = (
            view["is_my_turn"] and
            state["status"] == "playing" and
            player_id not in state.get("rankings", [])
        )
        return view

    def is_game_over(self, state: dict) -> bool:
        return state["status"] == "finished"

    def get_winner(self, state: dict) -> Optional[str]:
        return state["winner"]
