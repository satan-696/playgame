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

try:
    from app.games.uno_flip import UnoFlipEngine as _UnoFlipEngine  # noqa
except Exception as _e:
    import logging
    logging.getLogger(__name__).error(f"Failed to load UnoFlipEngine: {_e}")

try:
    from app.games.uno_no_mercy import UnoNoMercyEngine as _UnoNoMercyEngine  # noqa
except Exception as _e:
    import logging
    logging.getLogger(__name__).error(f"Failed to load UnoNoMercyEngine: {_e}")

try:
    from app.games.snake_ladder import SnakeLadderEngine as _SnakeLadderEngine  # noqa
except Exception as _e:
    import logging
    logging.getLogger(__name__).error(f"Failed to load SnakeLadderEngine: {_e}")
