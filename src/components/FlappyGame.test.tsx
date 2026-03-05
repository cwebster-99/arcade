import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import FlappyGame from "./FlappyGame";

describe("FlappyGame", () => {
  it("renders with correct ARIA role and label", () => {
    render(<FlappyGame />);
    expect(
      screen.getByRole("application", { name: /flappy bird game/i }),
    ).toBeInTheDocument();
  });

  it("has tabIndex on the game container", () => {
    render(<FlappyGame />);
    const container = screen.getByRole("application", {
      name: /flappy bird game/i,
    });
    expect(container).toHaveAttribute("tabindex", "0");
  });

  it("renders Start buttons when idle", () => {
    render(<FlappyGame />);
    // Idle state has two: header button ("Start") + overlay button ("Start Game")
    const startButtons = screen.getAllByRole("button", { name: /start/i });
    expect(startButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("renders score and high score", () => {
    render(<FlappyGame />);
    expect(screen.getByText(/score:/i)).toBeInTheDocument();
    expect(screen.getByText(/high:/i)).toBeInTheDocument();
  });

  it("renders the game canvas area", () => {
    render(<FlappyGame />);
    expect(
      screen.getByRole("grid", { name: /game canvas/i }),
    ).toBeInTheDocument();
  });

  it("renders the bird SVG", () => {
    render(<FlappyGame />);
    expect(screen.getByRole("img", { name: /bird/i })).toBeInTheDocument();
  });

  it("shows start overlay text when idle", () => {
    render(<FlappyGame />);
    expect(screen.getByText(/click or press space to flap/i)).toBeInTheDocument();
  });

  it("transitions to playing state when Start Game overlay button is clicked", async () => {
    const user = userEvent.setup();
    render(<FlappyGame />);
    // Click the in-canvas Start Game button
    await user.click(screen.getByRole("button", { name: /start game/i }));
    // Overlay disappears; header button now reads "Playing..."
    expect(screen.getByRole("button", { name: /playing/i })).toBeInTheDocument();
  });

  it("renders keyboard instructions", () => {
    render(<FlappyGame />);
    expect(screen.getByText(/click the game area/i)).toBeInTheDocument();
  });
});
