import { AnimatePresence, motion } from "framer-motion";
import { CARD_COLORS } from "../constants";

interface ColorRoulettePromptProps {
  open: boolean;
  isTarget: boolean;          // true = I'm the one drawing
  targetPlayerName: string;
  chosenColor: string;
  drawnSoFar: number;         // live counter from roulette_drawn_count
}

export function ColorRoulettePrompt({
  open,
  isTarget,
  targetPlayerName,
  chosenColor,
  drawnSoFar,
}: ColorRoulettePromptProps) {
  const colorHex = CARD_COLORS[chosenColor] ?? "#7B2FFF";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="roulette-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse at center, ${colorHex}22 0%, rgba(0,0,0,0.88) 100%)`,
            backdropFilter: "blur(8px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 28 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 16 }}
            transition={{ type: "spring", stiffness: 360, damping: 26 }}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
              background: "rgba(10,10,28,0.97)",
              borderRadius: 24,
              border: `1px solid ${colorHex}44`,
              padding: "40px 48px",
              boxShadow: `0 0 60px ${colorHex}22, 0 28px 70px rgba(0,0,0,0.85)`,
              maxWidth: 360,
              textAlign: "center",
            }}
          >
            {/* Spinning roulette badge */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              style={{
                width: 86, height: 86, borderRadius: "50%",
                background: `conic-gradient(
                  ${CARD_COLORS.red ?? "#FF3B30"} 0deg 90deg,
                  ${CARD_COLORS.blue ?? "#1A8CFF"} 90deg 180deg,
                  ${CARD_COLORS.yellow ?? "#FFD600"} 180deg 270deg,
                  ${CARD_COLORS.green ?? "#2ECC71"} 270deg 360deg
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid rgba(255,255,255,0.85)",
                boxShadow: `0 0 36px ${colorHex}66`,
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: "50%",
                background: "rgba(10,10,28,0.95)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 26 }}>🎰</span>
              </div>
            </motion.div>

            {/* Text */}
            <div>
              <div style={{
                color: "rgba(255,255,255,0.42)",
                fontSize: 11, fontWeight: 800, letterSpacing: 3,
                textTransform: "uppercase", marginBottom: 8,
              }}>
                Wild Draw Color
              </div>
              {isTarget ? (
                <>
                  <div style={{ color: "white", fontSize: 17, fontWeight: 900, lineHeight: 1.4 }}>
                    Drawing until{" "}
                    <span style={{ color: colorHex, fontWeight: 900 }}>{chosenColor.toUpperCase()}</span>
                    {" "}appears...
                  </div>
                  {drawnSoFar > 0 && (
                    <motion.div
                      key={drawnSoFar}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={{
                        marginTop: 14,
                        color: "rgba(255,255,255,0.52)",
                        fontSize: 14,
                      }}
                    >
                      <span style={{ color: "#f87171", fontWeight: 800, fontSize: 22 }}>
                        {drawnSoFar}
                      </span>
                      {" "}card{drawnSoFar !== 1 ? "s" : ""} drawn so far
                    </motion.div>
                  )}
                </>
              ) : (
                <div style={{ color: "white", fontSize: 17, fontWeight: 900, lineHeight: 1.4 }}>
                  <span style={{ color: "#c084fc" }}>{targetPlayerName}</span>{" "}
                  is drawing until{" "}
                  <span style={{ color: colorHex, fontWeight: 900 }}>{chosenColor.toUpperCase()}</span>
                </div>
              )}
            </div>

            {/* Draw count shown to spectators too */}
            {!isTarget && drawnSoFar > 0 && (
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
                {drawnSoFar} drawn so far...
              </div>
            )}

            <div style={{
              color: "rgba(255,255,255,0.25)",
              fontSize: 11, fontWeight: 600, lineHeight: 1.6,
            }}>
              {isTarget
                ? "Cards are drawn automatically — sit tight!"
                : "Resolving server-side..."}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
