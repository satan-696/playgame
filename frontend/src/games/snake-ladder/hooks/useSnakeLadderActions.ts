export function useSnakeLadderActions(onAction: (action: Record<string, unknown>) => void) {
  return {
    rollDice:    () => onAction({ type: "ROLL_DICE" }),
    restartGame: () => onAction({ type: "RESTART_GAME" }),
  };
}
