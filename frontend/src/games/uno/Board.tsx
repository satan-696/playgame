import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { AnimatePresence, motion } from "framer-motion";
import { ActionEffect } from "./components/ActionEffect";
import { ActionLog } from "./components/ActionLog";
import { ColorPicker } from "./components/ColorPicker";
import { DealingOverlay } from "./components/DealingOverlay";
import { DiscardPile } from "./components/DiscardPile";
import { DrawPile } from "./components/DrawPile";
import { GameOver } from "./components/GameOver";
import { GameVariantOverlays } from "./components/GameVariantOverlays";
import { Hand } from "./components/Hand";
import { OpponentHand } from "./components/OpponentHand";
import { SwapPicker } from "./components/SwapPicker";
import { TurnTimer } from "./components/TurnTimer";
import { UnoButton } from "./components/UnoButton";
import { Wd4ChallengePrompt } from "./components/Wd4ChallengePrompt";
import { CARD_COLOR_GLOW, CARD_COLORS, UI_COLORS } from "./constants";
import { useDealing } from "./hooks/useDealing";
import { useUnoActions } from "./hooks/useUnoActions";
import type { LastAction, OpponentInfo, PlayableColor, PlayerInfo, UnoBoardProps, UnoCard, UnoColor, UnoGameState } from "./types";

gsap.registerPlugin(useGSAP);

const RULE_LABEL_MAP: Record<string, string> = {
  seven_zero: "7/0",
  jump_in: "Jump In",
  must_play_drawn: "Must Play",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" ? value : fallback;
}

function asBoolean(value: unknown) {
  return typeof value === "boolean" ? value : false;
}

// Fix 6: fallback to "wild" (not "red") so unknown colors render as wild (dark purple) not red
function asColor(value: unknown, fallback: UnoColor = "wild"): UnoColor {
  const valid: UnoColor[] = ["red", "green", "blue", "yellow", "wild", "pink", "teal", "purple", "orange"];
  return valid.includes(value as UnoColor) ? (value as UnoColor) : fallback;
}

function asCard(value: unknown, side?: "light" | "dark"): UnoCard | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  
  let face = value;
  if (side && isRecord(value[side])) {
    face = value[side] as Record<string, unknown>;
  } else if (isRecord(value.light)) {
    // Fallback if it's a flip card but side is unknown
    face = value.light as Record<string, unknown>;
  }

  const color = asColor(face.color, "wild");
  const cardValue = asString(face.value);
  if (!id || !cardValue) {
    return null;
  }
  const chosenColor = asColor(face.chosen_color ?? value.chosen_color, color);
  return { id, color, value: cardValue, chosen_color: chosenColor === "wild" ? undefined : chosenColor };
}

function asPlayer(value: unknown): PlayerInfo | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  if (!id) {
    return null;
  }
  return { id, name: asString(value.name, id), is_host: asBoolean(value.is_host) };
}

function normalizeAction(value: unknown, playersById: Map<string, PlayerInfo>, side?: "light" | "dark"): LastAction | null {
  if (!isRecord(value)) {
    return null;
  }
  const playerId = asString(value.player_id);
  const card = asCard(value.card, side);
  const chosen = asColor(value.chosen_color ?? card?.chosen_color, "wild");
  return {
    type: asString(value.type, "ACTION"),
    player_id: playerId,
    player_name: asString(value.player_name, playersById.get(playerId)?.name ?? playerId),
    card: card ?? undefined,
    draw_count: asNumber(value.draw_count ?? value.count, 0),
    count: asNumber(value.count, 0),
    chosen_color: chosen === "wild" ? undefined : chosen,
    // Flip / No Mercy extended fields
    flip_to: (value.flip_to === "dark" || value.flip_to === "light") ? value.flip_to : undefined,
    eliminated: typeof value.eliminated === "string" ? value.eliminated : undefined,
    drawn_count: asNumber(value.drawn_count, 0),
  };
}

function normalizeState(rawState: unknown, myPlayerId: string): UnoGameState | null {
  if (!isRecord(rawState)) {
    return null;
  }

  const rawPlayers = Array.isArray(rawState.players) ? rawState.players : [];
  const players = rawPlayers.map(asPlayer).filter((player): player is PlayerInfo => Boolean(player));
  const playerNames = isRecord(rawState.player_names) ? rawState.player_names : {};
  const turnOrder = Array.isArray(rawState.turn_order) ? rawState.turn_order.map((id) => asString(id)).filter(Boolean) : players.map((player) => player.id);
  const orderedPlayers = turnOrder.length > 0
    ? turnOrder.map((id) => players.find((player) => player.id === id) ?? { id, name: asString(playerNames[id], id), is_host: false })
    : players;
  const playersById = new Map(orderedPlayers.map((player) => [player.id, player]));

  const side = rawState.side === "dark" ? "dark" : (rawState.side === "light" ? "light" : undefined);
  const hands = isRecord(rawState.hands) ? rawState.hands : {};
  const rawMyHand = Array.isArray(rawState.my_hand) ? rawState.my_hand : Array.isArray(hands[myPlayerId]) ? hands[myPlayerId] : [];
  const myHand = rawMyHand.map(c => asCard(c, side)).filter((card): card is UnoCard => Boolean(card));
  const opponentCounts: Record<string, number> = {};

  if (isRecord(rawState.opponent_card_counts)) {
    Object.entries(rawState.opponent_card_counts).forEach(([id, value]) => {
      opponentCounts[id] = asNumber(value, 0);
    });
  } else {
    Object.entries(hands).forEach(([id, value]) => {
      if (id !== myPlayerId) {
        if (typeof value === "number") {
          opponentCounts[id] = value;
        } else if (isRecord(value)) {
          opponentCounts[id] = asNumber(value.card_count, 0);
        } else {
          opponentCounts[id] = 0;
        }
      }
    });
  }

  const discardTop = asCard(rawState.discard_top, side) ??
    (Array.isArray(rawState.discard) && rawState.discard.length > 0 ? asCard(rawState.discard[rawState.discard.length - 1], side) : null);
  const activeColor = asColor(rawState.active_color ?? discardTop?.chosen_color ?? discardTop?.color, "red");
  const currentPlayerId = turnOrder[asNumber(rawState.current_player_index, 0)] ?? "";
  const currentPlayerName = asString(rawState.current_player_name, playersById.get(currentPlayerId)?.name ?? currentPlayerId);
  const winnerId = asString(rawState.winner_id ?? rawState.winner, "") || null;
  const pendingUnoCheck = asString(rawState.pending_uno_check, "") || null;

  // Helper to normalize pending roulette / WDC objects
  function normalizeRoulette(raw: unknown) {
    if (isRecord(raw) && typeof raw.target_id === "string") {
      return { target_id: raw.target_id, chosen_color: asString(raw.chosen_color) };
    }
    return null;
  }

  return {
    my_hand: myHand,
    opponent_card_counts: opponentCounts,
    playable_card_ids: Array.isArray(rawState.playable_card_ids) ? rawState.playable_card_ids.map((id) => asString(id)).filter(Boolean) : [],
    discard_top: discardTop,
    deck_count: asNumber(rawState.deck_count, 0),
    active_color: activeColor,
    direction: rawState.direction === -1 ? -1 : 1,
    is_my_turn: typeof rawState.is_my_turn === "boolean" ? rawState.is_my_turn : currentPlayerId === myPlayerId,
    current_player_id: currentPlayerId,
    current_player_name: currentPlayerName,
    status: rawState.status === "finished" ? "finished" : "playing",
    winner_id: winnerId,
    winner_name: asString(rawState.winner_name, winnerId ? playersById.get(winnerId)?.name ?? winnerId : "") || null,
    turn_started_at: asNumber(rawState.turn_started_at, Date.now() / 1000),
    turn_duration: asNumber(rawState.turn_duration, 30),
    pending_uno_check: pendingUnoCheck,
    pending_uno_check_name: pendingUnoCheck ? playersById.get(pendingUnoCheck)?.name ?? pendingUnoCheck : null,
    uno_declared: isRecord(rawState.uno_declared)
      ? Object.fromEntries(Object.entries(rawState.uno_declared).map(([id, value]) => [id, asBoolean(value)]))
      : {},
    last_action: normalizeAction(rawState.last_action, playersById, side),
    turn_order: turnOrder,
    players: orderedPlayers,
    pending_draw: asNumber(rawState.pending_draw, 0),
    drawn_this_turn: asBoolean(rawState.drawn_this_turn),
    rules: isRecord(rawState.rules) ? (rawState.rules as unknown as import("./types").UnoRules) : { seven_zero: false, jump_in: false, must_play_drawn: false },
    pending_wd4_challenge: (() => {
      const ch = rawState.pending_wd4_challenge;
      if (isRecord(ch) && typeof ch.played_by === "string" && typeof ch.eligible_challenger === "string") {
        return { played_by: ch.played_by, eligible_challenger: ch.eligible_challenger };
      }
      return null;
    })(),
    awaiting_swap: typeof rawState.awaiting_swap === "string" ? rawState.awaiting_swap : null,
    swap_targets: Array.isArray(rawState.swap_targets)
      ? rawState.swap_targets.map((id) => asString(id)).filter(Boolean)
      : [],
    initial_deal_ends_at: asNumber(rawState.initial_deal_ends_at, 0),
    // Flip-specific
    side: side,
    active_colors: Array.isArray(rawState.active_colors)
      ? rawState.active_colors.map((s) => asString(s)).filter(Boolean)
      : ["red", "green", "blue", "yellow"],
    pending_wild_draw_color: normalizeRoulette(rawState.pending_wild_draw_color),
    pending_wd2_challenge: (() => {
      const ch = rawState.pending_wd2_challenge;
      if (isRecord(ch) && typeof ch.played_by === "string" && typeof ch.eligible_challenger === "string") {
        return { played_by: ch.played_by, eligible_challenger: ch.eligible_challenger };
      }
      return null;
    })(),
    // No Mercy-specific
    eliminated: Array.isArray(rawState.eliminated)
      ? rawState.eliminated.map((s) => asString(s)).filter(Boolean)
      : [],
    pending_draw_value: asNumber(rawState.pending_draw_value, 0),
    pending_color_roulette: normalizeRoulette(rawState.pending_color_roulette),
    // Shared
    roulette_drawn_count: asNumber(rawState.roulette_drawn_count, 0),
  };
}

export default function Board({ gameState, myPlayerId, onAction, onLeave, isHost = false }: UnoBoardProps) {
  const state = useMemo(() => normalizeState(gameState, myPlayerId), [gameState, myPlayerId]);
  const actions = useUnoActions(onAction);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  // Fix 9: No Mercy Discard All — open color picker before dispatching action
  const [pendingDiscardAllCard, setPendingDiscardAllCard] = useState<UnoCard | null>(null);
  const [normalRenderReady, setNormalRenderReady] = useState(false);
  const [turnFlashKey, setTurnFlashKey] = useState(0);
  const [turnFlashVisible, setTurnFlashVisible] = useState(false);
  const colorGemRef = useRef<HTMLDivElement>(null);
  
  const players = state?.players ?? [];
  const dealing = useDealing(players, myPlayerId);

  // Moved below the last_action effect to prevent dealing race conditions

  // Dismiss color pickers when it's no longer our turn
  useEffect(() => {
    if (!state?.is_my_turn) {
      setPendingWildCard(null);
      setPendingDiscardAllCard(null);
    }
  }, [state?.is_my_turn]);

  useEffect(() => {
    const type = state?.last_action?.type;
    if (
      type === "PLAY_CARD" ||
      type === "WD4_ACCEPTED" ||
      type === "WD4_CHALLENGE_SUCCESS" ||
      type === "WD4_CHALLENGE_FAILED" ||
      type === "SWAP_HAND" ||
      type === "TIMEOUT_SWAP_SKIPPED" ||
      type === "TIMEOUT" ||
      type === "RESTART_GAME"
    ) {
      setPendingWildCard(null);
      setPendingDiscardAllCard(null);
    }
    if (type === "RESTART_GAME") {
      setNormalRenderReady(false);
      dealing.reset();
    }
  }, [state?.last_action, dealing.reset]);

  useEffect(() => {
    if (state?.status === "playing") {
      const serverDealDone = !state.initial_deal_ends_at || Date.now() / 1000 >= state.initial_deal_ends_at;
      if (serverDealDone) {
        setNormalRenderReady(true);
      } else {
        dealing.startDealing(() => setNormalRenderReady(true));
      }
    }
  }, [dealing.startDealing, state?.status, state?.initial_deal_ends_at]);

  useEffect(() => {
    if (state?.is_my_turn) {
      setTurnFlashKey((value) => value + 1);
      setTurnFlashVisible(true);
      const timer = window.setTimeout(() => setTurnFlashVisible(false), 1000);
      return () => window.clearTimeout(timer);
    }
    setTurnFlashVisible(false);
    return undefined;
  }, [state?.is_my_turn, state?.turn_started_at]);

  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add("(prefers-reduced-motion: no-preference)", () => {
      if (colorGemRef.current) {
        gsap.fromTo(colorGemRef.current, { scale: 1 }, { scale: 1.35, duration: 0.15, yoyo: true, repeat: 1 });
      }
    });
    return () => mm.revert();
  }, { dependencies: [state?.active_color] });

  const opponents = useMemo<OpponentInfo[]>(() => {
    if (!state) {
      return [];
    }
    return state.players
      .filter((player) => player.id !== myPlayerId)
      .map((player) => ({
        id: player.id,
        name: player.name,
        cardCount: state.opponent_card_counts[player.id] ?? 0,
        isActive: player.id === state.current_player_id,
      }));
  }, [myPlayerId, state]);

  const opponentPositions = opponents.length === 1
    ? ["top"]
    : opponents.length === 2
      ? ["top", "right"]
      : ["top", "left", "right"];

  const playCard = useCallback((card: UnoCard) => {
    if (card.color === "wild") {
      setPendingWildCard(card);
      return;
    }
    // Fix 9: Discard All card needs color picker before action dispatch
    if (card.value === "discard_all") {
      setPendingDiscardAllCard(card);
      return;
    }
    actions.playCard(card.id);
  }, [actions]);

  const pickColorAndPlay = (color: PlayableColor) => {
    if (pendingWildCard) {
      actions.playCard(pendingWildCard.id, color);
      setPendingWildCard(null);
    }
  };

  const pickDiscardColor = (color: PlayableColor) => {
    if (pendingDiscardAllCard) {
      actions.discardAll(color);
      setPendingDiscardAllCard(null);
    }
  };

  if (!state) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: UI_COLORS.tableEnd }}>
        <span className="loading loading-spinner loading-lg text-white" />
      </div>
    );
  }

  const iWon = state.winner_id === myPlayerId;
  // Fix 3: treat deal as done once the server's timestamp has passed, even if the animation hook is stuck
  const serverDealDone = !state.initial_deal_ends_at || Date.now() / 1000 >= state.initial_deal_ends_at;
  const showHand = normalRenderReady || dealing.isDone || serverDealDone;
  const isDealLocked = state.status === "playing" && !dealing.isDone && !serverDealDone;
  const isDarkSide = state.side === "dark";
  const canAct =
    state.is_my_turn &&
    !isDealLocked &&
    !state.pending_wd4_challenge &&
    state.awaiting_swap !== myPlayerId &&
    !state.pending_color_roulette &&          // No Mercy WCR targeting me
    !state.pending_wild_draw_color;           // Flip WDC targeting me
  const turnLabel = state.is_my_turn ? "Your turn" : `${state.current_player_name}'s turn`;

  return (
    <div
      style={{
        height: "100%",
        minHeight: 520,
        display: "grid",
        gridTemplateRows: "64px minmax(360px, 1fr) 42px 220px",
        gridTemplateAreas: "\"topbar\" \"table\" \"actionlog\" \"myhand\"",
        background: isDarkSide
          ? `radial-gradient(ellipse at 50% 40%, #1a0a2e 0%, #0d0618 55%, #050010 100%)`
          : `
            radial-gradient(ellipse at 30% 20%, rgba(46,204,113,0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, rgba(26,140,255,0.10) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 40%, ${UI_COLORS.tableStart} 0%, ${UI_COLORS.tableMiddle} 50%, ${UI_COLORS.tableEnd} 100%)
          `,
        transition: "background 1.2s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @keyframes spin-cw { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
        @keyframes my-turn-pulse { 0%,100% { box-shadow: 0 0 14px ${UI_COLORS.cyan}; } 50% { box-shadow: 0 0 32px ${UI_COLORS.cyan}, 0 0 60px ${UI_COLORS.cyan}44; } }
        @keyframes active-name-glow { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
      <div style={{ gridArea: "topbar", display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", padding: "0 16px", color: UI_COLORS.white }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {onLeave && (
            <button
              type="button"
              onClick={onLeave}
              style={{
                border: `3px solid rgba(255,255,255,0.3)`,
                borderRadius: 12,
                background: `linear-gradient(180deg, ${UI_COLORS.buttonRed} 0%, ${UI_COLORS.buttonRedDark} 100%)`,
                color: UI_COLORS.white,
                padding: "10px 22px",
                fontWeight: 900,
                fontSize: 14,
                letterSpacing: 1.5,
                boxShadow: `0 4px 0 rgba(0,0,0,0.3), 0 6px 16px rgba(255,59,48,0.4)`,
                cursor: "pointer",
                transition: "transform 0.12s, box-shadow 0.12s",
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = "translateY(4px)";
                e.currentTarget.style.boxShadow = "0 0 0 rgba(0,0,0,0.3), 0 2px 8px rgba(255,59,48,0.3)";
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 0 rgba(0,0,0,0.3), 0 6px 16px rgba(255,59,48,0.4)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = `0 4px 0 rgba(0,0,0,0.3), 0 6px 16px rgba(255,59,48,0.4)`;
              }}
            >
              QUIT
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
            <span style={{ display: "inline-block", animation: `spin-cw ${state.turn_started_at && (state.turn_duration - (Date.now() / 1000 - state.turn_started_at)) < 8 ? "0.8s" : "3s"} linear infinite`, animationDirection: state.direction === 1 ? "normal" : "reverse", fontSize: 18 }}>↻</span>
            {state.direction === 1 ? "Clockwise" : "Counter-Clockwise"}
          </div>
        </div>
        <motion.div
            key={state.current_player_id}
            initial={{ y: -12, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            style={{
              justifySelf: "center",
              minWidth: 280,
              textAlign: "center",
              borderRadius: 999,
              padding: "8px 22px",
              background: isDealLocked ? UI_COLORS.panelDark : state.is_my_turn ? "rgba(0,229,255,0.12)" : UI_COLORS.panelDark,
              border: `1px solid ${state.is_my_turn && !isDealLocked ? UI_COLORS.cyan : UI_COLORS.tableLine}`,
              animation: state.is_my_turn && !isDealLocked ? "my-turn-pulse 1.6s infinite" : "none",
              transition: "border 0.3s, background 0.3s",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 900, color: isDealLocked ? UI_COLORS.whiteMuted : state.is_my_turn ? UI_COLORS.cyan : UI_COLORS.whiteMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 1 }}>
              {isDealLocked ? "Dealing Cards" : "Current Turn"}
            </div>
            <div style={{ fontSize: 17, fontWeight: 900, color: UI_COLORS.white, letterSpacing: 0.5 }}>
              {isDealLocked ? "Please wait…" : turnLabel}
            </div>
          </motion.div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 14 }}>
          {state.pending_draw > 0 && canAct && (
            <button
              type="button"
              onClick={actions.drawCard}
              style={{
                background: "linear-gradient(180deg, #7f1d1d, #991b1b)",
                border: "1.5px solid rgba(255,100,100,0.4)",
                borderRadius: 8,
                padding: "6px 14px",
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(180deg, #991b1b, #7f1d1d)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(180deg, #7f1d1d, #991b1b)";
              }}
            >
              {`DRAW +${state.pending_draw}`}
            </button>
          )}
          {state.drawn_this_turn && !state.pending_draw && canAct && (
            <button
              type="button"
              onClick={actions.passTurn}
              style={{
                background: "linear-gradient(180deg, #374151, #1f2937)",
                border: "1.5px solid rgba(255,255,255,0.2)",
                borderRadius: 8,
                padding: "6px 14px",
                color: "white",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 1,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(180deg, #4b5563, #374151)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(180deg, #374151, #1f2937)";
              }}
            >
              PASS TURN
            </button>
          )}
          <div
            ref={colorGemRef}
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: CARD_COLORS[state.active_color],
              boxShadow: `0 0 20px ${CARD_COLOR_GLOW[state.active_color]}, 0 4px 12px rgba(0,0,0,0.4)`,
              transition: "background-color 0.4s, box-shadow 0.4s",
              border: `3px solid rgba(255,255,255,0.9)`,
            }}
          />
        </div>
      </div>

      <div style={{ gridArea: "table", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: "11% 20% 12%",
            borderRadius: 28,
            border: `3px dashed rgba(255,255,255,0.15)`,
            boxShadow: `inset 0 0 80px rgba(0,0,0,0.25), 0 0 0 6px rgba(255,255,255,0.04)`,
            pointerEvents: "none",
          }}
        />
        {/* Decorative polka dots for playful board-game feel */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
          {[
            { top: "12%", left: "8%", size: 10, opacity: 0.07 },
            { top: "70%", left: "12%", size: 7, opacity: 0.06 },
            { top: "25%", right: "10%", size: 12, opacity: 0.06 },
            { top: "80%", right: "8%", size: 8, opacity: 0.07 },
            { top: "45%", left: "5%", size: 6, opacity: 0.05 },
            { top: "55%", right: "5%", size: 9, opacity: 0.05 },
          ].map((dot, i) => (
            <div key={i} style={{
              position: "absolute",
              top: dot.top,
              left: (dot as any).left,
              right: (dot as any).right,
              width: dot.size,
              height: dot.size,
              borderRadius: "50%",
              background: "white",
              opacity: dot.opacity,
            }} />
          ))}
        </div>
        <div style={{ position: "absolute", top: 16, left: 24, display: "flex", gap: 8, zIndex: 10 }}>
          {Object.entries(state.rules)
            .filter(([, active]) => active)
            .map(([key]) => (
              <span key={key} style={{ background: "rgba(0,0,0,0.3)", padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: "bold", color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: 0.5, border: "1px solid rgba(255,255,255,0.1)" }}>
                {RULE_LABEL_MAP[key]}
              </span>
            ))
          }
        </div>
        {opponents.map((opponent, index) => (
          <OpponentHand
            key={opponent.id}
            opponent={opponent}
            position={opponentPositions[index] as "top" | "left" | "right"}
            isEliminated={state.eliminated?.includes(opponent.id)}
          />
        ))}
        <div style={{ position: "absolute", left: "calc(50% - 162px)", top: "50%", transform: "translateY(-50%)" }}>
          <DrawPile deckCount={state.deck_count} isMyTurn={canAct} onDraw={actions.drawCard} />
        </div>
        <div style={{ position: "absolute", left: "calc(50% + 28px)", top: "50%", transform: "translateY(-50%)" }}>
          <DiscardPile topCard={state.discard_top} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", marginTop: 110 }}>
          <TurnTimer turnStartedAt={state.turn_started_at} turnDuration={state.turn_duration} isMyTurn={state.is_my_turn} paused={isDealLocked} onTimeout={actions.timeout} />
        </div>
        <UnoButton
          isMyTurn={canAct}
          myHandCount={state.my_hand.length}
          myPlayerId={myPlayerId}
          unoDeclared={state.uno_declared}
          pendingUnoCheck={state.pending_uno_check}
          pendingUnoCheckName={state.pending_uno_check_name}
          onUno={(targetId) => actions.declareUno(targetId)}
        />
        <AnimatePresence>
          {canAct && turnFlashVisible && (
            <motion.div
              key={`turn-${turnFlashKey}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", color: UI_COLORS.white, fontWeight: 900, fontSize: 22, textShadow: `0 3px 14px ${UI_COLORS.cardShadow}` }}
            >
              Your turn!
            </motion.div>
          )}
        </AnimatePresence>
        <ColorPicker
          open={Boolean(pendingWildCard)}
          onColorPick={pickColorAndPlay}
          side={state.side}
          colorOptions={state.side === "dark" ? (state.active_colors as PlayableColor[]) : undefined}
        />
        {/* Fix 9: Discard All color picker (No Mercy) */}
        <ColorPicker
          open={Boolean(pendingDiscardAllCard)}
          onColorPick={pickDiscardColor}
          title="Discard Which Color?"
          colorOptions={(state.active_colors ?? ["red", "green", "blue", "yellow"]) as PlayableColor[]}
        />
        <Wd4ChallengePrompt
          open={
            Boolean(state.pending_wd4_challenge) &&
            state.pending_wd4_challenge?.eligible_challenger === myPlayerId
          }
          playedByName={
            state.players.find((p) => p.id === state.pending_wd4_challenge?.played_by)?.name ??
            state.pending_wd4_challenge?.played_by ??
            "Opponent"
          }
          drawCount={state.pending_draw}
          onAccept={() => actions.challengeWd4(true)}
          onChallenge={() => actions.challengeWd4(false)}
        />
        <SwapPicker
          open={state.awaiting_swap === myPlayerId}
          targets={state.swap_targets.map((id) => ({
            id,
            name: state.players.find((p) => p.id === id)?.name ?? id,
            cardCount: state.opponent_card_counts[id] ?? 0,
          }))}
          onSwap={(targetId) => actions.swapHand(targetId)}
        />
        <GameOver open={state.status === "finished"} iWon={iWon} winnerName={state.winner_name} isHost={isHost} onPlayAgain={actions.restartGame} onLeave={onLeave} />
        {/* Action card effect overlay — shows skip/reverse/draw/flip/eliminated animations */}
        <ActionEffect lastAction={!isDealLocked ? state.last_action : null} />
        {/* Flip dark-side overlay + side badge + color roulette prompt */}
        <GameVariantOverlays state={state} myPlayerId={myPlayerId} />
        <AnimatePresence>
          {(dealing.phase === "dealing" || dealing.phase === "revealing") && (
            <DealingOverlay phase={dealing.phase} dealtCounts={dealing.dealtCounts} players={players} myPlayerId={myPlayerId} />
          )}
        </AnimatePresence>
      </div>

      <div style={{ gridArea: "actionlog" }}>
        <ActionLog lastAction={state.last_action} />
      </div>

      <div
        style={{
          gridArea: "myhand",
          background: "linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.52) 100%)",
          borderTop: `1px solid ${UI_COLORS.borderSoft}`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          padding: "0 16px 14px",
          position: "relative",
          overflow: "visible",
        }}
      >
        {showHand && (
          <Hand
            cards={state.my_hand}
            playableIds={state.playable_card_ids}
            isMyTurn={canAct}
            onCardClick={playCard}
            isDealing={isDealLocked}
            dealRevealCount={isDealLocked ? dealing.revealCount : state.my_hand.length}
            isDarkSide={isDarkSide}
          />
        )}
      </div>
    </div>
  );
}
