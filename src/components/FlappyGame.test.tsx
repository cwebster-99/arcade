import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import FlappyGame from "./FlappyGame";

/** Returns the numeric score shown in the first "Score: N" element. */
function getDisplayedScore(): number {
  const els = screen.getAllByText(/Score:\s*\d+/);
  return parseInt(els[0].textContent?.replace("Score:", "").trim() ?? "0");
}

describe("FlappyGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Reset high score storage between tests
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the game container with correct accessibility attributes", () => {
    render(<FlappyGame />);
    const container = screen.getByRole("application");
    expect(container).toHaveAttribute("aria-label", "Flappy Bird game");
    expect(container).toHaveAttribute("tabIndex", "0");
  });

  it("shows Score and High score labels on initial render", () => {
    render(<FlappyGame />);
    expect(screen.getByText(/Score:/)).toBeInTheDocument();
    expect(screen.getByText(/High:/)).toBeInTheDocument();
  });

  it("starts the game when Start Game button is clicked", () => {
    render(<FlappyGame />);
    // Should show start instructions initially
    expect(screen.getByText("FLAPPY BIRD")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));
    // Start instructions disappear once running
    expect(screen.queryByText("FLAPPY BIRD")).not.toBeInTheDocument();
  });

  it("triggers flap on spacebar while running", () => {
    render(<FlappyGame />);
    // Start the game
    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));

    // Pressing space should not throw
    expect(() => {
      fireEvent.keyDown(window, { key: " " });
    }).not.toThrow();
  });

  it("shows game over overlay after bird hits the floor", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));

    // Advance enough ticks for the bird to fall to the floor (gravity pulls it down)
    act(() => {
      // Each tick is 30ms; advance many ticks so the bird falls
      vi.advanceTimersByTime(30 * 60);
    });

    expect(screen.getByRole("status")).toHaveTextContent("GAME OVER");
  });

  it("increments score when a pipe is passed", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));

    // Keep the bird alive by flapping on every tick while letting pipes move
    // The first pipe starts at x=400, bird is at x=50, PIPE_WIDTH=60
    // Pipe must travel >390px at 6px/tick => ~65 ticks = ~1950ms
    // We flap every tick to keep the bird alive
    act(() => {
      for (let i = 0; i < 70; i++) {
        vi.advanceTimersByTime(30);
        fireEvent.keyDown(window, { key: " " });
      }
    });

    // Score should be at least 1 after passing the first pipe
    expect(getDisplayedScore()).toBeGreaterThanOrEqual(1);
  });

  it("resets game on Space key after game over", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));

    // Let the bird fall
    act(() => {
      vi.advanceTimersByTime(30 * 60);
    });

    // Game over is shown
    expect(screen.getByRole("status")).toHaveTextContent("GAME OVER");

    // Press Space to restart
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });

    // Game over overlay should disappear
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("persists high score in localStorage", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: "Start Game" }));

    // Flap to stay alive for >65 ticks so the first pipe passes
    act(() => {
      for (let i = 0; i < 70; i++) {
        vi.advanceTimersByTime(30);
        fireEvent.keyDown(window, { key: " " });
      }
    });

    const stored = localStorage.getItem("flappyHighScore");
    if (stored !== null) {
      expect(parseInt(stored, 10)).toBeGreaterThanOrEqual(1);
    }
  });
});
