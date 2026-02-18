import React, { useEffect, useRef, useState } from 'react'

type Tile = {
  id: number
  value: number
  row: number
  col: number
}

type Grid = (Tile | null)[][]

const BOARD_SIZE = 4
const BOARD_PIXEL = 320
const BOARD_PADDING = 16
const CELL_GAP = 8
const CELL_SIZE =
  (BOARD_PIXEL - BOARD_PADDING * 2 - CELL_GAP * (BOARD_SIZE - 1)) / BOARD_SIZE

let tileIdCounter = 1

function createEmptyGrid(): Grid {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null))
}

function createTile(value: number, row: number, col: number): Tile {
  return {
    id: tileIdCounter++,
    value,
    row,
    col
  }
}

function initGrid(): Grid {
  const grid = createEmptyGrid()
  addNewTile(grid)
  addNewTile(grid)
  return grid
}

function addNewTile(grid: Grid): void {
  const empty: [number, number][] = []
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (!grid[r][c]) empty.push([r, c])
    }
  }
  if (empty.length === 0) return
  const [r, c] = empty[Math.floor(Math.random() * empty.length)]
  grid[r][c] = createTile(Math.random() < 0.9 ? 2 : 4, r, c)
}

type MoveDirection = 'left' | 'right' | 'up' | 'down'

function mergeLine(tiles: Tile[]): { tiles: Tile[]; score: number; mergedIds: number[] } {
  const merged: Tile[] = []
  const mergedIds: number[] = []
  let score = 0
  for (let i = 0; i < tiles.length; i++) {
    const current = { ...tiles[i] }
    const next = tiles[i + 1]
    if (next && current.value === next.value) {
      current.value *= 2
      score += current.value
      mergedIds.push(current.id)
      i += 1
    }
    merged.push(current)
  }
  return { tiles: merged, score, mergedIds }
}

function moveGrid(
  grid: Grid,
  direction: MoveDirection
): { grid: Grid; score: number; moved: boolean; mergedIds: number[] } {
  const nextGrid = createEmptyGrid()
  let totalScore = 0
  let moved = false
  const mergedIds: number[] = []

  const placeTile = (tile: Tile, row: number, col: number) => {
    if (tile.row !== row || tile.col !== col) moved = true
    tile.row = row
    tile.col = col
    nextGrid[row][col] = tile
  }

  if (direction === 'left' || direction === 'right') {
    for (let r = 0; r < BOARD_SIZE; r++) {
      const line: Tile[] = []
      const cols = direction === 'left'
        ? [...Array(BOARD_SIZE).keys()]
        : [...Array(BOARD_SIZE).keys()].reverse()
      for (const c of cols) {
        const tile = grid[r][c]
        if (tile) line.push(tile)
      }
      const { tiles, score, mergedIds: lineMergedIds } = mergeLine(line)
      totalScore += score
      mergedIds.push(...lineMergedIds)
      if (lineMergedIds.length > 0) moved = true
      tiles.forEach((tile, idx) => {
        const targetCol = direction === 'left' ? idx : BOARD_SIZE - 1 - idx
        placeTile(tile, r, targetCol)
      })
    }
  } else {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const line: Tile[] = []
      const rows = direction === 'up'
        ? [...Array(BOARD_SIZE).keys()]
        : [...Array(BOARD_SIZE).keys()].reverse()
      for (const r of rows) {
        const tile = grid[r][c]
        if (tile) line.push(tile)
      }
      const { tiles, score, mergedIds: lineMergedIds } = mergeLine(line)
      totalScore += score
      mergedIds.push(...lineMergedIds)
      if (lineMergedIds.length > 0) moved = true
      tiles.forEach((tile, idx) => {
        const targetRow = direction === 'up' ? idx : BOARD_SIZE - 1 - idx
        placeTile(tile, targetRow, c)
      })
    }
  }

  return { grid: nextGrid, score: totalScore, moved, mergedIds }
}

function canMove(grid: Grid): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      const tile = grid[r][c]
      if (!tile) return true
      const right = c < BOARD_SIZE - 1 ? grid[r][c + 1] : null
      const down = r < BOARD_SIZE - 1 ? grid[r + 1][c] : null
      if (right && right.value === tile.value) return true
      if (down && down.value === tile.value) return true
    }
  }
  return false
}

function hasWon(grid: Grid): boolean {
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (grid[r][c]?.value === 2048) return true
    }
  }
  return false
}

function getTileColor(value: number): string {
  const colors: { [key: number]: string } = {
    0: 'bg-gray-200',
    2: 'bg-gray-300',
    4: 'bg-yellow-100',
    8: 'bg-yellow-200',
    16: 'bg-yellow-300',
    32: 'bg-orange-300',
    64: 'bg-orange-400',
    128: 'bg-orange-500',
    256: 'bg-red-400',
    512: 'bg-red-500',
    1024: 'bg-red-600',
    2048: 'bg-amber-400',
  }
  return colors[value] || 'bg-purple-600'
}

function getTextColor(value: number): string {
  return value >= 8 ? 'text-white' : 'text-gray-700'
}

const Game2048: React.FC = () => {
  const [grid, setGrid] = useState<Grid>(initGrid)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const [mergedIds, setMergedIds] = useState<number[]>([])
  const gridRef = useRef(grid)
  const scoreRef = useRef(score)

  useEffect(() => {
    gridRef.current = grid
  }, [grid])
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  useEffect(() => {
    if (mergedIds.length === 0) return
    const timeout = window.setTimeout(() => setMergedIds([]), 180)
    return () => window.clearTimeout(timeout)
  }, [mergedIds])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (gameOver || won) {
        if (e.key === ' ' || e.key === 'Enter') {
          reset()
        }
        return
      }

      let result
      const key = e.key

      if (key === 'ArrowLeft' || key === 'a') {
        result = moveGrid(gridRef.current, 'left')
      } else if (key === 'ArrowRight' || key === 'd') {
        result = moveGrid(gridRef.current, 'right')
      } else if (key === 'ArrowUp' || key === 'w') {
        result = moveGrid(gridRef.current, 'up')
      } else if (key === 'ArrowDown' || key === 's') {
        result = moveGrid(gridRef.current, 'down')
      } else {
        return
      }

      if (!result.moved) return

      const newGrid = result.grid
      addNewTile(newGrid)
      setGrid(newGrid)
      setScore(scoreRef.current + result.score)
      setMergedIds(result.mergedIds)

      if (hasWon(newGrid)) {
        setWon(true)
      }

      if (!canMove(newGrid)) {
        setGameOver(true)
      }

      e.preventDefault()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [gameOver, won])

  const reset = () => {
    setGrid(initGrid())
    setScore(0)
    setGameOver(false)
    setWon(false)
    setMergedIds([])
  }

  return (
    <div className="flex flex-col items-center" role="application" aria-label="2048 game">
      <div className="mb-6 flex flex-col items-center gap-4">
        <div className="text-4xl font-bold text-gray-900">Score: {score}</div>
        <button
          onClick={reset}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold transition-colors"
        >
          {gameOver ? 'Game Over — Restart' : won ? 'You Won! — Play Again' : 'New Game'}
        </button>
      </div>

      <div
        className="bg-gray-300 p-4 rounded-lg relative"
        style={{
          width: BOARD_PIXEL,
          height: BOARD_PIXEL
        }}
        role="grid"
        aria-rowcount={BOARD_SIZE}
        aria-colcount={BOARD_SIZE}
        aria-label="2048 board"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
            gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
            width: '100%',
            height: '100%',
            gap: 8
          }}
        >
          {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => (
            <div
              key={`cell-${index}`}
              className="bg-gray-200 rounded-lg"
              style={{ opacity: 0.6 }}
            />
          ))}
        </div>

        <div
          className="absolute"
          style={{
            top: BOARD_PADDING,
            left: BOARD_PADDING,
            right: BOARD_PADDING,
            bottom: BOARD_PADDING
          }}
        >
          {grid
            .flat()
            .filter((tile): tile is Tile => Boolean(tile))
            .map(tile => {
              const x = tile.col * (CELL_SIZE + CELL_GAP)
              const y = tile.row * (CELL_SIZE + CELL_GAP)
              return (
                <div
                  key={tile.id}
                  className="absolute transition-transform duration-200 ease-out"
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    transform: `translate(${x}px, ${y}px)`,
                    willChange: 'transform'
                  }}
                >
                  <div
                    className={`${getTileColor(tile.value)} ${getTextColor(tile.value)} rounded-lg flex items-center justify-center font-bold ${
                      mergedIds.includes(tile.id) ? 'animate-merge' : ''
                    }`}
                    style={{
                      width: '100%',
                      height: '100%',
                      fontSize: tile.value >= 1000 ? '24px' : '32px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}
                  >
                    {tile.value}
                  </div>
                </div>
              )
            })}
        </div>
      </div>

      {gameOver && (
        <div
          className="mt-6 text-2xl font-bold text-red-600"
          role="status"
          aria-live="assertive"
        >
          Game Over! Final Score: {score}
        </div>
      )}

      {won && (
        <div
          className="mt-6 text-2xl font-bold text-green-600"
          role="status"
          aria-live="assertive"
        >
          You reached 2048! Score: {score}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 text-center">
        <div className="text-sm font-semibold text-gray-700">
          <span className="inline-block px-2 py-1 bg-gray-200 rounded mr-2">⬅️ ➡️ ⬆️ ⬇️</span> or <span className="inline-block px-2 py-1 bg-gray-200 rounded ml-2">WASD</span>
        </div>
        <div className="text-xs text-gray-600 max-w-xs">
          Slide tiles in any direction. Matching numbers merge and double!
        </div>
      </div>
    </div>
  )
}

export default Game2048
