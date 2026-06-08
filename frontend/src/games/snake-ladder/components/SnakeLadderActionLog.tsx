import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { SnakeLadderAction } from "../types";

export function adaptSnakeLadderAction(
  action: SnakeLadderAction | null,
  playerNames: Record<string, string>
) {
  if (!action) return null;
  const name = playerNames[action.player_id ?? ""] ?? action.player_id;
  
  if (action.type === "ROLL_DICE") {
    if (action.event === "snake")
      return { type: "SNAKE", name, drop: action.event_from! - action.to! };
    if (action.event === "ladder")
      return { type: "LADDER", name, climb: action.to! - action.event_from! };
    if (action.won)
      return { type: "WIN", name };
    if (action.three_doubles_penalty)
      return { type: "SKIP_TURN", name };
    return { type: "ROLL_DICE", name, sum: action.roll_sum };
  }
  if (action.type === "SKIP_TURN") {
      return { type: "SKIP_TURN", name };
  }
  if (action.type === "TIMEOUT") {
      return { type: "TIMEOUT", name };
  }
  return null;
}

export default function SnakeLadderActionLog({ lastAction, playerNames }: { lastAction: SnakeLadderAction | null, playerNames: Record<string, string> }) {
  const [messages, setMessages] = useState<{ id: number; text: string }[]>([]);
  
  useEffect(() => {
    const adapted = adaptSnakeLadderAction(lastAction, playerNames);
    if (!adapted) return;
    
    let text = "";
    if (adapted.type === "SNAKE") text = `🐍 ${adapted.name} hit a snake! -${adapted.drop} squares`;
    else if (adapted.type === "LADDER") text = `🪜 ${adapted.name} climbed a ladder! +${adapted.climb} squares`;
    else if (adapted.type === "WIN") text = `🏆 ${adapted.name} wins!`;
    else if (adapted.type === "SKIP_TURN") text = `😤 ${adapted.name} skipped (3 doubles)`;
    else if (adapted.type === "TIMEOUT") text = `⏰ ${adapted.name} ran out of time`;
    else if (adapted.type === "ROLL_DICE") text = `🎲 ${adapted.name} rolled ${adapted.sum}`;
    
    if (text) {
      setMessages(prev => {
        const next = [...prev, { id: Date.now(), text }];
        if (next.length > 5) return next.slice(next.length - 5);
        return next;
      });
    }
  }, [lastAction, playerNames]);

  return (
    <div style={{
      position: "fixed",
      bottom: 20,
      left: 20,
      display: "flex",
      flexDirection: "column",
      gap: 8,
      pointerEvents: "none",
      zIndex: 100,
    }}>
      <AnimatePresence>
        {messages.map(m => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={{
              background: "rgba(0,0,0,0.6)",
              color: "white",
              padding: "8px 16px",
              borderRadius: 20,
              fontSize: 14,
              fontWeight: 600,
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {m.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
