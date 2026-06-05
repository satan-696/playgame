import type { ComponentType } from "react";

export type GameActionSender = (type: "GAME_ACTION", payload: Record<string, unknown>) => void;

export interface GameComponentProps {
  gameState: unknown;
  myPlayerId: string;
  onAction: GameActionSender;
  onLeave?: () => void;
  isHost?: boolean;
}

export interface GameMeta {
  id: string;
  name: string;
  minPlayers: number;
  maxPlayers: number;
  thumbnail?: string | null;
  description?: string;
  component: ComponentType<GameComponentProps>;
}

export interface Player {
  id: string;
  name: string;
  is_host: boolean;
}

export interface Room {
  room_code: string;
  players: Player[];
  host_id: string;
  game_state: unknown;
  game_id: string | null;
  status: "waiting" | "playing";
}

export type WsMessage =
  | { type: "JOIN_ROOM"; payload: { room_code: string; player_name: string } }
  | { type: "LEAVE_ROOM"; payload: Record<string, never> }
  | { type: "GAME_ACTION"; payload: Record<string, unknown> }
  | { type: "ROOM_UPDATE"; payload: Room }
  | { type: "ERROR"; payload: { message: string } }
  | { type: "PLAYER_JOINED"; payload: { player_id: string; player_name: string } }
  | { type: "PLAYER_LEFT"; payload: { player_id: string } };

export type WsPayload = WsMessage["payload"];
