import React from "react";
import { usePlayer } from "../shell/context/PlayerContext";
import { NameEntry } from "../shell/components/NameEntry";
import { Lobby } from "../shell/components/Lobby";

export const Home: React.FC = () => {
  const { playerName } = usePlayer();

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      {!playerName ? <NameEntry /> : <Lobby />}
    </div>
  );
};
