from typing import Type
from app.games.base import GameEngine

GAME_REGISTRY: dict[str, Type[GameEngine]] = {}


def register_game(game_id: str):
    def decorator(cls: Type[GameEngine]):
        GAME_REGISTRY[game_id] = cls
        return cls
    return decorator


def get_engine(game_id: str) -> Type[GameEngine]:
    if game_id not in GAME_REGISTRY:
        raise KeyError(f"Game '{game_id}' not found in registry")
    return GAME_REGISTRY[game_id]


from app.games.uno import UnoEngine as _UnoEngine  # noqa: E402, F401
