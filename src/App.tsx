import { useState } from "react";
import Games from "./pages/Games";
import Scorer from "./pages/Scorer";
import Teams from "./pages/Teams";
import "./App.css";

type Tab = "games" | "teams";

export default function App() {
  const [tab, setTab] = useState<Tab>("games");
  const [gameId, setGameId] = useState<number | null>(null);

  return (
    <main>
      <h1>Baseball Scoring</h1>
      <nav>
        <button onClick={() => { setTab("games"); setGameId(null); }} disabled={tab === "games"}>Games</button>
        <button onClick={() => setTab("teams")} disabled={tab === "teams"}>Teams</button>
      </nav>
      {tab === "teams" ? (
        <Teams />
      ) : gameId === null ? (
        <Games onOpen={setGameId} />
      ) : (
        <Scorer gameId={gameId} onBack={() => setGameId(null)} />
      )}
    </main>
  );
}
