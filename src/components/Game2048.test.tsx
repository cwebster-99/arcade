import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import Game2048 from "./Game2048";

describe("Game2048", () => {
  it("renders with correct ARIA role and label", () => {
    render(<Game2048 />);
    expect(
      screen.getByRole("application", { name: /2048 game/i }),
    ).toBeInTheDocument();
  });

  it("renders the game board grid", () => {
    render(<Game2048 />);
    expect(
      screen.getByRole("grid", { name: /2048 board/i }),
    ).toBeInTheDocument();
  });

  it("renders the score display", () => {
    render(<Game2048 />);
    expect(screen.getByText(/score/i)).toBeInTheDocument();
  });

  it("renders the New Game button initially", () => {
    render(<Game2048 />);
    expect(
      screen.getByRole("button", { name: /new game/i }),
    ).toBeInTheDocument();
  });

  it("renders keyboard instructions", () => {
    render(<Game2048 />);
    expect(screen.getByText(/wasd/i)).toBeInTheDocument();
  });

  it("has tabIndex on the game container", () => {
    render(<Game2048 />);
    const container = screen.getByRole("application", { name: /2048 game/i });
    expect(container).toHaveAttribute("tabindex", "0");
  });

  it("starts with a score of 0", () => {
    render(<Game2048 />);
    // The score element shows "Score: 0"
    expect(screen.getByText("Score: 0")).toBeInTheDocument();
  });

  it("resets the game when New Game is clicked", async () => {
    const user = userEvent.setup();
    render(<Game2048 />);
    await user.click(screen.getByRole("button", { name: /new game/i }));
    // After reset score is still 0
    expect(screen.getByText("Score: 0")).toBeInTheDocument();
  });
});
