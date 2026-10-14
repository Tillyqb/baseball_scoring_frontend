const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export type PlayResult =
  | "single" | "double" | "triple" | "home_run" | "walk" | "hit_by_pitch"
  | "strikeout" | "ground_out" | "fly_out" | "line_out" | "sac_fly"
  | "sac_bunt" | "fielders_choice" | "double_play" | "error";

export const PLAY_RESULTS: PlayResult[] = [
  "single", "double", "triple", "home_run", "walk", "hit_by_pitch",
  "strikeout", "ground_out", "fly_out", "line_out", "sac_fly",
  "sac_bunt", "fielders_choice", "double_play", "error",
];

export interface Team { id: number; name: string }
export interface Player {
  id: number; team_id: number; first_name: string; last_name: string;
  jersey_number: number | null;
}
export interface Game {
  id: number; home_team_id: number; away_team_id: number; game_date: string;
  status: "scheduled" | "in_progress" | "final";
  inning: number; is_top: boolean; outs: number; home_score: number; away_score: number;
}
export interface Play {
  id: number; game_id: number; inning: number; is_top: boolean; batter_id: number;
  pitcher_id: number | null; result: PlayResult; outs_recorded: number;
  runs_scored: number; rbi: number;
}
export interface BattingStats {
  player_id: number; games: number; plate_appearances: number; at_bats: number;
  hits: number; doubles: number; triples: number; home_runs: number; walks: number;
  hit_by_pitch: number; strikeouts: number; sac_flies: number; rbi: number;
  avg: number; obp: number; slg: number; ops: number;
}
export interface PitchingStats {
  player_id: number; games: number; batters_faced: number; outs: number;
  innings_pitched: string; hits: number; runs: number; home_runs: number;
  walks: number; hit_by_pitch: number; strikeouts: number;
  whip: number; k_per_9: number; bb_per_9: number;
}

export interface PlayInput {
  batter_id: number;
  pitcher_id?: number | null;
  result: PlayResult;
  runs_scored: number;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body?.detail;
    throw new Error(typeof detail === "string" ? detail : `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const post = <T,>(path: string, body?: unknown) =>
  request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

export const api = {
  teams: () => request<Team[]>("/teams"),
  createTeam: (name: string) => post<Team>("/teams", { name }),
  players: (teamId: number) => request<Player[]>(`/teams/${teamId}/players`),
  createPlayer: (p: Omit<Player, "id">) => post<Player>("/players", p),
  games: () => request<Game[]>("/games"),
  game: (id: number) => request<Game>(`/games/${id}`),
  createGame: (home_team_id: number, away_team_id: number) =>
    post<Game>("/games", { home_team_id, away_team_id }),
  plays: (gameId: number) => request<Play[]>(`/games/${gameId}/plays`),
  recordPlay: (gameId: number, p: PlayInput) => post<Play>(`/games/${gameId}/plays`, p),
  finalize: (gameId: number) => post<Game>(`/games/${gameId}/final`),
  batting: (playerId: number) => request<BattingStats>(`/players/${playerId}/stats/batting`),
  pitching: (playerId: number) => request<PitchingStats>(`/players/${playerId}/stats/pitching`),
};
