export const CARD_WIDTH = 112;
export const CARD_HEIGHT = 156;

// Card face colors — brighter, more saturated cartoon palette
export const CARD_COLORS: Record<string, string> = {
  // Light side
  red:    "#FF3B30",
  green:  "#2ECC71",
  blue:   "#1A8CFF",
  yellow: "#FFD600",
  wild:   "#7B2FFF",
  // Dark side
  pink:   "#FF2D78",
  teal:   "#00C9B1",
  purple: "#7B2FFF",
  orange: "#FF6B00",
};

// Glow colors per card color — strong, vivid for playable highlights
export const CARD_COLOR_GLOW: Record<string, string> = {
  red:    "rgba(255,59,48,0.75)",
  green:  "rgba(46,204,113,0.75)",
  blue:   "rgba(26,140,255,0.75)",
  yellow: "rgba(255,214,0,0.75)",
  wild:   "rgba(123,47,255,0.75)",
  // Dark side
  pink:   "rgba(255,45,120,0.75)",
  teal:   "rgba(0,201,177,0.75)",
  purple: "rgba(123,47,255,0.75)",
  orange: "rgba(255,107,0,0.75)",
};

// Symbols shown on card face — safe ASCII/Unicode fallbacks only
export const VALUE_SYMBOLS: Record<string, string> = {
  // Standard UNO
  skip:              "⊘",
  reverse:           "↺",
  draw2:             "+2",
  wild:              "★",
  wild_draw4:        "+4",
  // UNO Flip — light side
  draw1:             "+1",
  flip:              "↕",    // Safe, no emoji
  // UNO Flip — dark side
  skip_everyone:     "⊗",
  draw5:             "+5",
  wild_draw2:        "+2W",  // No star character
  wild_draw_color:   "WDC",
  // UNO No Mercy
  wild_draw6:        "+6",
  wild_draw10:       "+10",
  discard_all:       "DA",
  wild_color_roulette: "WCR",
};

export const UI_COLORS = {
  // Table / background — rich green felt
  tableStart:   "#1a6b3c",
  tableMiddle:  "#155e33",
  tableEnd:     "#0f4726",
  tableFelt:    "rgba(255,255,255,0.08)",
  tableLine:    "rgba(255,255,255,0.12)",

  // Panels / chrome
  panel:        "rgba(15,15,30,0.95)",
  panelDark:    "rgba(0,0,0,0.45)",
  panelDarker:  "rgba(0,0,0,0.75)",
  handRail:     "rgba(0,0,0,0.3)",
  back:         "#1c1c3a",

  // Borders
  borderMuted:  "rgba(255,255,255,0.18)",
  borderSoft:   "rgba(255,255,255,0.10)",

  // Text
  white:        "#FFFFFF",
  whiteStrong:  "rgba(255,255,255,0.95)",
  whitePanel:   "rgba(255,255,255,0.92)",
  whiteMuted:   "rgba(255,255,255,0.55)",
  textDark:     "#1a1a2e",

  // Accent
  cyan:         "#00E5FF",
  orange:       "#f97316",
  gold:         "#f59e0b",

  // Buttons
  buttonRed:    "#FF3B30",
  buttonRedDark:"#C0392B",
  unoRed:       "#cc0000",
  unoYellow:    "#ffdd00",

  // Card shadows / overlays
  cardShadow:   "rgba(0,0,0,0.55)",

  // Timer colors
  greenOk:      "#2ECC71",
  yellowWarn:   "#F1C40F",
  redDanger:    "#FF3B30",

  // Legacy aliases kept for compatibility
  playableOutline: "rgba(255,255,255,0.4)",
} as const;

export const UNO_COLORS = ["red", "green", "blue", "yellow"] as const;
export const DARK_COLORS = ["pink", "teal", "purple", "orange"] as const;
