export interface SnakeLadderGameState {
  player_names:         Record<string, string>;
  turn_order:           string[];
  current_player_index: number;
  positions:            Record<string, number>;
  status:               "playing" | "finished";
  winner:               string | null;
  winner_name:          string | null;
  last_action:          SnakeLadderAction | null;
  last_roll:            [number, number] | null;
  consecutive_doubles:  Record<string, number>;
  skip_next_turn:       string[];
  scores:               Record<string, number>;
  turn_started_at:      number;
  turn_duration:        number;
  rankings:             string[];
  is_my_turn:           boolean;
  can_roll:             boolean;
}

export interface SnakeLadderAction {
  type:                  string;
  player_id?:            string;
  dice?:                 [number, number];
  roll_sum?:             number;
  from?:                 number;
  to?:                   number;
  event?:                "ladder" | "snake" | "bounce" | null;
  event_from?:           number;
  is_doubles?:           boolean;
  extra_roll?:           boolean;
  three_doubles_penalty?: boolean;
  won?:                  boolean;
  ranked?:               number;
}
