import { AnimatePresence, motion } from "framer-motion";
import { ColorRoulettePrompt } from "./ColorRoulettePrompt";
import type { UnoGameState } from "../types";

interface GameVariantOverlaysProps {
  state: UnoGameState;
  myPlayerId: string;
}

/**
 * Renders Flip/No Mercy-specific overlays that live inside the table area.
 * Kept separate so Board.tsx stays clean for future game variants.
 *
 * Contains:
 *   - Dark side atmosphere vignette (Flip only)
 *   - Side indicator badge (Flip only)
 *   - ColorRoulettePrompt for pending_wild_draw_color (Flip) or pending_color_roulette (No Mercy)
 */
export function GameVariantOverlays({ state, myPlayerId }: GameVariantOverlaysProps) {
  const side = state.side;

  // Resolve active roulette (Flip uses pending_wild_draw_color, No Mercy uses pending_color_roulette)
  const activeRoulette = state.pending_wild_draw_color ?? state.pending_color_roulette ?? null;
  const isRouletteTarget = activeRoulette?.target_id === myPlayerId;
  const rouletteTargetName =
    state.players.find((p) => p.id === activeRoulette?.target_id)?.name ??
    activeRoulette?.target_id ??
    "Opponent";
  const drawnSoFar = state.roulette_drawn_count ?? 0;

  return (
    <>
      {/* ── Dark side atmosphere vignette — Flip only ── */}
      <AnimatePresence>
        {side === "dark" && (
          <motion.div
            key="dark-side-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `radial-gradient(ellipse at center, rgba(10,0,30,0.18) 0%, rgba(10,0,30,0.52) 100%)`,
              pointerEvents: "none",
              zIndex: 1,
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Side indicator badge — Flip only ── */}
      {side !== undefined && (
        <motion.div
          animate={{
            background: side === "dark"
              ? "linear-gradient(135deg, #2d1b4e, #1a0a2e)"
              : "linear-gradient(135deg, rgba(232,244,248,0.12), rgba(255,255,255,0.08))",
            color: side === "dark" ? "#c084fc" : "#22d3ee",
            boxShadow: side === "dark"
              ? "0 0 16px rgba(123,47,255,0.5)"
              : "0 0 16px rgba(34,211,238,0.3)",
          }}
          transition={{ duration: 0.8 }}
          style={{
            position: "absolute",
            top: 12,
            right: 16,
            zIndex: 10,
            borderRadius: 999,
            padding: "6px 14px",
            border: "1.5px solid rgba(255,255,255,0.15)",
            fontSize: 12,
            fontWeight: 900,
            letterSpacing: 2,
            textTransform: "uppercase",
            backdropFilter: "blur(4px)",
            fontFamily: "'Nunito', Arial Black, sans-serif",
          }}
        >
          {side === "dark" ? "🌑 Dark Side" : "☀️ Light Side"}
        </motion.div>
      )}

      {/* ── Color Roulette prompt (Flip WDC + No Mercy WCR) ── */}
      <ColorRoulettePrompt
        open={Boolean(activeRoulette)}
        isTarget={isRouletteTarget}
        targetPlayerName={rouletteTargetName}
        chosenColor={activeRoulette?.chosen_color ?? ""}
        drawnSoFar={drawnSoFar}
      />
    </>
  );
}
