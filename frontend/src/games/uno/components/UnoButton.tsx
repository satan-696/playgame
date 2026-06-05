import { AnimatePresence, motion } from "framer-motion";

interface UnoButtonProps {
  isMyTurn: boolean;
  myHandCount: number;
  myPlayerId: string;
  unoDeclared: Record<string, boolean>;
  pendingUnoCheck: string | null;
  pendingUnoCheckName: string | null;
  onUno: () => void;
}

export function UnoButton({
  isMyTurn: _isMyTurn,
  myHandCount: _myHandCount,
  myPlayerId,
  unoDeclared,
  pendingUnoCheck,
  pendingUnoCheckName: _pendingUnoCheckName,
  onUno,
}: UnoButtonProps) {
  const unoButtonActive = pendingUnoCheck === myPlayerId && !unoDeclared?.[myPlayerId];

  const handleUnoClick = () => {
    if (unoButtonActive) {
      onUno();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        bottom: 12,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 30,
      }}
    >
      <style>{`
        @keyframes uno-pulse {
          0%,100% { transform: scale(1); box-shadow: 0 0 20px rgba(239,68,68,0.6); }
          50%      { transform: scale(1.08); box-shadow: 0 0 40px rgba(239,68,68,0.9); }
        }
      `}</style>
      <AnimatePresence mode="popLayout">
        <motion.button
          key="uno"
          type="button"
          initial={{ scale: 0.9, opacity: 0.5 }}
          animate={{
            scale: unoButtonActive ? 1 : 0.9,
            opacity: unoButtonActive ? 1 : 0.5,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          onClick={handleUnoClick}
          style={{
            background: "linear-gradient(135deg, #dc2626, #991b1b)",
            color: "white",
            border: "3px solid rgba(255,255,255,0.9)",
            borderRadius: 999,
            padding: "12px 40px",
            fontSize: "1.5rem",
            fontWeight: 900,
            fontFamily: "Arial Black, sans-serif",
            letterSpacing: 4,
            cursor: unoButtonActive ? "pointer" : "default",
            animation: unoButtonActive ? "uno-pulse 0.75s infinite" : "none",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
          }}
        >
          UNO!
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
