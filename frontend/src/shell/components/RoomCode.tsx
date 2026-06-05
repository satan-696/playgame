import React, { useState } from "react";
import { motion } from "framer-motion";

interface RoomCodeProps {
  code: string;
  size?: "sm" | "lg";
}

export const RoomCode: React.FC<RoomCodeProps> = ({ code, size = "lg" }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // TODO: Handle copy failure gracefully
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button
        onClick={handleCopy}
        whileTap={{ scale: 0.96 }}
        animate={copied ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={{ duration: 0.25 }}
        className={`font-mono font-black tracking-widest text-primary select-none cursor-pointer hover:opacity-80 transition-opacity ${
          size === "lg" ? "text-5xl" : "text-2xl"
        }`}
        title="Click to copy link"
      >
        {code}
      </motion.button>
      <button
        onClick={handleCopy}
        className={`btn btn-sm ${copied ? "btn-success" : "btn-ghost border border-base-300"}`}
      >
        {copied ? "✓ Copied!" : "Copy Room Link"}
      </button>
    </div>
  );
};
