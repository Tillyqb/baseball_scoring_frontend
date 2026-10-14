# Baseball Scoring

A browser-based scorekeeping interface for managing teams and rosters, creating games, recording plays, and viewing game scores.

## Requirements

- Node.js and npm
- The Baseball Scoring API running locally or at a reachable URL. By default, the frontend sends requests to `http://localhost:8000`.

## Run the frontend

From this directory, install dependencies and start the Vite development server:

```sh
npm install
npm run dev
```

Open the local URL printed by Vite in your browser. The API must be running separately for team, roster, and game data to load or save.

To use an API at a different origin, create a `.env.local` file in this directory and set:

```sh
VITE_API_URL=http://localhost:8000
```

Replace the example URL with the API's base URL. Restart the Vite server after changing environment variables.

## Use the scorekeeper

1. Open **Teams** and add both teams.
2. Select each team to open its roster, then add players. Jersey numbers are optional.
3. Open **Games**, choose the away and home teams, and select **New game**. The game opens in the scorer.
4. For each play, choose the batter from the batting team's roster. Choosing the pitcher is optional. Set **Runs scored**, then select the play result.
5. The game view displays the current inning, outs, score, and recorded plays. Select **End game** to mark the game final.
6. Return to **Games** to reopen a game and review its score and status.

Play results include hits, walks, hit by pitch, strikeouts, outs, sacrifice plays, fielder's choice, double plays, and errors. Finalized games no longer show scoring controls.

## Project commands

```sh
npm run dev      # Start the development server
npm run build    # Type-check and create a production build in dist/
npm test         # Run the unit and component tests once
npm run preview  # Serve the production build locally
npm run lint     # Run ESLint
```
