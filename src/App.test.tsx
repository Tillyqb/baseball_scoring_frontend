import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import Games from "./pages/Games";
import Scorer from "./pages/Scorer";
import Teams from "./pages/Teams";

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    teams: vi.fn(),
    createTeam: vi.fn(),
    players: vi.fn(),
    createPlayer: vi.fn(),
    games: vi.fn(),
    game: vi.fn(),
    createGame: vi.fn(),
    plays: vi.fn(),
    recordPlay: vi.fn(),
    finalize: vi.fn(),
    batting: vi.fn(),
    pitching: vi.fn(),
  },
}));

vi.mock("./api", () => ({
  api: apiMock,
  PLAY_RESULTS: [
    "single", "double", "triple", "home_run", "walk", "hit_by_pitch",
    "strikeout", "ground_out", "fly_out", "line_out", "sac_fly",
    "sac_bunt", "fielders_choice", "double_play", "error",
  ],
}));

const teams = [
  { id: 1, name: "Home" },
  { id: 2, name: "Away" },
];

const game = {
  id: 12,
  home_team_id: 1,
  away_team_id: 2,
  game_date: "2026-10-14",
  status: "in_progress" as const,
  inning: 1,
  is_top: true,
  outs: 0,
  home_score: 0,
  away_score: 0,
};

beforeEach(() => {
  vi.clearAllMocks();
  apiMock.teams.mockResolvedValue([]);
  apiMock.createTeam.mockResolvedValue({ id: 1, name: "Home" });
  apiMock.players.mockResolvedValue([]);
  apiMock.createPlayer.mockResolvedValue({
    id: 9,
    team_id: 1,
    first_name: "Casey",
    last_name: "Batter",
    jersey_number: 7,
  });
  apiMock.games.mockResolvedValue([]);
  apiMock.game.mockResolvedValue(game);
  apiMock.createGame.mockResolvedValue(game);
  apiMock.plays.mockResolvedValue([]);
  apiMock.recordPlay.mockResolvedValue({});
  apiMock.finalize.mockResolvedValue({ ...game, status: "final" });
});

afterEach(() => cleanup());

describe("baseball scoring workflows", () => {
  it("navigates between games and teams", async () => {
    render(<App />);

    expect(await screen.findByRole("heading", { name: "Games" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Teams" }));

    expect(await screen.findByRole("heading", { name: "Teams" })).toBeInTheDocument();
  });

  it("creates a team and adds a player to its roster", async () => {
    const user = userEvent.setup();
    const teamList: typeof teams = [];
    const roster: Array<{
      id: number;
      team_id: number;
      first_name: string;
      last_name: string;
      jersey_number: number | null;
    }> = [];
    apiMock.teams.mockImplementation(async () => [...teamList]);
    apiMock.createTeam.mockImplementation(async (name: string) => {
      const createdTeam = { id: 1, name };
      teamList.push(createdTeam);
      return createdTeam;
    });
    apiMock.players.mockImplementation(async () => [...roster]);
    apiMock.createPlayer.mockImplementation(async (player) => {
      const createdPlayer = { id: 9, ...player };
      roster.push(createdPlayer);
      return createdPlayer;
    });
    render(<Teams />);

    await user.type(screen.getByPlaceholderText("Team name"), "Home");
    await user.click(screen.getByRole("button", { name: "Add team" }));
    await user.type(await screen.findByPlaceholderText("First"), "Casey");
    await user.type(screen.getByPlaceholderText("Last"), "Batter");
    await user.type(screen.getByPlaceholderText("#"), "7");
    await user.click(screen.getByRole("button", { name: "Add player" }));

    expect(await screen.findByText("#7 Casey Batter")).toBeInTheDocument();
    expect(apiMock.createPlayer).toHaveBeenCalledWith({
      team_id: 1,
      first_name: "Casey",
      last_name: "Batter",
      jersey_number: 7,
    });
  });

  it("creates a game with the selected home and away teams", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    apiMock.teams.mockResolvedValue(teams);
    apiMock.createGame.mockResolvedValue({ ...game, id: 42 });
    render(<Games onOpen={onOpen} />);

    const [awaySelect, homeSelect] = await screen.findAllByRole("combobox");
    await user.selectOptions(awaySelect, "2");
    await user.selectOptions(homeSelect, "1");
    await user.click(screen.getByRole("button", { name: "New game" }));

    await waitFor(() => expect(apiMock.createGame).toHaveBeenCalledWith(1, 2));
    expect(onOpen).toHaveBeenCalledWith(42);
  });

  it("records a play with the selected batter, pitcher, and run count", async () => {
    const user = userEvent.setup();
    apiMock.teams.mockResolvedValue(teams);
    apiMock.players.mockImplementation(async (teamId: number) =>
      teamId === 2
        ? [{ id: 20, team_id: 2, first_name: "Casey", last_name: "Batter", jersey_number: 7 }]
        : [{ id: 10, team_id: 1, first_name: "Riley", last_name: "Pitcher", jersey_number: 4 }],
    );
    render(<Scorer gameId={12} onBack={vi.fn()} />);

    await screen.findByRole("heading", { name: /Away 0 - 0 Home/ });
    const [batterSelect, pitcherSelect] = await screen.findAllByRole("combobox");
    await user.selectOptions(batterSelect, "20");
    await user.selectOptions(pitcherSelect, "10");
    await user.type(screen.getByLabelText("Runs scored"), "2");
    await user.click(screen.getByRole("button", { name: "single" }));

    await waitFor(() =>
      expect(apiMock.recordPlay).toHaveBeenCalledWith(12, {
        batter_id: 20,
        pitcher_id: 10,
        result: "single",
        runs_scored: 2,
      }),
    );
  });

  it("finalizes a game and hides the scoring controls", async () => {
    const user = userEvent.setup();
    let status: "in_progress" | "final" = "in_progress";
    apiMock.game.mockImplementation(async () => ({ ...game, status }));
    apiMock.finalize.mockImplementation(async () => {
      status = "final";
      return { ...game, status };
    });
    render(<Scorer gameId={12} onBack={vi.fn()} />);

    await user.click(await screen.findByRole("button", { name: "End game" }));

    expect(await screen.findByText("Final")).toBeInTheDocument();
    expect(apiMock.finalize).toHaveBeenCalledWith(12);
    expect(screen.queryByRole("button", { name: "single" })).not.toBeInTheDocument();
  });
});