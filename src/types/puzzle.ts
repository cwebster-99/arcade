export interface PuzzleCell {
  letter: string;
  isBlack: boolean;
  number?: number;
  userInput?: string;
}

export interface Clue {
  number: number;
  text: string;
  answer: string;
  direction: 'across' | 'down';
  startRow: number;
  startCol: number;
}

export interface Puzzle {
  id: string;
  date: string;
  size: 5 | 7;
  grid: PuzzleCell[][];
  clues: Clue[];
  title?: string;
  author?: string;
}

// Note: The original sample puzzle has been moved to src/data/puzzles.ts
// This file now only contains type definitions