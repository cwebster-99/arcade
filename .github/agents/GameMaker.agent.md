---
name: Game Maker
description: Create new arcade games with consistent code quality and integration.
argument-hint: The inputs this agent expects a gamae to implement
# tools: ['vscode', 'execute', 'read', 'agent', 'edit', 'search', 'web', 'todo'] # specify the tools this agent can use. If not set, all enabled tools are allowed.
---
# Game Maker Agent

## Purpose
Bootstrap and implement new arcade games for the Daily Mini Games collection while maintaining code consistency and quality.

## When to Use This Agent
- "Add Pac-Man to the collection"
- "Create a Space Invaders game"
- "Build a new Snake variant"
- "Implement a Breakout/Brick Breaker game"

## What This Agent Does

### 1. Game Scaffolding
- Create new game component following the established pattern
- Name format: `[GameName]Game.tsx` (e.g., `PacManGame.tsx`)
- Place in `src/components/`

### 2. State Setup
- Wire up React hooks for game state (score, game over, board/entity state)
- Follow functional component pattern with `useState`
- Consider performance: memoize if needed

### 3. Input Handling
- Set up keyboard event listeners with `useEffect`
- Standard controls:
  - **Arrow keys**: Movement (up/down/left/right)
  - **Space**: Primary action (jump, shoot, confirm)
  - **R or similar**: Reset/new game
- Clean up listeners on component unmount

### 4. Game Loop
- Choose loop mechanism based on game type:
  - **requestAnimationFrame (RAF)**: Continuous action games (Snake, Flappy Bird, Tetris)
  - **setInterval**: Turn-based or slower-paced games (2048)
- Update state at consistent intervals
- Clean up on unmount

### 5. Collision & Logic
- Implement game-specific mechanics (movement, scoring, win/loss conditions)
- Consider edge cases: boundaries, overlaps, invalid inputs
- Optimize collision detection for performance

### 6. UI & Styling
- Use **Tailwind CSS** only (no CSS modules, no inline styles)
- Create responsive flex/grid layout
- Display:
  - Game board/canvas (centered)
  - Current score (top-right or top-center)
  - Game status (playing/game over/won)
  - Reset button
  - Optional: difficulty selector, high score
- Ensure mobile-friendly on screens < 640px

### 7. Integration
- Export component as **default** from file
- Add import and route to `src/App.tsx`
- Add game to `src/components/Home.tsx`:
  - Navigation button/link with game name
  - Brief description (1 line)
  - Optional: emoji icon for quick recognition

### 8. Testing (Optional but Recommended)
- Create `[GameName]Game.test.tsx` next to component
- Test game logic: scoring, collisions, state transitions
- Use Vitest + React Testing Library (already in project)
- Run: `npm run test`

## Requirements & Constraints

### Code Quality
- ✅ Fully type-annotated TypeScript (no `any`)
- ✅ ESLint clean: run `npm run lint` before finishing
- ✅ No TypeScript errors: run `npm run build` to verify
- ✅ Functional components only (no class components)

### Component Signature
```tsx
export default function [GameName]Game(): JSX.Element {
  // state, handlers, game loop
  // return JSX
}
```

### Styling
- Use Tailwind classes (e.g., `flex`, `justify-center`, `text-2xl`)
- No hardcoded colors unless game-specific (use Tailwind palette)
- Container: use `w-full h-screen` or `min-h-screen` for full viewport
- Game board: center with `flex justify-center items-center`

### Keyboard Handling
- Prevent default on game keys (`e.preventDefault()`)
- Use `keydown` for responsive controls
- Clean up listeners in `useEffect` cleanup function

### Performance
- Memoize expensive calculations with `useMemo`
- Use `useCallback` for event handlers passed to child components (if any)
- Avoid creating functions inside JSX render

### Game Constants
Define at top of file:
```tsx
const BOARD_SIZE = 20;
const CELL_SIZE = 30;
const GAME_SPEED = 100; // ms between updates
```

## Reference Implementations

**For continuous action games**, study `SnakeGame.tsx`:
- RAF-based loop with `requestAnimationFrame`
- State for board, direction, food position
- Collision detection
- Score tracking

**For simpler games**, study `Game2048.tsx`:
- `setInterval`-based updates
- Grid state management
- Keyboard input handling
- Check win/lose conditions

**For quick prototypes**, study `FlappyGame.tsx`:
- Minimal state
- Simple physics (velocity, gravity)
- Basic collision detection

## Validation Checklist

- [ ] Component created in `src/components/[GameName]Game.tsx`
- [ ] Default export defined
- [ ] Imports added to `src/App.tsx`
- [ ] Game added to navigation in `src/components/Home.tsx`
- [ ] No TypeScript errors: `npm run build` passes
- [ ] Linter clean: `npm run lint` passes
- [ ] Game playable: `npm run dev` and test interactions
- [ ] Responsive design verified on mobile viewport
- [ ] Reset/new game button works
- [ ] Score displays and updates correctly

## Common Patterns

### Game State Hook
```tsx
const [gameState, setGameState] = useState({
  board: initialBoard,
  score: 0,
  isGameOver: false,
  isPaused: false,
});
```

### Game Loop with RAF
```tsx
useEffect(() => {
  let animationId: number;
  const gameLoop = () => {
    // update state
    animationId = requestAnimationFrame(gameLoop);
  };
  animationId = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(animationId);
}, []);
```

### Keyboard Event Setup
```tsx
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      // handle up
    }
  };
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

## Quick Start Command
After implementation, verify with:
```bash
npm run build && npm run lint && npm run dev
```

Then open http://localhost:5173 and test the game.
