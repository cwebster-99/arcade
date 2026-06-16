# Arcade

A collection of classic arcade games built with React and TypeScript. Play Snake, 2048, Tetris, Flappy Bird, Minesweeper, and Brick Breaker right in your browser!

## Games

🐍 **Snake** - Guide the snake to eat food and grow longer without hitting walls or yourself

🔢 **2048** - Slide numbered tiles to combine them and reach the 2048 tile

🧱 **Tetris** - Stack falling blocks to clear lines and score points

🐦 **Flappy Bird** - Tap to fly through gaps in the pipes

💣 **Minesweeper** - Uncover tiles without triggering hidden mines

🧱 **Brick Breaker** - Bounce the ball off your paddle to smash all the bricks, earn points, and clear every row before you run out of lives

## Features

- Light/Dark theme toggle with persistent preference
- Responsive design
- Keyboard and mouse/touch controls
- Score tracking

## Tech Stack

- **Frontend**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Development**: Hot Module Reloading (HMR)

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## Project Structure

```
src/
├── components/
│   ├── Home.tsx              # Home page with game selection
│   ├── SnakeGame.tsx         # Snake game component
│   ├── Game2048.tsx          # 2048 game component
│   ├── TetrisGame.tsx        # Tetris game component
│   ├── FlappyGame.tsx        # Flappy Bird game component
│   ├── MinesweeperGame.tsx   # Minesweeper game component
│   └── BrickBreakerGame.tsx  # Brick Breaker game component
├── App.tsx              # Main app with routing
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## How to Play

### Snake
- Use **Arrow keys** to change direction
- Eat the food to grow longer
- Avoid hitting the walls or yourself

### 2048
- Use **Arrow keys** to slide tiles
- Combine matching numbers
- Try to reach 2048!

### Tetris
- **Left/Right arrows** - Move piece
- **Up arrow** - Rotate piece
- **Down arrow** - Soft drop
- **Space** - Hard drop

### Flappy Bird
- **Space** or **Click** to flap
- Navigate through the pipes
- Don't hit the ground or pipes!

### Minesweeper
- **Left click** to reveal a tile
- **Right click** to place or remove a flag
- Use the numbers to deduce where the mines are hiding

### Brick Breaker
- **Left/Right arrows** or **mouse movement** to move the paddle
- **Space** or **Click** to launch the ball
- Break all the bricks to win — each brick is worth 10 points
- You have 3 lives; losing the ball costs one life
- The ball speeds up as you clear bricks, and your high score is saved locally