import { useEffect, useState } from 'react'
import { CrosswordGrid } from './components/CrosswordGrid'
import { CluePanel } from './components/CluePanel'
import { Timer } from './components/Timer'
import { PuzzleSelector } from './components/PuzzleSelector'
import { Clue } from './types/puzzle'
import { useGameStore } from './store/gameStore'
import { PuzzleService } from './services/puzzleService'

function App() {
  const [showPuzzleSelector, setShowPuzzleSelector] = useState(false);
  
  const {
    currentPuzzle,
    userGrid,
    selectedCell,
    direction,
    startTime,
    isCompleted,
    loadPuzzle,
    updateCell,
    setSelectedCell,
    setDirection,
    resetPuzzle
  } = useGameStore();

  // Load today's puzzle on app start
  useEffect(() => {
    try {
      const todaysPuzzle = PuzzleService.getTodaysPuzzle();
      loadPuzzle(todaysPuzzle);
    } catch (error) {
      console.error('Failed to load today\'s puzzle:', error);
      // Load first available puzzle as fallback
      const allPuzzles = PuzzleService.getAllPuzzles();
      if (allPuzzles.length > 0) {
        loadPuzzle(allPuzzles[0]);
      }
    }
  }, [loadPuzzle]);

  const handleCellClick = (row: number, col: number) => {
    setSelectedCell([row, col]);
  };

  const handleCellInput = (row: number, col: number, value: string) => {
    updateCell(row, col, value);
  };

  const handleDirectionChange = (newDirection: 'across' | 'down') => {
    setDirection(newDirection);
  };

  const handleClueClick = (clue: Clue) => {
    setSelectedCell([clue.startRow, clue.startCol]);
    setDirection(clue.direction);
  };

  const handlePuzzleSelect = (puzzle: any) => {
    loadPuzzle(puzzle);
  };

  if (!currentPuzzle || userGrid.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Loading puzzle...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Daily Mini Crossword
          </h1>
          <div className="mt-4 text-sm text-gray-500">
            {currentPuzzle.title} • {currentPuzzle.date}
          </div>
          
          {/* Game controls and timer */}
          <div className="mt-4 flex justify-center items-center gap-6 flex-wrap">
            <Timer startTime={startTime} isCompleted={isCompleted} />
            <button
              onClick={() => setShowPuzzleSelector(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Choose Puzzle
            </button>
            <button
              onClick={resetPuzzle}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
            >
              Reset
            </button>
            {isCompleted && (
              <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                🎉 Completed!
              </div>
            )}
          </div>
        </header>
        
        <main className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <CrosswordGrid
              size={currentPuzzle.size}
              grid={userGrid}
              onCellClick={handleCellClick}
              onCellInput={handleCellInput}
              selectedCell={selectedCell}
              direction={direction}
              onDirectionChange={handleDirectionChange}
            />
          </div>
          
          {/* Clues section */}
          <div className="grid md:grid-cols-2 gap-6">
            <CluePanel
              clues={currentPuzzle.clues}
              direction="across"
              selectedCell={selectedCell}
              onClueClick={handleClueClick}
            />
            
            <CluePanel
              clues={currentPuzzle.clues}
              direction="down"
              selectedCell={selectedCell}
              onClueClick={handleClueClick}
            />
          </div>
        </main>

        {/* Puzzle Selector Modal */}
        {showPuzzleSelector && (
          <PuzzleSelector
            currentPuzzle={currentPuzzle}
            onPuzzleSelect={handlePuzzleSelect}
            onClose={() => setShowPuzzleSelector(false)}
          />
        )}
      </div>
    </div>
  )
}

export default App