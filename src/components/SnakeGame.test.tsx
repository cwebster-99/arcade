import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import SnakeGame from "./SnakeGame";

describe("SnakeGame", () => {
  it("renders with correct ARIA role and label", () => {
    render(<SnakeGame />);
    expect(
      screen.getByRole("application", { name: /snake game/i }),
    ).toBeInTheDocument();
  });

  it("renders the game board grid", () => {
    render(<SnakeGame />);
    expect(
      screen.getByRole("grid", { name: /snake board/i }),
    ).toBeInTheDocument();
  });

  it("renders Start button when idle", () => {
    render(<SnakeGame />);
    expect(screen.getByRole("button", { name: /start/i })).toBeInTheDocument();
  });

  it("renders Reset button", () => {
    render(<SnakeGame />);
    expect(screen.getByRole("button", { name: /reset/i })).toBeInTheDocument();
  });

  it("renders the score", () => {
    render(<SnakeGame />);
    expect(screen.getByText(/score/i)).toBeInTheDocument();
  });

  it("renders the grid size slider", () => {
    render(<SnakeGame />);
    expect(screen.getByText(/grid size/i)).toBeInTheDocument();
  });

  it("renders the speed slider", () => {
    render(<SnakeGame />);
    expect(screen.getByText(/speed/i)).toBeInTheDocument();
  });

  it("shows Pause button after clicking Start", async () => {
    const user = userEvent.setup();
    render(<SnakeGame />);
    await user.click(screen.getByRole("button", { name: /start/i }));
    expect(screen.getByRole("button", { name: /pause/i })).toBeInTheDocument();
  });

  it("has tabIndex on the game container for keyboard focus", () => {
    render(<SnakeGame />);
    const container = screen.getByRole("application", { name: /snake game/i });
    expect(container).toHaveAttribute("tabindex", "0");
  });

  it("renders keyboard instructions", () => {
    render(<SnakeGame />);
    expect(screen.getByText(/arrow keys/i)).toBeInTheDocument();
  });
});
