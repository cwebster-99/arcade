import React, { useEffect, useRef, useState } from 'react'

const DEFAULT_SIZE = 20
const DEFAULT_SPEED = 120 // ms per move

type Cell = [number, number]

function randomFood(snake: Cell[], rows: number, cols: number) {
  const occupied = new Set(snake.map(s => `${s[0]}:${s[1]}`))
  let r = 0, c = 0
  do {
    r = Math.floor(Math.random() * rows)
    c = Math.floor(Math.random() * cols)
  } while (occupied.has(`${r}:${c}`))
  return [r, c] as Cell
}

const SnakeGame: React.FC = () => {
  const [size, setSize] = useState<number>(DEFAULT_SIZE)
  const center = Math.floor(size / 2)

  const initialSnake = (): Cell[] => [[center, center], [center, center - 1], [center, center - 2]]

  const [snake, setSnake] = useState<Cell[]>(initialSnake)
  const [direction, setDirection] = useState<[number, number]>([0, 1]) // rowDelta, colDelta
  const [food, setFood] = useState<Cell>(() => randomFood(initialSnake(), size, size))
  const [running, setRunning] = useState(false)
  const [speed, setSpeed] = useState<number>(DEFAULT_SPEED)
  const [score, setScore] = useState(0)
  const [gameOver, setGameOver] = useState(false)

  const dirRef = useRef(direction)
  const snakeRef = useRef(snake)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const lastInputAt = useRef(0)

  // Focus the game container when the component mounts
  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  useEffect(() => { dirRef.current = direction }, [direction])
  useEffect(() => { snakeRef.current = snake }, [snake])

  // Keyboard controls
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running && (e.key === ' ' || e.key === 'Enter')) {
        setRunning(true)
        setGameOver(false)
        return
      }

      const key = e.key
      const [dr, dc] = dirRef.current

      if (key === 'ArrowUp' || key === 'w') {
        const now = Date.now()
        if (now - lastInputAt.current < 80) return
        lastInputAt.current = now
        if (dr === 1) return
        setDirection([-1, 0])
      } else if (key === 'ArrowDown' || key === 's') {
        const now = Date.now()
        if (now - lastInputAt.current < 80) return
        lastInputAt.current = now
        if (dr === -1) return
        setDirection([1, 0])
      } else if (key === 'ArrowLeft' || key === 'a') {
        const now = Date.now()
        if (now - lastInputAt.current < 80) return
        lastInputAt.current = now
        if (dc === 1) return
        setDirection([0, -1])
      } else if (key === 'ArrowRight' || key === 'd') {
        const now = Date.now()
        if (now - lastInputAt.current < 80) return
        lastInputAt.current = now
        if (dc === -1) return
        setDirection([0, 1])
      } else if (key === 'Escape') {
        setRunning(false)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [running])

  // Game loop
  useEffect(() => {
    if (!running) return

    const id = setInterval(() => {
      const s = snakeRef.current.slice()
      const head = s[0]
      const [dr, dc] = dirRef.current
      const newHead: Cell = [head[0] + dr, head[1] + dc]

      // Wall collision
      if (newHead[0] < 0 || newHead[0] >= size || newHead[1] < 0 || newHead[1] >= size) {
        setRunning(false)
        setGameOver(true)
        return
      }

      // Self collision
      if (s.some(seg => seg[0] === newHead[0] && seg[1] === newHead[1])) {
        setRunning(false)
        setGameOver(true)
        return
      }

      s.unshift(newHead)

      // Eat food
      if (newHead[0] === food[0] && newHead[1] === food[1]) {
        setScore(prev => prev + 1)
        setFood(randomFood(s, size, size))
        // speed up slightly
        setSpeed(prev => Math.max(40, prev - 4))
      } else {
        s.pop()
      }

      setSnake(s)
    }, speed)

    return () => clearInterval(id)
  }, [running, speed, food, size])

  const reset = (newSize = size, newSpeed = DEFAULT_SPEED) => {
    const c = Math.floor(newSize / 2)
    const init: Cell[] = [[c, c], [c, c - 1], [c, c - 2]]
    setSnake(init)
    setDirection([0, 1])
    setFood(randomFood(init, newSize, newSize))
    setRunning(false)
    setGameOver(false)
    setScore(0)
    setSpeed(newSpeed)
    setSize(newSize)
  }

  return (
    <div ref={rootRef} className="flex flex-col items-center" role="application" aria-label="Snake game" tabIndex={0}>
      <div className="mb-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => { if (gameOver) reset(size, speed); else setRunning(r => !r) }}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
          >
            {running ? 'Pause' : gameOver ? 'Restart' : 'Start'}
          </button>
          <button onClick={() => reset(size, speed)} className="px-3 py-2 bg-gray-200 rounded">Reset</button>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">Score: <span className="font-semibold">{score}</span></div>
        </div>
      </div>

      <div className="w-full max-w-md mb-4">
        <label className="block text-xs text-gray-600">Grid size: {size} × {size}</label>
        <input
          type="range"
          min={10}
          max={30}
          value={size}
          onChange={(e) => { const newSize = Number(e.target.value); reset(newSize, speed) }}
          className="w-full"
        />

        <label className="block text-xs text-gray-600 mt-2">Speed (ms per move): {speed} — {Math.round(1000 / speed * 10) / 10} moves/sec</label>
        <input
          type="range"
          min={40}
          max={400}
          step={10}
          value={speed}
          onChange={(e) => { const newSpeed = Number(e.target.value); setSpeed(newSpeed); setRunning(false) }}
          className="w-full"
        />
      </div>

      <div
        className="bg-gray-100 p-2 rounded"
        style={{ width: 360, height: 360 }}
        role="grid"
        aria-rowcount={size}
        aria-colcount={size}
        aria-label="Snake board"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateRows: `repeat(${size}, 1fr)`,
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: '100%',
            height: '100%'
          }}
        >
          {Array.from({ length: size }).map((_, r) =>
            Array.from({ length: size }).map((__, c) => {
              const isHead = snake[0][0] === r && snake[0][1] === c
              const isBody = snake.some((s, i) => i > 0 && s[0] === r && s[1] === c)
              const isFood = food[0] === r && food[1] === c
              const bg = isHead ? 'bg-green-800' : isBody ? 'bg-green-600' : isFood ? 'bg-red-500' : 'bg-white'
              const roleAttr = isFood ? 'img' : 'presentation'
              return (
                <div key={`${r}-${c}`} role={roleAttr} aria-label={isFood ? 'Food' : undefined} className={`${bg} border border-gray-200`} />
              )
            })
          )}
        </div>
      </div>

      {gameOver && (
        <div className="mt-4 text-red-600 font-bold" role="status" aria-live="assertive">Game Over — Score: {score}</div>
      )}

      <div className="mt-2" aria-live="polite">Score: <span className="font-semibold">{score}</span></div>

      <div className="mt-3 text-xs text-gray-500">
        Use arrow keys or WASD to move. Press Space/Enter to start.
      </div>
    </div>
  )
}

export default SnakeGame
