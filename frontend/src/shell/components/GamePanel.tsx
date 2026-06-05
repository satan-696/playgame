import React, { useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GAME_REGISTRY } from "../../games/registry";
import { useFullscreen } from "../hooks/useFullscreen";
import { useRoomContext } from "../context/RoomContext";
import { usePlayer } from "../context/PlayerContext";
import { LobbyView } from "./LobbyView";
import { fadeVariants } from "../utils/motion";

const FullscreenIcon: React.FC<{ isFullscreen: boolean }> = ({ isFullscreen }) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2" aria-hidden="true">
    {isFullscreen ? (
      <>
        <polyline points="8 3 3 3 3 8" /><line x1="3" y1="3" x2="9" y2="9" />
        <polyline points="16 3 21 3 21 8" /><line x1="21" y1="3" x2="15" y2="9" />
        <polyline points="8 21 3 21 3 16" /><line x1="3" y1="21" x2="9" y2="15" />
        <polyline points="16 21 21 21 21 16" /><line x1="21" y1="21" x2="15" y2="15" />
      </>
    ) : (
      <>
        <polyline points="15 3 21 3 21 9" /><line x1="21" y1="3" x2="14" y2="10" />
        <polyline points="9 21 3 21 3 15" /><line x1="3" y1="21" x2="10" y2="14" />
        <polyline points="21 15 21 21 15 21" /><line x1="21" y1="21" x2="14" y2="14" />
        <polyline points="3 9 3 3 9 3" /><line x1="3" y1="3" x2="10" y2="10" />
      </>
    )}
  </svg>
);

interface GamePanelProps {
  startGame: (gameId: string, options?: Record<string, unknown>) => void;
  onSelectGame: (gameId: string) => void;
  selectedGameId: string;
  sendAction: (action: Record<string, unknown>) => void;
  onLeave?: () => void;
}

export const GamePanel: React.FC<GamePanelProps> = ({
  startGame,
  onSelectGame,
  selectedGameId,
  sendAction,
  onLeave,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { isFullscreen, toggle } = useFullscreen(panelRef as React.RefObject<HTMLElement>);
  const { room } = useRoomContext();
  const { playerId } = usePlayer();
  const isPlaying = room?.status === "playing";
  const GameComponent = room?.game_id ? GAME_REGISTRY[room.game_id]?.component : null;

  const onAction = useCallback((type: "GAME_ACTION", payload: Record<string, unknown>) => {
    if (type === "GAME_ACTION") {
      sendAction(payload);
    }
  }, [sendAction]);

  return (
    <div ref={panelRef} className="relative flex-1 min-w-0 bg-base-300 overflow-hidden flex flex-col">
      <button
        onClick={toggle}
        className="absolute top-2 right-2 z-10 btn btn-xs btn-ghost border border-base-300 bg-base-100/50 backdrop-blur-sm"
        title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
      >
        <FullscreenIcon isFullscreen={isFullscreen} />
      </button>

      <AnimatePresence mode="wait">
        {isPlaying && GameComponent ? (
          <motion.div
            key={`game-${room?.game_id ?? "unknown"}`}
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 min-h-0"
          >
            <GameComponent
              gameState={room?.game_state}
              myPlayerId={playerId}
              onAction={onAction}
              onLeave={onLeave}
              isHost={room?.host_id === playerId}
            />
          </motion.div>
        ) : (
          <motion.div
            key="lobby"
            variants={fadeVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1 overflow-auto"
          >
            <LobbyView
              startGame={startGame}
              onSelectGame={onSelectGame}
              selectedGameId={selectedGameId}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
