export type UnoColor = "red" | "green" | "blue" | "yellow" | "wild";
export type PlayableColor = Exclude<UnoColor, "wild">;

export interface UnoRules {
  seven_zero: boolean;
  jump_in: boolean;
  must_play_drawn: boolean;
}

export const DEFAULT_UNO_RULES: UnoRules = {
  seven_zero: false,
  jump_in: false,
  must_play_drawn: false,
};

export interface UnoCard {
  id: string;
  color: UnoColor;
  value: string;
  chosen_color?: PlayableColor;
}

export interface OpponentInfo {
  id: string;
  name: string;
  cardCount: number;
  isActive: boolean;
}

export interface UnoGameState {
  my_hand: UnoCard[];
  opponent_card_counts: Record<string, number>;
  playable_card_ids: string[];
  discard_top: UnoCard | null;
  deck_count: number;
  active_color: UnoColor;
  direction: 1 | -1;
  is_my_turn: boolean;
  current_player_id: string;
  current_player_name: string;
  status: "playing" | "finished";
  winner_id: string | null;
  winner_name: string | null;
  turn_started_at: number;
  turn_duration: number;
  pending_uno_check: string | null;
  pending_uno_check_name: string | null;
  uno_declared: Record<string, boolean>;
  last_action: LastAction | null;
  turn_order: string[];
  players: PlayerInfo[];
  pending_draw: number;
  drawn_this_turn: boolean;
  rules: UnoRules;
}

export interface LastAction {
  type: string;
  player_id: string;
  player_name: string;
  card?: UnoCard;
  draw_count?: number;
  count?: number;
  chosen_color?: PlayableColor;
}

export interface PlayerInfo {
  id: string;
  name: string;
  is_host: boolean;
}

export type GameActionSender = (type: "GAME_ACTION", payload: Record<string, unknown>) => void;

export interface UnoBoardProps {
  gameState: unknown;
  myPlayerId: string;
  onAction: GameActionSender;
  onLeave?: () => void;
  isHost?: boolean;
}
