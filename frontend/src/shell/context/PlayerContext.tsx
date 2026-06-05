import React, { createContext, useContext, useState } from "react";

export interface PlayerContextType {
  playerId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [playerId] = useState(() => {
    const stored = localStorage.getItem("playgames_player_id");
    if (stored) return stored;
    const generated = generateUUID();
    localStorage.setItem("playgames_player_id", generated);
    return generated;
  });

  const [playerName, setPlayerNameState] = useState(() => {
    return localStorage.getItem("playgames_player_name") || "";
  });

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    localStorage.setItem("playgames_player_name", name);
  };

  return (
    <PlayerContext.Provider value={{ playerId, playerName, setPlayerName }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error("usePlayer must be used within a PlayerProvider");
  }
  return context;
};
