export const CARD_WIDTH = 112;
export const CARD_HEIGHT = 156;

export const CARD_COLORS = {
  red: "#DC2626",
  green: "#16A34A",
  blue: "#2563EB",
  yellow: "#CA8A04",
  wild: "#1a1a2e",
} as const;

export const CARD_COLOR_GLOW = {
  red: "rgba(220,38,38,0.6)",
  green: "rgba(22,163,74,0.6)",
  blue: "rgba(37,99,235,0.6)",
  yellow: "rgba(202,138,4,0.6)",
  wild: "rgba(139,92,246,0.6)",
} as const;

export const VALUE_SYMBOLS: Record<string, string> = {
  skip: "⊘",
  reverse: "↺",
  draw2: "+2",
  wild: "★",
  wild_draw4: "+4",
};

export const UI_COLORS = {
  white: "#ffffff",
  cardShadow: "rgba(0,0,0,0.5)",
  playableOutline: "rgba(255,255,255,0.4)",
  whiteStrong: "rgba(255,255,255,0.95)",
  whitePanel: "rgba(255,255,255,0.92)",
  whiteMuted: "rgba(255,255,255,0.66)",
  borderMuted: "rgba(255,255,255,0.15)",
  borderSoft: "rgba(255,255,255,0.08)",
  tableStart: "#1f9dd7",
  tableMiddle: "#0b5f91",
  tableEnd: "#062b46",
  tableFelt: "rgba(255,255,255,0.1)",
  tableLine: "rgba(255,255,255,0.28)",
  panel: "rgba(15,15,30,0.95)",
  panelDark: "rgba(0,0,0,0.5)",
  panelDarker: "rgba(0,0,0,0.75)",
  handRail: "rgba(0,0,0,0.3)",
  back: "#1c1c3a",
  unoRed: "#cc0000",
  unoYellow: "#ffdd00",
  orange: "#f97316",
  gold: "#f59e0b",
  greenOk: "#22c55e",
  yellowWarn: "#eab308",
  redDanger: "#ef4444",
  textDark: "#1a1a2e",
  buttonRed: "#b91c1c",
  buttonRedDark: "#7f1d1d",
  cyan: "#22d3ee",
} as const;

export const UNO_COLORS = ["red", "green", "blue", "yellow"] as const;
