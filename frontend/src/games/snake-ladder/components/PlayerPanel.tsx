import { TOKEN_COLORS, TOKEN_GLOW } from "../constants";

interface PlayerData {
  id: string;
  name: string;
  position: number;
  isCurrentPlayer: boolean;
  isMe: boolean;
}

interface PlayerPanelProps {
  players: PlayerData[];
  rankings: string[];
  skipNextTurn: string[];
  isMobile: boolean;
}

export default function PlayerPanel({ players, rankings, skipNextTurn, isMobile }: PlayerPanelProps) {
  return (
    <div style={{
      display: "flex",
      flexDirection: isMobile ? "row" : "column",
      gap: 12,
      width: isMobile ? "100%" : 260,
      overflowX: isMobile ? "auto" : "hidden",
      overflowY: isMobile ? "hidden" : "auto",
      padding: isMobile ? "4px 0" : 0,
      scrollbarWidth: "none",
    }}>
      {players.map((p, idx) => {
        const colorIdx = idx % TOKEN_COLORS.length;
        const rankIdx = rankings.indexOf(p.id);
        
        return (
          <div key={p.id} style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            borderRadius: 12,
            minWidth: isMobile ? 180 : "auto",
            background: p.isCurrentPlayer
              ? "rgba(255,255,255,0.12)"
              : "rgba(255,255,255,0.04)",
            border: p.isCurrentPlayer
              ? "1.5px solid rgba(255,255,255,0.3)"
              : "1.5px solid transparent",
            transition: "all 0.3s",
            flexShrink: 0,
          }}>
            {/* Token color circle */}
            <div style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: TOKEN_COLORS[colorIdx],
              boxShadow: p.isCurrentPlayer ? `0 0 12px ${TOKEN_GLOW[colorIdx]}` : "none",
              flexShrink: 0,
            }} />
            
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{
                fontWeight: 800,
                fontSize: isMobile ? 11 : 13,
                color: "white",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                overflow: "hidden"
              }}>
                {p.name} {p.isMe ? "(You)" : ""}
              </div>
              <div style={{ fontSize: isMobile ? 10 : 11, color: "rgba(255,255,255,0.5)" }}>
                Square {p.position === 0 ? "Start" : p.position === 100 ? "Finished! 🏆" : p.position}
              </div>
            </div>
            
            {/* Ranking badge if finished */}
            {rankIdx !== -1 && (
              <span style={{ fontSize: 16 }}>
                {rankIdx === 0 ? "🥇" : rankIdx === 1 ? "🥈" : rankIdx === 2 ? "🥉" : "🏅"}
              </span>
            )}
            
            {/* Skip indicator */}
            {skipNextTurn.includes(p.id) && (
              <span style={{ fontSize: 12, color: "#FF3B30", fontWeight: "bold" }}>SKIP</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
