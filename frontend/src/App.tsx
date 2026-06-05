import React from "react";
import { BrowserRouter as Router, Routes, Route, useParams } from "react-router-dom";
import { PlayerProvider } from "./shell/context/PlayerContext";
import { RoomProvider } from "./shell/context/RoomContext";
import { AppLayout } from "./shell/components/AppLayout";

const RoomRoute: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  return <AppLayout roomCode={code} />;
};

const App: React.FC = () => {
  return (
    <PlayerProvider>
      <RoomProvider>
        <Router>
          <Routes>
            <Route path="/" element={<AppLayout />} />
            <Route path="/room/:code" element={<RoomRoute />} />
          </Routes>
        </Router>
      </RoomProvider>
    </PlayerProvider>
  );
};

export default App;
