import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { useRoomContext } from "../context/RoomContext";
import { usePlayer } from "../context/PlayerContext";

interface HeaderRoomCodeProps {
  code: string;
}

const HeaderRoomCode: React.FC<HeaderRoomCodeProps> = ({ code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.95 }}
      animate={copied ? { scale: [1, 1.08, 1] } : { scale: 1 }}
      transition={{ duration: 0.25 }}
      className={clsx(
        "badge badge-lg font-mono tracking-widest cursor-pointer select-none",
        copied ? "badge-success" : "badge-ghost border-base-300"
      )}
      title="Click to copy room link"
    >
      {copied ? "Copied!" : code}
    </motion.button>
  );
};

interface HeaderProps {
  onLeave?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLeave }) => {
  const { room } = useRoomContext();
  const { playerName } = usePlayer();

  return (
    <header className="h-13 min-h-[52px] border-b border-base-300 bg-base-100 flex items-center px-4 gap-4 z-10 shrink-0">
      <div className="flex-1 flex items-center">
        <span className="font-bold text-lg tracking-wide text-primary">
          playgames
        </span>
      </div>

      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          {room && (
            <motion.div
              key={room.room_code}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15 }}
            >
              <HeaderRoomCode code={room.room_code} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 flex items-center justify-end gap-2">
        <AnimatePresence mode="wait">
          {room && (
            <motion.div
              key="room-controls"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2"
            >
              <span className="badge badge-ghost badge-md border-base-300 font-medium">
                {playerName}
              </span>
              {onLeave && (
                <button
                  onClick={onLeave}
                  className="btn btn-ghost btn-sm text-error"
                >
                  Leave
                </button>
              )}
            </motion.div>
          )}
          {!room && playerName && (
            <motion.span
              key="player-name"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="badge badge-ghost border-base-300 font-medium"
            >
              {playerName}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
