from abc import ABC, abstractmethod
from typing import Optional

class GameEngine(ABC):
    @abstractmethod
    def get_initial_state(self, players: list[dict]) -> dict:
        pass

    @abstractmethod
    def apply_action(self, state: dict, player_id: str, action: dict) -> dict:
        pass

    @abstractmethod
    def get_player_view(self, state: dict, player_id: str) -> dict:
        pass

    @abstractmethod
    def is_game_over(self, state: dict) -> bool:
        pass

    @abstractmethod
    def get_winner(self, state: dict) -> Optional[str]:
        pass
