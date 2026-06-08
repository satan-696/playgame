export function useSnakeLadderActions(onAction: (action: object) => void) {
  return {
    rollDice:    () => onAction({ type: "ROLL_DICE" }),
    restartGame: () => onAction({ type: "RESTART_GAME" }),
  };
}
