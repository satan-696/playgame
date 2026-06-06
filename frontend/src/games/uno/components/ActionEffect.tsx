import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CARD_COLORS, UI_COLORS } from "../constants";
import type { LastAction, PlayableColor } from "../types";

interface ActionEffectProps {
  lastAction: LastAction | null;
}

type EffectType = "skip" | "reverse" | "draw2" | "draw4" | "wild";

interface ActiveEffect {
  id: string;
  type: EffectType;
  count?: number;
  color?: PlayableColor;
}

function SkipEffect() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.3, times: [0, 0.25, 0.6, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
    >
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: "rgba(239,68,68,0.15)",
        border: "4px solid #ef4444",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 40px rgba(239,68,68,0.4)",
      }}>
        <span style={{ fontSize: 58 }}>🚫</span>
      </div>
      <span style={{
        color: "#ef4444", fontWeight: 900, fontSize: 24,
        letterSpacing: 4, textTransform: "uppercase",
        textShadow: "0 2px 16px rgba(239,68,68,0.9)",
        fontFamily: "'Nunito', Arial Black, sans-serif",
      }}>SKIP!</span>
    </motion.div>
  );
}

function ReverseEffect() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.25, 1], opacity: [0, 1, 1, 0], rotate: [0, 360] }}
      transition={{ duration: 1.4, times: [0, 0.2, 0.6, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}
    >
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: "rgba(34,211,238,0.15)",
        border: "4px solid #22d3ee",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(6px)",
        boxShadow: "0 0 40px rgba(34,211,238,0.4)",
      }}>
        <span style={{ fontSize: 58 }}>🔄</span>
      </div>
      <span style={{
        color: "#22d3ee", fontWeight: 900, fontSize: 24,
        letterSpacing: 4, textTransform: "uppercase",
        textShadow: "0 2px 16px rgba(34,211,238,0.9)",
        fontFamily: "'Nunito', Arial Black, sans-serif",
      }}>REVERSED!</span>
    </motion.div>
  );
}

function DrawCardsEffect({ count, color }: { count: number; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.7, times: [0, 0.08, 0.75, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}
    >
      {/* Animated card fan */}
      <div style={{ position: "relative", width: 120 + count * 16, height: 90 }}>
        {Array.from({ length: count }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, rotate: 0, scale: 0.3, opacity: 0 }}
            animate={{
              x: (i - (count - 1) / 2) * 22,
              y: [0, -36, -8],
              rotate: (i - (count - 1) / 2) * 14,
              scale: 1,
              opacity: 1,
            }}
            transition={{ delay: i * 0.13, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
            style={{
              position: "absolute", left: "50%", top: "50%",
              marginLeft: -24, marginTop: -34,
              width: 48, height: 68, borderRadius: 8,
              background: "linear-gradient(145deg, #22224a, #12122a)",
              border: "2.5px solid white",
              boxShadow: `0 6px 16px rgba(0,0,0,0.5), 0 0 0 1px ${color}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <div style={{
              width: 28, height: 38, borderRadius: "50%",
              background: "#cc0000", border: "1.5px solid white",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#ffdd00", fontWeight: 900, fontSize: 8, letterSpacing: 0.5 }}>UNO</span>
            </div>
          </motion.div>
        ))}
      </div>
      {/* +N CARDS badge */}
      <motion.div
        initial={{ scale: 0, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ delay: 0.25, type: "spring", stiffness: 320, damping: 22 }}
        style={{
          background: `linear-gradient(135deg, ${color}cc, ${color}88)`,
          border: `2.5px solid ${color}`,
          borderRadius: 999,
          padding: "10px 28px",
          display: "flex", alignItems: "center", gap: 8,
          backdropFilter: "blur(8px)",
          boxShadow: `0 0 30px ${color}55`,
        }}
      >
        <span style={{ color: "white", fontWeight: 900, fontSize: 32, fontFamily: "'Nunito', Arial Black, sans-serif" }}>
          +{count}
        </span>
        <span style={{ color: "rgba(255,255,255,0.85)", fontWeight: 800, fontSize: 18, letterSpacing: 2 }}>
          CARDS
        </span>
      </motion.div>
    </motion.div>
  );
}

function WildEffect({ color }: { color?: PlayableColor }) {
  const displayColor = color ? CARD_COLORS[color] : "#7c3aed";
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0, rotate: -200 }}
      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1, 0], rotate: [-200, 10, 0] }}
      transition={{ duration: 1.4, times: [0, 0.28, 0.65, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
    >
      <div style={{
        width: 120, height: 120, borderRadius: "50%",
        background: `conic-gradient(${CARD_COLORS.red} 0deg 90deg, ${CARD_COLORS.blue} 90deg 180deg, ${CARD_COLORS.yellow} 180deg 270deg, ${CARD_COLORS.green} 270deg 360deg)`,
        border: `4px solid ${displayColor}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 0 40px ${displayColor}88`,
      }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "rgba(0,0,0,0.65)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "2px solid rgba(255,255,255,0.4)",
        }}>
          <span style={{ fontSize: 28, fontWeight: 900, color: "white" }}>★</span>
        </div>
      </div>
      {color && (
        <span style={{
          color: displayColor, fontWeight: 900, fontSize: 22,
          letterSpacing: 4, textTransform: "uppercase",
          textShadow: `0 2px 20px ${displayColor}`,
          fontFamily: "'Nunito', Arial Black, sans-serif",
        }}>
          COLOR: {color.toUpperCase()}
        </span>
      )}
    </motion.div>
  );
}

export function ActionEffect({ lastAction }: ActionEffectProps) {
  const [active, setActive] = useState<ActiveEffect | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!lastAction) return;
    const { type: actionType, card, chosen_color } = lastAction;
    const cardValue = card?.value;

    let effect: ActiveEffect | null = null;

    if (actionType === "SKIP" || cardValue === "skip") {
      effect = { id: `${Date.now()}`, type: "skip" };
    } else if (actionType === "REVERSE" || cardValue === "reverse") {
      effect = { id: `${Date.now()}`, type: "reverse" };
    } else if (actionType === "PLAY_CARD" && cardValue === "draw2") {
      effect = { id: `${Date.now()}`, type: "draw2", count: 2 };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild_draw4") {
      effect = { id: `${Date.now()}`, type: "draw4", count: 4, color: chosen_color };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild") {
      effect = { id: `${Date.now()}`, type: "wild", color: chosen_color };
    } else if (actionType === "WILD_PLAYED") {
      effect = { id: `${Date.now()}`, type: "wild", color: chosen_color };
    }

    if (!effect) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setActive(effect);
    timerRef.current = window.setTimeout(() => setActive(null), 1900);

    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [lastAction]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key={active.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          style={{
            position: "absolute", inset: 0, zIndex: 40,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
            background: "rgba(0,0,0,0.35)",
            backdropFilter: "blur(3px)",
          }}
        >
          {active.type === "skip"    && <SkipEffect />}
          {active.type === "reverse" && <ReverseEffect />}
          {active.type === "draw2"   && <DrawCardsEffect count={2} color={UI_COLORS.redDanger} />}
          {active.type === "draw4"   && <DrawCardsEffect count={4} color={active.color ? CARD_COLORS[active.color] : "#7c3aed"} />}
          {active.type === "wild"    && <WildEffect color={active.color} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
