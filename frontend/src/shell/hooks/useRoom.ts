import { useEffect, useState } from "react";
import { useRoomContext } from "../context/RoomContext";
import { useWebSocket } from "./useWebSocket";
import { WS_URL } from "../constants";
import { usePlayer } from "../context/PlayerContext";

export const useRoom = (roomCode: string | null) => {
  const { room, setRoom } = useRoomContext();
  const { playerId, playerName } = usePlayer();
  const [error, setError] = useState<string | null>(null);

  const socketUrl = roomCode ? `${WS_URL}/${playerId}` : null;
  const { send, lastMessage, connectionStatus } = useWebSocket(socketUrl);

  useEffect(() => {
    if (!lastMessage) return;

    if (lastMessage.type === "ROOM_UPDATE") {
      setRoom(lastMessage.payload);
      setError(null);
    } else if (lastMessage.type === "ERROR") {
      setError(lastMessage.payload.message);
    }
  }, [lastMessage, setRoom]);

  useEffect(() => {
    if (connectionStatus === "connected" && roomCode && playerName) {
      send("JOIN_ROOM", { room_code: roomCode, player_name: playerName });
    }
  }, [connectionStatus, roomCode, playerName, send]);

  const leaveRoom = () => {
    send("LEAVE_ROOM", {});
    setRoom(null);
  };

  const sendAction = (action: Record<string, unknown>) => {
    send("GAME_ACTION", action);
  };

  const startGame = (gameId: string, options?: Record<string, unknown>) => {
    send("START_GAME", { game_id: gameId, ...options });
  };

  return {
    room,
    error,
    connectionStatus,
    leaveRoom,
    sendAction,
    startGame,
  };
};
