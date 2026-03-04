import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import FlappyGame from "./FlappyGame";

describe("FlappyGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the game container with correct ARIA attributes", () => {
    render(<FlappyGame />);
    expect(
      screen.getByRole("application", { name: /flappy bird game/i }),
    ).toBeInTheDocument();
  });

  it("shows score 0 and high score 0 initially", () => {
    render(<FlappyGame />);
    expect(screen.getByText(/score:\s*0/i)).toBeInTheDocument();
    expect(screen.getByText(/high:\s*0/i)).toBeInTheDocument();
  });

  it("loads persisted high score from localStorage", () => {
    localStorage.setItem("flappyHighScore", "7");
    render(<FlappyGame />);
    expect(screen.getByText(/high:\s*7/i)).toBeInTheDocument();
  });

  it("renders the Start Game overlay button before game starts", () => {
    render(<FlappyGame />);
    expect(
      screen.getByRole("button", { name: /start game/i }),
    ).toBeInTheDocument();
  });

  it("starts the game when the Start Game overlay button is clicked", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    // Header button now shows "Playing..."
    expect(screen.getByRole("button", { name: /playing/i })).toBeInTheDocument();
  });

  it("makes the bird flap on Space key while running", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    // Flap — should not throw
    fireEvent.keyDown(window, { key: " " });
    expect(
      screen.getByRole("application", { name: /flappy bird game/i }),
    ).toBeInTheDocument();
  });

  it("shows game over overlay when bird hits the floor", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    // Advance time far enough for gravity to pull the bird to the floor.
    // Starting at y=200, gravity=0.5/tick, 30ms interval → hits floor in ~340 ticks.
    act(() => {
      vi.advanceTimersByTime(30 * 350);
    });
    expect(screen.getByText(/game over/i)).toBeInTheDocument();
  });

  it("Restart button resets the game after game over", () => {
    render(<FlappyGame />);
    fireEvent.click(screen.getByRole("button", { name: /start game/i }));
    act(() => {
      vi.advanceTimersByTime(30 * 350);
    });
    // Click the Restart button (top control bar)
    fireEvent.click(screen.getByRole("button", { name: /restart/i }));
    // Score should reset to 0 and game should be running
    expect(screen.getByText(/score:\s*0/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /playing/i })).toBeInTheDocument();
  });
});
