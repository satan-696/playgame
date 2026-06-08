import { motion } from "framer-motion";
import { LADDERS, SNAKES, TOKEN_COLORS, TOKEN_GLOW } from "../constants";

// Vivid colors matching the reference board
const CELL_COLORS = [
  "#FFD54F", // Yellow
  "#CE93D8", // Purple
  "#81C784", // Green
  "#4FC3F7", // Blue
  "#FF8A65", // Orange
  "#F48FB1", // Pink
  "#4DD0E1", // Cyan
  "#AED581", // Light Green
  "#FFB74D", // Deep Orange
];

const SNAKE_COLORS = [
  { body: "#F44336", spots: "#B71C1C" }, // Red
  { body: "#9C27B0", spots: "#4A148C" }, // Purple
  { body: "#00BCD4", spots: "#006064" }, // Cyan
  { body: "#4CAF50", spots: "#1B5E20" }, // Green
  { body: "#FF9800", spots: "#E65100" }, // Orange
  { body: "#E91E63", spots: "#880E4F" }, // Pink
  { body: "#3F51B5", spots: "#1A237E" }, // Indigo
  { body: "#CDDC39", spots: "#827717" }, // Lime
];

interface BoardGridProps {
  positions: Record<string, number>;
  turnOrder: string[];
  playerNames: Record<string, string>;
  breakpoint: string;
}

export default function BoardGrid({ positions, turnOrder, playerNames, breakpoint }: BoardGridProps) {
  const BOARD_PX = breakpoint === "mobile" ? 300 : breakpoint === "tablet" ? 460 : 620;
  const CELL_SIZE = BOARD_PX / 10;

  function cellToXY(cell: number): { x: number; y: number } {
    if (cell <= 0) return { x: -CELL_SIZE, y: BOARD_PX - CELL_SIZE / 2 };
    const row = Math.floor((cell - 1) / 10);
    const col =
      row % 2 === 0
        ? (cell - 1) % 10          // left-to-right
        : 9 - ((cell - 1) % 10);  // right-to-left
    const x = col * CELL_SIZE + CELL_SIZE / 2;
    const y = (9 - row) * CELL_SIZE + CELL_SIZE / 2;
    return { x, y };
  }

  function getCellBackground(num: number): string {
    // Generate a distributed cycle so adjacent cells differ in both directions
    const index = (num * 3 + Math.floor(num / 10) * 5) % CELL_COLORS.length;
    return CELL_COLORS[index];
  }

  const cells = Array.from({ length: 100 }, (_, i) => i + 1);
  const bodyWidth = CELL_SIZE * 0.45;

  return (
    <svg
      width={BOARD_PX}
      height={BOARD_PX}
      style={{
        borderRadius: 8,
        boxShadow: "0 16px 64px rgba(0,0,0,0.55), 0 0 0 4px #444",
        overflow: "hidden", // Keep it clean to the borders
        flexShrink: 0,
        backgroundColor: "#fff"
      }}
    >
      <defs>
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF176" />
          <stop offset="100%" stopColor="#FFB300" />
        </linearGradient>
      </defs>

      {/* ── Background cells ── */}
      {cells.map((cell) => {
        const { x, y } = cellToXY(cell);
        const fill = cell === 100 ? "url(#goldGrad)" : getCellBackground(cell);

        return (
          <g key={`cell-${cell}`}>
            <rect
              x={x - CELL_SIZE / 2}
              y={y - CELL_SIZE / 2}
              width={CELL_SIZE}
              height={CELL_SIZE}
              fill={fill}
              stroke="rgba(0,0,0,0.2)"
              strokeWidth={1}
            />
            <text
              x={x - CELL_SIZE / 2 + 6}
              y={y - CELL_SIZE / 2 + (breakpoint === "mobile" ? 12 : 16)}
              fontSize={breakpoint === "mobile" ? 10 : 13}
              fill="rgba(0,0,0,0.8)"
              fontWeight="900"
              fontFamily="sans-serif"
            >
              {cell}
            </text>
            {cell === 100 && (
              <text
                x={x} y={y + CELL_SIZE * 0.15}
                fontSize={CELL_SIZE * 0.45}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                🏆
              </text>
            )}
            {cell === 1 && (
              <text
                x={x} y={y + CELL_SIZE * 0.15}
                fontSize={CELL_SIZE * 0.22}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(0,0,0,0.6)"
                fontWeight="900"
              >
                START
              </text>
            )}
          </g>
        );
      })}

      {/* ── Ladders (Wood Style) ── */}
      {Object.entries(LADDERS).map(([foot, head]) => {
        const from = cellToXY(Number(foot));
        const to   = cellToXY(Number(head));
        
        const railColor = "#BCAAA4"; // Lighter wood
        const rungColor = "#8D6E63"; // Darker wood
        const outline = "#4E342E";

        const railWidth = CELL_SIZE * 0.1;
        const rungWidth = CELL_SIZE * 0.08;
        const offset    = CELL_SIZE * 0.15;

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const angle = Math.atan2(dy, dx);
        
        const perpX = Math.sin(angle) * offset;
        const perpY = -Math.cos(angle) * offset;

        // Extend rails slightly past the centers of from/to squares
        const extend = CELL_SIZE * 0.2;
        const startX = from.x - Math.cos(angle) * extend;
        const startY = from.y - Math.sin(angle) * extend;
        const endX = to.x + Math.cos(angle) * extend;
        const endY = to.y + Math.sin(angle) * extend;

        const ladderDist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
        const numRungs = Math.max(3, Math.round(ladderDist / (CELL_SIZE * 0.5)));

        return (
          <g key={`ladder-${foot}`}>
            {/* Left Rail */}
            <line
              x1={startX - perpX} y1={startY - perpY}
              x2={endX - perpX}   y2={endY - perpY}
              stroke={outline} strokeWidth={railWidth + 4} strokeLinecap="round"
            />
            <line
              x1={startX - perpX} y1={startY - perpY}
              x2={endX - perpX}   y2={endY - perpY}
              stroke={railColor} strokeWidth={railWidth} strokeLinecap="round"
            />
            
            {/* Right Rail */}
            <line
              x1={startX + perpX} y1={startY + perpY}
              x2={endX + perpX}   y2={endY + perpY}
              stroke={outline} strokeWidth={railWidth + 4} strokeLinecap="round"
            />
            <line
              x1={startX + perpX} y1={startY + perpY}
              x2={endX + perpX}   y2={endY + perpY}
              stroke={railColor} strokeWidth={railWidth} strokeLinecap="round"
            />

            {/* Rungs */}
            {Array.from({ length: numRungs }).map((_, i) => {
              const t = (i + 1) / (numRungs + 1);
              const rx = from.x + dx * t;
              const ry = from.y + dy * t;
              return (
                <g key={`rung-${i}`}>
                  <line
                    x1={rx - perpX} y1={ry - perpY}
                    x2={rx + perpX} y2={ry + perpY}
                    stroke={outline} strokeWidth={rungWidth + 4} strokeLinecap="butt"
                  />
                  <line
                    x1={rx - perpX} y1={ry - perpY}
                    x2={rx + perpX} y2={ry + perpY}
                    stroke={rungColor} strokeWidth={rungWidth} strokeLinecap="butt"
                  />
                  {/* Nails */}
                  <circle cx={rx - perpX} cy={ry - perpY} r={CELL_SIZE * 0.02} fill={outline} />
                  <circle cx={rx + perpX} cy={ry + perpY} r={CELL_SIZE * 0.02} fill={outline} />
                </g>
              );
            })}
          </g>
        );
      })}

      {/* ── Snakes (Smooth S-Curves) ── */}
      {Object.entries(SNAKES).map(([mouth, tail], idx) => {
        const from = cellToXY(Number(mouth));
        const to   = cellToXY(Number(tail));
        const colors = SNAKE_COLORS[idx % SNAKE_COLORS.length];

        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        // Calculate a smooth bezier curve that bows out and then back in
        const bow = dist * 0.25;
        const pX = Math.cos(angle + Math.PI / 2) * bow;
        const pY = Math.sin(angle + Math.PI / 2) * bow;

        const cp1 = { x: from.x + dx * 0.3 + pX, y: from.y + dy * 0.3 + pY };
        const cp2 = { x: from.x + dx * 0.7 - pX, y: from.y + dy * 0.7 - pY };

        const curvePath = `M ${from.x} ${from.y} C ${cp1.x} ${cp1.y} ${cp2.x} ${cp2.y} ${to.x} ${to.y}`;

        // Head orientation: facing backwards along the tangent from cp1 to the mouth
        const headAngle = Math.atan2(from.y - cp1.y, from.x - cp1.x) * (180 / Math.PI);

        return (
          <g key={`snake-${mouth}`}>
            {/* Outline */}
            <path
              d={curvePath}
              stroke="#000"
              strokeWidth={bodyWidth + 6}
              strokeLinecap="round"
              fill="none"
            />
            {/* Body */}
            <path
              d={curvePath}
              stroke={colors.body}
              strokeWidth={bodyWidth}
              strokeLinecap="round"
              fill="none"
            />
            {/* Spots (dashed line overlay) */}
            <path
              d={curvePath}
              stroke={colors.spots}
              strokeWidth={bodyWidth * 0.5}
              strokeLinecap="round"
              strokeDasharray={`0 ${CELL_SIZE * 0.6}`}
              fill="none"
            />

            {/* Snake Head */}
            <g transform={`translate(${from.x}, ${from.y}) rotate(${headAngle})`}>
              {/* Head Base */}
              <ellipse cx={0} cy={0} rx={CELL_SIZE * 0.35} ry={CELL_SIZE * 0.25} fill={colors.body} stroke="#000" strokeWidth={3} />
              
              {/* Eyes */}
              <ellipse cx={CELL_SIZE * 0.15} cy={-CELL_SIZE * 0.1} rx={CELL_SIZE * 0.08} ry={CELL_SIZE * 0.12} fill="#FFF" stroke="#000" strokeWidth={1.5} />
              <ellipse cx={CELL_SIZE * 0.15} cy={CELL_SIZE * 0.1} rx={CELL_SIZE * 0.08} ry={CELL_SIZE * 0.12} fill="#FFF" stroke="#000" strokeWidth={1.5} />
              <circle cx={CELL_SIZE * 0.18} cy={-CELL_SIZE * 0.1} r={CELL_SIZE * 0.04} fill="#000" />
              <circle cx={CELL_SIZE * 0.18} cy={CELL_SIZE * 0.1} r={CELL_SIZE * 0.04} fill="#000" />
              
              {/* Tongue */}
              <path
                d={`M ${CELL_SIZE * 0.35} 0 L ${CELL_SIZE * 0.55} -${CELL_SIZE * 0.1} M ${CELL_SIZE * 0.35} 0 L ${CELL_SIZE * 0.55} ${CELL_SIZE * 0.1}`}
                stroke="#FF1744"
                strokeWidth={2.5}
                strokeLinecap="round"
                fill="none"
              />
            </g>

            {/* Tail */}
            <circle cx={to.x} cy={to.y} r={bodyWidth * 0.4} fill={colors.body} />
          </g>
        );
      })}

      {/* ── Player tokens ── */}
      {Object.entries(positions ?? {})
        .filter(([, pos]) => typeof pos === "number" && pos >= 0)
        .map(([pid, pos]) => {
          const colorIdx = turnOrder.indexOf(pid);
          const { x, y } = cellToXY(pos);

          const sameCellPlayers = Object.entries(positions)
            .filter(([, p]) => p === pos)
            .map(([id]) => id);
          const tokenIdx = sameCellPlayers.indexOf(pid);
          const total = sameCellPlayers.length;
          const offsetAngle = total > 1 ? (tokenIdx / total) * 2 * Math.PI : 0;
          const offsetR = total > 1 ? CELL_SIZE * 0.22 : 0;
          const tx = x + offsetR * Math.cos(offsetAngle);
          const ty = y + offsetR * Math.sin(offsetAngle);

          const r = CELL_SIZE * 0.24;
          const color = TOKEN_COLORS[colorIdx % TOKEN_COLORS.length];
          const glow  = TOKEN_GLOW[colorIdx % TOKEN_GLOW.length];
          const label = playerNames[pid]?.[0]?.toUpperCase() ?? "?";

          return (
            <motion.g
              key={pid}
              animate={{ x: tx, y: ty }}
              initial={false}
              transition={{ type: "spring", stiffness: 160, damping: 20 }}
              style={{ zIndex: 10 }}
            >
              <ellipse cx={0} cy={r * 0.35} rx={r * 0.85} ry={r * 0.28} fill="rgba(0,0,0,0.4)" />
              <circle cx={0} cy={0} r={r} fill={color} stroke="#FFF" strokeWidth={3} filter={`drop-shadow(0 4px 6px ${glow})`} />
              <ellipse cx={-r * 0.3} cy={-r * 0.3} rx={r * 0.28} ry={r * 0.2} fill="rgba(255,255,255,0.4)" />
              <text x={0} y={r * 0.35} textAnchor="middle" fontSize={r * 0.8} fontWeight="900" fill="#FFF" fontFamily="sans-serif">
                {label}
              </text>
            </motion.g>
          );
        })}
    </svg>
  );
}
