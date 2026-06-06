import { useState } from "react";
import { CARD_HEIGHT, CARD_WIDTH, UI_COLORS } from "../constants";
import { CardBack } from "./CardBack";

interface DrawPileProps {
  deckCount: number;
  isMyTurn: boolean;
  onDraw: () => void;
}

export function DrawPile({ deckCount, isMyTurn, onDraw }: DrawPileProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={() => { if (isMyTurn) onDraw(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: CARD_WIDTH + 14,
        height: CARD_HEIGHT + 38,
        border: 0,
        background: "transparent",
        padding: 0,
        opacity: isMyTurn ? 1 : 0.55,
        cursor: isMyTurn ? "pointer" : "not-allowed",
        transition: "transform 0.2s cubic-bezier(0.22,1,0.36,1), opacity 0.2s",
        transform: hovered && isMyTurn ? "scale(1.08) translateY(-4px)" : "scale(1)",
        animation: !hovered ? "draw-pile-float 3s ease-in-out infinite" : "none",
      }}
    >
      {/* Stack of 3 cards offset */}
      {[2, 1, 0].map((offset) => (
        <CardBack
          key={offset}
          style={{
            position: "absolute",
            left: offset * 2,
            top: offset * 2,
            boxShadow: offset === 0 ? "0 6px 20px rgba(0,0,0,0.5)" : "0 2px 8px rgba(0,0,0,0.3)",
          }}
        />
      ))}

      {/* Count badge */}
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: CARD_WIDTH,
          height: CARD_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: UI_COLORS.white,
          fontWeight: 900,
          fontSize: 34,
          fontFamily: "Arial Black, sans-serif",
          textShadow: `0 2px 12px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)`,
          pointerEvents: "none",
        }}
      >
        {deckCount}
      </span>

      {/* Hover glow ring */}
      {isMyTurn && hovered && (
        <div
          style={{
            position: "absolute",
            left: -4,
            top: -4,
            width: CARD_WIDTH + 8,
            height: CARD_HEIGHT + 8,
            borderRadius: 16,
            border: "2px solid rgba(46,204,113,0.8)",
            boxShadow: "0 0 24px rgba(46,204,113,0.5), 0 0 0 4px rgba(46,204,113,0.15)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Label */}
      <span
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: CARD_WIDTH,
          textAlign: "center",
          color: UI_COLORS.whiteMuted,
          fontSize: 11,
          fontWeight: 900,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        DRAW
      </span>
    </button>
  );
}
