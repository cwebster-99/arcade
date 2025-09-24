# Daily Mini

A web-based mini crossword puzzle game. This application features daily puzzles with a 5x5 grid for weekdays and 7x7 grid for Saturdays, providing users with quick, engaging crossword experiences that can be completed in just a few minutes.

## Current Features

✅ **Basic Functionality Working:**
- Letter input with keyboard support
- Arrow key navigation
- Direction switching (Across/Down)
- Real-time completion detection
- Timer functionality
- Interactive clue panels
- Reset functionality
- Responsive design

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

## How to Play

1. **Select a cell**: Click on any white cell in the grid
2. **Enter letters**: Type letters directly - they'll appear in the selected cell
3. **Navigate**: 
   - Use arrow keys to move between cells
   - Tab to move to next cell in current direction
   - Space bar to toggle between Across/Down directions
4. **Use clues**: Click on clues to jump to their starting position
5. **Complete the puzzle**: Fill in all letters correctly to see the completion message

## Keyboard Shortcuts

- **Arrow keys**: Navigate between cells
- **Letters A-Z**: Enter letters
- **Backspace/Delete**: Clear current cell
- **Tab**: Move to next cell in current direction
- **Space**: Toggle between Across/Down directions

## Project Structure

```
src/
├── components/
│   ├── CrosswordGrid.tsx    # Main crossword grid component
│   ├── CluePanel.tsx        # Clue display component
│   └── Timer.tsx            # Timer component
├── store/
│   └── gameStore.ts         # Zustand state management
├── types/
│   └── puzzle.ts            # TypeScript type definitions
└── App.tsx                  # Main app component
```

## Sample Puzzle

The app currently includes a sample puzzle with:
- 4 Across clues: CARS, AREA, TAXI, ASK
- 2 Down clues: CAT, RAT

Try solving it to test all the features!