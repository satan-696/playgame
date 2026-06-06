import { useCallback } from "react";
import type { GameActionSender, PlayableColor } from "../types";

export function useUnoActions(onAction: GameActionSender) {
  const sendGameAction = useCallback(
    (payload: Record<string, unknown>) => onAction("GAME_ACTION", payload),
    [onAction]
  );

  return {
    playCard: (cardId: string, chosenColor?: string) => {
      const payload: Record<string, unknown> = { type: "PLAY_CARD", card_id: cardId };
      // Fix 13: only include chosen_color when it's a real string (wild cards)
      if (typeof chosenColor === "string" && chosenColor.length > 0) {
        payload.chosen_color = chosenColor;
      }
      sendGameAction(payload);
    },
    drawCard: () => {
      sendGameAction({ type: "DRAW_CARD" });
    },
    timeout: () => {
      sendGameAction({ type: "TIMEOUT" });
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
    // UNO No Mercy: discard all cards of a chosen color
    discardAll: (chosenColor: PlayableColor) => {
      sendGameAction({ type: "DISCARD_ALL", chosen_color: chosenColor });
    },
    // UNO Flip: challenge the Wild Draw 2
    challengeWd2: (accept: boolean) => {
      sendGameAction({ type: "CHALLENGE_WD2", accept });
    },
  };
}


