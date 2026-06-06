from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import rooms, ws
from app.config import CORS_ORIGINS
# Bootstrap game engine registrations (each module self-registers via @register_game)
import app.games.uno_flip  # noqa: F401
import app.games.uno_no_mercy  # noqa: F401

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(rooms.router, prefix="/rooms")
app.include_router(ws.router, prefix="/ws")
