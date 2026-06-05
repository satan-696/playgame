import type { GameMeta } from "../shell/types";
import Board from "./uno/Board";

export const GAME_REGISTRY: Record<string, GameMeta> = {
  uno: {
    id: "uno",
    name: "UNO",
    minPlayers: 2,
    maxPlayers: 4,
    thumbnail: null,
    description: "Classic card game. First to empty your hand wins.",
    component: Board,
  },
};

export const GAME_METAS = GAME_REGISTRY;
