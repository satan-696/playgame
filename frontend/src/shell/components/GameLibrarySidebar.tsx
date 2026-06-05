import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { GAME_METAS } from "../../games/registry";
import { useRoomContext } from "../context/RoomContext";
import { usePlayer } from "../context/PlayerContext";

const LockIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-base-content/50" aria-hidden="true">
    <path d="M18 8h-1V6A5 5 0 0 0 7 6v2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10a2 2 0 0 0-2-2zM12 17a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm3.1-9H8.9V6a3.1 3.1 0 0 1 6.2 0v2z" />
  </svg>
);

const ChevronIcon: React.FC<{ collapsed: boolean }> = ({ collapsed }) => (
  <motion.svg
    viewBox="0 0 24 24"
    className="w-4 h-4 fill-none stroke-base-content/60 stroke-2"
    animate={{ rotate: collapsed ? 180 : 0 }}
    transition={{ duration: 0.25 }}
    aria-hidden="true"
  >
    <polyline points="15 18 9 12 15 6" />
  </motion.svg>
);

interface GameLibrarySidebarProps {
  onSelectGame?: (gameId: string) => void;
  activeGameId?: string | null;
}

export const GameLibrarySidebar: React.FC<GameLibrarySidebarProps> = ({
  onSelectGame,
  activeGameId,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { room } = useRoomContext();
  const { playerId } = usePlayer();

  const isHost = room?.host_id === playerId;
  const games = Object.values(GAME_METAS);

  const EXPANDED_WIDTH = 220;
  const COLLAPSED_WIDTH = 40;

  return (
    <motion.aside
      layout
      animate={{ width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="relative flex flex-col border-l border-base-300 bg-base-200 overflow-hidden shrink-0"
      style={{ minWidth: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute top-3 -left-3 z-10 btn btn-xs btn-ghost border border-base-300 bg-base-200 rounded-full w-6 h-6 p-0 flex items-center justify-center shadow"
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronIcon collapsed={collapsed} />
      </button>

      <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-1 mt-2">
        <AnimatePresence mode="popLayout">
          {games.map((meta) => {
            const isActive = activeGameId === meta.id;

            if (collapsed) {
              return (
                <motion.div
                  key={meta.id}
                  layout
                  title={meta.name}
                  onClick={() => isHost && onSelectGame?.(meta.id)}
                  className={clsx(
                    "w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors mx-auto",
                    isActive ? "bg-primary/20 border border-primary" : "bg-base-300 hover:bg-base-100"
                  )}
                >
                  <span className="text-base-content/80 text-xs font-bold uppercase">
                    {meta.name.charAt(0)}
                  </span>
                </motion.div>
              );
            }

            return (
              <motion.div
                key={meta.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                onClick={() => isHost && onSelectGame?.(meta.id)}
                className={clsx(
                  "card card-compact cursor-pointer transition-all",
                  isActive
                    ? "border border-primary bg-primary/10"
                    : "border border-base-300 bg-base-100 hover:border-base-content/20"
                )}
              >
                <div className="card-body p-2 gap-1.5">
                  <div
                    className="w-full h-14 rounded bg-base-300 flex items-center justify-center"
                    style={{ background: `hsl(${(meta.name.charCodeAt(0) * 15) % 360}, 30%, 25%)` }}
                  >
                    <span className="text-2xl font-black text-white/60">
                      {meta.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-sm font-semibold text-base-content truncate">
                      {meta.name}
                    </span>
                    {!isHost && (
                      <div className="tooltip tooltip-left" data-tip="Host only">
                        <LockIcon />
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-base-content/50">
                    {meta.minPlayers}–{meta.maxPlayers} players
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {games.length === 0 && !collapsed && (
          <p className="text-xs text-base-content/40 text-center mt-4 px-2">
            No games registered yet.
          </p>
        )}
      </div>
    </motion.aside>
  );
};
