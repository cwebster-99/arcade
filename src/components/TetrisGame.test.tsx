import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import TetrisGame from "./TetrisGame";

describe("TetrisGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the game container with correct ARIA attributes", () => {
    render(<TetrisGame />);
    expect(
      screen.getByRole("application", { name: /tetris game/i }),
    ).toBeInTheDocument();
  });

  it("shows SCORE, LINES, LEVEL labels in the stats panel", () => {
    render(<TetrisGame />);
    expect(screen.getByText("SCORE")).toBeInTheDocument();
    expect(screen.getByText("LINES")).toBeInTheDocument();
    expect(screen.getByText("LEVEL")).toBeInTheDocument();
    // Initial values: score=0, lines=0, level=1
    const statValues = screen
      .getAllByText(/^[01]$/, { selector: ".font-mono" })
      .map((el) => el.textContent);
    expect(statValues).toContain("0");
    expect(statValues).toContain("1");
  });

  it("renders START and RESET buttons initially", () => {
    render(<TetrisGame />);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("starts the game on Space key press", () => {
    render(<TetrisGame />);
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("starts the game on Enter key press", () => {
    render(<TetrisGame />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("toggles pause/resume with the start/pause button", () => {
    render(<TetrisGame />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /pause/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("resets the game with the RESET button", () => {
    render(<TetrisGame />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("accepts left/right arrow key input while running", () => {
    render(<TetrisGame />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    // These should not throw
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    fireEvent.keyDown(window, { key: "ArrowRight" });
    fireEvent.keyDown(window, { key: "ArrowDown" });
    // Arrow up / space rotate
    fireEvent.keyDown(window, { key: "ArrowUp" });
    expect(
      screen.getByRole("application", { name: /tetris game/i }),
    ).toBeInTheDocument();
  });

  it("advances the game loop when running", () => {
    render(<TetrisGame />);
    fireEvent.click(screen.getByRole("button", { name: /start/i }));
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    // Game should still be running or game-over; either way it doesn't crash
    expect(
      screen.getByRole("application", { name: /tetris game/i }),
    ).toBeInTheDocument();
  });
});
