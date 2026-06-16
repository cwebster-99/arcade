import { useCallback, useEffect, useRef, useState } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 520;
const PADDLE_WIDTH = 80;
const PADDLE_HEIGHT = 12;
const PADDLE_SPEED = 7;
const PADDLE_Y = CANVAS_HEIGHT - 40;
const BALL_RADIUS = 8;
const BALL_SPEED_INITIAL = 5;
const BRICK_ROWS = 5;
const BRICK_COLS = 9;
const BRICK_PADDING = 5;
const BRICK_LEFT_OFFSET = 15;
const BRICK_TOP_OFFSET = 60;
const BRICK_HEIGHT = 20;
const BRICK_WIDTH =
  (CANVAS_WIDTH - BRICK_LEFT_OFFSET * 2 - BRICK_PADDING * (BRICK_COLS - 1)) /
  BRICK_COLS;
const TOTAL_LIVES = 3;
const POINTS_PER_BRICK = 10;
const BRICK_COLORS: readonly string[] = [
  "#ef4444", // row 0 – red
  "#f97316", // row 1 – orange
  "#eab308", // row 2 – yellow
  "#22c55e", // row 3 – green
  "#3b82f6", // row 4 – blue
];
const HIGH_SCORE_KEY = "brickHighScore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Brick {
  x: number;
  y: number;
  alive: boolean;
  color: string;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Paddle {
  x: number; // left edge
}

type GamePhase = "idle" | "playing" | "ball-lost" | "game-over" | "won";

// ── Pure helpers ──────────────────────────────────────────────────────────────
function buildBricks(): Brick[] {
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row++) {
    for (let col = 0; col < BRICK_COLS; col++) {
      bricks.push({
        x: BRICK_LEFT_OFFSET + col * (BRICK_WIDTH + BRICK_PADDING),
        y: BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_PADDING),
        alive: true,
        color: BRICK_COLORS[row],
      });
    }
  }
  return bricks;
}

function makeBall(paddleX: number): Ball {
  const dir = Math.random() > 0.5 ? 1 : -1;
  return {
    x: paddleX + PADDLE_WIDTH / 2,
    y: PADDLE_Y - BALL_RADIUS - 1,
    vx: dir * BALL_SPEED_INITIAL * 0.6,
    vy: -BALL_SPEED_INITIAL,
  };
}

function getStoredHighScore(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

/** Portable rounded-rectangle path (avoids ctx.roundRect TS-lib variance). */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function BrickBreakerGame(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mutable game state lives in refs so RAF callbacks never close over stale values
  const phaseRef = useRef<GamePhase>("idle");
  const ballRef = useRef<Ball>(makeBall((CANVAS_WIDTH - PADDLE_WIDTH) / 2));
  const paddleRef = useRef<Paddle>({ x: (CANVAS_WIDTH - PADDLE_WIDTH) / 2 });
  const bricksRef = useRef<Brick[]>(buildBricks());
  const livesRef = useRef<number>(TOTAL_LIVES);
  const scoreRef = useRef<number>(0);
  const highScoreRef = useRef<number>(getStoredHighScore());
  const keysRef = useRef({ left: false, right: false });
  const rafRef = useRef<number | null>(null);

  // React state drives the HUD only (no game logic reads from these)
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(TOTAL_LIVES);
  const [highScore, setHighScore] = useState<number>(getStoredHighScore);

  // Keep highScoreRef in sync with state so game loop reads the right value
  useEffect(() => {
    highScoreRef.current = highScore;
  }, [highScore]);

  /** Push all ref values into React state (batched in React 18). */
  const syncHUD = useCallback(() => {
    setPhase(phaseRef.current);
    setScore(scoreRef.current);
    setLives(livesRef.current);
  }, []);

  // ── Canvas draw ────────────────────────────────────────────────────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x: bx, y: by } = ballRef.current;
    const { x: px } = paddleRef.current;

    // Background
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle divider above bricks
    ctx.strokeStyle = "#1e3a5f";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, BRICK_TOP_OFFSET - 10);
    ctx.lineTo(CANVAS_WIDTH, BRICK_TOP_OFFSET - 10);
    ctx.stroke();

    // Bricks
    for (const brick of bricksRef.current) {
      if (!brick.alive) continue;
      // Body
      ctx.fillStyle = brick.color;
      roundRectPath(ctx, brick.x, brick.y, BRICK_WIDTH, BRICK_HEIGHT, 4);
      ctx.fill();
      // Top shine
      ctx.fillStyle = "rgba(255,255,255,0.28)";
      roundRectPath(ctx, brick.x + 2, brick.y + 2, BRICK_WIDTH - 4, 5, 2);
      ctx.fill();
    }

    // Paddle
    const pGrad = ctx.createLinearGradient(
      px,
      PADDLE_Y,
      px,
      PADDLE_Y + PADDLE_HEIGHT
    );
    pGrad.addColorStop(0, "#93c5fd");
    pGrad.addColorStop(1, "#1d4ed8");
    ctx.fillStyle = pGrad;
    roundRectPath(ctx, px, PADDLE_Y, PADDLE_WIDTH, PADDLE_HEIGHT, 6);
    ctx.fill();
    // Paddle shine
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    roundRectPath(ctx, px + 4, PADDLE_Y + 2, PADDLE_WIDTH - 8, 3, 2);
    ctx.fill();

    // Ball glow
    const glowGrad = ctx.createRadialGradient(
      bx,
      by,
      0,
      bx,
      by,
      BALL_RADIUS * 2.5
    );
    glowGrad.addColorStop(0, "rgba(186,230,253,0.45)");
    glowGrad.addColorStop(1, "rgba(186,230,253,0)");
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(bx, by, BALL_RADIUS * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Ball
    const bGrad = ctx.createRadialGradient(
      bx - 2,
      by - 2,
      1,
      bx,
      by,
      BALL_RADIUS
    );
    bGrad.addColorStop(0, "#ffffff");
    bGrad.addColorStop(1, "#bae6fd");
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.arc(bx, by, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    // Dashed indicator ring when ball is waiting to be launched
    if (phaseRef.current === "idle" || phaseRef.current === "ball-lost") {
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(bx, by, BALL_RADIUS + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, []);

  // ── Game loop (runs every animation frame) ─────────────────────────────────
  const gameLoop = useCallback(() => {
    const currentPhase = phaseRef.current;
    let hudDirty = false;

    if (currentPhase === "playing") {
      const paddle = paddleRef.current;
      const ball = ballRef.current;
      const keys = keysRef.current;

      // Move paddle
      if (keys.left) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
      if (keys.right)
        paddle.x = Math.min(CANVAS_WIDTH - PADDLE_WIDTH, paddle.x + PADDLE_SPEED);

      // Move ball
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Left / right wall bounce
      if (ball.x - BALL_RADIUS < 0) {
        ball.x = BALL_RADIUS;
        ball.vx = Math.abs(ball.vx);
      } else if (ball.x + BALL_RADIUS > CANVAS_WIDTH) {
        ball.x = CANVAS_WIDTH - BALL_RADIUS;
        ball.vx = -Math.abs(ball.vx);
      }

      // Ceiling bounce
      if (ball.y - BALL_RADIUS < 0) {
        ball.y = BALL_RADIUS;
        ball.vy = Math.abs(ball.vy);
      }

      // Paddle collision — angle reflects off hit position
      if (
        ball.vy > 0 &&
        ball.y + BALL_RADIUS >= PADDLE_Y &&
        ball.y - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT &&
        ball.x + BALL_RADIUS > paddle.x &&
        ball.x - BALL_RADIUS < paddle.x + PADDLE_WIDTH
      ) {
        ball.y = PADDLE_Y - BALL_RADIUS;
        const hitRatio =
          (ball.x - (paddle.x + PADDLE_WIDTH / 2)) / (PADDLE_WIDTH / 2);
        const speed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const maxAngle = Math.PI / 3; // ±60°
        ball.vx = speed * Math.sin(hitRatio * maxAngle);
        ball.vy = -Math.abs(speed * Math.cos(hitRatio * maxAngle));
      }

      // Brick collision — closest-point AABB circle test, one brick per frame
      let brickHit = false;
      for (const brick of bricksRef.current) {
        if (!brick.alive || brickHit) continue;
        const nearX = Math.max(brick.x, Math.min(ball.x, brick.x + BRICK_WIDTH));
        const nearY = Math.max(brick.y, Math.min(ball.y, brick.y + BRICK_HEIGHT));
        const dx = ball.x - nearX;
        const dy = ball.y - nearY;
        if (dx * dx + dy * dy < BALL_RADIUS * BALL_RADIUS) {
          brick.alive = false;
          brickHit = true;
          scoreRef.current += POINTS_PER_BRICK;
          hudDirty = true;
          // Dominant-axis bounce
          const overlapX = BALL_RADIUS - Math.abs(dx);
          const overlapY = BALL_RADIUS - Math.abs(dy);
          if (overlapX < overlapY) {
            ball.vx = dx < 0 ? -Math.abs(ball.vx) : Math.abs(ball.vx);
          } else {
            ball.vy = dy < 0 ? -Math.abs(ball.vy) : Math.abs(ball.vy);
          }
        }
      }

      // Ball lost below canvas
      if (ball.y - BALL_RADIUS > CANVAS_HEIGHT) {
        livesRef.current -= 1;
        hudDirty = true;
        if (livesRef.current <= 0) {
          phaseRef.current = "game-over";
          if (scoreRef.current > highScoreRef.current) {
            highScoreRef.current = scoreRef.current;
            try {
              localStorage.setItem(HIGH_SCORE_KEY, String(scoreRef.current));
            } catch {
              /* noop */
            }
            setHighScore(scoreRef.current);
          }
        } else {
          phaseRef.current = "ball-lost";
          ball.x = paddle.x + PADDLE_WIDTH / 2;
          ball.y = PADDLE_Y - BALL_RADIUS - 1;
          ball.vx = 0;
          ball.vy = 0;
        }
      }

      // Win — all bricks cleared
      if (bricksRef.current.every((b) => !b.alive)) {
        phaseRef.current = "won";
        hudDirty = true;
        if (scoreRef.current > highScoreRef.current) {
          highScoreRef.current = scoreRef.current;
          try {
            localStorage.setItem(HIGH_SCORE_KEY, String(scoreRef.current));
          } catch {
            /* noop */
          }
          setHighScore(scoreRef.current);
        }
      }
    } else if (currentPhase === "idle" || currentPhase === "ball-lost") {
      // Paddle still moves while waiting to launch; ball follows paddle
      const paddle = paddleRef.current;
      if (keysRef.current.left) paddle.x = Math.max(0, paddle.x - PADDLE_SPEED);
      if (keysRef.current.right)
        paddle.x = Math.min(
          CANVAS_WIDTH - PADDLE_WIDTH,
          paddle.x + PADDLE_SPEED
        );
      ballRef.current.x = paddle.x + PADDLE_WIDTH / 2;
      ballRef.current.y = PADDLE_Y - BALL_RADIUS - 1;
    }

    draw();
    if (hudDirty) syncHUD();

    rafRef.current = requestAnimationFrame(gameLoop);
  }, [draw, syncHUD]);

  // Start (and keep alive) the RAF loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [gameLoop]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const launchBall = useCallback(() => {
    if (phaseRef.current !== "idle" && phaseRef.current !== "ball-lost") return;
    ballRef.current = makeBall(paddleRef.current.x);
    phaseRef.current = "playing";
    syncHUD();
  }, [syncHUD]);

  const resetGame = useCallback(() => {
    const centerX = (CANVAS_WIDTH - PADDLE_WIDTH) / 2;
    phaseRef.current = "idle";
    paddleRef.current = { x: centerX };
    ballRef.current = makeBall(centerX);
    bricksRef.current = buildBricks();
    livesRef.current = TOTAL_LIVES;
    scoreRef.current = 0;
    syncHUD();
  }, [syncHUD]);

  // ── Keyboard input ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        keysRef.current.left = true;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        keysRef.current.right = true;
      } else if (e.key === " ") {
        e.preventDefault();
        if (phaseRef.current === "idle" || phaseRef.current === "ball-lost") {
          launchBall();
        } else if (
          phaseRef.current === "game-over" ||
          phaseRef.current === "won"
        ) {
          resetGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        keysRef.current.left = false;
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        keysRef.current.right = false;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [launchBall, resetGame]);

  // Focus the container so keyboard works immediately
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-4 outline-none"
      role="application"
      aria-label="Brick Breaker game"
      tabIndex={0}
    >
      {/* HUD */}
      <div
        className="flex items-center justify-between w-full"
        style={{ maxWidth: CANVAS_WIDTH }}
      >
        <div className="flex gap-1" aria-label={`Lives remaining: ${lives}`}>
          {Array.from({ length: TOTAL_LIVES }, (_, i) => (
            <span
              key={i}
              className={
                i < lives ? "text-red-500 text-xl" : "text-slate-600 text-xl"
              }
              aria-hidden="true"
            >
              ♥
            </span>
          ))}
        </div>

        <div className="text-lg font-bold text-gray-700 dark:text-gray-300">
          Score:{" "}
          <span className="text-blue-600 dark:text-blue-400">{score}</span>
        </div>

        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Best: {highScore}
        </div>
      </div>

      {/* Game canvas + overlays */}
      <div
        className="relative rounded-lg border-4 border-slate-700"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block rounded"
          aria-label="Brick Breaker game canvas"
        />

        {/* Idle overlay */}
        {phase === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/50">
            <div className="text-center px-6">
              <p className="text-4xl font-black text-white tracking-widest mb-2">
                BRICK BREAKER
              </p>
              <p className="text-yellow-300 text-lg mb-6">
                Clear all the bricks!
              </p>
              <button
                onClick={launchBall}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white rounded-lg font-bold text-lg transition-colors"
              >
                PLAY
              </button>
              <p className="text-gray-400 text-sm mt-4">
                ◄ ► Arrow keys to move &bull; SPACE to launch
              </p>
            </div>
          </div>
        )}

        {/* Ball-lost overlay */}
        {phase === "ball-lost" && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/40">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400 mb-1">
                Ball Lost!
              </p>
              <p className="text-gray-300 text-sm mb-4">
                {lives} {lives === 1 ? "life" : "lives"} remaining
              </p>
              <button
                onClick={launchBall}
                className="px-6 py-2 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white rounded-lg font-bold transition-colors"
              >
                Launch Ball
              </button>
              <p className="text-gray-400 text-xs mt-2">or press SPACE</p>
            </div>
          </div>
        )}

        {/* Game-over overlay */}
        {phase === "game-over" && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60">
            <div className="text-center" role="status" aria-live="assertive">
              <p className="text-5xl font-black text-red-400 mb-3">
                GAME OVER
              </p>
              <p className="text-xl text-yellow-300 mb-1">Score: {score}</p>
              <p className="text-sm text-gray-400 mb-6">Best: {highScore}</p>
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-blue-500 hover:bg-blue-400 active:bg-blue-600 text-white rounded-lg font-bold text-lg transition-colors"
              >
                Try Again
              </button>
              <p className="text-gray-400 text-sm mt-3">or press SPACE</p>
            </div>
          </div>
        )}

        {/* Win overlay */}
        {phase === "won" && (
          <div className="absolute inset-0 flex items-center justify-center rounded bg-black/60">
            <div className="text-center" role="status" aria-live="assertive">
              <p className="text-5xl font-black text-yellow-300 mb-2">
                🎉 YOU WIN!
              </p>
              <p className="text-xl text-green-400 mb-1">Score: {score}</p>
              <p className="text-sm text-gray-400 mb-6">Best: {highScore}</p>
              <button
                onClick={resetGame}
                className="px-8 py-3 bg-green-500 hover:bg-green-400 active:bg-green-600 text-white rounded-lg font-bold text-lg transition-colors"
              >
                Play Again
              </button>
              <p className="text-gray-400 text-sm mt-3">or press SPACE</p>
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
        <p>◄ ► Arrow keys to move paddle &bull; SPACE to launch ball</p>
        <p>3 lives &bull; clear all bricks to win</p>
      </div>
    </div>
  );
}
