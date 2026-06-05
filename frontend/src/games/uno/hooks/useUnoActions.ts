import { useCallback } from "react";
import type { GameActionSender } from "../types";

export function useUnoActions(onAction: GameActionSender) {
  const sendGameAction = useCallback(
    (payload: Record<string, unknown>) => onAction("GAME_ACTION", payload),
    [onAction]
  );

  return {
    playCard: (cardId: string, chosenColor?: string) => {
      sendGameAction({ type: "PLAY_CARD", card_id: cardId, chosen_color: chosenColor });
    },
    drawCard: () => {
      sendGameAction({ type: "DRAW_CARD" });
    },
    declareUno: (targetId: string) => {
      sendGameAction({ type: "DECLARE_UNO", target_player_id: targetId });
    },
    passTurn: () => {
      sendGameAction({ type: "PASS" });
    },
    restartGame: () => {
      sendGameAction({ type: "RESTART_GAME" });
    },
    challengeWd4: (accept: boolean) => {
      sendGameAction({ type: "CHALLENGE_WD4", accept });
    },
    swapHand: (targetPlayerId: string) => {
      sendGameAction({ type: "SWAP_HAND", target_player_id: targetPlayerId });
    },
  };
}

