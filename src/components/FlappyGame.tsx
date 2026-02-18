import React, { useEffect, useRef, useState } from "react";

const GRAVITY = 0.5;
const FLAP_STRENGTH = -12;
const PIPE_WIDTH = 60;
const PIPE_GAP = 120;
const PIPE_SPACING = 300;
const BIRD_SIZE = 25;

interface Pipe {
  x: number;
  topHeight: number;
  scored?: boolean;
}

const FlappyGame: React.FC = () => {
  const [birdY, setBirdY] = useState(200);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([
    { x: 400, topHeight: 150 },
    { x: 700, topHeight: 100 },
  ]);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [running, setRunning] = useState(false);
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem("flappyHighScore") || "0", 10);
    } catch {
      return 0;
    }
  });

  const gameWidth = 400;
  const gameHeight = 600;
  const birdX = 50;

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pipeIdRef = useRef(0);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const birdYRef = useRef(birdY);

  useEffect(() => {
    birdYRef.current = birdY;
  }, [birdY]);

  // Focus game on mount
  useEffect(() => {
    rootRef.current?.focus();
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === " " || e.key === "Enter") && !running && gameOver) {
        reset();
        return;
      }
      if ((e.key === " " || e.key === "Enter") && running && !gameOver) {
        setBirdVelocity(FLAP_STRENGTH);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, running]);

  // Mouse click to flap
  const handleFlap = () => {
    if (!gameOver) {
      setBirdVelocity(FLAP_STRENGTH);
    }
  };

  // Start game
  const startGame = () => {
    if (!running && !gameOver) {
      setRunning(true);
    }
  };

  // Reset game
  const reset = () => {
    setBirdY(200);
    setBirdVelocity(0);
    setPipes([
      { x: 400, topHeight: 150 },
      { x: 700, topHeight: 100 },
    ]);
    setScore(0);
    setGameOver(false);
    setRunning(true);
    pipeIdRef.current = 0;
  };

  // Game loop
  useEffect(() => {
    if (!running || gameOver) return;

    gameLoopRef.current = setInterval(() => {
      setBirdY((prevY) => {
        const newY = prevY + birdVelocity;
        setBirdVelocity((v) => v + GRAVITY);

        // Ceiling and floor collision
        if (newY <= 0 || newY + BIRD_SIZE >= gameHeight) {
          setGameOver(true);
          setRunning(false);
          return prevY;
        }

        return newY;
      });

      setPipes((prevPipes) => {
        let newPipes = prevPipes.map((p) => ({
          ...p,
          x: p.x - 6,
        }));

        // Remove off-screen pipes and add new ones
        newPipes = newPipes.filter((p) => p.x > -PIPE_WIDTH);

        if (
          newPipes.length > 0 &&
          newPipes[newPipes.length - 1].x < gameWidth - PIPE_SPACING
        ) {
          const randomGapStart =
            Math.random() * (gameHeight - PIPE_GAP - 60) + 30;
          newPipes.push({
            x: gameWidth,
            topHeight: randomGapStart,
          });
        }

        // Collision detection
        newPipes.forEach((pipe) => {
          if (birdX + BIRD_SIZE > pipe.x && birdX < pipe.x + PIPE_WIDTH) {
            // Check collision with top or bottom pipe
            if (
              birdYRef.current < pipe.topHeight ||
              birdYRef.current + BIRD_SIZE > pipe.topHeight + PIPE_GAP
            ) {
              setGameOver(true);
              setRunning(false);
            }
          }

          // Score increment when passing pipe
          if (pipe.x === birdX - PIPE_WIDTH / 2 && !pipe.scored) {
            setScore((prev) => {
              const newScore = prev + 1;
              if (newScore > highScore) {
                setHighScore(newScore);
                try {
                  localStorage.setItem("flappyHighScore", String(newScore));
                } catch {
                  // localStorage may be unavailable
                }
              }
              return newScore;
            });
            pipe.scored = true;
          }
        });

        return newPipes;
      });
    }, 30);

    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [running, gameOver, birdVelocity, highScore]);

  return (
    <div
      ref={rootRef}
      className="flex flex-col items-center gap-4"
      role="application"
      aria-label="Flappy Bird game"
      tabIndex={0}
    >
      <div className="flex gap-4 mb-2">
        <button
          onClick={startGame}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded font-bold"
        >
          {running ? "Playing..." : gameOver ? "Restart" : "Start"}
        </button>
        <div className="text-lg font-bold text-gray-700">Score: {score}</div>
        <div className="text-lg font-bold text-gray-700">High: {highScore}</div>
      </div>

      <div
        onClick={handleFlap}
        role="grid"
        aria-label="Game canvas"
        className="relative bg-gradient-to-b from-cyan-300 to-cyan-100 border-4 border-gray-800 cursor-pointer overflow-hidden"
        style={{
          width: `${gameWidth}px`,
          height: `${gameHeight}px`,
        }}
      >
        {/* Bird */}
        <div
          className="absolute"
          style={{
            left: `${birdX}px`,
            top: `${birdY}px`,
            transform: `rotate(${Math.min(birdVelocity * 2, 90)}deg)`,
            transition: "none",
          }}
          role="img"
          aria-label="Bird"
        >
          <svg
            width="30"
            height="24"
            viewBox="0 0 30 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Bird body */}
            <ellipse
              cx="15"
              cy="12"
              rx="10"
              ry="8"
              fill="#FFD700"
              stroke="#FFA500"
              strokeWidth="1.5"
            />

            {/* Bird head */}
            <circle
              cx="22"
              cy="10"
              r="6"
              fill="#FFD700"
              stroke="#FFA500"
              strokeWidth="1.5"
            />

            {/* Eye */}
            <circle cx="24" cy="9" r="2" fill="#000000" />

            {/* Beak */}
            <polygon
              points="28,9 30,8.5 28,11"
              fill="#FF6B00"
              stroke="#FF6B00"
              strokeWidth="1"
            />

            {/* Wing top */}
            <path
              d="M 12 8 Q 8 4 6 8"
              stroke="#FF8C00"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Wing bottom */}
            <path
              d="M 12 16 Q 8 20 6 16"
              stroke="#FF8C00"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />

            {/* Tail feathers */}
            <path
              d="M 5 10 L 2 8"
              stroke="#FF8C00"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 5 12 L 2 12"
              stroke="#FF8C00"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M 5 14 L 2 16"
              stroke="#FF8C00"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Pipes */}
        {pipes.map((pipe, idx) => (
          <div key={idx}>
            {/* Top pipe */}
            <div
              className="absolute bg-green-600 border-2 border-green-800"
              style={{
                left: `${pipe.x}px`,
                top: 0,
                width: `${PIPE_WIDTH}px`,
                height: `${pipe.topHeight}px`,
              }}
            />
            {/* Bottom pipe */}
            <div
              className="absolute bg-green-600 border-2 border-green-800"
              style={{
                left: `${pipe.x}px`,
                top: `${pipe.topHeight + PIPE_GAP}px`,
                width: `${PIPE_WIDTH}px`,
                height: `${gameHeight - pipe.topHeight - PIPE_GAP}px`,
              }}
            />
          </div>
        ))}

        {/* Game Over message */}
        {gameOver && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50"
            role="status"
            aria-live="assertive"
          >
            <div className="text-center">
              <p className="text-4xl font-bold text-white mb-2">GAME OVER</p>
              <p className="text-2xl font-bold text-yellow-300 mb-4">
                Score: {score}
              </p>
              <p className="text-sm text-gray-300">
                Press SPACE or ENTER to restart
              </p>
            </div>
          </div>
        )}

        {/* Start instructions */}
        {!running && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
            <div className="text-center">
              <p className="text-3xl font-bold text-white mb-4">FLAPPY BIRD</p>
              <p className="text-lg text-yellow-300 mb-4">
                Click or press SPACE to flap
              </p>
              <button
                onClick={startGame}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-bold text-lg"
              >
                Start Game
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-xs text-gray-500 text-center max-w-sm">
        <p>Click the game area or press SPACE to make the bird flap.</p>
        <p>Avoid the green pipes to keep playing!</p>
      </div>
    </div>
  );
};

export default FlappyGame;
