import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import SnakeGame from "./SnakeGame";

describe("SnakeGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the game container with correct ARIA attributes", () => {
    render(<SnakeGame />);
    const container = screen.getByRole("application", { name: /snake game/i });
    expect(container).toBeInTheDocument();
  });

  it("renders the board grid", () => {
    render(<SnakeGame />);
    expect(screen.getByRole("grid", { name: /snake board/i })).toBeInTheDocument();
  });

  it("renders Start, Reset buttons and score label initially", () => {
    render(<SnakeGame />);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
    // Score label is present
    expect(screen.getByText(/score:/i)).toBeInTheDocument();
    // Score value starts at 0 (it lives in a child <span>)
    expect(screen.getByText("0", { selector: "span.font-semibold" })).toBeInTheDocument();
  });

  it("renders food cell with aria-label 'Food'", () => {
    render(<SnakeGame />);
    expect(screen.getByRole("img", { name: /food/i })).toBeInTheDocument();
  });

  it("starts the game on Space key press", () => {
    render(<SnakeGame />);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: " " });
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("starts the game on Enter key press", () => {
    render(<SnakeGame />);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("pauses and resumes with start/pause button", () => {
    render(<SnakeGame />);
    const startBtn = screen.getByRole("button", { name: /start/i });
    fireEvent.click(startBtn);
    const pauseBtn = screen.getByRole("button", { name: /pause/i });
    fireEvent.click(pauseBtn);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("shows game over message after a wall collision", () => {
    // Place food at [0,0] — far from the rightward-moving snake (starts at row 10).
    // With fixed food, the snake never eats it so the game loop interval is stable.
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
    render(<SnakeGame />);
    fireEvent.keyDown(window, { key: " " });
    // Snake starts at col 10 heading right; hits right wall (col ≥ 20) after 10 moves.
    // Advance one tick at a time so each React state update is flushed by act().
    for (let i = 0; i < 12; i++) {
      act(() => {
        vi.advanceTimersByTime(120);
      });
    }
    expect(screen.getByText(/game over/i)).toBeInTheDocument();
    randomSpy.mockRestore();
  });

  it("reset button resets the game state", () => {
    render(<SnakeGame />);
    // Start game then reset
    fireEvent.keyDown(window, { key: " " });
    fireEvent.click(screen.getByRole("button", { name: /reset/i }));
    // After reset the score should be 0 and the Start button visible
    expect(screen.getByText("0", { selector: "span.font-semibold" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });
});
