import { useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import type { UnoCard } from "../types";
import { Card } from "./Card";

interface HandProps {
  cards: UnoCard[];
  playableIds: string[];
  isMyTurn: boolean;
  onCardClick: (card: UnoCard) => void;
  isDealing?: boolean;
  dealRevealCount?: number;
  isDarkSide?: boolean;
}

export function Hand({ cards, playableIds, isMyTurn, onCardClick, isDealing = false, dealRevealCount = cards.length, isDarkSide = false }: HandProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());
  const prevCardIdsRef = useRef<Set<string>>(new Set());
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

      // Only animate cards that are genuinely new
      const newCardIds = cards
        .map(c => c.id)
        .filter(id => !prevCardIdsRef.current.has(id));

      const nodes = newCardIds
        .map(id => cardRefs.current.get(id))
        .filter((node): node is HTMLDivElement => Boolean(node));

      if (nodes.length === 0) return;

      gsap.fromTo(
        nodes,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.06 }
      );
    });

    // Update ref AFTER computing new cards
    prevCardIdsRef.current = new Set(cards.map(c => c.id));

    return () => mm.revert();
  }, { scope: containerRef, dependencies: [cards.map((c) => c.id).join("|"), isDealing] });

  // Playable card pulse — bouncy upward jump
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (!isMyTurn) return;
      const nodes = playableIds
        .map((id) => cardRefs.current.get(id))
        .filter((node): node is HTMLDivElement => Boolean(node));
      if (nodes.length === 0) return;
      gsap.fromTo(
        nodes,
        { opacity: 1 },
        {
          opacity: 0.85,
          duration: 0.4,
          yoyo: true,
          repeat: 3,
          ease: "sine.inOut",
          stagger: 0.06,
          onComplete: () => {
            // Guarantee opacity is restored after pulse
            gsap.set(nodes, { opacity: 1 });
          },
        }
      );
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
        const liftY = isHovered && canPlay ? y - 36 : y;
        const scale = isHovered && canPlay ? 1.15 : 1;

        return (
          <div
            key={card.id}
            ref={(node) => {
              if (node) cardRefs.current.set(card.id, node);
              else cardRefs.current.delete(card.id);
            }}
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
            <Card
              card={card}
              isPlayable={canPlay}
              isMyTurn={isMyTurn}
              isHovered={isHovered}
              isDarkSide={isDarkSide}
              onClick={() => onCardClick(card)}
            />
          </div>
        );
      })}
    </div>
  );
}
