import { useState } from "react";
import { api, PLAY_RESULTS, type PlayResult } from "../api";
import { useAsync } from "../useAsync";

const label = (s: string) => s.replace(/_/g, " ");

export default function Scorer({ gameId, onBack }: { gameId: number; onBack: () => void }) {
  const { data: game, error, reload: reloadGame } = useAsync(() => api.game(gameId), [gameId]);
  const { data: plays, reload: reloadPlays } = useAsync(() => api.plays(gameId), [gameId]);
  const { data: teams } = useAsync(api.teams, []);
  const { data: homeRoster } = useAsync(
    () => (game ? api.players(game.home_team_id) : Promise.resolve([])),
    [game?.home_team_id],
  );
  const { data: awayRoster } = useAsync(
    () => (game ? api.players(game.away_team_id) : Promise.resolve([])),
    [game?.away_team_id],
  );

  const [batter, setBatter] = useState("");
  const [pitcher, setPitcher] = useState("");
  const [runs, setRuns] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!game) return <p>{error ?? "Loading..."}</p>;

  const teamName = (id: number) => teams?.find((t) => t.id === id)?.name ?? `Team ${id}`;
  const battingRoster = (game.is_top ? awayRoster : homeRoster) ?? [];
  const fieldingRoster = (game.is_top ? homeRoster : awayRoster) ?? [];
  const nameOf = (id: number | null) => {
    const p = [...(homeRoster ?? []), ...(awayRoster ?? [])].find((x) => x.id === id);
    return p ? `${p.first_name} ${p.last_name}` : "-";
  };
  const final = game.status === "final";

  const refresh = () => { reloadGame(); reloadPlays(); };

  const record = async (result: PlayResult) => {
    if (!batter) { setActionError("Select a batter"); return; }
    try {
      await api.recordPlay(gameId, {
        batter_id: Number(batter),
        pitcher_id: pitcher ? Number(pitcher) : null,
        result,
        runs_scored: runs,
      });
      setRuns(0); setActionError(null); refresh();
    } catch (err) {
      setActionError((err as Error).message);
    }
  };

  const finish = async () => {
    try { await api.finalize(gameId); refresh(); }
    catch (err) { setActionError((err as Error).message); }
  };

  return (
    <section>
      <button className="link" onClick={onBack}>&larr; Games</button>
      <h2>
        {teamName(game.away_team_id)} {game.away_score} - {game.home_score} {teamName(game.home_team_id)}
      </h2>
      <p>
        {final ? "Final" : `${game.is_top ? "Top" : "Bottom"} ${game.inning}, ${game.outs} out`}
      </p>

      {!final && (
        <>
          <div className="row">
            <select value={batter} onChange={(e) => setBatter(e.target.value)}>
              <option value="">Batter</option>
              {battingRoster.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
            <select value={pitcher} onChange={(e) => setPitcher(e.target.value)}>
              <option value="">Pitcher (optional)</option>
              {fieldingRoster.map((p) => (
                <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
              ))}
            </select>
            <label>
              Runs scored
              <input type="number" min={0} max={4} value={runs}
                     onChange={(e) => setRuns(Number(e.target.value))} />
            </label>
          </div>
          <div className="buttons">
            {PLAY_RESULTS.map((r) => (
              <button key={r} onClick={() => record(r)}>{label(r)}</button>
            ))}
          </div>
          <button onClick={finish}>End game</button>
        </>
      )}
      {actionError && <p className="error">{actionError}</p>}

      <h3>Plays</h3>
      <ol reversed>
        {[...(plays ?? [])].reverse().map((p) => (
          <li key={p.id}>
            {p.is_top ? "T" : "B"}{p.inning} {nameOf(p.batter_id)}: {label(p.result)}
            {p.runs_scored > 0 && ` (${p.runs_scored} run${p.runs_scored > 1 ? "s" : ""})`}
          </li>
        ))}
      </ol>
    </section>
  );
}
