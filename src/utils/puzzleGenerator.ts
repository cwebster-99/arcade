import { Puzzle, PuzzleCell, Clue } from '../types/puzzle';

export interface PuzzleTemplate {
  size: 5 | 7;
  pattern: string[]; // 'X' for black cells, 'O' for white cells
  words: Array<{
    word: string;
    clue: string;
    direction: 'across' | 'down';
    startRow: number;
    startCol: number;
  }>;
}

/**
 * Utility class for creating and validating crossword puzzles
 */
export class PuzzleGenerator {
  
  /**
   * Create a puzzle from a template
   */
  static createFromTemplate(
    template: PuzzleTemplate,
    metadata: { id: string; date: string; title?: string; author?: string }
  ): Puzzle {
    const grid: PuzzleCell[][] = this.createGridFromPattern(template.pattern, template.size);
    const clues: Clue[] = [];
    let clueNumber = 1;
    const clueNumbers: Record<string, number> = {};

    // Sort words by position to assign numbers correctly
    const sortedWords = [...template.words].sort((a, b) => {
      if (a.startRow !== b.startRow) return a.startRow - b.startRow;
      return a.startCol - b.startCol;
    });

    // Place words and assign clue numbers
    for (const wordData of sortedWords) {
      const key = `${wordData.startRow}-${wordData.startCol}`;
      
      // Check if this position already has a number
      if (!clueNumbers[key]) {
        clueNumbers[key] = clueNumber++;
        grid[wordData.startRow][wordData.startCol].number = clueNumbers[key];
      }

      // Place the word in the grid
      this.placeWordInGrid(grid, wordData);

      // Create the clue
      clues.push({
        number: clueNumbers[key],
        text: wordData.clue,
        answer: wordData.word.toUpperCase(),
        direction: wordData.direction,
        startRow: wordData.startRow,
        startCol: wordData.startCol
      });
    }

    return {
      ...metadata,
      size: template.size,
      grid,
      clues: clues.sort((a, b) => a.number - b.number)
    };
  }

  /**
   * Create a grid from a pattern string
   */
  private static createGridFromPattern(pattern: string[], size: 5 | 7): PuzzleCell[][] {
    const grid: PuzzleCell[][] = [];
    
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        const isBlack = pattern[row] && pattern[row][col] === 'X';
        grid[row][col] = {
          letter: isBlack ? '' : ' ',
          isBlack: Boolean(isBlack),
          number: undefined
        };
      }
    }
    
    return grid;
  }

  /**
   * Place a word in the grid
   */
  private static placeWordInGrid(
    grid: PuzzleCell[][],
    wordData: { word: string; direction: 'across' | 'down'; startRow: number; startCol: number }
  ) {
    const { word, direction, startRow, startCol } = wordData;
    
    for (let i = 0; i < word.length; i++) {
      const row = direction === 'across' ? startRow : startRow + i;
      const col = direction === 'across' ? startCol + i : startCol;
      
      if (row < grid.length && col < grid[0].length && !grid[row][col].isBlack) {
        grid[row][col].letter = word[i].toUpperCase();
      }
    }
  }

  /**
   * Validate that a puzzle is solvable and correctly structured
   */
  static validatePuzzle(puzzle: Puzzle): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Basic structure validation
    if (!puzzle.id || !puzzle.date || !puzzle.grid || !puzzle.clues) {
      errors.push('Missing required puzzle properties');
    }

    // Grid size validation
    if (puzzle.grid.length !== puzzle.size) {
      errors.push(`Grid height ${puzzle.grid.length} doesn't match puzzle size ${puzzle.size}`);
    }

    for (let i = 0; i < puzzle.grid.length; i++) {
      if (puzzle.grid[i].length !== puzzle.size) {
        errors.push(`Row ${i} has length ${puzzle.grid[i].length}, expected ${puzzle.size}`);
      }
    }

    // Clue validation
    for (const clue of puzzle.clues) {
      const { startRow, startCol, answer, direction } = clue;
      
      // Check bounds
      if (startRow < 0 || startCol < 0 || startRow >= puzzle.size || startCol >= puzzle.size) {
        errors.push(`Clue ${clue.number} (${direction}) starts outside grid bounds`);
        continue;
      }

      // Check if word fits in grid
      const endRow = direction === 'across' ? startRow : startRow + answer.length - 1;
      const endCol = direction === 'across' ? startCol + answer.length - 1 : startCol;
      
      if (endRow >= puzzle.size || endCol >= puzzle.size) {
        errors.push(`Clue ${clue.number} (${direction}) extends outside grid bounds`);
        continue;
      }

      // Check if letters match
      for (let i = 0; i < answer.length; i++) {
        const row = direction === 'across' ? startRow : startRow + i;
        const col = direction === 'across' ? startCol + i : startCol;
        
        const gridCell = puzzle.grid[row][col];
        if (gridCell.isBlack) {
          errors.push(`Clue ${clue.number} (${direction}) tries to place letter in black cell`);
        } else if (gridCell.letter !== answer[i]) {
          errors.push(`Clue ${clue.number} (${direction}) letter mismatch at position ${i}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate a simple random puzzle (basic implementation)
   */
  static generateSimplePuzzle(
    size: 5 | 7,
    wordList: string[],
    clueMap: Record<string, string>
  ): Puzzle | null {
    // This is a simplified version - a full implementation would be much more complex
    // For now, let's create a basic template-based puzzle
    
    if (size === 5 && wordList.length >= 5) {
      const template: PuzzleTemplate = {
        size: 5,
        pattern: [
          'OOOOX',
          'OOOOX', 
          'OOOOX',
          'XOOOX',
          'XXXXX'
        ],
        words: [
          { word: wordList[0], clue: clueMap[wordList[0]] || 'No clue', direction: 'across', startRow: 0, startCol: 0 },
          { word: wordList[1], clue: clueMap[wordList[1]] || 'No clue', direction: 'across', startRow: 1, startCol: 0 },
          { word: wordList[2], clue: clueMap[wordList[2]] || 'No clue', direction: 'across', startRow: 2, startCol: 0 },
          { word: wordList[3], clue: clueMap[wordList[3]] || 'No clue', direction: 'across', startRow: 3, startCol: 1 },
          { word: wordList[4], clue: clueMap[wordList[4]] || 'No clue', direction: 'down', startRow: 0, startCol: 0 }
        ]
      };

      return this.createFromTemplate(template, {
        id: `generated-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        title: 'Generated Puzzle',
        author: 'Puzzle Generator'
      });
    }

    return null;
  }
}

// Pre-defined templates for quick puzzle creation
export const PUZZLE_TEMPLATES = {
  mini5x5Classic: {
    size: 5 as const,
    pattern: [
      'OOOOX',
      'OOOOX',
      'OOOOX', 
      'XOOOX',
      'XXXXX'
    ]
  },
  
  mini5x5Cross: {
    size: 5 as const,
    pattern: [
      'XXOXX',
      'XXOXX',
      'OOOOO',
      'XXOXX',
      'XXOXX'
    ]
  }
} as const;