import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Home from "./Home";

describe("Home", () => {
  it("renders the arcade title", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders all four game buttons", () => {
    render(<Home />);
    expect(screen.getByText(/snake/i)).toBeInTheDocument();
    expect(screen.getByText(/2048/i)).toBeInTheDocument();
    expect(screen.getByText(/tetris/i)).toBeInTheDocument();
    expect(screen.getByText(/flappy bird/i)).toBeInTheDocument();
  });

  it("calls onPlaySnake when the Snake button is clicked", async () => {
    const user = userEvent.setup();
    const onPlaySnake = vi.fn();
    render(<Home onPlaySnake={onPlaySnake} />);
    await user.click(screen.getByRole("button", { name: /snake/i }));
    expect(onPlaySnake).toHaveBeenCalledTimes(1);
  });

  it("calls onPlay2048 when the 2048 button is clicked", async () => {
    const user = userEvent.setup();
    const onPlay2048 = vi.fn();
    render(<Home onPlay2048={onPlay2048} />);
    await user.click(screen.getByRole("button", { name: /2048/i }));
    expect(onPlay2048).toHaveBeenCalledTimes(1);
  });

  it("calls onPlayTetris when the Tetris button is clicked", async () => {
    const user = userEvent.setup();
    const onPlayTetris = vi.fn();
    render(<Home onPlayTetris={onPlayTetris} />);
    await user.click(screen.getByRole("button", { name: /tetris/i }));
    expect(onPlayTetris).toHaveBeenCalledTimes(1);
  });

  it("calls onPlayFlappy when the Flappy Bird button is clicked", async () => {
    const user = userEvent.setup();
    const onPlayFlappy = vi.fn();
    render(<Home onPlayFlappy={onPlayFlappy} />);
    await user.click(screen.getByRole("button", { name: /flappy bird/i }));
    expect(onPlayFlappy).toHaveBeenCalledTimes(1);
  });
});
