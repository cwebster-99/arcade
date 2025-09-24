import { Puzzle, PuzzleCell, Clue } from '../types/puzzle';

/**
 * Automatically numbers a crossword grid based on the clues
 * This ensures that every clue starting position has the correct number
 */
export function numberCrosswordGrid(puzzle: Puzzle): Puzzle {
  // Create a copy of the grid without numbers
  const grid: PuzzleCell[][] = puzzle.grid.map(row =>
    row.map(cell => ({
      ...cell,
      number: undefined
    }))
  );

  // Sort clues by number to process them in order
  const sortedClues = [...puzzle.clues].sort((a, b) => a.number - b.number);

  // Apply numbers to starting positions
  sortedClues.forEach(clue => {
    const { startRow, startCol, number } = clue;
    if (!grid[startRow][startCol].isBlack) {
      // Only add number if this cell doesn't already have one, or if this number is smaller
      if (!grid[startRow][startCol].number || grid[startRow][startCol].number! > number) {
        grid[startRow][startCol].number = number;
      }
    }
  });

  return {
    ...puzzle,
    grid
  };
}

/**
 * Validates that a crossword puzzle has consistent numbering
 * Returns an array of issues found
 */
export function validateCrosswordNumbering(puzzle: Puzzle): string[] {
  const issues: string[] = [];

  puzzle.clues.forEach(clue => {
    const { startRow, startCol, number, direction, answer } = clue;
    
    // Check if starting cell exists and is not black
    if (startRow >= puzzle.size || startCol >= puzzle.size) {
      issues.push(`Clue ${number} ${direction}: Starting position (${startRow}, ${startCol}) is outside grid bounds`);
      return;
    }

    const startCell = puzzle.grid[startRow][startCol];
    if (startCell.isBlack) {
      issues.push(`Clue ${number} ${direction}: Starting position (${startRow}, ${startCol}) is a black cell`);
      return;
    }

    // Check if starting cell has the correct number
    if (startCell.number !== number) {
      issues.push(`Clue ${number} ${direction}: Starting cell should have number ${number} but has ${startCell.number || 'no number'}`);
    }

    // Check if the answer fits in the grid
    for (let i = 0; i < answer.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;

      if (row >= puzzle.size || col >= puzzle.size) {
        issues.push(`Clue ${number} ${direction}: Answer extends beyond grid bounds`);
        break;
      }

      if (puzzle.grid[row][col].isBlack) {
        issues.push(`Clue ${number} ${direction}: Answer passes through black cell at (${row}, ${col})`);
        break;
      }
    }
  });

  return issues;
}

/**
 * Creates a properly numbered crossword from basic grid and clue data
 * This is useful when creating puzzles programmatically
 */
export function createNumberedCrossword(
  size: 5 | 7,
  gridPattern: boolean[][], // true = white cell, false = black cell
  clueData: Omit<Clue, 'number'>[], // clues without numbers
  metadata: { id: string; date: string; title?: string; author?: string }
): Puzzle {
  // Create basic grid
  const grid: PuzzleCell[][] = gridPattern.map(row =>
    row.map(isWhite => ({
      letter: "",
      isBlack: !isWhite,
      userInput: ""
    }))
  );

  // Auto-assign clue numbers based on reading order (left-to-right, top-to-bottom)
  let clueNumber = 1;
  const numberedClues: Clue[] = [];
  const cellNumbers: Map<string, number> = new Map();

  // First pass: identify all cells that start clues
  clueData.forEach(clueData => {
    const key = `${clueData.startRow},${clueData.startCol}`;
    if (!cellNumbers.has(key)) {
      cellNumbers.set(key, clueNumber++);
    }
  });

  // Second pass: assign numbers to clues
  clueData.forEach(clueData => {
    const key = `${clueData.startRow},${clueData.startCol}`;
    const number = cellNumbers.get(key)!;
    numberedClues.push({
      ...clueData,
      number
    });
  });

  // Third pass: assign numbers to grid cells
  cellNumbers.forEach((number, key) => {
    const [row, col] = key.split(',').map(Number);
    grid[row][col].number = number;
  });

  const puzzle: Puzzle = {
    ...metadata,
    size,
    grid,
    clues: numberedClues.sort((a, b) => a.number - b.number)
  };

  return numberCrosswordGrid(puzzle);
}