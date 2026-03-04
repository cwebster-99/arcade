import { useCallback, useEffect, useRef, useState } from 'react'

// ── Constants ──────────────────────────────────────────────────────────────────

const DIFFICULTIES = {
  beginner: { rows: 9, cols: 9, mines: 10, label: 'Beginner' },
  intermediate: { rows: 16, cols: 16, mines: 40, label: 'Intermediate' },
  expert: { rows: 16, cols: 30, mines: 99, label: 'Expert' },
} as const

type Difficulty = keyof typeof DIFFICULTIES
const DIFFICULTY_ORDER: Difficulty[] = ['beginner', 'intermediate', 'expert']

/** Tailwind text-color class for each mine-count digit */
const NUMBER_COLORS: Record<number, string> = {
  1: 'text-blue-700',
  2: 'text-green-700',
  3: 'text-red-600',
  4: 'text-blue-950',
  5: 'text-red-900',
  6: 'text-teal-600',
  7: 'text-gray-900',
  8: 'text-gray-500',
}

/** Emoji for each game-status face button */
const FACE_EMOJI: Record<string, string> = { lost: '😵', won: '😎', idle: '😊', playing: '😊' }

/** Cell size in px per difficulty — shrinks larger boards to fit on screen */
const CELL_SIZES: Record<Difficulty, number> = { expert: 22, intermediate: 26, beginner: 30 }

// ── Types ──────────────────────────────────────────────────────────────────────

interface CellState {
  isMine: boolean
  isRevealed: boolean
  isFlagged: boolean
  adjacentMines: number
  /** Marks the mine that was directly clicked and triggered game-over */
  isExploded: boolean
}

type GameStatus = 'idle' | 'playing' | 'won' | 'lost'

// ── Pure board helpers ─────────────────────────────────────────────────────────

function createEmptyBoard(rows: number, cols: number): CellState[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
      isExploded: false,
    }))
  )
}

function placeMines(
  board: CellState[][],
  rows: number,
  cols: number,
  mines: number,
  safeRow: number,
  safeCol: number,
): CellState[][] {
  // Deep-clone
  const next = board.map(row => row.map(cell => ({ ...cell })))

  // Build a set of cells excluded from mine placement (clicked cell + its 8 neighbors)
  const excludedCells = new Set<string>()
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      const nr = safeRow + dr
      const nc = safeCol + dc
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        excludedCells.add(`${nr},${nc}`)
      }
    }
  }

  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (!next[r][c].isMine && !excludedCells.has(`${r},${c}`)) {
      next[r][c].isMine = true
      placed++
    }
  }

  // Calculate adjacency counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].isMine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          const nr = r + dr
          const nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && next[nr][nc].isMine) {
            count++
          }
        }
      }
      next[r][c].adjacentMines = count
    }
  }

  return next
}

/** BFS flood-reveal starting from (row, col). Returns a new board. */
function floodReveal(
  board: CellState[][],
  rows: number,
  cols: number,
  row: number,
  col: number,
): CellState[][] {
  const next = board.map(row => row.map(cell => ({ ...cell })))
  // Use an index-based approach to avoid O(n) shift() on the array
  const queue: [number, number][] = [[row, col]]
  let head = 0

  while (head < queue.length) {
    const [r, c] = queue[head++]
    if (r < 0 || r >= rows || c < 0 || c >= cols) continue
    const cell = next[r][c]
    if (cell.isRevealed || cell.isFlagged || cell.isMine) continue
    cell.isRevealed = true
    if (cell.adjacentMines === 0) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          queue.push([r + dr, c + dc])
        }
      }
    }
  }

  return next
}

/** Returns true when all non-mine cells have been revealed. */
function checkWin(board: CellState[][], rows: number, cols: number, mines: number): boolean {
  let revealed = 0
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isRevealed) revealed++
    }
  }
  return revealed === rows * cols - mines
}

/** Exposes all mines (and marks the exploded cell) for game-over display. */
function revealAllMines(board: CellState[][], explodedRow: number, explodedCol: number): CellState[][] {
  return board.map((row, r) =>
    row.map((cell, c) => {
      if (r === explodedRow && c === explodedCol) {
        return { ...cell, isRevealed: true, isExploded: true }
      }
      if (cell.isMine) {
        return { ...cell, isRevealed: true }
      }
      return cell
    })
  )
}

// ── Display helpers ────────────────────────────────────────────────────────────

/** Formats a counter value like the classic 3-digit LED display. */
function formatDisplay(value: number): string {
  if (value < 0) return `-${String(Math.abs(value)).padStart(2, '0')}`
  return String(Math.min(value, 999)).padStart(3, '0')
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function MinesweeperGame(): JSX.Element {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner')

  const [board, setBoard] = useState<CellState[][]>(() =>
    createEmptyBoard(
      DIFFICULTIES.beginner.rows,
      DIFFICULTIES.beginner.cols,
    )
  )
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle')
  const [flagCount, setFlagCount] = useState(0)
  const [timer, setTimer] = useState(0)

  // Refs to avoid stale closures in event handlers / intervals
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ── Timer ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (gameStatus === 'playing') {
      timerIntervalRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
    return () => {
      if (timerIntervalRef.current !== null) {
        clearInterval(timerIntervalRef.current)
        timerIntervalRef.current = null
      }
    }
  }, [gameStatus])

  // ── Reset ────────────────────────────────────────────────────────────────────

  const resetGame = useCallback((diff: Difficulty) => {
    const { rows, cols } = DIFFICULTIES[diff]
    setBoard(createEmptyBoard(rows, cols))
    setGameStatus('idle')
    setFlagCount(0)
    setTimer(0)
  }, [])

  // ── Keyboard controls ────────────────────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        resetGame(difficulty)
      } else if (e.key === 'n' || e.key === 'N') {
        const idx = DIFFICULTY_ORDER.indexOf(difficulty)
        const next = DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length]
        setDifficulty(next)
        resetGame(next)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [difficulty, resetGame])

  // ── Cell interactions ────────────────────────────────────────────────────────

  const handleCellClick = (row: number, col: number) => {
    if (gameStatus === 'won' || gameStatus === 'lost') return
    const cell = board[row][col]
    if (cell.isRevealed || cell.isFlagged) return

    const { rows, cols, mines } = DIFFICULTIES[difficulty]
    let currentBoard = board

    // First click: lay mines now (guaranteed safe first click)
    if (gameStatus === 'idle') {
      currentBoard = placeMines(board, rows, cols, mines, row, col)
      setGameStatus('playing')
    }

    if (currentBoard[row][col].isMine) {
      setBoard(revealAllMines(currentBoard, row, col))
      setGameStatus('lost')
      return
    }

    const newBoard = floodReveal(currentBoard, rows, cols, row, col)
    if (checkWin(newBoard, rows, cols, mines)) {
      setBoard(newBoard)
      setGameStatus('won')
    } else {
      setBoard(newBoard)
    }
  }

  const handleRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault()
    // Cannot flag after the game has ended
    if (gameStatus === 'won' || gameStatus === 'lost') return
    const cell = board[row][col]
    if (cell.isRevealed) return

    const newBoard = board.map(boardRow => boardRow.map(c => ({ ...c })))
    newBoard[row][col] = { ...newBoard[row][col], isFlagged: !newBoard[row][col].isFlagged }
    setFlagCount(prev => (newBoard[row][col].isFlagged ? prev + 1 : prev - 1))
    setBoard(newBoard)
  }

  /**
   * Chord click: clicking a revealed numbered cell when the correct number of
   * adjacent flags have been placed auto-reveals all remaining neighbors.
   */
  const handleChordClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return
    const cell = board[row][col]
    if (!cell.isRevealed || cell.adjacentMines === 0) return

    const { rows, cols, mines } = DIFFICULTIES[difficulty]

    // Count adjacent flags
    let adjacentFlags = 0
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = row + dr
        const nc = col + dc
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isFlagged) {
          adjacentFlags++
        }
      }
    }

    if (adjacentFlags !== cell.adjacentMines) return

    // Reveal all non-flagged, non-revealed neighbors
    let currentBoard = board
    let explodedRow = -1
    let explodedCol = -1

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue
        const nr = row + dr
        const nc = col + dc
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
        const neighbor = currentBoard[nr][nc]
        if (neighbor.isRevealed || neighbor.isFlagged) continue
        if (neighbor.isMine) {
          explodedRow = nr
          explodedCol = nc
        } else {
          currentBoard = floodReveal(currentBoard, rows, cols, nr, nc)
        }
      }
    }

    if (explodedRow >= 0) {
      setBoard(revealAllMines(currentBoard, explodedRow, explodedCol))
      setGameStatus('lost')
    } else if (checkWin(currentBoard, rows, cols, mines)) {
      setBoard(currentBoard)
      setGameStatus('won')
    } else {
      setBoard(currentBoard)
    }
  }

  // ── Derived display values ───────────────────────────────────────────────────

  const { mines } = DIFFICULTIES[difficulty]
  const mineCounter = Math.max(-99, mines - flagCount)
  const timerDisplay = Math.min(999, timer)

  const faceEmoji = FACE_EMOJI[gameStatus] ?? '😊'

  // ── Cell rendering helpers ───────────────────────────────────────────────────

  const getCellContent = (cell: CellState): string => {
    if (cell.isFlagged) return '🚩'
    if (!cell.isRevealed) return ''
    if (cell.isMine) return '💣'
    if (cell.adjacentMines === 0) return ''
    return String(cell.adjacentMines)
  }

  const getCellClasses = (cell: CellState): string => {
    const base =
      'flex items-center justify-center font-bold border border-gray-700 select-none cursor-pointer'

    if (!cell.isRevealed) {
      return `${base} bg-gray-600 hover:bg-gray-500 text-sm`
    }
    if (cell.isMine) {
      const bg = cell.isExploded ? 'bg-red-600' : 'bg-red-900'
      return `${base} ${bg} text-sm`
    }
    const numColor =
      cell.adjacentMines > 0 ? (NUMBER_COLORS[cell.adjacentMines] ?? '') : ''
    return `${base} bg-gray-400 text-sm ${numColor}`
  }

  const cellSizePx = CELL_SIZES[difficulty]

  const getCellAriaLabel = (cell: CellState, r: number, c: number): string => {
    if (cell.isFlagged) return `Cell ${r + 1},${c + 1} flagged`
    if (!cell.isRevealed) return `Cell ${r + 1},${c + 1} hidden`
    if (cell.isMine) return `Mine at ${r + 1},${c + 1}`
    if (cell.adjacentMines > 0) return `${cell.adjacentMines} at ${r + 1},${c + 1}`
    return `Empty at ${r + 1},${c + 1}`
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col items-center select-none"
      tabIndex={0}
      role="application"
      aria-label="Minesweeper game"
    >
      {/* ── Difficulty selector ── */}
      <div className="flex gap-2 mb-4" role="group" aria-label="Difficulty selection">
        {DIFFICULTY_ORDER.map(diff => (
          <button
            key={diff}
            onClick={() => {
              setDifficulty(diff)
              resetGame(diff)
            }}
            className={`px-3 py-1 rounded text-sm font-mono font-bold border transition-colors ${
              difficulty === diff
                ? 'bg-purple-600 text-white border-purple-400'
                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            }`}
            aria-pressed={difficulty === diff}
          >
            {DIFFICULTIES[diff].label}
          </button>
        ))}
      </div>

      {/* ── Status bar: mine counter · reset · timer ── */}
      <div
        className="flex items-center justify-between bg-gray-800 border-2 border-gray-600 rounded px-4 py-2 mb-3 gap-8"
        style={{ minWidth: cellSizePx * DIFFICULTIES[difficulty].cols }}
      >
        {/* Mine counter */}
        <div
          className="font-mono text-2xl font-bold text-red-400 w-12 text-center tabular-nums"
          aria-label={`${mineCounter} mines remaining`}
          aria-live="polite"
        >
          {formatDisplay(mineCounter)}
        </div>

        {/* Reset / smiley button */}
        <button
          onClick={() => resetGame(difficulty)}
          className="text-2xl leading-none hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-400 rounded"
          aria-label="Reset game"
        >
          {faceEmoji}
        </button>

        {/* Timer */}
        <div
          className="font-mono text-2xl font-bold text-red-400 w-12 text-center tabular-nums"
          aria-label={`Timer: ${timerDisplay} seconds`}
          aria-live="off"
        >
          {formatDisplay(timerDisplay)}
        </div>
      </div>

      {/* ── Game board ── */}
      <div
        className="border-2 border-gray-600 bg-gray-700 p-0.5"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${DIFFICULTIES[difficulty].cols}, ${cellSizePx}px)`,
        }}
        role="grid"
        aria-label="Minesweeper board"
      >
        {board.map((row, r) =>
          row.map((cell, c) => (
            <div
              key={`${r}-${c}`}
              role="gridcell"
              className={getCellClasses(cell)}
              style={{ width: cellSizePx, height: cellSizePx }}
              onClick={() => {
                if (cell.isRevealed && cell.adjacentMines > 0) {
                  handleChordClick(r, c)
                } else {
                  handleCellClick(r, c)
                }
              }}
              onContextMenu={e => handleRightClick(e, r, c)}
              aria-label={getCellAriaLabel(cell, r, c)}
            >
              {getCellContent(cell)}
            </div>
          ))
        )}
      </div>

      {/* ── Win / loss status messages ── */}
      {gameStatus === 'won' && (
        <div
          className="mt-4 text-green-400 font-bold text-xl font-mono"
          role="status"
          aria-live="assertive"
        >
          🎉 YOU WIN! &nbsp; Time: {timerDisplay}s
        </div>
      )}
      {gameStatus === 'lost' && (
        <div
          className="mt-4 text-red-400 font-bold text-xl font-mono"
          role="status"
          aria-live="assertive"
        >
          💥 GAME OVER — Better luck next time!
        </div>
      )}

      {/* ── Controls hint ── */}
      <div className="mt-3 text-xs text-gray-400 font-mono text-center">
        <span>LEFT CLICK REVEAL</span>
        <span className="mx-2">•</span>
        <span>RIGHT CLICK FLAG</span>
        <span className="mx-2">•</span>
        <span>R RESET</span>
        <span className="mx-2">•</span>
        <span>N NEXT DIFFICULTY</span>
      </div>
    </div>
  )
}
