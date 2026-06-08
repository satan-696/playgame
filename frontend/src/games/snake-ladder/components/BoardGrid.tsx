import { motion } from "framer-motion";
import { CELL_COLORS, LADDERS, SNAKES, TOKEN_COLORS, TOKEN_GLOW } from "../constants";

interface BoardGridProps {
  positions: Record<string, number>;
  turnOrder: string[];
  lastAction: any;
  breakpoint: string;
}

function groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const result = {} as Record<K, T[]>;
  for (const item of array) {
    const key = keyFn(item);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(item);
  }
  return result;
}

export default function BoardGrid({ positions, turnOrder, lastAction, breakpoint }: BoardGridProps) {
  const CELL_SIZE = breakpoint === "mobile" ? 32 : breakpoint === "tablet" ? 44 : 56;
  const BOARD_SIZE = CELL_SIZE * 10;

  function cellToXY(cell: number, cellSize: number): { x: number; y: number } {
    if (cell === 0) {
      return { x: -cellSize * 0.7, y: 9 * cellSize + cellSize / 2 };
    }
    const row = Math.floor((cell - 1) / 10);
    const col = row % 2 === 0
      ? (cell - 1) % 10           // left-to-right rows
      : 9 - (cell - 1) % 10;      // right-to-left rows
    const x = col * cellSize + cellSize / 2;
    const y = (9 - row) * cellSize + cellSize / 2;
    return { x, y };
  }

  const cells = Array.from({ length: 100 }, (_, i) => i + 1);

  // Group tokens by position
  const tokensByCell = groupBy(Object.entries(positions), ([, pos]) => pos);

  return (
    <svg width={BOARD_SIZE} height={BOARD_SIZE} style={{ background: "white", borderRadius: 8, boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
      {/* Background cells */}
      {cells.map(cell => {
        const { x, y } = cellToXY(cell, CELL_SIZE);
        const row = Math.floor((cell - 1) / 10);
        const col = (cell - 1) % 10;
        const isDark = (row + col) % 2 === 1;
        let fill = isDark ? CELL_COLORS.dark : CELL_COLORS.light;
        if (cell === 1) fill = CELL_COLORS.start;
        if (cell === 100) fill = CELL_COLORS.finish;
        if (SNAKES[cell]) fill = CELL_COLORS.snake; // mouth
        if (LADDERS[cell]) fill = CELL_COLORS.ladder; // foot

        return (
          <g key={`cell-${cell}`}>
            <rect
              x={x - CELL_SIZE / 2}
              y={y - CELL_SIZE / 2}
              width={CELL_SIZE}
              height={CELL_SIZE}
              fill={fill}
              stroke="rgba(0,0,0,0.05)"
              strokeWidth={1}
            />
            <text
              x={x - CELL_SIZE / 2 + 2}
              y={y - CELL_SIZE / 2 + 12}
              fontSize={breakpoint === "mobile" ? 8 : 10}
              fill="rgba(0,0,0,0.5)"
              fontWeight="bold"
            >
              {cell}
            </text>
            {SNAKES[cell] && (
              <text x={x} y={y + 4} fontSize={CELL_SIZE * 0.4} textAnchor="middle" opacity={0.6}>🐍</text>
            )}
            {LADDERS[cell] && (
              <text x={x} y={y + 4} fontSize={CELL_SIZE * 0.4} textAnchor="middle" opacity={0.6}>🪜</text>
            )}
            {cell === 100 && (
              <text x={x} y={y + 4} fontSize={CELL_SIZE * 0.5} textAnchor="middle">🏆</text>
            )}
          </g>
        );
      })}

      {/* Snake paths */}
      {Object.entries(SNAKES).map(([mouth, tail]) => {
        const from = cellToXY(Number(mouth), CELL_SIZE);
        const to = cellToXY(Number(tail), CELL_SIZE);
        const midX = (from.x + to.x) / 2 + 20;
        const midY = (from.y + to.y) / 2;
        return (
          <path
            key={`snake-${mouth}`}
            d={`M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`}
            stroke="#FF3B30"
            strokeWidth={CELL_SIZE * 0.18}
            strokeLinecap="round"
            fill="none"
            opacity={0.75}
          />
        );
      })}

      {/* Ladder lines */}
      {Object.entries(LADDERS).map(([foot, head]) => {
        const from = cellToXY(Number(foot), CELL_SIZE);
        const to = cellToXY(Number(head), CELL_SIZE);
        const offset = CELL_SIZE * 0.12;
        
        // Calculate direction vector to make crossbars perpendicular
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        // Perpendicular unit vector
        const px = -dy / len;
        const py = dx / len;
        
        const railOffset = CELL_SIZE * 0.12;
        
        const l1 = { x: from.x + px * railOffset, y: from.y + py * railOffset };
        const l2 = { x: to.x + px * railOffset, y: to.y + py * railOffset };
        
        const r1 = { x: from.x - px * railOffset, y: from.y - py * railOffset };
        const r2 = { x: to.x - px * railOffset, y: to.y - py * railOffset };

        return (
          <g key={`ladder-${foot}`}>
            {/* Rails */}
            <line x1={l1.x} y1={l1.y} x2={l2.x} y2={l2.y} stroke="#FFD600" strokeWidth={3} strokeLinecap="round" />
            <line x1={r1.x} y1={r1.y} x2={r2.x} y2={r2.y} stroke="#FFD600" strokeWidth={3} strokeLinecap="round" />
            
            {/* Crossbars */}
            {[0.2, 0.4, 0.6, 0.8].map((t, i) => (
              <line key={i}
                x1={l1.x * (1 - t) + l2.x * t}
                y1={l1.y * (1 - t) + l2.y * t}
                x2={r1.x * (1 - t) + r2.x * t}
                y2={r1.y * (1 - t) + r2.y * t}
                stroke="#FFD600" strokeWidth={2.5} strokeLinecap="round"
              />
            ))}
          </g>
        );
      })}

      {/* Player tokens */}
      {Object.entries(tokensByCell).map(([cell, playerEntries]) => {
        const base = cellToXY(Number(cell), CELL_SIZE);
        
        // Cap visible tokens
        const visibleEntries = playerEntries.slice(0, 4);
        const hiddenCount = playerEntries.length - visibleEntries.length;

        return (
          <g key={`cell-tokens-${cell}`}>
            {visibleEntries.map(([pid], tokenIdx) => {
              const colorIdx = turnOrder.indexOf(pid);
              const offsetAngle = (tokenIdx / visibleEntries.length) * 2 * Math.PI;
              const offsetR = visibleEntries.length > 1 ? CELL_SIZE * 0.22 : 0; // Increased offset to avoid overlap
              const tx = base.x + offsetR * Math.cos(offsetAngle);
              const ty = base.y + offsetR * Math.sin(offsetAngle);
              
              return (
                <motion.circle
                  key={pid}
                  cx={tx} cy={ty}
                  r={CELL_SIZE * 0.22}
                  fill={TOKEN_COLORS[colorIdx % TOKEN_COLORS.length]}
                  stroke="white"
                  strokeWidth={2}
                  filter={`drop-shadow(0 2px 6px ${TOKEN_GLOW[colorIdx % TOKEN_GLOW.length]})`}
                  animate={{ cx: tx, cy: ty }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                />
              );
            })}
            {hiddenCount > 0 && (
              <text x={base.x} y={base.y} fill="white" fontSize={10} fontWeight="bold" textAnchor="middle" style={{ textShadow: "0 0 2px black" }}>
                +{hiddenCount}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
