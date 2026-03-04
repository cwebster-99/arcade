import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import Home from "./Home";

describe("Home", () => {
  const noop = vi.fn();

  it("renders all four game cards", () => {
    render(
      <Home
        onPlaySnake={noop}
        onPlay2048={noop}
        onPlayTetris={noop}
        onPlayFlappy={noop}
      />,
    );

    expect(screen.getByText(/snake/i)).toBeInTheDocument();
    expect(screen.getByText(/2048/i)).toBeInTheDocument();
    expect(screen.getByText(/tetris/i)).toBeInTheDocument();
    expect(screen.getByText(/flappy/i)).toBeInTheDocument();
  });

  it("calls onPlaySnake when the Snake card is clicked", async () => {
    const onPlaySnake = vi.fn();
    render(
      <Home
        onPlaySnake={onPlaySnake}
        onPlay2048={noop}
        onPlayTetris={noop}
        onPlayFlappy={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /snake/i }));
    expect(onPlaySnake).toHaveBeenCalledOnce();
  });

  it("calls onPlay2048 when the 2048 card is clicked", async () => {
    const onPlay2048 = vi.fn();
    render(
      <Home
        onPlaySnake={noop}
        onPlay2048={onPlay2048}
        onPlayTetris={noop}
        onPlayFlappy={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /2048/i }));
    expect(onPlay2048).toHaveBeenCalledOnce();
  });

  it("calls onPlayTetris when the Tetris card is clicked", async () => {
    const onPlayTetris = vi.fn();
    render(
      <Home
        onPlaySnake={noop}
        onPlay2048={noop}
        onPlayTetris={onPlayTetris}
        onPlayFlappy={noop}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /tetris/i }));
    expect(onPlayTetris).toHaveBeenCalledOnce();
  });

  it("calls onPlayFlappy when the Flappy Bird card is clicked", async () => {
    const onPlayFlappy = vi.fn();
    render(
      <Home
        onPlaySnake={noop}
        onPlay2048={noop}
        onPlayTetris={noop}
        onPlayFlappy={onPlayFlappy}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /flappy/i }));
    expect(onPlayFlappy).toHaveBeenCalledOnce();
  });
});
