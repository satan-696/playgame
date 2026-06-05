import React, { useState } from "react";
import { Room as RoomType } from "../types";
import { RoomCode } from "./RoomCode";
import { usePlayer } from "../context/PlayerContext";
import { GAME_REGISTRY } from "../../games/registry";

interface RoomProps {
  room: RoomType;
  error: string | null;
  connectionStatus: string;
  leaveRoom: () => void;
  sendAction: (action: Record<string, unknown>) => void;
  startGame: (gameId: string, options?: Record<string, unknown>) => void;
}

export const Room: React.FC<RoomProps> = ({
  room,
  error,
  connectionStatus,
  leaveRoom,
  sendAction,
  startGame,
}) => {
  const { playerId } = usePlayer();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // TODO: Handle copy failure
    }
  };

  const isHost = room.host_id === playerId;
  const canStart = room.players.length >= 2;

  const BoardComponent = room.game_id ? GAME_REGISTRY[room.game_id]?.component : null;

  return (
    <div className="w-full max-w-4xl p-6 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-6">
      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 rounded-xl text-red-200 text-center">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div>
          <span className="text-sm text-zinc-500 font-medium">Room Code</span>
          <RoomCode code={room.room_code} />
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 font-semibold rounded-lg text-zinc-300 hover:text-zinc-100 transition-colors"
          >
            {copiedLink ? "Link Copied!" : "Copy Room Link"}
          </button>
          <button
            onClick={leaveRoom}
            className="px-4 py-2 bg-red-950 border border-red-900 hover:bg-red-900/50 font-semibold rounded-lg text-red-200 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-zinc-950 border border-zinc-800 p-4 rounded-xl space-y-4">
          <h3 className="text-lg font-semibold text-zinc-200 border-b border-zinc-800 pb-2 flex items-center justify-between">
            <span>Players</span>
            <span className="text-xs bg-zinc-850 px-2 py-0.5 rounded text-zinc-400">
              {room.players.length}
            </span>
          </h3>
          <ul className="space-y-2">
            {room.players.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between p-2 rounded bg-zinc-900 border border-zinc-850"
              >
                <span className="text-zinc-100 font-medium">{p.name}</span>
                {p.is_host && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-yellow-950/50 border border-yellow-800 text-yellow-500 rounded">
                    Host
                  </span>
                )}
              </li>
            ))}
          </ul>
          <div className="pt-2 flex items-center space-x-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectionStatus === "connected"
                  ? "bg-green-500 animate-pulse"
                  : connectionStatus === "connecting"
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
            />
            <span className="text-xs text-zinc-500 capitalize">{connectionStatus}</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col justify-between min-h-[300px]">
          {room.status === "waiting" ? (
            <div className="flex flex-col items-center justify-center h-full space-y-6 py-12">
              <div className="text-center space-y-2">
                <h4 className="text-xl font-semibold text-zinc-300">Waiting for Players</h4>
                <p className="text-zinc-500 text-sm max-w-sm">
                  {isHost
                    ? "Share the room code or link. The game requires at least 2 players to start."
                    : "Waiting for the host to start the game."}
                </p>
              </div>

              {isHost && (
                <button
                  onClick={() => startGame(room.game_id ?? "uno")}
                  disabled={!canStart}
                  className="px-8 py-3 bg-zinc-100 text-zinc-950 font-bold rounded-lg hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  Start Game
                </button>
              )}
            </div>
          ) : (
            <div className="w-full">
              {BoardComponent ? (
                <BoardComponent
                  gameState={room.game_state || {}}
                  myPlayerId={playerId}
                  onAction={(_type, payload) => sendAction(payload)}
                  onLeave={leaveRoom}
                  isHost={isHost}
                />
              ) : (
                <div className="text-center text-zinc-500">
                  Game engine loaded, rendering board...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
