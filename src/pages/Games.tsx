import { useState } from "react";
import { api } from "../api";
import { useAsync } from "../useAsync";

export default function Games({ onOpen }: { onOpen: (id: number) => void }) {
  const { data: games, error, reload } = useAsync(api.games, []);
  const { data: teams } = useAsync(api.teams, []);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const name = (id: number) => teams?.find((t) => t.id === id)?.name ?? `Team ${id}`;

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const g = await api.createGame(Number(home), Number(away));
      setFormError(null);
      reload();
      onOpen(g.id);
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <section>
      <h2>Games</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={create} className="row">
        <select value={away} onChange={(e) => setAway(e.target.value)} required>
          <option value="">Away team</option>
          {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <span>at</span>
        <select value={home} onChange={(e) => setHome(e.target.value)} required>
          <option value="">Home team</option>
          {teams?.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button>New game</button>
      </form>
      {formError && <p className="error">{formError}</p>}
      <ul>
        {games?.map((g) => (
          <li key={g.id}>
            <button className="link" onClick={() => onOpen(g.id)}>
              {g.game_date}: {name(g.away_team_id)} {g.away_score} - {g.home_score} {name(g.home_team_id)}
            </button>{" "}
            <em>{g.status.replace("_", " ")}</em>
          </li>
        ))}
      </ul>
    </section>
  );
}
