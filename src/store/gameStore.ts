import { create } from 'zustand';
import { Puzzle, PuzzleCell } from '../types/puzzle';

interface GameState {
  currentPuzzle: Puzzle | null;
  userGrid: PuzzleCell[][];
  selectedCell: [number, number] | null;
  direction: 'across' | 'down';
  startTime: Date | null;
  isCompleted: boolean;
  completedPuzzles: string[]; // Track completed puzzle IDs
  puzzleProgress: Record<string, { grid: PuzzleCell[][], startTime: Date | null }>; // Save progress
  
  // Actions
  loadPuzzle: (puzzle: Puzzle) => void;
  updateCell: (row: number, col: number, letter: string) => void;
  setSelectedCell: (cell: [number, number] | null) => void;
  setDirection: (direction: 'across' | 'down') => void;
  startTimer: () => void;
  checkCompletion: () => void;
  resetPuzzle: () => void;
  markPuzzleCompleted: (puzzleId: string) => void;
  saveProgress: (puzzleId: string) => void;
  loadProgress: (puzzleId: string) => boolean;
  clearProgress: (puzzleId: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentPuzzle: null,
  userGrid: [],
  selectedCell: null,
  direction: 'across',
  startTime: null,
  isCompleted: false,
  completedPuzzles: [],
  puzzleProgress: {},

  loadPuzzle: (puzzle) => {
    // Try to load existing progress first
    const hasProgress = get().loadProgress(puzzle.id);
    
    if (!hasProgress) {
      // Create fresh grid if no progress exists
      const userGrid = puzzle.grid.map(row => 
        row.map(cell => ({ ...cell, userInput: '' }))
      );
      set({ 
        currentPuzzle: puzzle, 
        userGrid,
        isCompleted: false,
        startTime: null,
        selectedCell: null,
      });
    }
    
    // Check if puzzle was already completed
    const isAlreadyCompleted = get().completedPuzzles.includes(puzzle.id);
    if (isAlreadyCompleted) {
      set({ isCompleted: true });
    }
  },

  updateCell: (row, col, letter) => {
    const { userGrid, startTime, currentPuzzle } = get();
    const newGrid = [...userGrid];
    newGrid[row][col] = { ...newGrid[row][col], userInput: letter.toUpperCase() };
    set({ userGrid: newGrid });
    
    // Start timer on first input
    if (!startTime && letter.trim() !== '') {
      get().startTimer();
    }
    
    // Auto-save progress
    if (currentPuzzle) {
      get().saveProgress(currentPuzzle.id);
    }
    
    // Check completion after update
    setTimeout(() => get().checkCompletion(), 100);
  },

  setSelectedCell: (cell) => set({ selectedCell: cell }),
  
  setDirection: (direction) => set({ direction }),
  
  startTimer: () => set({ startTime: new Date() }),

  checkCompletion: () => {
    const { currentPuzzle, userGrid, isCompleted } = get();
    if (!currentPuzzle || isCompleted) return;

    const isComplete = currentPuzzle.clues.every(clue => {
      const { startRow, startCol, answer, direction } = clue;
      for (let i = 0; i < answer.length; i++) {
        const row = direction === 'across' ? startRow : startRow + i;
        const col = direction === 'across' ? startCol + i : startCol;
        const userInput = userGrid[row]?.[col]?.userInput || '';
        if (userInput !== answer[i]) return false;
      }
      return true;
    });

    if (isComplete) {
      set({ isCompleted: true });
      get().markPuzzleCompleted(currentPuzzle.id);
      get().clearProgress(currentPuzzle.id); // Clear progress since it's completed
      console.log('🎉 Puzzle completed!');
    }
  },

  resetPuzzle: () => {
    const { currentPuzzle } = get();
    if (currentPuzzle) {
      get().clearProgress(currentPuzzle.id);
      get().loadPuzzle(currentPuzzle);
    }
  },

  markPuzzleCompleted: (puzzleId) => {
    set(state => ({
      completedPuzzles: [...state.completedPuzzles.filter(id => id !== puzzleId), puzzleId]
    }));
  },

  saveProgress: (puzzleId) => {
    const { userGrid, startTime } = get();
    set(state => ({
      puzzleProgress: {
        ...state.puzzleProgress,
        [puzzleId]: { grid: userGrid, startTime }
      }
    }));
  },

  loadProgress: (puzzleId) => {
    const progress = get().puzzleProgress[puzzleId];
    if (progress) {
      set({
        userGrid: progress.grid,
        startTime: progress.startTime,
        currentPuzzle: get().currentPuzzle // Keep current puzzle
      });
      return true;
    }
    return false;
  },

  clearProgress: (puzzleId) => {
    set(state => {
      const newProgress = { ...state.puzzleProgress };
      delete newProgress[puzzleId];
      return { puzzleProgress: newProgress };
    });
  },
}));