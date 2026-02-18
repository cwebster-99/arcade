import React, { useCallback, useEffect, useRef, useState } from "react";

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const BLOCK_SIZE = 30;

type Board = (number | null)[][];

interface Piece {
  shape: number[][];
  color: number;
}

const TETROMINOS: Piece[] = [
  { shape: [[1, 1, 1, 1]], color: 1 }, // I - cyan
  {
    shape: [
      [2, 2],
      [2, 2],
    ],
    color: 2,
  }, // O - yellow
  {
    shape: [
      [0, 3, 0],
      [3, 3, 3],
    ],
    color: 3,
  }, // T - purple
  {
    shape: [
      [0, 4, 4],
      [4, 4, 0],
    ],
    color: 4,
  }, // S - green
  {
    shape: [
      [5, 5, 0],
      [0, 5, 5],
    ],
    color: 5,
  }, // Z - red
  {
    shape: [
      [6, 0, 0],
      [6, 6, 6],
    ],
    color: 6,
  }, // J - blue
  {
    shape: [
      [0, 0, 7],
      [7, 7, 7],
    ],
    color: 7,
  }, // L - orange
];

function createEmptyBoard(): Board {
  return Array(BOARD_HEIGHT)
    .fill(null)
    .map(() => Array(BOARD_WIDTH).fill(null));
}

function getRandomPiece(): Piece {
  const basePiece = TETROMINOS[Math.floor(Math.random() * TETROMINOS.length)];
  return {
    shape: basePiece.shape.map((row) => [...row]),
    color: basePiece.color,
  };
}

function canPlace(board: Board, piece: Piece, x: number, y: number): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] === 0) continue;
      const boardY = y + r;
      const boardX = x + c;
      if (
        boardX < 0 ||
        boardX >= BOARD_WIDTH ||
        boardY < 0 ||
        boardY >= BOARD_HEIGHT
      ) {
        return false;
      }
      if (boardY >= 0 && board[boardY][boardX] !== null) {
        return false;
      }
    }
  }
  return true;
}

function placePiece(board: Board, piece: Piece, x: number, y: number): Board {
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] === 0) continue;
      const boardY = y + r;
      const boardX = x + c;
      if (boardY >= 0) {
        newBoard[boardY][boardX] = piece.color;
      }
    }
  }
  return newBoard;
}

function rotatePiece(piece: Piece): Piece {
  const n = piece.shape.length;
  const m = piece.shape[0].length;
  const rotated: number[][] = Array(m)
    .fill(null)
    .map(() => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      rotated[c][n - 1 - r] = piece.shape[r][c];
    }
  }
  return { shape: rotated, color: piece.color };
}

function clearLines(board: Board): { board: Board; lines: number } {
  let cleared = 0;
  const newBoard = board.filter((row) => {
    const isFull = row.every((cell) => cell !== null);
    if (isFull) cleared++;
    return !isFull;
  });
  while (newBoard.length < BOARD_HEIGHT) {
    newBoard.unshift(Array(BOARD_WIDTH).fill(null));
  }
  return { board: newBoard, lines: cleared };
}

function getTileColor(value: number | null): string {
  const colors: { [key: number]: string } = {
    1: "bg-cyan-400",
    2: "bg-yellow-400",
    3: "bg-purple-500",
    4: "bg-green-500",
    5: "bg-red-500",
    6: "bg-blue-500",
    7: "bg-orange-500",
  };
  return colors[value ?? 0] || "bg-gray-900";
}

const TetrisGame: React.FC = () => {
  const [board, setBoard] = useState<Board>(createEmptyBoard);
  const [piece, setPiece] = useState<Piece>(getRandomPiece);
  const [nextPiece, setNextPiece] = useState<Piece>(getRandomPiece);
  const [position, setPosition] = useState([0, 0]);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);

  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const posRef = useRef(position);
  const gameOverRef = useRef(gameOver);
  const speedRef = useRef(800 - level * 50);
  const nextPieceRef = useRef(nextPiece);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);
  useEffect(() => {
    pieceRef.current = piece;
  }, [piece]);
  useEffect(() => {
    posRef.current = position;
  }, [position]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);
  useEffect(() => {
    speedRef.current = Math.max(100, 800 - level * 50);
  }, [level]);
  useEffect(() => {
    nextPieceRef.current = nextPiece;
  }, [nextPiece]);

  const moveDown = useCallback((): boolean => {
    const [x, y] = posRef.current;
    if (canPlace(boardRef.current, pieceRef.current, x, y + 1)) {
      setPosition([x, y + 1]);
      return true;
    }
    return false;
  }, []);

  const placeCurrent = useCallback(() => {
    const [x, y] = posRef.current;
    let newBoard = placePiece(boardRef.current, pieceRef.current, x, y);
    const { board: clearedBoard, lines: clearedLines } = clearLines(newBoard);
    newBoard = clearedBoard;

    setBoard(newBoard);

    if (clearedLines > 0) {
      const lineScore = [0, 100, 300, 500, 800][clearedLines] || 800;
      setScore((s) => s + lineScore);
      setLines((l) => {
        const newLines = l + clearedLines;
        const newLevel = Math.floor(newLines / 10) + 1;
        setLevel(newLevel);
        return newLines;
      });
    }

    const newPiece = nextPieceRef.current;
    setNextPiece(getRandomPiece());
    setPiece(newPiece);
    setPosition([3, 0]);

    if (!canPlace(newBoard, newPiece, 3, 0)) {
      setGameOver(true);
      setRunning(false);
    }
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!running && (e.key === " " || e.key === "Enter")) {
        setRunning(true);
        setGameOver(false);
        return;
      }

      const [x, y] = posRef.current;
      let newX = x;

      if (e.key === "ArrowLeft" || e.key === "a") {
        newX = x - 1;
      } else if (e.key === "ArrowRight" || e.key === "d") {
        newX = x + 1;
      } else if (e.key === "ArrowDown" || e.key === "s") {
        const moved = moveDown();
        if (!moved) {
          placeCurrent();
        }
        e.preventDefault();
        return;
      } else if (e.key === " " || e.key === "ArrowUp" || e.key === "w") {
        const rotated = rotatePiece(pieceRef.current);
        if (canPlace(boardRef.current, rotated, x, y)) {
          setPiece(rotated);
        }
        e.preventDefault();
        return;
      }

      if (canPlace(boardRef.current, pieceRef.current, newX, y)) {
        setPosition([newX, y]);
      }

      e.preventDefault();
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, moveDown, placeCurrent]);

  useEffect(() => {
    if (!running || gameOverRef.current) return;

    const id = setInterval(() => {
      const moved = moveDown();
      if (!moved) {
        placeCurrent();
      }
    }, speedRef.current);

    return () => clearInterval(id);
  }, [running, moveDown, placeCurrent]);

  const reset = () => {
    setBoard(createEmptyBoard());
    setPiece(getRandomPiece());
    setNextPiece(getRandomPiece());
    setPosition([3, 0]);
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setRunning(false);
  };

  const displayBoard = board.map((row) => [...row]);
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (piece.shape[r][c] === 0) continue;
      const y = position[1] + r;
      const x = position[0] + c;
      if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
        if (displayBoard[y][x] === null) {
          displayBoard[y][x] = piece.color;
        }
      }
    }
  }

  return (
    <div
      className="flex flex-col items-center gap-6"
      role="application"
      aria-label="Tetris game"
    >
      <div className="flex gap-8 flex-wrap justify-center">
        {/* Game Board */}
        <div>
          <div
            className="bg-gray-900 border-4 border-cyan-400"
            style={{
              width: BOARD_WIDTH * BLOCK_SIZE,
              height: BOARD_HEIGHT * BLOCK_SIZE,
              display: "grid",
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, 1fr)`,
              gridTemplateRows: `repeat(${BOARD_HEIGHT}, 1fr)`,
              gap: 1,
              boxShadow:
                "0 0 20px rgba(34,211,238,0.5), inset 0 0 10px rgba(0,0,0,0.8)",
            }}
          >
            {displayBoard.map((row, r) =>
              row.map((value, c) => (
                <div
                  key={`${r}-${c}`}
                  className={`${getTileColor(value)} border border-gray-800 transition-all duration-100`}
                  style={{
                    opacity: value ? 1 : 0.1,
                  }}
                />
              )),
            )}
          </div>

          {gameOver && (
            <div
              className="mt-4 text-red-500 font-bold text-xl text-center"
              role="status"
            >
              GAME OVER
            </div>
          )}
        </div>

        {/* Stats Panel */}
        <div className="flex flex-col gap-6">
          <div
            className="bg-gray-800 border-2 border-yellow-400 p-4 rounded"
            style={{
              boxShadow: "0 0 10px rgba(250,204,21,0.4)",
            }}
          >
            <div className="text-yellow-400 font-bold mb-2">SCORE</div>
            <div className="text-3xl font-bold text-white font-mono">
              {score}
            </div>
          </div>

          <div
            className="bg-gray-800 border-2 border-green-400 p-4 rounded"
            style={{
              boxShadow: "0 0 10px rgba(34,197,94,0.4)",
            }}
          >
            <div className="text-green-400 font-bold mb-2">LINES</div>
            <div className="text-3xl font-bold text-white font-mono">
              {lines}
            </div>
          </div>

          <div
            className="bg-gray-800 border-2 border-purple-400 p-4 rounded"
            style={{
              boxShadow: "0 0 10px rgba(168,85,247,0.4)",
            }}
          >
            <div className="text-purple-400 font-bold mb-2">LEVEL</div>
            <div className="text-3xl font-bold text-white font-mono">
              {level}
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-6 flex gap-4">
        <button
          onClick={() => {
            if (gameOver) reset();
            else setRunning((r) => !r);
          }}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-bold"
        >
          {running ? "PAUSE" : gameOver ? "RESTART" : "START"}
        </button>
        <button
          onClick={reset}
          className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-bold"
        >
          RESET
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-sm text-gray-400 font-mono">
        <p>◀ ▶ Move | ▲ / Space Rotate | ▼ Drop</p>
        <p>Space/Enter to Start</p>
      </div>
    </div>
  );
};

export default TetrisGame;
