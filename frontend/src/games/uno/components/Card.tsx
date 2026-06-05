import type { CSSProperties, Ref } from "react";
import { CARD_COLORS, CARD_HEIGHT, CARD_WIDTH, UI_COLORS } from "../constants";
import type { UnoCard } from "../types";

interface CardProps {
  card: UnoCard;
  isPlayable?: boolean;
  isMyTurn?: boolean;
  isHovered?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
  cardRef?: Ref<HTMLDivElement>;
}

const SPECIAL_ICONS: Record<string, string> = {
  skip: "🚫",
  reverse: "🔄",
  draw2: "+2",
  wild: "★",
  wild_draw4: "+4",
};

export function Card({
  card,
  isPlayable = true,
  isMyTurn = false,
  isHovered = false,
  onClick,
  style,
  className,
  cardRef,
}: CardProps) {
  const canPlay = isPlayable && isMyTurn;
  const isWild = card.color === "wild";
  const isSpecial = card.value in SPECIAL_ICONS;

  const background = isWild
    ? `conic-gradient(${CARD_COLORS.red} 0deg 90deg, ${CARD_COLORS.blue} 90deg 180deg, ${CARD_COLORS.yellow} 180deg 270deg, ${CARD_COLORS.green} 270deg 360deg)`
    : CARD_COLORS[card.color];

  const glowColor = isWild
    ? "rgba(139,92,246,0.8)"
    : card.color === "red"
    ? "rgba(220,38,38,0.8)"
    : card.color === "green"
    ? "rgba(22,163,74,0.8)"
    : card.color === "blue"
    ? "rgba(37,99,235,0.8)"
    : "rgba(202,138,4,0.8)";

  const displayValue = SPECIAL_ICONS[card.value] ?? card.value;
  const pipColor = isWild ? UI_COLORS.white : "rgba(255,255,255,0.95)";

  let boxShadow = `0 4px 14px rgba(0,0,0,0.5)`;
  if (isHovered && canPlay) {
    boxShadow = `0 12px 32px rgba(0,0,0,0.6), 0 0 0 3px white, 0 0 20px ${glowColor}`;
  } else if (canPlay) {
    boxShadow = `0 4px 14px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.5)`;
  }

  return (
    <div
      ref={cardRef}
      className={className}
      onClick={() => {
        if (canPlay) onClick?.();
      }}
      style={{
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 12,
        border: `3px solid ${UI_COLORS.white}`,
        boxShadow,
        background,
        position: "relative",
        overflow: "hidden",
        cursor: canPlay ? "pointer" : "default",
        userSelect: "none",
        transition: "box-shadow 0.18s ease, filter 0.18s ease",
        filter: !isMyTurn || isPlayable ? "none" : "brightness(0.38) saturate(0.25)",
        ...style,
      }}
    >
      {/* Top-left pip */}
      <div
        style={{
          position: "absolute",
          top: 5,
          left: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
        }}
      >
        <span style={{ color: pipColor, fontSize: 15, fontWeight: 900, fontFamily: "Arial Black, sans-serif" }}>
          {displayValue}
        </span>
      </div>

      {/* Center body */}
      {isWild ? (
        /* Wild card: 4-color star */
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 72,
            height: 72,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.35)",
            border: "3px solid rgba(255,255,255,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: card.value === "wild_draw4" ? 26 : 28,
              fontWeight: 900,
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.7)",
              fontFamily: "Arial Black, sans-serif",
            }}
          >
            {displayValue}
          </span>
        </div>
      ) : isSpecial ? (
        /* Skip / Reverse / Draw2: dark oval with symbol */
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%) rotate(-25deg)",
            width: 66,
            height: 90,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.22)",
            border: "3px solid rgba(255,255,255,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              transform: "rotate(25deg)",
              fontSize: card.value === "draw2" ? 26 : 28,
              fontWeight: 900,
              color: "white",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              fontFamily: "Arial Black, sans-serif",
            }}
          >
            {displayValue}
          </span>
        </div>
      ) : (
        /* Number card: rotated diamond + big number */
        <>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
              width: 70,
              height: 70,
              background: "rgba(255,255,255,0.88)",
              borderRadius: 6,
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 40,
              fontWeight: 900,
              color: CARD_COLORS[card.color],
              textShadow: "none",
              fontFamily: "Arial Black, sans-serif",
              lineHeight: 1,
            }}
          >
            {displayValue}
          </span>
        </>
      )}

      {/* Bottom-right pip (rotated 180°) */}
      <div
        style={{
          position: "absolute",
          bottom: 5,
          right: 6,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          lineHeight: 1,
          transform: "rotate(180deg)",
        }}
      >
        <span style={{ color: pipColor, fontSize: 15, fontWeight: 900, fontFamily: "Arial Black, sans-serif" }}>
          {displayValue}
        </span>
      </div>

      {/* Playable shimmer overlay */}
      {canPlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}
