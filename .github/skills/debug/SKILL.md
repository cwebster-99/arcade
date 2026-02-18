---
name: debug
description: Diagnose and fix common bugs in arcade game components. This skill helps trace issues through game loops, state management, collision detection, input handling, and rendering logic.
---

## When to Use
- A game has broken collision detection (walls, enemies, boundaries)
- Pieces/entities overlap or phase through each other
- Input feels laggy or unresponsive
- Game state doesn't reset properly on restart
- Score doesn't update correctly
- Animation stutters or freezes
- Game loop runs too fast or too slow

## Approach

### Step 1: Identify the Bug Category
Classify the issue into one of these categories:

| Category | Symptoms | Where to Look |
|----------|----------|---------------|
| **Collision** | Entities pass through walls/each other | Boundary checks, overlap comparisons |
| **Input** | Keys don't respond, wrong direction, lag | `useEffect` keyboard listeners, `preventDefault` |
| **State** | Score wrong, reset broken, stale values | `useState`, `useRef`, closure captures |
| **Rendering** | Flicker, wrong position, missing elements | JSX, conditional rendering, key props |
| **Timing** | Too fast/slow, inconsistent speed | `setInterval`/`requestAnimationFrame`, speed constants |

### Step 2: Read the Game Component
Read the full game file in `src/components/[GameName]Game.tsx`. Understand:
- **State variables**: What `useState`/`useRef` hooks exist
- **Game loop**: Is it `requestAnimationFrame` or `setInterval`? What does each tick do?
- **Input handling**: Which `useEffect` sets up keyboard listeners? Does it clean up?
- **Update logic**: How do positions, scores, and game-over conditions change?

### Step 3: Trace the Bug

#### Collision Bugs
Check these common patterns:
```tsx
// ❌ Off-by-one: should be >= size, not > size
if (head[0] > size || head[1] > size) { /* wall hit */ }

// ✅ Correct boundary check
if (head[0] < 0 || head[0] >= size || head[1] < 0 || head[1] >= size) { /* wall hit */ }
```

```tsx
// ❌ Comparing arrays by reference (always false)
if (head === food) { /* eat */ }

// ✅ Compare values
if (head[0] === food[0] && head[1] === food[1]) { /* eat */ }
```

#### Input Bugs
Check these common patterns:
```tsx
// ❌ Stale closure: direction never updates inside handler
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowUp') setDirection([0, -1]); // uses stale direction
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, []); // empty deps = stale closure

// ✅ Use ref for mutable current value, or include deps
const dirRef = useRef(direction);
dirRef.current = direction;
```

```tsx
// ❌ Missing preventDefault causes page scroll during gameplay
const handler = (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') setDirection([-1, 0]);
};

// ✅ Prevent default for game keys
const handler = (e: KeyboardEvent) => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  if (e.key === 'ArrowUp') setDirection([-1, 0]);
};
```

#### State Reset Bugs
```tsx
// ❌ Partial reset: forgot to reset score or food
const resetGame = () => {
  setSnake(initialSnake());
  setGameOver(false);
  // missing: setScore(0), setFood(...)
};

// ✅ Reset all state
const resetGame = () => {
  const newSnake = initialSnake();
  setSnake(newSnake);
  setDirection([0, 1]);
  setFood(randomFood(newSnake, size, size));
  setScore(0);
  setGameOver(false);
};
```

#### Timing Bugs
```tsx
// ❌ Interval not cleared on speed change → multiple intervals
useEffect(() => {
  const id = setInterval(tick, speed);
  // missing cleanup
}, [speed]);

// ✅ Always clear previous interval
useEffect(() => {
  const id = setInterval(tick, speed);
  return () => clearInterval(id);
}, [speed]);
```

### Step 4: Apply the Fix
- Make the minimal change needed to fix the bug
- Keep the same function signatures and component structure
- Don't refactor surrounding code unless it's part of the bug

### Step 5: Validate
Run these checks after applying the fix:
```bash
npm run build    # TypeScript errors
npm run lint     # Style issues
npm run dev      # Manual play-test
```

Play-test checklist:
- [ ] Bug no longer reproduces
- [ ] Game starts correctly
- [ ] Score updates properly
- [ ] Reset/new game works
- [ ] No console errors
- [ ] No regressions in other mechanics

## Game-Specific Knowledge

### Snake (`SnakeGame.tsx`)
- State: `snake` (array of `[row, col]`), `direction`, `food`, `score`, `gameOver`
- Common bugs: Self-collision check missing tail, food spawns on snake, direction reversal (180°)

### 2048 (`Game2048.tsx`)
- State: `board` (2D number array), `score`, `gameOver`
- Common bugs: Tile merge happening twice in one move, new tile spawning on occupied cell, win detection at wrong value

### Tetris (`TetrisGame.tsx`)
- State: `board`, `currentPiece`, `position`, `score`, `level`
- Common bugs: Rotation near walls (wall kicks), line clear not shifting rows down, piece spawn overlap = instant game over

### Flappy Bird (`FlappyGame.tsx`)
- State: `birdY`, `velocity`, `pipes`, `score`, `gameOver`
- Common bugs: Hitbox too large/small, pipes not despawning (memory leak), gravity not frame-rate independent
