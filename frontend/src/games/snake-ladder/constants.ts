// Mirror of backend _LADDERS and _SNAKES
export const LADDERS: Record<number, number> = {
  4: 14, 9: 31, 20: 38, 28: 84,
  40: 59, 51: 67, 63: 81, 71: 91,
};

export const SNAKES: Record<number, number> = {
  17: 7, 54: 34, 62: 19, 64: 60,
  87: 24, 93: 73, 95: 75, 99: 78,
};

// Player token colors — up to 6 players
export const TOKEN_COLORS = [
  "#FF3B30", // red
  "#1A8CFF", // blue
  "#2ECC71", // green
  "#FFD600", // yellow
  "#FF6B00", // orange
  "#7B2FFF", // purple
];

export const TOKEN_GLOW = [
  "rgba(255,59,48,0.7)",
  "rgba(26,140,255,0.7)",
  "rgba(46,204,113,0.7)",
  "rgba(255,214,0,0.7)",
  "rgba(255,107,0,0.7)",
  "rgba(123,47,255,0.7)",
];

// Board cell colors — alternating light/dark checkerboard with accent cells
export const CELL_COLORS = {
  light:   "#e8f5e9",
  dark:    "#c8e6c9",
  ladder:  "#fff9c4",   // yellow tint on ladder cells
  snake:   "#ffebee",   // red tint on snake cells
  start:   "#e3f2fd",
  finish:  "#f3e5f5",
};
