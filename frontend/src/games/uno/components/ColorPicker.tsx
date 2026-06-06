import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CARD_COLORS, CARD_COLOR_GLOW, UNO_COLORS, DARK_COLORS } from "../constants";
import type { PlayableColor } from "../types";

interface ColorPickerProps {
  open: boolean;
  onColorPick: (color: PlayableColor) => void;
  side?: "light" | "dark";
  colorOptions?: readonly string[];  // override default color list
  title?: string;
}

export function ColorPicker({
  open,
  onColorPick,
  side = "light",
  colorOptions,
  title = "Choose a Color!",
}: ColorPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);

  // Determine which colors to show
  const colors = colorOptions ?? (side === "dark" ? DARK_COLORS : UNO_COLORS);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="color-picker-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(12px)",
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
              alignItems: "center",
              background: side === "dark"
                ? "linear-gradient(160deg, #0a0015 0%, #1a0a2e 100%)"
                : "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)",
              borderRadius: 28,
              border: side === "dark"
                ? "2px solid rgba(123,47,255,0.3)"
                : "2px solid rgba(255,255,255,0.12)",
              padding: "32px 40px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            }}
          >
            <div>
              <div style={{
                color: side === "dark" ? "rgba(192,132,252,0.6)" : "rgba(255,255,255,0.5)",
                fontSize: 11, fontWeight: 800, letterSpacing: 3,
                textTransform: "uppercase", marginBottom: 4,
              }}>
                {side === "dark" ? "Dark Side" : "Wild Card"}
              </div>
              <div style={{ color: "white", fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
                {title}
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              {colors.map((color, i) => {
                const c = color as PlayableColor;
                const isHovered = hovered === c;
                const bgColor = CARD_COLORS[c] ?? "#7B2FFF";
                const glowColor = CARD_COLOR_GLOW[c] ?? "rgba(123,47,255,0.75)";
                return (
                  <motion.button
                    key={c}
                    type="button"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 360, damping: 22 }}
                    aria-label={c}
                    onClick={() => onColorPick(c)}
                    onMouseEnter={() => setHovered(c)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: bgColor,
                      border: "4px solid rgba(255,255,255,0.9)",
                      cursor: "pointer",
                      transform: isHovered ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.15s",
                      boxShadow: isHovered
                        ? `0 8px 28px ${glowColor}, 0 0 0 4px white`
                        : `0 6px 20px ${glowColor}, 0 0 0 0px white`,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      paddingBottom: 8,
                    }}
                  >
                    <span style={{
                      color: "rgba(255,255,255,0.95)",
                      fontSize: 10,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      textShadow: "0 1px 4px rgba(0,0,0,0.7)",
                    }}>
                      {c}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
