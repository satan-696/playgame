import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { GamePanel } from "./GamePanel";
import { GameLibrarySidebar } from "./GameLibrarySidebar";
import { PlayerTray } from "./PlayerTray";
import { NameEntry } from "./NameEntry";
import { useRoomContext } from "../context/RoomContext";
import { usePlayer } from "../context/PlayerContext";
import { useRoom } from "../hooks/useRoom";
import { pageVariants } from "../utils/motion";
import { GAME_METAS } from "../../games/registry";
import { API_URL } from "../constants";

interface AppLayoutProps {
  roomCode?: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ roomCode }) => {
  const { playerName } = usePlayer();
  const { room } = useRoomContext();
  const navigate = useNavigate();

  const firstGameId = Object.keys(GAME_METAS)[0] ?? "template";
  const [selectedGameId, setSelectedGameId] = useState(firstGameId);

  const { leaveRoom, sendAction, startGame } = useRoom(
    playerName ? (roomCode ?? null) : null
  );

  const handleLeave = () => {
    leaveRoom();
    navigate("/");
  };

  if (!playerName) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center p-4">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="w-full max-w-sm"
        >
          <NameEntry />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-base-100">
      <Header onLeave={room ? handleLeave : undefined} />

      <div className="flex flex-row flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {!room && !roomCode ? (
            <motion.div
              key="home"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex-1 flex items-center justify-center p-6"
            >
              <HomeCards />
            </motion.div>
          ) : (
            <motion.div
              key="room"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="flex flex-row flex-1 min-w-0 min-h-0"
            >
              <GamePanel
                startGame={startGame}
                onSelectGame={setSelectedGameId}
                selectedGameId={selectedGameId}
                sendAction={sendAction}
                onLeave={handleLeave}
              />
              <GameLibrarySidebar
                activeGameId={room?.game_id ?? null}
                onSelectGame={setSelectedGameId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <PlayerTray />
    </div>
  );
};

const HomeCards: React.FC = () => {
  const navigate = useNavigate();
  const { playerId, playerName } = usePlayer();
  const [joinCode, setJoinCode] = useState("");
  const [showJoin, setShowJoin] = useState(false);

  const handleCreate = async () => {
    const res = await fetch(`${API_URL}/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player_id: playerId, player_name: playerName }),
    });
    if (res.ok) {
      const data = await res.json();
      navigate(`/room/${data.code}`);
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) navigate(`/room/${joinCode.trim().toUpperCase()}`);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-sm">
      <div className="text-center">
        <h2 className="text-3xl font-black text-base-content">
          Welcome, <span className="text-primary">{playerName}</span>
        </h2>
        <p className="text-base-content/50 mt-1 text-sm">Start or join a room to play</p>
      </div>

      {!showJoin ? (
        <div className="flex flex-col gap-3 w-full">
          <button onClick={handleCreate} className="btn btn-primary w-full btn-lg">
            Create Room
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="btn btn-ghost border border-base-300 w-full"
          >
            Join Room
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoin} className="flex flex-col gap-3 w-full">
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Room code (e.g. XKPQ72)"
            maxLength={6}
            className="input input-bordered w-full text-center font-mono uppercase tracking-widest text-xl"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowJoin(false)} className="btn btn-ghost flex-1 border border-base-300">
              Back
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Join
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
