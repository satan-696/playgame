import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayer } from "../context/PlayerContext";
import { API_URL } from "../constants";

export const Lobby: React.FC = () => {
  const { playerId, playerName } = usePlayer();
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState("");
  const [showJoinInput, setShowJoinInput] = useState(false);

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API_URL}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, player_name: playerName }),
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/room/${data.code}`);
      }
    } catch {
      // TODO: Handle network/API error
    }
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim()) {
      navigate(`/room/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl space-y-6">
      <div className="text-center">
        <p className="text-zinc-400">Playing as</p>
        <h2 className="text-2xl font-bold text-zinc-100">{playerName}</h2>
      </div>

      {!showJoinInput ? (
        <div className="space-y-4">
          <button
            onClick={handleCreate}
            className="w-full py-3 bg-zinc-100 text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
          >
            Create Room
          </button>
          <button
            onClick={() => setShowJoinInput(true)}
            className="w-full py-3 bg-zinc-900 text-zinc-100 border border-zinc-800 font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
          >
            Join Room
          </button>
        </div>
      ) : (
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-2">Enter Room Code</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-100 uppercase tracking-widest text-center text-xl focus:outline-none focus:border-zinc-600"
              placeholder="XKPQ72"
              maxLength={6}
              required
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => setShowJoinInput(false)}
              className="w-1/2 py-3 bg-zinc-900 text-zinc-100 border border-zinc-800 font-semibold rounded-lg hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              className="w-1/2 py-3 bg-zinc-100 text-zinc-950 font-semibold rounded-lg hover:bg-zinc-200 transition-colors"
            >
              Join
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
