import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CARD_COLORS, UI_COLORS, VALUE_SYMBOLS } from "../constants";
import type { LastAction } from "../types";

interface LogEvent {
  id: string;
  text: string;
  color: string;
}

interface ActionLogProps {
  lastAction: LastAction | null;
}

function formatAction(action: LastAction): LogEvent {
  const cardText = action.card ? `${action.card.color} ${VALUE_SYMBOLS[action.card.value] ?? action.card.value}` : "";
  const count = action.draw_count ?? action.count ?? 1;
  const color = action.card?.color && action.card.color !== "wild" ? CARD_COLORS[action.card.color] : UI_COLORS.whiteMuted;
  const textByType: Record<string, string> = {
    PLAY_CARD: `• ${action.player_name} played ${cardText}`,
    DRAW_CARD: `• ${action.player_name} drew ${count} card${count === 1 ? "" : "s"}`,
    SKIP: `• ${action.player_name} was skipped`,
    REVERSE: "• Direction reversed!",
    UNO_PENALTY: `⚠ ${action.player_name} forgot UNO! +2 cards`,
    TIMEOUT: `• ${action.player_name} timed out`,
    WILD_PLAYED: `• ${action.player_name} chose ${action.chosen_color ?? action.card?.chosen_color ?? "a color"}`,
    PASS: `• ${action.player_name} passed`,
  };

  return {
    id: `${action.type}-${Date.now()}`,
    text: textByType[action.type] ?? `• ${action.player_name} acted`,
    color,
  };
}

export function ActionLog({ lastAction }: ActionLogProps) {
  const [events, setEvents] = useState<LogEvent[]>([]);

  useEffect(() => {
    if (!lastAction || lastAction.type === "UNO_PENALTY") {
      return;
    }
    setEvents((prev) => [...prev.slice(-2), formatAction(lastAction)]);
  }, [lastAction]);

  const event = events[events.length - 1];

  return (
    <div style={{ height: 42, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
      <AnimatePresence mode="wait">
        {event && (
          <motion.div
            key={event.id}
            initial={{ y: 28, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            style={{
              borderLeft: `4px solid ${event.color}`,
              background: UI_COLORS.panelDark,
              padding: "6px 14px",
              fontSize: 13,
              color: UI_COLORS.white,
              borderRadius: 6,
              minWidth: 220,
              textAlign: "left",
            }}
          >
            {event.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
