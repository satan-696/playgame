import random
from typing import Optional
from app.shell.models import Player, Room

class RoomManager:
    _instance: Optional["RoomManager"] = None

    def __new__(cls) -> "RoomManager":
        if cls._instance is None:
            cls._instance = super(RoomManager, cls).__new__(cls)
            cls._instance.rooms = {}
        return cls._instance

    def __init__(self) -> None:
        if not hasattr(self, 'rooms'):
            self.rooms = {}

    def generate_code(self) -> str:
        chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
        while True:
            code = "".join(random.choices(chars, k=6))
            if code not in self.rooms:
                return code

    def create_room(self, host: Player) -> Room:
        code = self.generate_code()
        room = Room(
            code=code,
            players=[host],
            status="waiting",
            game_id=None,
            game_state=None
        )
        self.rooms[code] = room
        return room

    def join_room(self, code: str, player: Player) -> Room:
        room = self.get_room(code)
        if not room:
            raise ValueError("Room not found")
        if any(p.id == player.id for p in room.players):
            return room
        room.players.append(player)
        return room

    def leave_room(self, code: str, player_id: str) -> Optional[Room]:
        room = self.get_room(code)
        if not room:
            return None
        
        room.players = [p for p in room.players if p.id != player_id]
        
        if not room.players:
            self.rooms.pop(code, None)
            return None
        
        if not any(p.is_host for p in room.players):
            room.players[0].is_host = True
            
        return room

    def get_room(self, code: str) -> Optional[Room]:
        return self.rooms.get(code.upper())


room_manager = RoomManager()
