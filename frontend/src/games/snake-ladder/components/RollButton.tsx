import { motion } from "framer-motion";

interface RollButtonProps {
  canRoll: boolean;
  onRoll: () => void;
  isMobile: boolean;
}

export default function RollButton({ canRoll, onRoll, isMobile }: RollButtonProps) {
  return (
    <motion.button
      whileHover={canRoll ? { scale: 1.06, y: -3 } : {}}
      whileTap={canRoll ? { scale: 0.94, y: 0 } : {}}
      onClick={canRoll ? onRoll : undefined}
      style={{
        background: canRoll
          ? "linear-gradient(160deg, #FF6B00 0%, #FF3B30 100%)"
          : "rgba(255,255,255,0.08)",
        border: canRoll
          ? "3px solid rgba(255,255,255,0.3)"
          : "2px solid rgba(255,255,255,0.08)",
        borderRadius: 999,
        padding: isMobile ? "14px 32px" : "18px 48px",
        fontSize: isMobile ? 18 : 24,
        fontWeight: 900,
        color: canRoll ? "white" : "rgba(255,255,255,0.25)",
        letterSpacing: 2,
        cursor: canRoll ? "pointer" : "default",
        fontFamily: "'Nunito', Arial Black, sans-serif",
        boxShadow: canRoll
          ? "0 6px 0 rgba(0,0,0,0.3), 0 8px 24px rgba(255,107,0,0.4)"
          : "none",
        transition: "background 0.2s, box-shadow 0.2s, color 0.2s",
        animation: canRoll ? "roll-btn-pulse 1.4s ease-in-out infinite" : "none",
        outline: "none",
      }}
    >
      🎲 ROLL!
    </motion.button>
  );
}
