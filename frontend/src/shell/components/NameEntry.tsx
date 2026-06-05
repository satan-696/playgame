import React, { useState } from "react";
import { usePlayer } from "../context/PlayerContext";

export const NameEntry: React.FC = () => {
  const { setPlayerName } = usePlayer();
  const [val, setVal] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (val.trim()) {
      setPlayerName(val.trim());
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-center text-zinc-100">Welcome to PlayGames</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-2">Enter your name</label>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
            placeholder="Your name..."
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-zinc-100 text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
        >
          Continue
        </button>
      </form>
    </div>
  );
};
