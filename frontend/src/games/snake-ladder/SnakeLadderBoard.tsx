import { useEffect, useRef, useState } from "react";
import { useWindowSize } from "../../hooks/useWindowSize";
import { SnakeLadderAction, SnakeLadderGameState } from "./types";
import { useSnakeLadderActions } from "./hooks/useSnakeLadderActions";
import type { GameActionSender } from "../../shell/types";

import BoardGrid from "./components/BoardGrid";
import DiceDisplay from "./components/DiceDisplay";
import PlayerPanel from "./components/PlayerPanel";
import RollButton from "./components/RollButton";
import EventOverlay from "./components/EventOverlay";
import SnakeLadderActionLog from "./components/SnakeLadderActionLog";
import SnakeLadderGameOver from "./components/SnakeLadderGameOver";
import { TurnTimer } from "../uno/components/TurnTimer";

import "./SnakeLadderBoard.css";

interface SnakeLadderBoardProps {
  gameState: any;
  myPlayerId: string;
  isHost?: boolean;
  onAction: GameActionSender;
  onLeave?: () => void;
}

export default function SnakeLadderBoard({
  gameState,
  myPlayerId,
  isHost = false,
  onAction,
  onLeave,
}: SnakeLadderBoardProps) {
  const state = gameState as SnakeLadderGameState;
  const { breakpoint } = useWindowSize();
  const isMobile = breakpoint === "mobile";

  const handleAction = (action: Record<string, unknown>) => onAction("GAME_ACTION", action);
  const actions = useSnakeLadderActions(handleAction);

  // ── Animation state ──────────────────────────────────────────────
  const [displayPositions, setDisplayPositions] = useState<Record<string, number>>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [showEvent, setShowEvent] = useState<SnakeLadderAction | null>(null);
  const animationRef = useRef<number[]>([]);

  // Initialize displayPositions from server state (first mount or turn order change)
  useEffect(() => {
    if (Object.keys(displayPositions).length === 0 && state?.positions) {
      setDisplayPositions(state.positions);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.turn_order]);

  // ── Die roll animation — triggers first, pawn moves after ────────
  useEffect(() => {
    if (!state?.last_action || state.last_action.type !== "ROLL_DICE") return;
    setIsRolling(true);
    const t1 = window.setTimeout(() => setIsRolling(false), 700);
    return () => clearTimeout(t1);
  }, [state?.last_action]);

  // ── Pawn step-by-step movement ───────────────────────────────────
  useEffect(() => {
    if (!state?.last_action || state.last_action.type !== "ROLL_DICE") return;
    const action = state.last_action;
    if (action.from === undefined || action.to === undefined) return;

    const pid = action.player_id!;
    const landSquare = action.event_from ?? action.to!; // square before snake/ladder jump
    const finalSquare = action.to!;

    // Bounce or no movement — just sync position
    if (landSquare === action.from && finalSquare === action.from) {
      setDisplayPositions((prev) => ({ ...prev, [pid]: finalSquare }));
      return;
    }

    // Build step list from current → landSquare
    const steps: number[] = [];
    const startSq = action.from ?? 0;
    for (let s = startSq + 1; s <= landSquare; s++) {
      steps.push(s);
    }

    setIsAnimating(true);
    setShowEvent(null);
    animationRef.current.forEach(clearTimeout);
    animationRef.current = [];

    // Step through squares — start 700ms after die roll
    steps.forEach((sq, i) => {
      const t = window.setTimeout(() => {
        setDisplayPositions((prev) => ({ ...prev, [pid]: sq }));
      }, 700 + i * 120);
      animationRef.current.push(t);
    });

    const snakeLadderDelay = 700 + steps.length * 120 + 400;

    if (landSquare !== finalSquare) {
      // Show event overlay the moment the snake/ladder activates
      const t3 = window.setTimeout(() => {
        setShowEvent(action);
      }, snakeLadderDelay);
      // Apply the snake/ladder jump
      const t2 = window.setTimeout(() => {
        setDisplayPositions((prev) => ({ ...prev, [pid]: finalSquare }));
        setIsAnimating(false);
      }, snakeLadderDelay + 600);
      // Clear event overlay
      const t4 = window.setTimeout(() => {
        setShowEvent(null);
      }, snakeLadderDelay + 2100);
      animationRef.current.push(t2, t3, t4);
    } else {
      const t2 = window.setTimeout(() => {
        setIsAnimating(false);
      }, snakeLadderDelay);
      animationRef.current.push(t2);
    }

    return () => animationRef.current.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.last_action]);

  const canRoll = state.can_roll && !isAnimating && !isRolling;

  const BOARD_PX = breakpoint === "mobile" ? 300 : breakpoint === "tablet" ? 460 : 620;

  return (
    <div
      style={{
        height: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: `
          radial-gradient(ellipse at 30% 10%, rgba(80,160,40,0.3) 0%, transparent 50%),
          radial-gradient(ellipse at 70% 90%, rgba(20,80,10,0.4) 0%, transparent 50%),
          #1a3a0a
        `,
        backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.025) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
        overflow: "hidden",
        fontFamily: "'Nunito', Arial Black, sans-serif",
      }}
    >
      {/* ── Topbar ── */}
      <div
        style={{
          height: isMobile ? 48 : 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "0 12px" : "0 20px",
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={onLeave}
          style={{
            background: "linear-gradient(180deg, #FF3B30, #C0392B)",
            color: "white",
            border: "3px solid rgba(255,255,255,0.3)",
            borderRadius: 12,
            padding: "8px 18px",
            fontWeight: 900,
            letterSpacing: 1,
            cursor: "pointer",
            boxShadow: "0 4px 0 rgba(0,0,0,0.3), 0 6px 16px rgba(255,59,48,0.4)",
            fontSize: 13,
          }}
        >
          QUIT
        </button>
        <div style={{ color: "white", fontWeight: 900, fontSize: isMobile ? 14 : 16 }}>
          🐍 Snake &amp; Ladder
        </div>
        <TurnTimer
          turnStartedAt={state.turn_started_at}
          turnDuration={state.turn_duration}
          isMyTurn={state.is_my_turn}
          paused={false}
        />
      </div>

      {/* ── Main area ── */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          overflow: "hidden",
          padding: isMobile ? 8 : 16,
          gap: isMobile ? 8 : 16,
          alignItems: isMobile ? "center" : "flex-start",
          justifyContent: "center",
        }}
      >
        {/* Board + controls (left column on desktop, top on mobile) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            flex: isMobile ? "none" : "0 0 auto",
            position: "relative",
          }}
        >
          <div style={{ position: "relative", width: BOARD_PX, height: BOARD_PX, flexShrink: 0 }}>
            <BoardGrid
              positions={displayPositions}
              turnOrder={state.turn_order}
              playerNames={state.player_names}
              breakpoint={breakpoint}
            />
            {/* EventOverlay sits directly over the board */}
            <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 10 }}>
              <EventOverlay action={showEvent} breakpoint={breakpoint} />
            </div>
          </div>

          {/* Dice + Roll button */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DiceDisplay
              dice={state.last_roll}
              isRolling={isRolling}
              breakpoint={breakpoint}
            />
            <RollButton
              canRoll={canRoll}
              onRoll={actions.rollDice}
              isMobile={isMobile}
            />
          </div>

          {/* Action log — constrained to board width */}
          <div style={{ width: BOARD_PX, maxWidth: "100%" }}>
            <SnakeLadderActionLog
              lastAction={state.last_action}
              playerNames={state.player_names}
            />
          </div>
        </div>

        {/* Player panel — dark glass card */}
        <div
          style={{
            background: "rgba(0,0,0,0.40)",
            backdropFilter: "blur(12px)",
            borderRadius: 16,
            border: "1px solid rgba(255,255,255,0.10)",
            padding: 12,
            minWidth: isMobile ? undefined : 220,
            flex: isMobile ? "none" : undefined,
            alignSelf: isMobile ? "stretch" : "flex-start",
          }}
        >
          <PlayerPanel
            players={state.turn_order.map((pid) => ({
              id: pid,
              name: state.player_names[pid],
              position: state.positions[pid],
              isCurrentPlayer: state.turn_order[state.current_player_index] === pid,
              isMe: pid === myPlayerId,
            }))}
            rankings={state.rankings}
            skipNextTurn={state.skip_next_turn}
            isMobile={isMobile}
          />
        </div>
      </div>

      {/* Game over */}
      <SnakeLadderGameOver
        open={state.status === "finished"}
        rankings={state.rankings}
        playerNames={state.player_names}
        isHost={isHost}
        onPlayAgain={actions.restartGame}
        onLeave={onLeave || (() => {})}
      />
    </div>
  );
}
