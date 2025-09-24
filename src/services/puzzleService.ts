import { Puzzle } from '../types/puzzle';
import { 
  getPuzzleById, 
  getPuzzleByDate, 
  getTodaysPuzzle,
  getAllPuzzles,
  getPuzzlesBySize 
} from '../data/puzzles';

export interface PuzzleFilter {
  size?: 5 | 7;
  date?: string;
  author?: string;
}

/**
 * Service for managing puzzle data and selection logic
 */
export class PuzzleService {
  /**
   * Get today's puzzle, or fallback to a default puzzle
   */
  static getTodaysPuzzle(): Puzzle {
    const puzzle = getTodaysPuzzle();
    if (!puzzle) {
      throw new Error('No puzzle available for today');
    }
    return puzzle;
  }

  /**
   * Get a specific puzzle by ID
   */
  static getPuzzleById(id: string): Puzzle | null {
    return getPuzzleById(id) || null;
  }

  /**
   * Get puzzle for a specific date
   */
  static getPuzzleByDate(date: string): Puzzle | null {
    return getPuzzleByDate(date) || null;
  }

  /**
   * Get all available puzzles with optional filtering
   */
  static getAllPuzzles(filter?: PuzzleFilter): Puzzle[] {
    let puzzles = getAllPuzzles();

    if (filter?.size) {
      puzzles = getPuzzlesBySize(filter.size);
    }

    if (filter?.date) {
      puzzles = puzzles.filter(p => p.date === filter.date);
    }

    if (filter?.author) {
      puzzles = puzzles.filter(p => p.author === filter.author);
    }

    return puzzles;
  }

  /**
   * Get a random puzzle from the collection
   */
  static getRandomPuzzle(filter?: PuzzleFilter): Puzzle {
    const availablePuzzles = this.getAllPuzzles(filter);
    if (availablePuzzles.length === 0) {
      throw new Error('No puzzles match the specified criteria');
    }
    
    const randomIndex = Math.floor(Math.random() * availablePuzzles.length);
    return availablePuzzles[randomIndex];
  }

  /**
   * Get puzzle suggestions based on user's completed puzzles
   */
  static getSuggestedPuzzles(completedPuzzleIds: string[], maxSuggestions = 3): Puzzle[] {
    const allPuzzles = getAllPuzzles();
    const uncompletedPuzzles = allPuzzles.filter(p => !completedPuzzleIds.includes(p.id));
    
    // Sort by date (most recent first) and return limited results
    return uncompletedPuzzles
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, maxSuggestions);
  }

  /**
   * Get puzzles for the current week
   */
  static getWeeklyPuzzles(): Puzzle[] {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    return getAllPuzzles().filter(puzzle => {
      const puzzleDate = new Date(puzzle.date);
      return puzzleDate >= weekStart && puzzleDate <= weekEnd;
    });
  }

  /**
   * Validate puzzle data structure
   */
  static validatePuzzle(puzzle: Puzzle): boolean {
    try {
      // Basic structure validation
      if (!puzzle.id || !puzzle.date || !puzzle.grid || !puzzle.clues) {
        return false;
      }

      // Grid size validation
      if (puzzle.grid.length !== puzzle.size || 
          puzzle.grid.some(row => row.length !== puzzle.size)) {
        return false;
      }

      // Clue validation
      for (const clue of puzzle.clues) {
        if (!clue.answer || !clue.text || 
            clue.startRow < 0 || clue.startCol < 0 ||
            clue.startRow >= puzzle.size || clue.startCol >= puzzle.size) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }
}

// Export utility functions for direct use
export {
  getPuzzleById,
  getPuzzleByDate,
  getTodaysPuzzle,
  getAllPuzzles,
  getPuzzlesBySize
};