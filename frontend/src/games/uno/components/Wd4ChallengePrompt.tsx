import { AnimatePresence, motion } from "framer-motion";
import { CARD_COLORS } from "../constants";

interface Wd4ChallengePromptProps {
  open: boolean;
  playedByName: string;
  drawCount: number;
  onAccept: () => void;
  onChallenge: () => void;
}

export function Wd4ChallengePrompt({
  open,
  playedByName,
  drawCount,
  onAccept,
  onChallenge,
}: Wd4ChallengePromptProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="wd4-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(ellipse at center, rgba(123,47,255,0.3) 0%, rgba(0,0,0,0.85) 100%)",
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
              gap: 22,
              background: "rgba(10,10,28,0.97)",
              borderRadius: 24,
              border: "1px solid rgba(139,92,246,0.3)",
              padding: "40px 48px",
              boxShadow:
                "0 0 60px rgba(139,92,246,0.18), 0 28px 70px rgba(0,0,0,0.85)",
              maxWidth: 380,
              textAlign: "center",
            }}
          >
            {/* Wild +4 badge */}
            <motion.div
              initial={{ rotate: -15, scale: 0.7 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.08 }}
              style={{
                width: 86,
                height: 86,
                borderRadius: "50%",
                background: `conic-gradient(
                  ${CARD_COLORS.red} 0deg 90deg,
                  ${CARD_COLORS.blue} 90deg 180deg,
                  ${CARD_COLORS.yellow} 180deg 270deg,
                  ${CARD_COLORS.green} 270deg 360deg
                )`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "3px solid rgba(255,255,255,0.85)",
                boxShadow: "0 0 36px rgba(139,92,246,0.55)",
                animation: "wd4-spin 4s linear infinite",
              }}
            >
              <span
                style={{
                  color: "white",
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: "Arial Black, sans-serif",
                  textShadow: "0 2px 8px rgba(0,0,0,0.85)",
                }}
              >
                +4
              </span>
            </motion.div>

            {/* Text */}
            <div>
              <div
                style={{
                  color: "rgba(255,255,255,0.42)",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: 3,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                Wild Draw 4 Played
              </div>
              <div style={{ color: "white", fontSize: 18, fontWeight: 900, lineHeight: 1.35 }}>
                <span style={{ color: "#c084fc" }}>{playedByName}</span> played a Wild +4
              </div>
              <div
                style={{
                  color: "rgba(255,255,255,0.52)",
                  fontSize: 13.5,
                  marginTop: 10,
                  lineHeight: 1.55,
                }}
              >
                Accept and draw{" "}
                <span style={{ color: "#f87171", fontWeight: 800 }}>
                  {drawCount} cards
                </span>
                , or challenge if you think{" "}
                <span style={{ color: "#c084fc" }}>{playedByName}</span> had a
                matching card.
              </div>
            </div>

            {/* Divider */}
            <div
              style={{
                width: "100%",
                height: 1,
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
              }}
            />

            {/* Buttons */}
            <div style={{ display: "flex", gap: 12, width: "100%" }}>
              <button
                id="wd4-accept-btn"
                type="button"
                onClick={onAccept}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 13,
                  border: "1.5px solid rgba(248,113,113,0.35)",
                  background: "linear-gradient(155deg, #7f1d1d 0%, #991b1b 100%)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "filter 0.15s, transform 0.12s",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.animation = "shake 0.4s";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.animation = "none";
                  e.currentTarget.style.filter = "brightness(1)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Accept +{drawCount}
              </button>

              <button
                id="wd4-challenge-btn"
                type="button"
                onClick={onChallenge}
                style={{
                  flex: 1,
                  padding: "13px 0",
                  borderRadius: 13,
                  border: "1.5px solid rgba(34,211,238,0.35)",
                  background: "linear-gradient(155deg, #0e7490 0%, #0891b2 100%)",
                  color: "white",
                  fontSize: 13,
                  fontWeight: 900,
                  letterSpacing: 1.5,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "filter 0.15s, transform 0.12s",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(0,229,255,0.6), 0 8px 24px rgba(0,229,255,0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 14px rgba(0,0,0,0.35)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Challenge!
              </button>
            </div>

            {/* Fine print */}
            <div
              style={{
                color: "rgba(255,255,255,0.28)",
                fontSize: 11,
                fontWeight: 600,
                lineHeight: 1.6,
              }}
            >
              Challenge succeeds →{" "}
              <span style={{ color: "rgba(134,239,172,0.7)" }}>
                {playedByName} draws 4
              </span>
              {"  ·  "}
              Challenge fails →{" "}
              <span style={{ color: "rgba(248,113,113,0.7)" }}>you draw 6</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
