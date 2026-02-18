# Project Guidelines

## Overview

Daily Mini Games — a collection of classic arcade games (Snake, 2048, Tetris, Flappy Bird) built as a single-page React + TypeScript app with Vite and Tailwind CSS.

## Code Style

- **TypeScript strict mode** — `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` are all enabled. No `any` types.
- **Functional components only** — no class components. Use `useState`, `useRef`, `useEffect`, `useCallback`, `useMemo`.
- **Tailwind CSS** for styling — no CSS modules. Inline styles are acceptable for dynamic values (transforms, box-shadows, game-specific rendering).
- **Default exports** for game components: `export default function GameNameGame(): JSX.Element`.

## Architecture

```
src/
├── App.tsx              # SPA router (state-based, no React Router) + theme toggle
├── main.tsx             # Entry point, StrictMode wrapper
├── index.css            # Tailwind directives + custom animations
├── components/
│   ├── Home.tsx         # Landing page with arcade cabinet navigation
│   ├── SnakeGame.tsx    # Grid-based game (setInterval loop)
│   ├── Game2048.tsx     # Tile puzzle (event-driven updates)
│   ├── TetrisGame.tsx   # Piece-based game (setInterval loop)
│   └── FlappyGame.tsx   # Physics-based game (requestAnimationFrame loop)
├── services/            # Empty — reserved for future backend integration
└── utils/               # Empty — reserved for shared helpers
```

- **Routing**: `App.tsx` uses a `view` state string to render the active page. No React Router.
- **Theme**: Light/dark toggle persisted in `localStorage`. Managed in `App.tsx`, passed via props.
- **State management**: Local component state (`useState`/`useRef`). Zustand is installed but unused.
- **Layout**: `GameLayout` wrapper in `App.tsx` provides consistent back button, title, and theme toggle for all games.

## Build and Test

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (HMR)
npm run build        # tsc + vite build (type-check + bundle)
npm run lint         # ESLint — zero warnings allowed
npm run test         # Vitest (watch mode)
npm run test:run     # Vitest (single run)
```

Always verify changes with `npm run build` (catches TypeScript errors) and `npm run lint`.

## Conventions

### Adding a New Game

1. Create `src/components/[Name]Game.tsx` with a default-exported functional component
2. Add an import and route case in `src/App.tsx`
3. Add a navigation card in `src/components/Home.tsx`
4. See the [Game Maker agent](.github/agents/GameMaker.agent.md) for the full checklist and patterns

### Game Component Patterns

- **Constants** at the top of the file (board size, speed, physics values)
- **Game loop**: `setInterval` for grid/turn-based games, `requestAnimationFrame` for continuous physics
- **Stale closure avoidance**: Sync state to refs (`useRef`) for values read inside intervals/RAF callbacks
- **Input handling**: `useEffect` with `keydown` listener, `preventDefault` on game keys (arrows, space), cleanup on unmount
- **Reset function**: Must reset *all* state (board, score, game-over flag, direction, speed)
- **Accessibility**: `role="application"`, `aria-label`, `tabIndex={0}` on game containers

### Naming

- Game components: `[Name]Game.tsx` (PascalCase name + `Game` suffix)
- Game constants: `UPPER_SNAKE_CASE`
- Types/interfaces: `PascalCase` (e.g., `Tile`, `Piece`, `Board`)

### Testing

- Framework: Vitest + React Testing Library + jest-dom matchers
- Test setup: `src/setupTests.ts` (includes `matchMedia` mock)
- Vitest config in `vite.config.ts` — `jsdom` environment, globals enabled
- Place tests next to components: `[Name]Game.test.tsx`

## Existing Customizations

- **Agent**: `.github/agents/GameMaker.agent.md` — scaffolds new games with consistent patterns
- **Skill**: `.github/skills/debug/SKILL.md` — structured approach for diagnosing game bugs
- **Hook**: `.github/hooks/post-tool-use.json` — runs lint after tool use
