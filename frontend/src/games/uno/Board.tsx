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

function asColor(value: unknown, fallback: UnoColor = "red"): UnoColor {
  return value === "red" || value === "green" || value === "blue" || value === "yellow" || value === "wild" ? value : fallback;
}

function asCard(value: unknown): UnoCard | null {
  if (!isRecord(value)) {
    return null;
  }
  const id = asString(value.id);
  const color = asColor(value.color, "wild");
  const cardValue = asString(value.value);
  if (!id || !cardValue) {
    return null;
  }
  const chosenColor = asColor(value.chosen_color, color);
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

function normalizeAction(value: unknown, playersById: Map<string, PlayerInfo>): LastAction | null {
  if (!isRecord(value)) {
    return null;
  }
  const playerId = asString(value.player_id);
  const card = asCard(value.card);
  const chosen = asColor(value.chosen_color ?? card?.chosen_color, "wild");
  return {
    type: asString(value.type, "ACTION"),
    player_id: playerId,
    player_name: asString(value.player_name, playersById.get(playerId)?.name ?? playerId),
    card: card ?? undefined,
    draw_count: asNumber(value.draw_count ?? value.count, 0),
    count: asNumber(value.count, 0),
    chosen_color: chosen === "wild" ? undefined : chosen,
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

  const hands = isRecord(rawState.hands) ? rawState.hands : {};
  const rawMyHand = Array.isArray(rawState.my_hand) ? rawState.my_hand : Array.isArray(hands[myPlayerId]) ? hands[myPlayerId] : [];
  const myHand = rawMyHand.map(asCard).filter((card): card is UnoCard => Boolean(card));
  const opponentCounts: Record<string, number> = {};

  if (isRecord(rawState.opponent_card_counts)) {
    Object.entries(rawState.opponent_card_counts).forEach(([id, value]) => {
      opponentCounts[id] = asNumber(value, 0);
    });
  } else {
    Object.entries(hands).forEach(([id, value]) => {
      if (id !== myPlayerId) {
        opponentCounts[id] = isRecord(value) ? asNumber(value.card_count, 0) : 0;
      }
    });
  }

  const discard = Array.isArray(rawState.discard) ? rawState.discard : [];
  const discardTop = asCard(rawState.discard_top ?? discard[discard.length - 1]);
  const activeColor = asColor(rawState.active_color ?? discardTop?.chosen_color ?? discardTop?.color, "red");
  const currentPlayerId = turnOrder[asNumber(rawState.current_player_index, 0)] ?? "";
  const currentPlayerName = asString(rawState.current_player_name, playersById.get(currentPlayerId)?.name ?? currentPlayerId);
  const winnerId = asString(rawState.winner_id ?? rawState.winner, "") || null;
  const pendingUnoCheck = asString(rawState.pending_uno_check, "") || null;

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
    last_action: normalizeAction(rawState.last_action, playersById),
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
  };
}

export default function Board({ gameState, myPlayerId, onAction, onLeave, isHost = false }: UnoBoardProps) {
  const state = useMemo(() => normalizeState(gameState, myPlayerId), [gameState, myPlayerId]);
  const actions = useUnoActions(onAction);
  const [pendingWildCard, setPendingWildCard] = useState<UnoCard | null>(null);
  const [normalRenderReady, setNormalRenderReady] = useState(false);
  const [turnFlashKey, setTurnFlashKey] = useState(0);
  const [turnFlashVisible, setTurnFlashVisible] = useState(false);
  const colorGemRef = useRef<HTMLDivElement>(null);

  const players = state?.players ?? [];

  const dealing = useDealing(players, myPlayerId);

  useEffect(() => {
    if (state?.status === "playing") {
      dealing.startDealing(() => setNormalRenderReady(true));
    }
  }, [dealing.startDealing, state?.status]);

  // Bug 2 fix: auto-dismiss color picker whenever it's no longer our turn
  // (covers error paths, race conditions, and RESTART_GAME)
  useEffect(() => {
    if (!state?.is_my_turn) {
      setPendingWildCard(null);
    }
  }, [state?.is_my_turn]);

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
    actions.playCard(card.id);
  }, [actions]);

  const pickColor = (color: PlayableColor) => {
    if (pendingWildCard) {
      actions.playCard(pendingWildCard.id, color);
      setPendingWildCard(null);
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
  const showHand = normalRenderReady || dealing.isDone;
  const isDealLocked = state.status === "playing" && !dealing.isDone;
  // Bug 10 fix: card interactivity must be blocked during WD4 challenge and when THIS player is awaiting a swap
  // (not when a *different* player is awaiting a swap — that would black out innocent players' cards)
  const canAct =
    state.is_my_turn &&
    !isDealLocked &&
    !state.pending_wd4_challenge &&
    state.awaiting_swap !== myPlayerId;
  const turnLabel = state.is_my_turn ? "Your turn" : `${state.current_player_name}'s turn`;

  return (
    <div
      style={{
        height: "100%",
        minHeight: 520,
        display: "grid",
        gridTemplateRows: "64px minmax(360px, 1fr) 42px 220px",
        gridTemplateAreas: "\"topbar\" \"table\" \"actionlog\" \"myhand\"",
        background: `radial-gradient(ellipse at 50% 40%, ${UI_COLORS.tableStart} 0%, ${UI_COLORS.tableMiddle} 55%, ${UI_COLORS.tableEnd} 100%)`,
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
                border: `3px solid ${UI_COLORS.borderMuted}`,
                borderRadius: 8,
                background: `linear-gradient(180deg, ${UI_COLORS.buttonRed}, ${UI_COLORS.buttonRedDark})`,
                color: UI_COLORS.white,
                padding: "8px 18px",
                fontWeight: 900,
                letterSpacing: 1,
                boxShadow: `0 5px 14px ${UI_COLORS.cardShadow}`,
                cursor: "pointer",
              }}
            >
              QUIT
            </button>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800 }}>
            <span style={{ display: "inline-block", animation: "spin-cw 3s linear infinite", animationDirection: state.direction === 1 ? "normal" : "reverse" }}>↻</span>
            {state.direction === 1 ? "Clockwise" : "Counter-Clockwise"}
          </div>
        </div>
        <div
          style={{
            justifySelf: "center",
            minWidth: 280,
            textAlign: "center",
            borderRadius: 999,
            padding: "8px 22px",
            background: isDealLocked ? UI_COLORS.panelDark : state.is_my_turn ? "rgba(34,211,238,0.12)" : UI_COLORS.panelDark,
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
        </div>
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
              width: 28,
              height: 28,
              transform: "rotate(45deg)",
              backgroundColor: CARD_COLORS[state.active_color],
              boxShadow: `0 0 16px ${CARD_COLOR_GLOW[state.active_color]}`,
              transition: "background-color 0.4s, box-shadow 0.4s",
              border: `2px solid ${UI_COLORS.white}`,
            }}
          />
        </div>
      </div>

      <div style={{ gridArea: "table", position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: "11% 20% 12%",
            borderRadius: 18,
            border: `2px solid ${UI_COLORS.tableFelt}`,
            boxShadow: `inset 0 0 60px ${UI_COLORS.tableFelt}`,
            pointerEvents: "none",
          }}
        />
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
          <OpponentHand key={opponent.id} opponent={opponent} position={opponentPositions[index] as "top" | "left" | "right"} />
        ))}
        <div style={{ position: "absolute", left: "calc(50% - 162px)", top: "50%", transform: "translateY(-50%)" }}>
          <DrawPile deckCount={state.deck_count} isMyTurn={canAct} onDraw={actions.drawCard} />
        </div>
        <div style={{ position: "absolute", left: "calc(50% + 28px)", top: "50%", transform: "translateY(-50%)" }}>
          <DiscardPile topCard={state.discard_top} />
        </div>
        <div style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", marginTop: 110 }}>
          <TurnTimer turnStartedAt={state.turn_started_at} turnDuration={state.turn_duration} isMyTurn={state.is_my_turn} paused={isDealLocked} />
        </div>
        <UnoButton
          isMyTurn={canAct}
          myHandCount={state.my_hand.length}
          myPlayerId={myPlayerId}
          unoDeclared={state.uno_declared}
          pendingUnoCheck={state.pending_uno_check}
          pendingUnoCheckName={state.pending_uno_check_name}
          onUno={() => actions.declareUno(myPlayerId)}
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
        <ColorPicker open={Boolean(pendingWildCard)} onColorPick={pickColor} />
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
        {/* Action card effect overlay — shows skip/reverse/draw animations */}
        <ActionEffect lastAction={dealing.isDone ? state.last_action : null} />
        <DealingOverlay phase={dealing.phase} dealtCounts={dealing.dealtCounts} players={players} myPlayerId={myPlayerId} />
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
            isDealing={!dealing.isDone}
            dealRevealCount={dealing.revealCount}
          />
        )}
      </div>
    </div>
  );
}
