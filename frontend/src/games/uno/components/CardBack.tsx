import type { CSSProperties } from "react";
import { CARD_HEIGHT, CARD_WIDTH, UI_COLORS } from "../constants";

interface CardBackProps {
  style?: CSSProperties;
  scale?: number;
}

export function CardBack({ style, scale = 1 }: CardBackProps) {
  return (
    <div
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 12,
        border: `3px solid ${UI_COLORS.white}`,
        boxShadow: `0 4px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12)`,
        background: "linear-gradient(145deg, #22224a 0%, #1a1a38 60%, #12122a 100%)",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        transform: `scale(${scale})`,
        transformOrigin: "center",
        ...style,
      }}
    >
      {/* Subtle texture lines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 8px,
            rgba(255,255,255,0.025) 8px,
            rgba(255,255,255,0.025) 9px
          )`,
        }}
      />
      {/* Center oval with UNO text */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 68,
          height: 92,
          borderRadius: "50%",
          background: "linear-gradient(145deg, #cc0000, #991111)",
          border: `2.5px solid rgba(255,255,255,0.9)`,
          transform: "translate(-50%, -50%) rotate(-18deg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 3px 12px rgba(0,0,0,0.4)",
        }}
      >
        <span
          style={{
            color: "#ffdd00",
            fontWeight: 900,
            fontSize: 18,
            letterSpacing: 1.5,
            transform: "rotate(18deg)",
            fontFamily: "'Nunito', Arial Black, sans-serif",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          UNO
        </span>
      </div>
    </div>
  );
}
