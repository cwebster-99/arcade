import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import TetrisGame from "./TetrisGame";

describe("TetrisGame", () => {
  it("renders with correct ARIA role and label", () => {
    render(<TetrisGame />);
    expect(
      screen.getByRole("application", { name: /tetris game/i }),
    ).toBeInTheDocument();
  });

  it("has tabIndex on the game container", () => {
    render(<TetrisGame />);
    const container = screen.getByRole("application", { name: /tetris game/i });
    expect(container).toHaveAttribute("tabindex", "0");
  });

  it("renders START button when idle", () => {
    render(<TetrisGame />);
    expect(
      screen.getByRole("button", { name: /start/i }),
    ).toBeInTheDocument();
  });

  it("renders RESET button", () => {
    render(<TetrisGame />);
    expect(
      screen.getByRole("button", { name: /reset/i }),
    ).toBeInTheDocument();
  });

  it("renders score, lines, and level stats", () => {
    render(<TetrisGame />);
    expect(screen.getByText("SCORE")).toBeInTheDocument();
    expect(screen.getByText("LINES")).toBeInTheDocument();
    expect(screen.getByText("LEVEL")).toBeInTheDocument();
  });

  it("renders keyboard instructions", () => {
    render(<TetrisGame />);
    expect(screen.getByText(/space\/enter to start/i)).toBeInTheDocument();
  });

  it("shows PAUSE button after clicking START", async () => {
    const user = userEvent.setup();
    render(<TetrisGame />);
    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(
      screen.getByRole("button", { name: /pause/i }),
    ).toBeInTheDocument();
  });
});
