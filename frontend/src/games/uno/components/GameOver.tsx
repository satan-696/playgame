import { AnimatePresence, motion } from "framer-motion";
import { CARD_COLORS, UNO_COLORS } from "../constants";

interface GameOverProps {
  open: boolean;
  iWon: boolean;
  winnerName: string | null;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave?: () => void;
}

export function GameOver({ open, iWon, winnerName, isHost, onPlayAgain, onLeave }: GameOverProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="game-over"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* Confetti for win */}
          {iWon && Array.from({ length: 50 }).map((_, index) => (
            <motion.div
              key={`confetti-${index}`}
              initial={{ x: 0, y: -20, rotate: 0, opacity: 1, scale: 1 }}
              animate={{
                x: (Math.random() - 0.5) * 800,
                y: 700,
                rotate: Math.random() * 720 - 360,
                opacity: 0,
                scale: Math.random() * 0.5 + 0.5,
              }}
              transition={{ duration: 1.8 + Math.random() * 0.8, ease: "easeOut", delay: Math.random() * 0.4 }}
              style={{
                position: "absolute",
                left: "50%",
                top: "30%",
                width: Math.random() > 0.5 ? 8 : 5,
                height: Math.random() > 0.5 ? 8 : 14,
                borderRadius: Math.random() > 0.5 ? "50%" : 2,
                background: CARD_COLORS[UNO_COLORS[index % UNO_COLORS.length]],
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Result panel */}
          <motion.div
            initial={{ y: 60, scale: 0.88, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 280, damping: 24, delay: 0.1 }}
            style={{
              background: "rgba(10,10,28,0.97)",
              borderRadius: 28,
              border: `2px solid ${iWon ? "rgba(255,214,0,0.5)" : "rgba(255,255,255,0.12)"}`,
              padding: "48px 64px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              gap: 24,
              alignItems: "center",
              boxShadow: iWon
                ? "0 0 80px rgba(255,214,0,0.25), 0 24px 60px rgba(0,0,0,0.7)"
                : "0 24px 60px rgba(0,0,0,0.7)",
              minWidth: 340,
            }}
          >
            {/* Trophy / emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18, delay: 0.25 }}
              style={{ fontSize: 64, lineHeight: 1 }}
            >
              {iWon ? "🏆" : "😔"}
            </motion.div>

            {/* Title */}
            <div>
              <div style={{
                color: iWon ? CARD_COLORS.yellow : "rgba(255,255,255,0.45)",
                fontSize: iWon ? "2.8rem" : "1.6rem",
                fontWeight: 900,
                lineHeight: 1,
                textShadow: iWon ? `0 4px 0 rgba(0,0,0,0.3)` : "none",
                marginBottom: 4,
                animation: iWon ? "winner-bounce 0.6s ease-in-out infinite alternate" : "none",
              }}>
                {iWon ? "🎉 YOU WON! 🎉" : "😢 Better luck next time!"}
              </div>
              {!iWon && winnerName && (
                <div style={{
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}>
                  🏆 <strong style={{ color: "white" }}>{winnerName}</strong> wins!
                </div>
              )}
            </div>

            {/* Divider */}
            <div style={{
              width: "100%",
              height: 1,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
            }} />

            {/* Actions */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
              {isHost && (
                <button
                  type="button"
                  onClick={onPlayAgain}
                  style={{
                    background: "linear-gradient(135deg, #ca8a04, #92400e)",
                    color: "white",
                    border: "2px solid rgba(245,158,11,0.5)",
                    borderRadius: 12,
                    padding: "12px 28px",
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: "pointer",
                    letterSpacing: 1,
                    transition: "transform 0.15s, box-shadow 0.15s",
                    boxShadow: "0 4px 16px rgba(202,138,4,0.35)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.boxShadow = "0 6px 24px rgba(202,138,4,0.55)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(202,138,4,0.35)";
                  }}
                >
                  🔄 Play Again
                </button>
              )}
              {onLeave && (
                <button
                  type="button"
                  onClick={onLeave}
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.8)",
                    border: "1.5px solid rgba(255,255,255,0.2)",
                    borderRadius: 12,
                    padding: "12px 28px",
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: "pointer",
                    letterSpacing: 0.5,
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.color = "rgba(255,255,255,0.8)";
                  }}
                >
                  Leave Room
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
