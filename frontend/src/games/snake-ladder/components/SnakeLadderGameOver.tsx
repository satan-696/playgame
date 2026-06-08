import { motion } from "framer-motion";

interface SnakeLadderGameOverProps {
  open: boolean;
  rankings: string[];
  playerNames: Record<string, string>;
  isHost: boolean;
  onPlayAgain: () => void;
  onLeave: () => void;
}

export default function SnakeLadderGameOver({ open, rankings, playerNames, isHost, onPlayAgain, onLeave }: SnakeLadderGameOverProps) {
  if (!open) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.8)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          background: "linear-gradient(145deg, #1a4a2e 0%, #0d2b1a 100%)",
          border: "2px solid rgba(255,255,255,0.1)",
          borderRadius: 24,
          padding: 32,
          width: "100%",
          maxWidth: 400,
          textAlign: "center",
          boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
          color: "white",
        }}
      >
        <h2 style={{ fontSize: 32, fontWeight: 900, marginBottom: 8, marginTop: 0 }}>
          Game Over!
        </h2>
        <div style={{ fontSize: 48, marginBottom: 24 }}>🏆</div>

        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
          marginBottom: 32,
          textAlign: "left",
          background: "rgba(0,0,0,0.2)",
          padding: 16,
          borderRadius: 12,
        }}>
          {rankings.map((pid, idx) => {
            const medal = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : "🏅";
            return (
              <div key={pid} style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 18, fontWeight: idx === 0 ? 800 : 600 }}>
                <span style={{ fontSize: 24 }}>{medal}</span>
                <span style={{ flex: 1 }}>{playerNames[pid] || pid}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isHost && (
            <button
              onClick={onPlayAgain}
              style={{
                background: "white",
                color: "#1a4a2e",
                padding: "14px 24px",
                borderRadius: 12,
                fontSize: 18,
                fontWeight: 800,
                border: "none",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(255,255,255,0.2)",
              }}
            >
              Play Again
            </button>
          )}
          <button
            onClick={onLeave}
            style={{
              background: "transparent",
              color: "white",
              padding: "14px 24px",
              borderRadius: 12,
              fontSize: 16,
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.2)",
              cursor: "pointer",
            }}
          >
            Leave Game
          </button>
        </div>
      </motion.div>
    </div>
  );
}
