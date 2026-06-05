import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRoomContext } from "../context/RoomContext";
import { usePlayer } from "../context/PlayerContext";
import { pillVariants } from "../utils/motion";

const CrownIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-3 h-3 fill-warning" aria-hidden="true">
    <path d="M2 19l2-8 5 4 3-7 3 7 5-4 2 8H2zm0 2h20v2H2v-2z" />
  </svg>
);

export const PlayerTray: React.FC = () => {
  const { room } = useRoomContext();
  const { playerId } = usePlayer();
  const [turnName] = useState<string | null>(null);

  if (!room) {
    return (
      <div className="h-12 border-t border-base-300 bg-base-200 flex items-center px-4">
        <span className="text-base-content/40 text-sm">Not in a room</span>
      </div>
    );
  }

  const isWaiting = room.status === "waiting" && room.players.length < 2;

  return (
    <div className="h-auto min-h-12 max-h-24 border-t border-base-300 bg-base-200 flex items-center gap-2 px-4 py-2 flex-wrap overflow-y-auto">
      {isWaiting && (
        <span className="text-base-content/40 text-sm italic mr-2">
          Waiting for players...
        </span>
      )}

      {turnName && room.status === "playing" && (
        <span className="badge badge-primary badge-sm mr-2">
          {turnName}&apos;s turn
        </span>
      )}

      <AnimatePresence mode="popLayout">
        {room.players.map((player) => {
          const isSelf = player.id === playerId;
          const isHost = player.is_host;
          return (
            <motion.div
              key={player.id}
              variants={pillVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              layout
              className={`badge gap-1 badge-md ${
                isSelf ? "badge-primary" : "badge-ghost border-base-300"
              }`}
            >
              {isHost && <CrownIcon />}
              <span>{player.name}</span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
