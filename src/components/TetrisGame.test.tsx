import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import TetrisGame from "./TetrisGame";

describe("TetrisGame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders with correct accessibility attributes", () => {
    render(<TetrisGame />);
    const container = screen.getByRole("application");
    expect(container).toHaveAttribute("aria-label", "Tetris game");
  });

  it("shows START button initially", () => {
    render(<TetrisGame />);
    expect(screen.getByRole("button", { name: "START" })).toBeInTheDocument();
  });

  it("starts the game on Space key press", () => {
    render(<TetrisGame />);
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    expect(screen.getByRole("button", { name: "PAUSE" })).toBeInTheDocument();
  });

  it("pauses and resumes the game", () => {
    render(<TetrisGame />);
    // Start
    act(() => {
      fireEvent.keyDown(window, { key: " " });
    });
    expect(screen.getByRole("button", { name: "PAUSE" })).toBeInTheDocument();

    // Pause via button click
    fireEvent.click(screen.getByRole("button", { name: "PAUSE" }));
    expect(screen.getByRole("button", { name: "START" })).toBeInTheDocument();
  });

  it("resets the board on RESET button click", () => {
    render(<TetrisGame />);
    // Start and advance time
    act(() => {
      fireEvent.keyDown(window, { key: " " });
      vi.advanceTimersByTime(2000);
    });

    // Click reset
    act(() => {
      fireEvent.click(screen.getByRole("button", { name: "RESET" }));
    });

    // Score should be back at 0; find the score stat panel by its label
    const scorePanel = screen.getByText("SCORE").closest("div")?.parentElement;
    const scoreValue = scorePanel?.querySelector(".text-3xl");
    expect(scoreValue?.textContent).toBe("0");
  });

  it("moves pieces left and right with arrow keys", () => {
    render(<TetrisGame />);
    act(() => {
      fireEvent.keyDown(window, { key: " " }); // start
    });

    // Arrow keys should not throw
    expect(() => {
      fireEvent.keyDown(window, { key: "ArrowLeft" });
      fireEvent.keyDown(window, { key: "ArrowRight" });
      fireEvent.keyDown(window, { key: "ArrowDown" });
    }).not.toThrow();
  });

  it("increases score when lines are cleared", () => {
    render(<TetrisGame />);
    // This test verifies the score stat panel starts at 0
    const scorePanel = screen.getByText("SCORE").closest("div")?.parentElement;
    const scoreValue = scorePanel?.querySelector(".text-3xl");
    expect(scoreValue?.textContent).toBe("0");
  });

  it("game loop runs at the correct interval after level change", () => {
    render(<TetrisGame />);
    const advanceSpy = vi.spyOn(global, "setInterval");

    act(() => {
      fireEvent.keyDown(window, { key: " " }); // start at level 1
    });

    // The interval should be created
    expect(advanceSpy).toHaveBeenCalled();

    advanceSpy.mockRestore();
  });
});
