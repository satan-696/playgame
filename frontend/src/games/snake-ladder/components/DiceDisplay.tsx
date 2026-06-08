import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface DiceDisplayProps {
  dice: [number, number] | null;
  isRolling: boolean;
  breakpoint: string;
}

function Die({ value, size, isRolling }: { value: number; size: number; isRolling: boolean }) {
  const pips = [];
  // Standard dice layout
  if ([1, 3, 5].includes(value)) pips.push({ top: "50%", left: "50%" }); // center
  if ([2, 3, 4, 5, 6].includes(value)) {
    pips.push({ top: "25%", left: "25%" }); // top-left
    pips.push({ top: "75%", left: "75%" }); // bottom-right
  }
  if ([4, 5, 6].includes(value)) {
    pips.push({ top: "25%", left: "75%" }); // top-right
    pips.push({ top: "75%", left: "25%" }); // bottom-left
  }
  if (value === 6) {
    pips.push({ top: "50%", left: "25%" }); // middle-left
    pips.push({ top: "50%", left: "75%" }); // middle-right
  }

  return (
    <motion.div
      animate={isRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.15, 0.9, 1.1, 1] } : { rotate: 0, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        width: size,
        height: size,
        background: "white",
        borderRadius: size * 0.18,
        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
        position: "relative",
      }}
    >
      {pips.map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: size * 0.2,
            height: size * 0.2,
            background: "#333",
            borderRadius: "50%",
            top: pos.top,
            left: pos.left,
            transform: "translate(-50%, -50%)",
          }}
        />
      ))}
    </motion.div>
  );
}

export default function DiceDisplay({ dice, isRolling, breakpoint }: DiceDisplayProps) {
  const DIE_SIZE = breakpoint === "mobile" ? 40 : 56;
  const isDoubles = dice && dice[0] === dice[1];

  // We need to keep track of previous dice to show something even if current is null or during roll
  const [displayDice, setDisplayDice] = useState<[number, number]>([1, 1]);

  useEffect(() => {
    if (dice) {
      setDisplayDice(dice);
    }
  }, [dice]);

  return (
    <div style={{ display: "flex", gap: 12, position: "relative" }}>
      <Die value={displayDice[0]} size={DIE_SIZE} isRolling={isRolling} />
      <Die value={displayDice[1]} size={DIE_SIZE} isRolling={isRolling} />

      <AnimatePresence>
        {isDoubles && !isRolling && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: -40 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            style={{
              position: "absolute",
              top: 0,
              left: "50%",
              transform: "translateX(-50%)",
              background: "linear-gradient(to right, #FFD700, #FFA500)",
              color: "#333",
              padding: "4px 12px",
              borderRadius: 16,
              fontWeight: 900,
              fontSize: breakpoint === "mobile" ? 12 : 14,
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(255,165,0,0.5)",
              zIndex: 10,
            }}
          >
            DOUBLES! 🎲🎲
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
