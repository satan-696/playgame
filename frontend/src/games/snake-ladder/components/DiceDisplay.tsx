import { motion, useAnimation } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// Pip offsets as [dy%, dx%] from center — positive y is down, positive x is right
const PIP_LAYOUTS: Record<number, [number, number][]> = {
  1: [[0, 0]],
  2: [[-30, -30], [30, 30]],
  3: [[-30, -30], [0, 0], [30, 30]],
  4: [[-30, -30], [30, -30], [-30, 30], [30, 30]],
  5: [[-30, -30], [30, -30], [0, 0], [-30, 30], [30, 30]],
  6: [[-30, -30], [30, -30], [-30, 0], [30, 0], [-30, 30], [30, 30]],
};

const CYCLE_FACES = [1, 4, 2, 6, 3, 5];

interface DiceDisplayProps {
  dice: [number, number] | null;
  isRolling: boolean;
  breakpoint: string;
}

export default function DiceDisplay({ dice, isRolling, breakpoint }: DiceDisplayProps) {
  const dieSize  = breakpoint === "mobile" ? 52 : breakpoint === "tablet" ? 64 : 80;
  const pipR     = dieSize * 0.07;
  const shadowH  = dieSize * 0.10;

  const [displayFace, setDisplayFace] = useState<number>(dice?.[0] ?? 1);
  const controls  = useAnimation();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cycleIdxRef = useRef(0);

  useEffect(() => {
    if (isRolling) {
      // Start flip loop
      controls.start({
        rotateY: [0, -180, -360, -540, -720],
        transition: { duration: 0.65, ease: "linear" },
      });
      // Cycle pip face every 80ms
      intervalRef.current = setInterval(() => {
        cycleIdxRef.current = (cycleIdxRef.current + 1) % CYCLE_FACES.length;
        setDisplayFace(CYCLE_FACES[cycleIdxRef.current]);
      }, 80);
    } else {
      // Stop cycling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Settle back to 0° then snap to actual value
      controls.start({
        rotateY: 0,
        transition: { duration: 0.25, ease: "easeOut" },
      });
      const t = setTimeout(() => {
        if (dice?.[0]) setDisplayFace(dice[0]);
      }, 100);
      return () => clearTimeout(t);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRolling]); // eslint-disable-line react-hooks/exhaustive-deps

  // When dice value arrives after rolling stops, ensure face is set
  useEffect(() => {
    if (!isRolling && dice?.[0]) {
      setDisplayFace(dice[0]);
    }
  }, [dice, isRolling]);

  const pips  = PIP_LAYOUTS[displayFace] ?? [];

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      {/* Perspective wrapper — single-axis Y flip */}
      <div style={{ perspective: 800, position: "relative" }}>
        <motion.div
          animate={controls}
          style={{
            width: dieSize,
            height: dieSize,
            borderRadius: dieSize * 0.18,
            background: "linear-gradient(145deg, #ffffff, #e8e8e8)",
            border: "2px solid #ddd",
            boxShadow: `
              0 ${shadowH}px 0 #bbb,
              0 ${shadowH * 1.5}px ${dieSize * 0.25}px rgba(0,0,0,0.40)
            `,
            position: "relative",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Pips */}
          {pips.map(([dy, dx], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top:  `calc(50% + ${dy}%)`,
                left: `calc(50% + ${dx}%)`,
                transform: "translate(-50%, -50%)",
                width:  pipR * 2,
                height: pipR * 2,
                borderRadius: "50%",
                background: "#2c2c2c",
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.4)",
              }}
            />
          ))}
        </motion.div>

        {/* 3D depth face — the "bottom" of the cube */}
        <div
          style={{
            position: "absolute",
            bottom: -shadowH,
            left:  dieSize * 0.05,
            right: dieSize * 0.05,
            height: shadowH,
            background: "#888",
            borderRadius: `0 0 ${dieSize * 0.18}px ${dieSize * 0.18}px`,
            zIndex: -1,
          }}
        />
      </div>
    </div>
  );
}
