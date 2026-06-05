from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.shell.room_manager import RoomManager
from app.shell.models import Player

router = APIRouter()
room_manager = RoomManager()

class CreateRoomRequest(BaseModel):
    player_id: str
    player_name: str

class JoinRoomRequest(BaseModel):
    player_id: str
    player_name: str

@router.post("")
async def create_room(req: CreateRoomRequest):
    host = Player(id=req.player_id, name=req.player_name, is_host=True)
    room = room_manager.create_room(host)
    return {
        "code": room.code,
        "players": [{"id": p.id, "name": p.name, "is_host": p.is_host} for p in room.players],
        "status": room.status
    }

@router.post("/{code}/join")
async def join_room(code: str, req: JoinRoomRequest):
    room = room_manager.get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    player = Player(id=req.player_id, name=req.player_name, is_host=False)
    try:
        updated_room = room_manager.join_room(code, player)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "code": updated_room.code,
        "players": [{"id": p.id, "name": p.name, "is_host": p.is_host} for p in updated_room.players],
        "status": updated_room.status
    }

@router.get("/{code}")
async def get_room(code: str):
    room = room_manager.get_room(code)
    if not room:
        raise HTTPException(status_code=404, detail="Room not found")
    return {
        "code": room.code,
        "players": [{"id": p.id, "name": p.name, "is_host": p.is_host} for p in room.players],
        "status": room.status
    }

@router.get("")
async def list_rooms():
    return [{"code": r.code, "players_count": len(r.players), "status": r.status} for r in room_manager.rooms.values()]
