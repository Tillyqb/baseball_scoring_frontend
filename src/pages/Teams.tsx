import { useState } from "react";
import { api } from "../api";
import { useAsync } from "../useAsync";

function Roster({ teamId }: { teamId: number }) {
  const { data: players, error, reload } = useAsync(() => api.players(teamId), [teamId]);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [num, setNum] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createPlayer({
        team_id: teamId,
        first_name: first,
        last_name: last,
        jersey_number: num === "" ? null : Number(num),
      });
      setFirst(""); setLast(""); setNum(""); setFormError(null);
      reload();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <div>
      {error && <p className="error">{error}</p>}
      <ul>
        {players?.map((p) => (
          <li key={p.id}>
            {p.jersey_number != null && `#${p.jersey_number} `}
            {p.first_name} {p.last_name}
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="row">
        <input placeholder="First" value={first} onChange={(e) => setFirst(e.target.value)} required />
        <input placeholder="Last" value={last} onChange={(e) => setLast(e.target.value)} required />
        <input placeholder="#" type="number" min={0} value={num} onChange={(e) => setNum(e.target.value)} />
        <button>Add player</button>
      </form>
      {formError && <p className="error">{formError}</p>}
    </div>
  );
}

export default function Teams() {
  const { data: teams, error, reload } = useAsync(api.teams, []);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const team = await api.createTeam(name);
      setName(""); setFormError(null); setSelected(team.id);
      reload();
    } catch (err) {
      setFormError((err as Error).message);
    }
  };

  return (
    <section>
      <h2>Teams</h2>
      {error && <p className="error">{error}</p>}
      <form onSubmit={add} className="row">
        <input placeholder="Team name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button>Add team</button>
      </form>
      {formError && <p className="error">{formError}</p>}
      <ul>
        {teams?.map((t) => (
          <li key={t.id}>
            <button className="link" onClick={() => setSelected(selected === t.id ? null : t.id)}>
              {t.name}
            </button>
            {selected === t.id && <Roster teamId={t.id} />}
          </li>
        ))}
      </ul>
    </section>
  );
}
