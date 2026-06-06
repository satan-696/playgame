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
      <AnimatePresence mode="popLayout">
        <motion.button
          key="uno"
          type="button"
          initial={{ scale: 0.92, opacity: 0.45 }}
          animate={{
            scale: unoButtonActive ? 1 : 0.92,
            opacity: unoButtonActive ? 1 : 0.45,
          }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
          onClick={handleUnoClick}
          style={{
            background: "linear-gradient(160deg, #FF3B30 0%, #C0392B 100%)",
            color: "white",
            border: "4px solid rgba(255,255,255,0.25)",
            borderRadius: 999,
            padding: "14px 36px",
            fontSize: 22,
            fontWeight: 900,
            fontFamily: "'Nunito', Arial Black, sans-serif",
            letterSpacing: 2,
            cursor: unoButtonActive ? "pointer" : "default",
            pointerEvents: unoButtonActive ? "auto" : "none",
            animation: unoButtonActive ? "uno-btn-bounce 0.7s ease-in-out infinite" : "none",
            textShadow: "0 2px 8px rgba(0,0,0,0.4)",
            boxShadow: unoButtonActive
              ? "0 0 0 4px rgba(255,59,48,0.4), 0 8px 28px rgba(255,59,48,0.5)"
              : "0 6px 20px rgba(0,0,0,0.4)",
            transition: "opacity 0.2s, box-shadow 0.2s",
          }}
        >
          UNO!
        </motion.button>
      </AnimatePresence>
    </div>
  );
}
