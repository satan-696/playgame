import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePlayer } from "../shell/context/PlayerContext";
import { NameEntry } from "../shell/components/NameEntry";
import { Room } from "../shell/components/Room";
import { useRoom } from "../shell/hooks/useRoom";

export const RoomPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const { playerName } = usePlayer();
  const navigate = useNavigate();

  const roomCode = code || null;
  const { room, error, connectionStatus, leaveRoom, sendAction, startGame } = useRoom(
    playerName ? roomCode : null
  );

  const handleBackToHome = () => {
    navigate("/");
  };

  if (!playerName) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
        <NameEntry />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 space-y-4">
        {error ? (
          <div className="w-full max-w-md p-6 bg-red-950/50 border border-red-800 rounded-xl text-center">
            <p className="text-red-200 font-semibold mb-4">{error}</p>
            <button
              onClick={handleBackToHome}
              className="px-4 py-2 bg-zinc-800 text-zinc-200 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Back to Home
            </button>
          </div>
        ) : (
          <div className="text-center text-zinc-400 font-medium animate-pulse">
            Connecting to room {roomCode}...
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <Room
        room={room}
        error={error}
        connectionStatus={connectionStatus}
        leaveRoom={() => {
          leaveRoom();
          navigate("/");
        }}
        sendAction={sendAction}
        startGame={startGame}
      />
    </div>
  );
};
