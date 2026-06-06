import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CARD_COLORS, CARD_COLOR_GLOW, UNO_COLORS } from "../constants";
import type { PlayableColor } from "../types";

interface ColorPickerProps {
  open: boolean;
  onColorPick: (color: PlayableColor) => void;
}


export function ColorPicker({ open, onColorPick }: ColorPickerProps) {
  const [hovered, setHovered] = useState<string | null>(null);

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
              background: "linear-gradient(160deg, #1a1a2e 0%, #16213e 100%)",
              borderRadius: 28,
              border: "2px solid rgba(255,255,255,0.12)",
              padding: "32px 40px",
              boxShadow: "0 32px 80px rgba(0,0,0,0.7)",
            }}
          >
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
                Wild Card
              </div>
              <div style={{ color: "white", fontSize: 18, fontWeight: 900, letterSpacing: 1 }}>
                Choose a Color!
              </div>
            </div>

            <div style={{ display: "flex", gap: 16 }}>
              {UNO_COLORS.map((color, i) => {
                const isHovered = hovered === color;
                return (
                  <motion.button
                    key={color}
                    type="button"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06, type: "spring", stiffness: 360, damping: 22 }}
                    aria-label={color}
                    onClick={() => onColorPick(color)}
                    onMouseEnter={() => setHovered(color)}
                    onMouseLeave={() => setHovered(null)}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: "50%",
                      background: CARD_COLORS[color],
                      border: "4px solid rgba(255,255,255,0.9)",
                      cursor: "pointer",
                      transform: isHovered ? "scale(1.2)" : "scale(1)",
                      transition: "transform 0.15s cubic-bezier(0.22,1,0.36,1), box-shadow 0.15s",
                      boxShadow: isHovered
                        ? `0 8px 28px ${CARD_COLOR_GLOW[color]}, 0 0 0 4px white`
                        : `0 6px 20px ${CARD_COLOR_GLOW[color]}, 0 0 0 0px white`,
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
                      {color}
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
