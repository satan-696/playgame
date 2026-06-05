import type { GameMeta } from "../../shell/types";
import Board from "./Board";

export const meta: GameMeta = {
  id: "uno",
  name: "UNO",
  minPlayers: 2,
  maxPlayers: 4,
  thumbnail: null,
  description: "Classic card game. First to empty your hand wins.",
  component: Board,
};
