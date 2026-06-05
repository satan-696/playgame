import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { CARD_COLORS, UNO_COLORS } from "../constants";
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
            backdropFilter: "blur(6px)",
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
              gap: 20,
              alignItems: "center",
              background: "rgba(15,15,35,0.95)",
              borderRadius: 20,
              border: "1px solid rgba(255,255,255,0.12)",
              padding: "32px 40px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.7)",
            }}
          >
            <div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 800, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>
                Wild Card
              </div>
              <div style={{ color: "white", fontSize: 20, fontWeight: 900, fontFamily: "Arial Black, sans-serif" }}>
                Choose a Color
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
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
                      width: 100,
                      height: 100,
                      borderRadius: 16,
                      backgroundColor: CARD_COLORS[color],
                      border: isHovered ? "3px solid white" : "3px solid rgba(255,255,255,0.3)",
                      cursor: "pointer",
                      transform: isHovered ? "scale(1.1) translateY(-4px)" : "scale(1)",
                      transition: "transform 0.18s cubic-bezier(0.22,1,0.36,1), border 0.15s, box-shadow 0.18s",
                      boxShadow: isHovered
                        ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 3px white, 0 0 20px ${CARD_COLORS[color]}88`
                        : "0 4px 12px rgba(0,0,0,0.3)",
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      paddingBottom: 10,
                    }}
                  >
                    <span style={{
                      color: "rgba(255,255,255,0.9)",
                      fontSize: 12,
                      fontWeight: 900,
                      textTransform: "uppercase",
                      letterSpacing: 1.5,
                      textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                      fontFamily: "Arial Black, sans-serif",
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
