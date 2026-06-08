import type { GameMeta } from "../shell/types";
import Board from "./uno/Board";
import SnakeLadderBoard from "./snake-ladder/SnakeLadderBoard";

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
  uno_flip: {
    id: "uno_flip",
    name: "UNO Flip",
    minPlayers: 2,
    maxPlayers: 6,
    thumbnail: null,
    description: "UNO with a Dark Side — flip the deck to reveal brutal new cards.",
    component: Board,
  },
  uno_no_mercy: {
    id: "uno_no_mercy",
    name: "UNO No Mercy",
    minPlayers: 2,
    maxPlayers: 6,
    thumbnail: null,
    description: "168 cards. Stack +10s. Get eliminated at 25 cards. No mercy.",
    component: Board,
  },
  snake_ladder: {
    id:          "snake_ladder",
    name:        "Snake & Ladder",
    minPlayers:  2,
    maxPlayers:  6,
    description: "Roll dice, climb ladders, dodge snakes. Classic fun!",
    thumbnail:   null,
    component:   SnakeLadderBoard,
  },
};

export const GAME_METAS = GAME_REGISTRY;
