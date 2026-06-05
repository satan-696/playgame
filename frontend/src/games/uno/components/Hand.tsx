import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CARD_COLOR_GLOW } from "../constants";
import type { UnoCard } from "../types";
import { Card } from "./Card";

interface HandProps {
  cards: UnoCard[];
  playableIds: string[];
  isMyTurn: boolean;
  onCardClick: (card: UnoCard) => void;
  isDealing?: boolean;
  dealRevealCount?: number;
}

export function Hand({ cards, playableIds, isMyTurn, onCardClick, isDealing = false, dealRevealCount = cards.length }: HandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fanLayout = useMemo(() => {
    if (cards.length === 0) return [];
    const visibleCards = isDealing ? cards.slice(0, dealRevealCount) : cards;
    const count = visibleCards.length;
    if (count === 0) return [];

    // Tight fan: keep spread small so cards don't go off screen
    const maxAngle = Math.min(count * 2.2, 18);
    const angleStep = count > 1 ? maxAngle / (count - 1) : 0;
    const overlapPx = count <= 5 ? 88 : count <= 8 ? 72 : count <= 12 ? 56 : count <= 16 ? 42 : 30;
    const arcHeight = count > 1 ? 12 : 0; // vertical sag towards center of arc

    return visibleCards.map((card, index) => {
      const angle = -maxAngle / 2 + index * angleStep;
      const x = (index - (count - 1) / 2) * overlapPx;
      // Cards closer to center of fan dip slightly lower
      const normalizedPos = count > 1 ? (index - (count - 1) / 2) / ((count - 1) / 2) : 0;
      const y = arcHeight * (normalizedPos * normalizedPos);
      return { card, angle, x, y, zIndex: index };
    });
  }, [cards, dealRevealCount, isDealing]);

  // Entrance animation when cards change (not during dealing)
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (isDealing) return;
      const nodes = cards
        .map((card) => cardRefs.current.get(card.id))
        .filter((node): node is HTMLDivElement => Boolean(node));
      gsap.from(nodes, {
        y: -220,
        opacity: 0,
        rotation: () => Math.random() * 40 - 20,
        duration: 0.4,
        ease: "back.out(1.5)",
        stagger: 0.055,
      });
    });
    return () => mm.revert();
  }, { scope: containerRef, dependencies: [cards.map((c) => c.id).join("|"), isDealing] });

  // Playable card pulse
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!isMyTurn) return;
      const nodes = playableIds
        .map((id) => cardRefs.current.get(id))
        .filter((node): node is HTMLDivElement => Boolean(node));
      gsap.to(nodes, {
        boxShadow: `0 0 24px ${CARD_COLOR_GLOW.wild}, 0 0 0 2px rgba(255,255,255,0.6)`,
        duration: 0.5,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
      });
    });
    return () => mm.revert();
  }, { scope: containerRef, dependencies: [isMyTurn, playableIds.join("|")] });

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        height: 200,
        maxWidth: 860,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {fanLayout.map(({ card, angle, x, y, zIndex }) => {
        const canPlay = playableIds.includes(card.id) && isMyTurn;
        const isHovered = hoveredId === card.id;
        // Compose transform at wrapper level to avoid overriding parent transforms
        const liftY = isHovered && canPlay ? y - 26 : y;
        const scale = isHovered && canPlay ? 1.1 : 1;

        return (
          <div
            key={card.id}
            onMouseEnter={() => setHoveredId(card.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              position: "absolute",
              bottom: 10,
              transformOrigin: "bottom center",
              transform: `translateX(${x}px) translateY(${liftY}px) rotate(${angle}deg) scale(${scale})`,
              zIndex: isHovered ? 200 : zIndex,
              transition: "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), z-index 0s",
              willChange: "transform",
            }}
          >
            <div
              ref={(node) => {
                if (node) cardRefs.current.set(card.id, node);
                else cardRefs.current.delete(card.id);
              }}
            >
              <Card
                card={card}
                isPlayable={canPlay}
                isMyTurn={isMyTurn}
                isHovered={isHovered}
                onClick={() => onCardClick(card)}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
