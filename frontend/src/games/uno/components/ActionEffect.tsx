import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CARD_COLORS, UI_COLORS } from "../constants";
import type { LastAction, PlayableColor } from "../types";

interface ActionEffectProps {
  lastAction: LastAction | null;
}

type EffectType =
  | "skip"
  | "reverse"
  | "draw2"
  | "draw4"
  | "wild"
  | "flip"
  | "eliminated"
  | "draw5"
  | "draw6"
  | "draw10"
  | "skip_everyone"
  | "wild_draw_color";

interface ActiveEffect {
  id: string;
  type: EffectType;
  count?: number;
  color?: PlayableColor | "dark" | "light";
  playerName?: string;
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

function SkipEveryoneEffect() {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.5, times: [0, 0.2, 0.65, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
    >
      <div style={{
        width: 130, height: 130, borderRadius: "50%",
        background: "rgba(239,68,68,0.18)",
        border: "4px solid #ef4444",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 50px rgba(239,68,68,0.5)",
      }}>
        <span style={{ fontSize: 64 }}>⊗</span>
      </div>
      <span style={{
        color: "#ef4444", fontWeight: 900, fontSize: 22,
        letterSpacing: 3, textTransform: "uppercase",
        textShadow: "0 2px 16px rgba(239,68,68,0.9)",
        fontFamily: "'Nunito', Arial Black, sans-serif",
        textAlign: "center",
      }}>SKIP EVERYONE!</span>
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
        {Array.from({ length: Math.min(count, 10) }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, rotate: 0, scale: 0.3, opacity: 0 }}
            animate={{
              x: (i - (Math.min(count, 10) - 1) / 2) * 22,
              y: [0, -36, -8],
              rotate: (i - (Math.min(count, 10) - 1) / 2) * 14,
              scale: 1,
              opacity: 1,
            }}
            transition={{ delay: i * 0.1, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
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

function FlipEffect({ toDark }: { toDark: boolean }) {
  return (
    <motion.div
      initial={{ rotateY: 0, opacity: 0 }}
      animate={{ rotateY: [0, 90, 0], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1] }}
      style={{
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 16,
        perspective: 800,
      }}
    >
      <div style={{
        width: 140, height: 140, borderRadius: 20,
        background: toDark
          ? "linear-gradient(135deg, #1a0a2e, #2d1b4e)"
          : "linear-gradient(135deg, #ffffff, #e8f4f8)",
        border: toDark ? "4px solid #7b2fff" : "4px solid #22d3ee",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: toDark
          ? "0 0 60px rgba(123,47,255,0.7)"
          : "0 0 60px rgba(34,211,238,0.7)",
      }}>
        <span style={{ fontSize: 64 }}>{toDark ? "🌑" : "☀️"}</span>
      </div>
      <span style={{
        color: toDark ? "#c084fc" : "#22d3ee",
        fontWeight: 900, fontSize: 26,
        letterSpacing: 3, textTransform: "uppercase",
        textShadow: toDark
          ? "0 0 20px rgba(192,132,252,0.8)"
          : "0 0 20px rgba(34,211,238,0.8)",
        fontFamily: "'Nunito', Arial Black, sans-serif",
      }}>
        {toDark ? "DARK SIDE!" : "LIGHT SIDE!"}
      </span>
    </motion.div>
  );
}

function EliminatedEffect({ playerName }: { playerName: string }) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 2.0, times: [0, 0.2, 0.65, 1] }}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}
    >
      <span style={{ fontSize: 80 }}>💀</span>
      <span style={{
        color: "#ef4444", fontWeight: 900, fontSize: 22,
        letterSpacing: 3, textTransform: "uppercase",
        textShadow: "0 0 20px rgba(239,68,68,0.9)",
        fontFamily: "'Nunito', Arial Black, sans-serif",
        textAlign: "center",
      }}>
        {playerName}<br />ELIMINATED!
      </span>
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
    // Extended last action fields
    const flipTo = (lastAction as any).flip_to as "dark" | "light" | undefined;
    const eliminatedId = (lastAction as any).eliminated as string | undefined;
    const playerName = (lastAction as any).player_name as string | undefined;

    let effect: ActiveEffect | null = null;
    let duration = 1900;

    if (flipTo) {
      effect = { id: `${Date.now()}`, type: "flip", color: flipTo };
      duration = 1900;
    } else if (eliminatedId) {
      effect = {
        id: `${Date.now()}`,
        type: "eliminated",
        playerName: playerName ?? eliminatedId,
      };
      duration = 2200;
    } else if (actionType === "SKIP" || cardValue === "skip") {
      effect = { id: `${Date.now()}`, type: "skip" };
    } else if (actionType === "REVERSE" || cardValue === "reverse") {
      effect = { id: `${Date.now()}`, type: "reverse" };
    } else if (cardValue === "skip_everyone") {
      effect = { id: `${Date.now()}`, type: "skip_everyone" };
    } else if (actionType === "PLAY_CARD" && cardValue === "draw2") {
      effect = { id: `${Date.now()}`, type: "draw2", count: 2 };
    } else if (actionType === "PLAY_CARD" && cardValue === "draw5") {
      effect = { id: `${Date.now()}`, type: "draw5", count: 5 };
    } else if (actionType === "PLAY_CARD" && cardValue === "draw1") {
      effect = { id: `${Date.now()}`, type: "draw2", count: 1 };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild_draw4") {
      effect = { id: `${Date.now()}`, type: "draw4", count: 4, color: chosen_color };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild_draw2") {
      effect = { id: `${Date.now()}`, type: "draw4", count: 2, color: chosen_color };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild_draw6") {
      effect = { id: `${Date.now()}`, type: "draw6", count: 6, color: chosen_color };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild_draw10") {
      effect = { id: `${Date.now()}`, type: "draw10", count: 10, color: chosen_color };
    } else if (actionType === "PLAY_CARD" && (cardValue === "wild_draw_color" || cardValue === "wild_color_roulette")) {
      effect = { id: `${Date.now()}`, type: "wild_draw_color", color: chosen_color };
    } else if (actionType === "PLAY_CARD" && cardValue === "wild") {
      effect = { id: `${Date.now()}`, type: "wild", color: chosen_color };
    } else if (actionType === "WILD_PLAYED") {
      effect = { id: `${Date.now()}`, type: "wild", color: chosen_color };
    }

    if (!effect) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setActive(effect);
    timerRef.current = window.setTimeout(() => setActive(null), duration);

    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [lastAction]);

  const isDarkFlip = active?.type === "flip" && active.color === "dark";

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
            background: isDarkFlip
              ? "rgba(10,0,30,0.65)"
              : active.type === "eliminated"
                ? "rgba(20,0,0,0.55)"
                : "rgba(0,0,0,0.35)",
            backdropFilter: "blur(3px)",
          }}
        >
          {active.type === "skip"          && <SkipEffect />}
          {active.type === "skip_everyone" && <SkipEveryoneEffect />}
          {active.type === "reverse"       && <ReverseEffect />}
          {active.type === "draw2"         && <DrawCardsEffect count={active.count ?? 2} color={UI_COLORS.redDanger} />}
          {active.type === "draw4"         && <DrawCardsEffect count={active.count ?? 4} color={active.color ? CARD_COLORS[active.color] ?? "#7c3aed" : "#7c3aed"} />}
          {active.type === "draw5"         && <DrawCardsEffect count={5} color="#FF2D78" />}
          {active.type === "draw6"         && <DrawCardsEffect count={active.count ?? 6} color={active.color ? CARD_COLORS[active.color] ?? "#7c3aed" : "#7c3aed"} />}
          {active.type === "draw10"        && <DrawCardsEffect count={active.count ?? 10} color={active.color ? CARD_COLORS[active.color] ?? "#7c3aed" : "#7c3aed"} />}
          {active.type === "wild"          && <WildEffect color={active.color as PlayableColor | undefined} />}
          {active.type === "wild_draw_color" && <WildEffect color={active.color as PlayableColor | undefined} />}
          {active.type === "flip"          && <FlipEffect toDark={active.color === "dark"} />}
          {active.type === "eliminated"    && <EliminatedEffect playerName={active.playerName ?? "Player"} />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
