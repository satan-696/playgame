import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { CARD_HEIGHT, CARD_WIDTH, UI_COLORS } from "../constants";
import type { UnoCard } from "../types";
import { Card } from "./Card";

interface DiscardPileProps {
  topCard: UnoCard | null;
}

export function DiscardPile({ topCard }: DiscardPileProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (cardRef.current) {
        gsap.from(cardRef.current, { scale: 0.5, y: -100, rotation: -15, duration: 0.35, ease: "back.out(1.5)" });
      }
    });
    return () => mm.revert();
  }, { scope: scopeRef, dependencies: [topCard?.id ?? "none"] });

  return (
    <div ref={scopeRef} style={{ position: "relative", width: CARD_WIDTH + 14, height: CARD_HEIGHT + 34 }}>
      <div style={{ position: "absolute", left: 8, top: 7, transform: "rotate(8deg) scale(0.95)", opacity: 0.7 }}>
        {topCard && <Card card={topCard} isMyTurn={false} />}
      </div>
      <div style={{ position: "absolute", left: 0, top: 0 }}>
        {topCard ? <Card card={topCard} isMyTurn={false} cardRef={cardRef} /> : null}
      </div>
      <span style={{ position: "absolute", bottom: 0, left: 0, width: CARD_WIDTH, textAlign: "center", color: UI_COLORS.whiteMuted, fontSize: 11, fontWeight: 900, letterSpacing: 1 }}>
        DISCARD
      </span>
    </div>
  );
}
