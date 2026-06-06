import { UI_COLORS } from "../constants";
import type { OpponentInfo } from "../types";
import { CardBack } from "./CardBack";

interface OpponentHandProps {
  opponent: OpponentInfo;
  position: "top" | "left" | "right";
  isEliminated?: boolean;
}

const POSITION_STYLES: Record<OpponentHandProps["position"], React.CSSProperties> = {
  top: { top: "5%", left: "50%", transform: "translateX(-50%)" },
  right: { right: "2%", top: "50%", transform: "translateY(-50%)" },
  left: { left: "2%", top: "50%", transform: "translateY(-50%)" },
};

export function OpponentHand({ opponent, position, isEliminated = false }: OpponentHandProps) {
  const visibleCount = Math.min(opponent.cardCount, 30);
  const overflow = opponent.cardCount - visibleCount;
  const isSide = position === "left" || position === "right";


  const gapPx = visibleCount <= 8 ? 40 : visibleCount <= 15 ? 26 : 16;

  const maxSpread = Math.min(visibleCount * 2.2, 24);
  const angleStep = visibleCount > 1 ? maxSpread / (visibleCount - 1) : 0;
  const arcHeight = visibleCount > 1 ? 6 : 0;

  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        ...POSITION_STYLES[position],
      }}
    >
      {/* Card fan */}
      <div
        style={{
          position: "relative",
          width: Math.max(220, visibleCount * gapPx + 30),
          height: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: position === "top" ? "rotate(180deg)" : (position === "left" ? "rotate(90deg)" : (position === "right" ? "rotate(-90deg)" : "none")),
        }}
      >
        {Array.from({ length: visibleCount }).map((_, index) => {
          const angle = -maxSpread / 2 + index * angleStep;
          const x = (index - (visibleCount - 1) / 2) * gapPx;
          // Sag towards the center of the arc
          const normalizedPos = visibleCount > 1 ? (index - (visibleCount - 1) / 2) / ((visibleCount - 1) / 2) : 0;
          const y = arcHeight * normalizedPos * normalizedPos;

          return (
            <div
              key={`${opponent.id}-${index}`}
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                marginLeft: -35, // half of scaled card width
                marginTop: -50,  // half of scaled card height
                transformOrigin: "bottom center",
                transform: `translate(${x}px, ${y}px) rotate(${angle}deg)`,
                zIndex: index,
              }}
            >
              <CardBack
                scale={0.63}
                style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.45)" }}
              />
            </div>
          );
        })}

        {/* Overflow indicator */}
        {overflow > 0 && (
          <div
            style={{
              position: "absolute",
              top: isSide ? -8 : 0,
              right: isSide ? -8 : 0,
              background: "rgba(239,68,68,0.9)",
              color: "white",
              fontSize: 10,
              fontWeight: 900,
              borderRadius: 999,
              padding: "2px 6px",
              border: "1.5px solid white",
              zIndex: 50,
            }}
          >
            +{overflow}
          </div>
        )}
        {/* Elimination skull overlay (No Mercy) */}
        {isEliminated && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.6)",
              borderRadius: 12,
              zIndex: 100,
            }}
          >
            <span style={{ fontSize: 32 }}>💀</span>
          </div>
        )}
      </div>

      {/* Name + card count tag */}
      <div
        style={{
          marginTop: isSide ? 6 : 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          transform: position === "top" ? "rotate(180deg)" : undefined,
          opacity: isEliminated ? 0.4 : 1,
          transition: "opacity 0.4s",
        }}
      >
        {/* Active player pulse ring */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: opponent.isActive
              ? "rgba(34,211,238,0.18)"
              : "rgba(0,0,0,0.45)",
            border: `1.5px solid ${opponent.isActive ? UI_COLORS.cyan : "rgba(255,255,255,0.15)"}`,
            borderRadius: 999,
            padding: "3px 10px",
            transition: "border 0.3s, background 0.3s",
            boxShadow: opponent.isActive
              ? `0 0 0 3px ${UI_COLORS.cyan}, 0 0 20px rgba(0,229,255,0.4)`
              : "none",
          }}
        >
          {/* Card visual fan */}
          <span
            style={{
              color: opponent.isActive ? "white" : "rgba(255,255,255,0.75)",
              fontSize: 12,
              fontWeight: 700,
              maxWidth: 90,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              letterSpacing: 0.3,
              transition: "color 0.3s",
              animation: opponent.isActive ? "active-name-glow 1.4s infinite" : "none",
              textDecoration: isEliminated ? "line-through" : "none",
            }}
          >
            {opponent.name}
          </span>
          {opponent.isActive && (
            <span style={{ fontSize: 9, color: UI_COLORS.cyan, fontWeight: 900, letterSpacing: 1 }}>▶</span>
          )}
        </div>
      </div>
    </div>
  );
}
