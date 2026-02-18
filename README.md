# Arcade

A collection of classic arcade games built with React and TypeScript. Play Snake, 2048, Tetris, and Flappy Bird right in your browser!

## Games

🐍 **Snake** - Guide the snake to eat food and grow longer without hitting walls or yourself

🔢 **2048** - Slide numbered tiles to combine them and reach the 2048 tile

🧱 **Tetris** - Stack falling blocks to clear lines and score points

🐦 **Flappy Bird** - Tap to fly through gaps in the pipes

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
│   ├── Home.tsx         # Home page with game selection
│   ├── SnakeGame.tsx    # Snake game component
│   ├── Game2048.tsx     # 2048 game component
│   ├── TetrisGame.tsx   # Tetris game component
│   └── FlappyGame.tsx   # Flappy Bird game component
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