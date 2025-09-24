import React, { useState } from 'react';
import { Puzzle } from '../types/puzzle';
import { PuzzleService } from '../services/puzzleService';

interface PuzzleSelectorProps {
  currentPuzzle: Puzzle | null;
  onPuzzleSelect: (puzzle: Puzzle) => void;
  onClose: () => void;
}

export const PuzzleSelector: React.FC<PuzzleSelectorProps> = ({
  currentPuzzle,
  onPuzzleSelect,
  onClose
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'size5' | 'size7' | 'today'>('all');
  const [puzzles, setPuzzles] = useState<Puzzle[]>(() => PuzzleService.getAllPuzzles());

  const handleFilterChange = (filter: typeof selectedFilter) => {
    setSelectedFilter(filter);
    
    switch (filter) {
      case 'all':
        setPuzzles(PuzzleService.getAllPuzzles());
        break;
      case 'size5':
        setPuzzles(PuzzleService.getAllPuzzles({ size: 5 }));
        break;
      case 'size7':
        setPuzzles(PuzzleService.getAllPuzzles({ size: 7 }));
        break;
      case 'today':
        const todaysPuzzle = PuzzleService.getTodaysPuzzle();
        setPuzzles([todaysPuzzle]);
        break;
    }
  };

  const handlePuzzleClick = (puzzle: Puzzle) => {
    onPuzzleSelect(puzzle);
    onClose();
  };

  const handleRandomPuzzle = () => {
    const filter = selectedFilter === 'size5' ? { size: 5 as const } :
                   selectedFilter === 'size7' ? { size: 7 as const } : 
                   undefined;
    const randomPuzzle = PuzzleService.getRandomPuzzle(filter);
    onPuzzleSelect(randomPuzzle);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Select a Puzzle</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Filter buttons */}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'all' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Puzzles
            </button>
            <button
              onClick={() => handleFilterChange('today')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'today' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Today's Puzzle
            </button>
            <button
              onClick={() => handleFilterChange('size5')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'size5' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              5×5 Mini
            </button>
            <button
              onClick={() => handleFilterChange('size7')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedFilter === 'size7' 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              7×7 Challenge
            </button>
            <button
              onClick={handleRandomPuzzle}
              className="px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
            >
              🎲 Random
            </button>
          </div>
        </div>

        {/* Puzzle list */}
        <div className="p-6 overflow-y-auto max-h-96">
          <div className="grid gap-3">
            {puzzles.map((puzzle) => (
              <div
                key={puzzle.id}
                onClick={() => handlePuzzleClick(puzzle)}
                className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                  currentPuzzle?.id === puzzle.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {puzzle.title || `Puzzle ${puzzle.id}`}
                    </h3>
                    <div className="text-sm text-gray-600 mt-1">
                      {puzzle.date} • {puzzle.size}×{puzzle.size} • {puzzle.clues.length} clues
                    </div>
                    {puzzle.author && (
                      <div className="text-xs text-gray-500 mt-1">
                        by {puzzle.author}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      puzzle.size === 5 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {puzzle.size}×{puzzle.size}
                    </span>
                    {currentPuzzle?.id === puzzle.id && (
                      <span className="text-blue-500 font-medium text-sm">Current</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {puzzles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No puzzles found for the selected filter.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};