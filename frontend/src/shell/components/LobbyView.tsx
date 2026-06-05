import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRoomContext } from "../context/RoomContext";
import { usePlayer } from "../context/PlayerContext";
import { GAME_METAS } from "../../games/registry";
import { pageVariants } from "../utils/motion";
import { UnoRuleToggles } from "./UnoRuleToggles";
import { UnoRules, DEFAULT_UNO_RULES } from "../../games/uno/types";

interface LobbyViewProps {
  startGame: (gameId: string, options?: Record<string, unknown>) => void;
  onSelectGame: (gameId: string) => void;
  selectedGameId: string;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ startGame, onSelectGame, selectedGameId }) => {
  const { room } = useRoomContext();
  const { playerId } = usePlayer();
  const [copied, setCopied] = useState(false);
  const [rules, setRules] = useState<UnoRules>(DEFAULT_UNO_RULES);

  const toggleRule = (key: keyof UnoRules) => {
    setRules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!room) return null;

  const isHost = room.host_id === playerId;
  const selectedMeta = GAME_METAS[selectedGameId];
  const minPlayers = selectedMeta?.minPlayers ?? 2;
  const canStart = room.players.length >= minPlayers;
  const gameIds = Object.keys(GAME_METAS);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-col items-center justify-center h-full gap-8 p-6"
    >
      <div className="flex flex-col items-center gap-2">
        <span className="font-mono text-5xl font-black tracking-widest text-primary select-none">
          {room.room_code}
        </span>
        <button
          onClick={handleCopyLink}
          className={`btn btn-sm ${copied ? "btn-success" : "btn-ghost border-base-300"}`}
        >
          {copied ? "✓ Link copied!" : "Copy invite link"}
        </button>
        <p className="text-base-content/50 text-sm">Share this link to invite friends</p>
      </div>

      <div className="card bg-base-200 border border-base-300 w-full max-w-xs">
        <div className="card-body p-4 gap-2">
          <h3 className="font-semibold text-sm text-base-content/60 uppercase tracking-wider">
            Players · {room.players.length}
          </h3>
          <ul className="flex flex-col gap-1.5">
            {room.players.map((p) => (
              <li key={p.id} className="flex items-center justify-between">
                <span className={`text-sm font-medium ${p.id === playerId ? "text-primary" : "text-base-content"}`}>
                  {p.name}
                </span>
                {p.is_host && (
                  <span className="badge badge-warning badge-xs">host</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {isHost && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          {gameIds.length > 1 && (
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text text-xs text-base-content/60">Select game</span>
              </label>
              <select
                className="select select-bordered select-sm w-full"
                value={selectedGameId}
                onChange={(e) => onSelectGame(e.target.value)}
              >
                {gameIds.map((id) => (
                  <option key={id} value={id}>
                    {GAME_METAS[id]?.name ?? id}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {selectedGameId === "uno" && (
            <UnoRuleToggles rules={rules} onToggle={toggleRule} isHost={isHost} />
          )}

          <button
            onClick={() => startGame(selectedGameId, { rules })}
            disabled={!canStart}
            className="btn btn-primary w-full mt-4"
          >
            {canStart
              ? "Start Game"
              : `Need ${minPlayers - room.players.length} more player${minPlayers - room.players.length !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {!isHost && (
        <p className="text-base-content/40 text-sm italic">Waiting for host to start the game...</p>
      )}
    </motion.div>
  );
};
