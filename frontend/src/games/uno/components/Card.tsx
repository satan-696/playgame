import type { CSSProperties, Ref } from "react";
import { CARD_COLORS, CARD_COLOR_GLOW, CARD_HEIGHT, CARD_WIDTH, UI_COLORS } from "../constants";
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
    ? CARD_COLOR_GLOW.wild
    : CARD_COLOR_GLOW[card.color] ?? "rgba(255,255,255,0.5)";

  const displayValue = SPECIAL_ICONS[card.value] ?? card.value;
  const pipColor = isWild ? UI_COLORS.white : "rgba(255,255,255,0.97)";

  let boxShadow = `0 6px 18px rgba(0,0,0,0.5)`;
  if (isHovered && canPlay) {
    boxShadow = `0 8px 24px rgba(0,0,0,0.55), 0 0 0 3px white, 0 0 28px ${glowColor}`;
  } else if (canPlay) {
    boxShadow = `0 4px 14px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.6)`;
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
        borderRadius: 16,
        border: `4px solid rgba(255,255,255,0.95)`,
        boxShadow,
        background,
        position: "relative",
        overflow: "hidden",
        cursor: canPlay ? "pointer" : "default",
        userSelect: "none",
        transition: "box-shadow 0.18s ease, filter 0.18s ease",
        filter: !isMyTurn || isPlayable ? "none" : "brightness(0.30) saturate(0.15)",
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
        <span style={{ color: pipColor, fontSize: 15, fontWeight: 900, fontFamily: "'Nunito', Arial Black, sans-serif" }}>
          {displayValue}
        </span>
      </div>

      {/* Center body */}
      {isWild ? (
        /* Wild card: rainbow ring */
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 78,
            height: 78,
            borderRadius: "50%",
            background: `conic-gradient(
              ${CARD_COLORS.red} 0deg 90deg,
              ${CARD_COLORS.blue} 90deg 180deg,
              ${CARD_COLORS.yellow} 180deg 270deg,
              ${CARD_COLORS.green} 270deg 360deg
            )`,
            border: "4px solid rgba(255,255,255,0.95)",
            boxShadow: "0 0 20px rgba(123,47,255,0.6)",
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
              fontFamily: "'Nunito', Arial Black, sans-serif",
            }}
          >
            {displayValue}
          </span>
        </div>
      ) : isSpecial ? (
        /* Skip / Reverse / Draw2: tilted oval with symbol */
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
              fontFamily: "'Nunito', Arial Black, sans-serif",
            }}
          >
            {displayValue}
          </span>
        </div>
      ) : (
        /* Number card: bigger diamond + bigger number */
        <>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%) rotate(45deg)",
              width: 80,
              height: 80,
              background: "rgba(255,255,255,0.92)",
              borderRadius: 8,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
            }}
          />
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontSize: 46,
              fontWeight: 900,
              color: CARD_COLORS[card.color],
              textShadow: "none",
              fontFamily: "'Nunito', Arial Black, sans-serif",
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
        <span style={{ color: pipColor, fontSize: 15, fontWeight: 900, fontFamily: "'Nunito', Arial Black, sans-serif" }}>
          {displayValue}
        </span>
      </div>

      {/* Playable shimmer overlay */}
      {canPlay && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(135deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.04) 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Diagonal texture overlay — gives cards a physical feel */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: `repeating-linear-gradient(
          45deg,
          transparent,
          transparent 4px,
          rgba(255,255,255,0.03) 4px,
          rgba(255,255,255,0.03) 5px
        )`,
        borderRadius: 13,
        pointerEvents: "none",
      }} />
    </div>
  );
}
