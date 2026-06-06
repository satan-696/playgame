import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
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
            node.style.opacity = "0";
            node.style.pointerEvents = "none";
            // Reset transform so if node re-mounts it starts from center
            gsap.set(node, { x: 0, y: 0, rotation: 0, scale: 1 });
          },
        });
      });
    });
    return () => {
      mm.revert();
      gsap.killTweensOf(Array.from(cardRefs.current.values()));
    };
  }, { scope: scopeRef, dependencies: [cards.length, phase] });

  return (
    <motion.div
      ref={scopeRef}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
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
          background: "radial-gradient(ellipse at center, rgba(26,107,60,0.98) 0%, rgba(10,50,28,0.99) 100%)",
          backdropFilter: "blur(4px)",
          color: "white",
          borderRadius: 999,
          padding: "14px 28px",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
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
              background: "#2ECC71",
              animation: `deal-dot 1.2s ${i * 0.2}s infinite`,
            }}
          />
        ))}
        <span
          style={{
            fontSize: 16,
            fontWeight: 900,
            letterSpacing: 1,
            color: "rgba(255,255,255,0.95)",
          }}
        >
          Dealing Cards... 🃏
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
    </motion.div>
  );
}
