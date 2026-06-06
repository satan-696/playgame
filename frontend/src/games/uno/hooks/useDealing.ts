import { useCallback, useEffect, useRef, useState } from "react";
import type { PlayerInfo } from "../types";

export type DealingPhase = "idle" | "dealing" | "revealing" | "done";

export function useDealing(players: PlayerInfo[], myPlayerId: string) {
  const [phase, setPhase] = useState<DealingPhase>("idle");
  const [dealtCounts, setDealtCounts] = useState<Record<string, number>>({});
  const [revealCount, setRevealCount] = useState(0);
  const hasDealtRef = useRef(false);
  const phaseRef = useRef<DealingPhase>("idle");
  const timersRef = useRef<number[]>([]);

  // Keep live refs so startDealing doesn't need them in its dep array
  const playersRef = useRef<PlayerInfo[]>(players);
  const myPlayerIdRef = useRef<string>(myPlayerId);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { myPlayerIdRef.current = myPlayerId; }, [myPlayerId]);

  const setCurrentPhase = useCallback((nextPhase: DealingPhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach(window.clearTimeout);
      timersRef.current = [];
      hasDealtRef.current = false;
    };
  }, []);

  // STABLE identity — empty dep array, reads live data via refs
  const startDealing = useCallback((onComplete: () => void) => {
    const currentPlayers = playersRef.current;
    const currentMyPlayerId = myPlayerIdRef.current;

    if (currentPlayers.length === 0 || !currentMyPlayerId) {
      setCurrentPhase("done");
      onComplete();
      return;
    }

    if (hasDealtRef.current) {
      if (phaseRef.current === "done") {
        onComplete();
      }
      return;
    }

    hasDealtRef.current = true;
    setCurrentPhase("dealing");
    setDealtCounts({});
    setRevealCount(0);

    const totalRounds = 7;
    const msPerCard = 120;
    let cardIndex = 0;

    for (let round = 0; round < totalRounds; round += 1) {
      for (let playerIndex = 0; playerIndex < currentPlayers.length; playerIndex += 1) {
        const delay = cardIndex * msPerCard;
        const playerId = currentPlayers[playerIndex].id;
        const timer = window.setTimeout(() => {
          setDealtCounts((prev) => ({ ...prev, [playerId]: (prev[playerId] ?? 0) + 1 }));
        }, delay);
        timersRef.current.push(timer);
        cardIndex += 1;
      }
    }

    const totalDealMs = cardIndex * msPerCard;

    const revealTimer = window.setTimeout(() => {
      setCurrentPhase("revealing");
      for (let index = 0; index < 7; index += 1) {
        const timer = window.setTimeout(() => {
          setRevealCount(index + 1);
          if (index === 6) {
            const doneTimer = window.setTimeout(() => {
              setCurrentPhase("done");
              onComplete();
            }, 300);
            timersRef.current.push(doneTimer);
          }
        }, index * 70);
        timersRef.current.push(timer);
      }
    }, totalDealMs + 240);

    timersRef.current.push(revealTimer);

    // Failsafe: force done if animation stalls
    const failsafeTimer = window.setTimeout(() => {
      if (phaseRef.current !== "done") {
        setRevealCount(7);
        setCurrentPhase("done");
        onComplete();
      }
    }, totalDealMs + 1600);

    timersRef.current.push(failsafeTimer);
  }, []); // ← empty — stable forever

  const reset = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
    hasDealtRef.current = false;
    setCurrentPhase("idle");
    setDealtCounts({});
    setRevealCount(0);
  }, [setCurrentPhase]);

  return { phase, dealtCounts, revealCount, startDealing, reset, isDone: phase === "done" };
}
