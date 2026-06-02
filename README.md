# Pairs — Mini Arcade 🎮

A pocket-sized arcade — solo brain games **plus online versus play with friends** — built with **React + Vite + Convex**, mobile-first, and installable as a **PWA** (works offline).

> The original single-file prototype is preserved as `game.html` for reference.

## 🎲 Games

**Solo:** Memory Match · Word Search · 2048 · Minesweeper
**Versus (online room codes + same-screen):** Tic-Tac-Toe · Connect 4 · Chess (full rules) · Checkers · Hangman
**Versus (online only — hidden info):** Battleship

## ✨ Features

- **Landing page** with an animated hero, split into Versus + Solo sections.
- **A page per game** — deep-linkable; bottom dock for Home / Leaderboard / Groups.
- **Online multiplayer** — create a room, share the 4-letter code, play live. Or "same screen" pass-and-play with no backend.
- **Live leaderboard** and **friend groups** (create/join by code) powered by Convex.
- **Per-game neon identity**, light/dark theme, synthesised sound, win confetti, reduced-motion support.
- **Mobile-first & touch-native** — swipe (2048), drag-select (Word Search), long-press flag (Minesweeper).
- **PWA** — manifest, service worker, offline caching, "Install app" prompt.

## 🚀 Run it

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # production build into dist/
npm run preview  # preview the production build locally
```

The app runs fully **without any backend** — solo games and same-screen versus work out of the box.

## 🌐 Turn on online multiplayer (Convex)

Online rooms, the leaderboard, and groups use a free [Convex](https://convex.dev) backend:

```bash
npx convex dev    # sign in, creates a project, deploys convex/ functions
                  # and writes VITE_CONVEX_URL into .env.local
```

Leave that running, restart `npm run dev`, and online play lights up automatically. Until you do, those screens show a friendly "set up Convex" notice.

## 🧱 Tech stack

- **React 18** + **React Router** (HashRouter — refresh-safe on any static host)
- **Convex** for real-time rooms, leaderboard, and groups
- **Vite** for dev/build · **vite-plugin-pwa** (Workbox) for offline + manifest
- Plain CSS with design tokens (no UI framework)

## 🕹️ How online play works

Each turn-based game is defined by a pure **engine** in `convex/engines/` (rules + win detection). The same engine runs **client-side** for same-screen play and **server-side** (in a Convex mutation) to validate every online move, so the board can't be cheated. Room state lives in Convex and the client re-renders reactively as the opponent moves — no polling.

Games with **hidden information** (Hangman's word, Battleship's ships) implement an optional `view(state, seat)` on their engine. The Convex `getView` query runs it server-side so secret data is **redacted before it ever reaches the opponent's device** — true fog-of-war, not just hidden in the UI.

Adding a game = write an engine (+ optional `view`), a board component, register it, add a route. Engine correctness is covered by quick Node checks (chess checkmate/castling, mandatory captures, etc.).

## 📂 Structure

```
convex/                  # backend (deployed by `npx convex dev`)
├─ schema.js             # rooms, scores, groups tables
├─ rooms.js              # create/join/move/rematch room-code multiplayer
├─ leaderboard.js        # submit + top + recent
├─ groups.js             # create/join/get friend groups
└─ engines/              # pure, shared game rules (client + server)
   ├─ ticTacToe.js · connect4.js · hangman.js
   ├─ checkers.js · chess.js · battleship.js
   └─ index.js           # engine registry — add new versus games here

src/
├─ main.jsx              # app mount + providers (incl. Convex) + router
├─ App.jsx               # routes
├─ styles/global.css     # design tokens + all component styles
├─ context/              # Settings (theme/sound) + Toast providers
├─ lib/                  # storage, sound, timer, install-prompt, helpers
├─ multiplayer/          # Convex client + anonymous identity
├─ components/           # Layout, GameShell, Confetti
├─ pages/                # Home, Leaderboard, Groups
└─ games/
   ├─ registry.js        # game metadata (drives landing + nav)
   ├─ Memory / WordSearch / Game2048 / Minesweeper   # solo
   ├─ TurnGame.jsx       # generic mode-chooser + local + online controller
   ├─ OnlineGame.jsx     # Convex-synced room UI
   ├─ TicTacToe.jsx / Connect4.jsx                    # versus
   └─ boards/            # presentational board components
```

## ⌨️ Shortcuts

`N` new game · `H` hint (Memory) · `P` pause (Memory) · `U` undo (2048) · `↑↓←→` move (2048) · `T` theme · `S` sound

## 🌐 Deploy (Vercel)

`base` is `./` and routing uses `HashRouter`, so the built `dist/` works on a custom domain or any static host with no rewrites.

1. Import the repo in Vercel (framework preset: **Vite**, build `npm run build`, output `dist`).
2. Add an environment variable so online play works:
   - `VITE_CONVEX_URL` = `https://vibrant-tiger-655.eu-west-1.convex.cloud`
3. Deploy, then point your custom domain at the project.

The Convex **production** backend is already deployed (`npx convex deploy`). The `VITE_CONVEX_URL` above is the public client URL and is safe to expose — the **deploy key is secret** and must only live in your local shell / Convex dashboard, never in the repo or client.

> **Icons:** the PWA ships crisp SVG icons (`public/icon.svg`, `icon-maskable.svg`). For maximum install fidelity on older Android, add PNG `192/512` versions to the manifest in `vite.config.js`.

## 🤖 Built with

Claude (Anthropic) via Claude Code — rebuilt from the original four-tab `game.html` prototype.
