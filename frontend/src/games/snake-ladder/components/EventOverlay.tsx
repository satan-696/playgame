import { AnimatePresence, motion } from "framer-motion";
import { SnakeLadderAction } from "../types";

interface EventOverlayProps {
  action: SnakeLadderAction | null;
  breakpoint: string;
}

export default function EventOverlay({ action, breakpoint }: EventOverlayProps) {
  const isMobile = breakpoint === "mobile";

  return (
    <AnimatePresence>
      {action?.event && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 50,
            background: "rgba(0,0,0,0.45)",
            borderRadius: 8,
          }}
        >
          {action.event === "snake" && (
            <motion.div
              key={`snake-${action.player_id}-${action.from}`}
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: [0, 1, 1, 0], y: [-30, 0, 0, 30] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.0, times: [0, 0.1, 0.75, 1] }}
              style={{ textAlign: "center", textShadow: "0 4px 16px rgba(0,0,0,0.8)" }}
            >
              <div style={{ fontSize: isMobile ? 64 : 96 }}>🐍</div>
              <div style={{ color: "#FF3B30", fontSize: isMobile ? 22 : 30, fontWeight: 900 }}>
                SNAKE! -{action.event_from! - action.to!} squares
              </div>
            </motion.div>
          )}

          {action.event === "ladder" && (
            <motion.div
              key={`ladder-${action.player_id}-${action.from}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 1, 0.8] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.0, times: [0, 0.15, 0.7, 1] }}
              style={{ textAlign: "center", textShadow: "0 4px 16px rgba(0,0,0,0.8)" }}
            >
              <div style={{ fontSize: isMobile ? 64 : 96 }}>🪜</div>
              <div style={{ color: "#FFD600", fontSize: isMobile ? 22 : 30, fontWeight: 900 }}>
                LADDER! +{action.to! - action.event_from!} squares
              </div>
            </motion.div>
          )}

          {action.event === "bounce" && (
            <motion.div
              key={`bounce-${action.player_id}-${action.from}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1.1, 1, 0.9] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.0, times: [0, 0.1, 0.8, 1] }}
              style={{
                background: "rgba(0,0,0,0.8)",
                padding: "12px 24px",
                borderRadius: 20,
                color: "white",
                fontSize: isMobile ? 18 : 24,
                fontWeight: 800,
                border: "2px solid rgba(255,255,255,0.2)",
              }}
            >
              Too far! Stay put 😅
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
