from dataclasses import dataclass
from typing import Optional

@dataclass
class Player:
    id: str
    name: str
    is_host: bool

@dataclass
class Room:
    code: str
    players: list[Player]
    status: str
    game_id: Optional[str] = None
    game_state: Optional[dict] = None
