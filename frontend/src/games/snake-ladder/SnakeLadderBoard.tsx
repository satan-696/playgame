import { useEffect, useState } from "react";
import { useWindowSize } from "../../hooks/useWindowSize";
import { SnakeLadderGameState } from "./types";
import { useSnakeLadderActions } from "./hooks/useSnakeLadderActions";

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
  onAction: (type: "GAME_ACTION", action: object) => void;
  onLeave?: () => void;
}

export default function SnakeLadderBoard({ gameState, myPlayerId, isHost = false, onAction, onLeave }: SnakeLadderBoardProps) {
  const state = gameState as SnakeLadderGameState;
  const { breakpoint } = useWindowSize();
  const isMobile = breakpoint === "mobile";
  
  const handleAction = (action: object) => onAction("GAME_ACTION", action);
  const actions = useSnakeLadderActions(handleAction);
  const [isRolling, setIsRolling] = useState(false);

  useEffect(() => {
    if (state.last_action?.type === "ROLL_DICE") {
      setIsRolling(true);
      const t = setTimeout(() => setIsRolling(false), 600);
      return () => clearTimeout(t);
    }
  }, [state.last_action]);

  return (
    <div style={{
      height: "100dvh",
      display: "flex",
      flexDirection: "column",
      background: "radial-gradient(ellipse at 50% 30%, #1a4a2e 0%, #0d2b1a 60%, #071510 100%)",
      overflow: "hidden",
      fontFamily: "'Nunito', Arial Black, sans-serif",
    }}>
      {/* Topbar */}
      <div style={{
        height: isMobile ? 48 : 56,
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 12px" : "0 20px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        flexShrink: 0,
      }}>
        <button 
          onClick={onLeave} 
          style={{ 
            background: "rgba(255,0,0,0.2)", color: "white", 
            border: "none", borderRadius: 8, padding: "6px 12px", 
            fontWeight: "bold", cursor: "pointer" 
          }}>
          QUIT
        </button>
        <div style={{ color: "white", fontWeight: 900, fontSize: isMobile ? 14 : 16 }}>
          🐍 Snake & Ladder
        </div>
        <TurnTimer
          turnStartedAt={state.turn_started_at}
          turnDuration={state.turn_duration}
          isMyTurn={state.is_my_turn}
          paused={false}
        />
      </div>

      {/* Main area */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        overflow: "hidden",
        padding: isMobile ? 8 : 16,
        gap: isMobile ? 8 : 16,
        alignItems: isMobile ? "center" : "flex-start",
        justifyContent: "center",
      }}>
        {/* Board + dice/roll (left column on desktop, top on mobile) */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
          flex: isMobile ? "none" : "0 0 auto",
          position: "relative",
        }}>
          <BoardGrid
            positions={state.positions}
            turnOrder={state.turn_order}
            lastAction={state.last_action}
            breakpoint={breakpoint}
          />
          <EventOverlay lastAction={state.last_action} breakpoint={breakpoint} />

          {/* Dice + Roll button */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <DiceDisplay
              dice={state.last_roll}
              isRolling={isRolling}
              breakpoint={breakpoint}
            />
            <RollButton
              canRoll={state.can_roll}
              onRoll={actions.rollDice}
              isMobile={isMobile}
            />
          </div>
        </div>

        {/* Player panel (right column on desktop, bottom strip on mobile) */}
        <PlayerPanel
          players={state.turn_order.map(pid => ({
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

      {/* Action log */}
      <SnakeLadderActionLog 
        lastAction={state.last_action} 
        playerNames={state.player_names} 
      />

      {/* Game over */}
      <SnakeLadderGameOver
        open={state.status === "finished"}
        rankings={state.rankings}
        playerNames={state.player_names}
        isHost={isHost}
        onPlayAgain={actions.restartGame}
        onLeave={onLeave}
      />
    </div>
  );
}
