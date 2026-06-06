import { useEffect, useState } from "react";
import { UI_COLORS } from "../constants";

interface TurnTimerProps {
  turnStartedAt: number;
  turnDuration: number;
  isMyTurn: boolean;
  paused?: boolean;
  onTimeout?: () => void;
}

export function TurnTimer({ turnStartedAt, turnDuration, isMyTurn, paused = false, onTimeout }: TurnTimerProps) {
  const [remaining, setRemaining] = useState(turnDuration);
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const ratio = turnDuration > 0 ? remaining / turnDuration : 0;
  const urgent = remaining < 8 && !paused;
  const stroke = remaining > 15 ? UI_COLORS.greenOk : remaining > 8 ? UI_COLORS.yellowWarn : UI_COLORS.redDanger;

  useEffect(() => {
    if (paused) {
      setRemaining(turnDuration);
      return undefined;
    }
    const interval = window.setInterval(() => {
      const elapsed = Date.now() / 1000 - turnStartedAt;
      const timeLeft = Math.max(0, turnDuration - elapsed);
      setRemaining(Math.min(turnDuration, timeLeft));
      
      // Fire timeout action if time runs out and it's our turn
      if (timeLeft === 0 && isMyTurn && onTimeout) {
        onTimeout();
      }
    }, 250);
    return () => window.clearInterval(interval);
  }, [paused, turnDuration, turnStartedAt, isMyTurn, onTimeout]);

  if (paused) return null;

  return (
    <div
      style={{
        width: 58,
        height: 58,
        animation: urgent && isMyTurn ? "timer-shake 0.6s infinite" : "none",
        filter: urgent && isMyTurn ? `drop-shadow(0 0 8px ${UI_COLORS.redDanger})` : "none",
        transition: "filter 0.4s",
      }}
    >
      <svg width="58" height="58" viewBox="0 0 50 50">
        {/* Background track */}
        <circle cx="25" cy="25" r={r} stroke="rgba(255,255,255,0.12)" strokeWidth="5" fill="rgba(0,0,0,0.3)" />
        {/* Progress arc */}
        <circle
          cx="25" cy="25" r={r}
          stroke={stroke}
          strokeWidth="5"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)}
          strokeLinecap="round"
          style={{
            transition: "stroke 0.5s, stroke-dashoffset 0.25s linear",
            transform: "rotate(-90deg)",
            transformOrigin: "center",
          }}
        />
        {/* Time text */}
        <text
          x="25" y="30"
          textAnchor="middle"
          fontSize="13"
          fontWeight="800"
          fill={paused ? "rgba(255,255,255,0.4)" : UI_COLORS.white}
          fontFamily="'Nunito', Arial Black, sans-serif"
        >
          {paused ? "–" : Math.ceil(remaining)}
        </text>
      </svg>
    </div>
  );
}
