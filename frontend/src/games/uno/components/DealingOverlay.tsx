import { useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { DealingPhase } from "../hooks/useDealing";
import type { PlayerInfo } from "../types";
import { CardBack } from "./CardBack";

interface FlyingCard {
  id: string;
  playerId: string;
}

interface DealingOverlayProps {
  phase: DealingPhase;
  dealtCounts: Record<string, number>;
  players: PlayerInfo[];
  myPlayerId: string;
}

export function DealingOverlay({ phase, dealtCounts, players, myPlayerId }: DealingOverlayProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const cards = useMemo(() => {
    const nextCards: FlyingCard[] = [];
    Object.entries(dealtCounts).forEach(([playerId, count]) => {
      for (let index = 0; index < count; index += 1) {
        nextCards.push({ id: `${playerId}-${index}`, playerId });
      }
    });
    return nextCards;
  }, [dealtCounts]);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      cards.forEach((card) => {
        const node = cardRefs.current.get(card.id);
        if (!node || node.dataset.animated === "true") return;
        node.dataset.animated = "true";
        const isMe = card.playerId === myPlayerId;
        const opponents = players.filter((p) => p.id !== myPlayerId);
        const opponentIndex = opponents.findIndex((p) => p.id === card.playerId);
        const isTopOpponent = opponentIndex === 0 && opponents.length < 3;
        const isLeftOpponent = opponents.length === 3 && opponentIndex === 1;
        const targetX = isMe ? 0 : isTopOpponent ? 0 : isLeftOpponent ? -420 : 420;
        const targetY = isMe ? 260 : isTopOpponent ? -240 : 0;
        const targetRot = isMe
          ? Math.random() * 8 - 4
          : isTopOpponent ? 180 : isLeftOpponent ? -90 : 90;
        gsap.to(node, {
          x: targetX,
          y: targetY,
          rotation: targetRot,
          scale: isMe ? 0.88 : 0.62,
          duration: 0.38,
          ease: "power2.out",
          onComplete: () => {
            node.style.visibility = "hidden";
          },
        });
      });
    });
    return () => mm.revert();
  }, { scope: scopeRef, dependencies: [cards.length, phase] });

  if (phase !== "dealing" && phase !== "revealing") return null;

  return (
    <div
      ref={scopeRef}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 45,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      {/* Dealing status badge */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%) translateY(-90px)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(0,0,0,0.65)",
          backdropFilter: "blur(6px)",
          color: "white",
          borderRadius: 999,
          padding: "10px 22px",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      >
        {/* Spinner dots */}
        <style>{`
          @keyframes deal-dot { 0%,80%,100% { transform: scale(0); opacity:0.3; } 40% { transform: scale(1); opacity:1; } }
        `}</style>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: "#22d3ee",
              animation: `deal-dot 1.2s ${i * 0.2}s infinite`,
            }}
          />
        ))}
        <span
          style={{
            fontSize: 13,
            fontWeight: 800,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.9)",
          }}
        >
          Dealing cards
        </span>
      </div>

      {/* Flying card elements */}
      {cards.map((card) => (
        <div
          key={card.id}
          ref={(node) => {
            if (node) cardRefs.current.set(card.id, node);
            else cardRefs.current.delete(card.id);
          }}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <CardBack />
        </div>
      ))}
    </div>
  );
}
