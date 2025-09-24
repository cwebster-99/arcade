import { Puzzle } from '../types/puzzle';

// Sample puzzle collection - you can expand this or load from JSON/API
export const puzzleCollection: Puzzle[] = [
  {
    id: "daily-2025-09-24",
    date: "2025-09-24",
    size: 5,
    title: "Daily Mini",
    author: "Daily Team",
    grid: [
      [
        { letter: "C", isBlack: false, number: 1 },
        { letter: "A", isBlack: false, number: 2 },
        { letter: "R", isBlack: false },
        { letter: "S", isBlack: false },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "A", isBlack: false, number: 3 },
        { letter: "R", isBlack: false },
        { letter: "E", isBlack: false },
        { letter: "A", isBlack: false },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "T", isBlack: false, number: 4 },
        { letter: "A", isBlack: false },
        { letter: "X", isBlack: false },
        { letter: "I", isBlack: false },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "", isBlack: true },
        { letter: "T", isBlack: false, number: 5 },
        { letter: "S", isBlack: false },
        { letter: "K", isBlack: false },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ]
    ],
    clues: [
      { number: 1, text: "Automobiles", answer: "CARS", direction: "across", startRow: 0, startCol: 0 },
      { number: 3, text: "Space or zone", answer: "AREA", direction: "across", startRow: 1, startCol: 0 },
      { number: 4, text: "Cab", answer: "TAXI", direction: "across", startRow: 2, startCol: 0 },
      { number: 5, text: "Question", answer: "ASK", direction: "across", startRow: 3, startCol: 1 },
      { number: 1, text: "Feline", answer: "CAT", direction: "down", startRow: 0, startCol: 0 },
      { number: 2, text: "Rodent", answer: "RAT", direction: "down", startRow: 0, startCol: 1 }
    ]
  },
  
  {
    id: "daily-2025-09-23",
    date: "2025-09-23",
    size: 5,
    title: "Yesterday's Mini",
    author: "Daily Team",
    grid: [
      [
        { letter: "D", isBlack: false, number: 1 },
        { letter: "O", isBlack: false, number: 2 },
        { letter: "G", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "A", isBlack: false, number: 3 },
        { letter: "P", isBlack: false },
        { letter: "E", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "Y", isBlack: false, number: 4 },
        { letter: "E", isBlack: false },
        { letter: "S", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ]
    ],
    clues: [
      { number: 1, text: "Canine pet", answer: "DOG", direction: "across", startRow: 0, startCol: 0 },
      { number: 3, text: "Primate", answer: "APE", direction: "across", startRow: 1, startCol: 0 },
      { number: 4, text: "Affirmative", answer: "YES", direction: "across", startRow: 2, startCol: 0 },
      { number: 1, text: "24 hours", answer: "DAY", direction: "down", startRow: 0, startCol: 0 },
      { number: 2, text: "Cooking vessel", answer: "POT", direction: "down", startRow: 0, startCol: 1 }
    ]
  },

  {
    id: "weekend-2025-09-22",
    date: "2025-09-22",
    size: 7,
    title: "Weekend Challenge",
    author: "Weekend Team",
    grid: [
      [
        { letter: "R", isBlack: false, number: 1 },
        { letter: "E", isBlack: false },
        { letter: "A", isBlack: false },
        { letter: "D", isBlack: false },
        { letter: "I", isBlack: false },
        { letter: "N", isBlack: false },
        { letter: "G", isBlack: false }
      ],
      [
        { letter: "O", isBlack: false, number: 2 },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "C", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "A", isBlack: false }
      ],
      [
        { letter: "C", isBlack: false, number: 3 },
        { letter: "K", isBlack: false },
        { letter: "E", isBlack: false },
        { letter: "T", isBlack: false },
        { letter: "S", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "M", isBlack: false }
      ],
      [
        { letter: "K", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "E", isBlack: false }
      ],
      [
        { letter: "S", isBlack: false, number: 4 },
        { letter: "T", isBlack: false },
        { letter: "O", isBlack: false },
        { letter: "N", isBlack: false },
        { letter: "E", isBlack: false },
        { letter: "", isBlack: true },
        { letter: "S", isBlack: false }
      ],
      [
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ],
      [
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true },
        { letter: "", isBlack: true }
      ]
    ],
    clues: [
      { number: 1, text: "Activity with books", answer: "READING", direction: "across", startRow: 0, startCol: 0 },
      { number: 3, text: "Space program vehicles", answer: "ROCKETS", direction: "across", startRow: 2, startCol: 0 },
      { number: 4, text: "Rock or pebble", answer: "STONE", direction: "across", startRow: 4, startCol: 0 },
      { number: 2, text: "Big cat", answer: "LION", direction: "down", startRow: 1, startCol: 0 },
      { number: 1, text: "Opposite of blue", answer: "RED", direction: "down", startRow: 0, startCol: 0 }
    ]
  }
];

// Utility functions for puzzle management
export const getPuzzleById = (id: string): Puzzle | undefined => {
  return puzzleCollection.find(puzzle => puzzle.id === id);
};

export const getPuzzleByDate = (date: string): Puzzle | undefined => {
  return puzzleCollection.find(puzzle => puzzle.date === date);
};

export const getTodaysPuzzle = (): Puzzle | undefined => {
  const today = new Date().toISOString().split('T')[0];
  return getPuzzleByDate(today) || puzzleCollection[0]; // Fallback to first puzzle
};

export const getAllPuzzles = (): Puzzle[] => {
  return [...puzzleCollection];
};

export const getPuzzlesBySize = (size: 5 | 7): Puzzle[] => {
  return puzzleCollection.filter(puzzle => puzzle.size === size);
};