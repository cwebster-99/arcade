import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import App from "./App";

describe("App", () => {
  it("renders the Home screen by default", () => {
    render(<App />);
    // Home screen shows the ARCADE heading
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("navigates to Snake game when Snake is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /snake/i }));
    expect(
      screen.getByRole("application", { name: /snake game/i }),
    ).toBeInTheDocument();
  });

  it("navigates to 2048 game when 2048 is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /2048/i }));
    expect(
      screen.getByRole("application", { name: /2048 game/i }),
    ).toBeInTheDocument();
  });

  it("navigates to Tetris game when Tetris is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /tetris/i }));
    expect(
      screen.getByRole("application", { name: /tetris game/i }),
    ).toBeInTheDocument();
  });

  it("navigates to Flappy Bird game when Flappy Bird is clicked", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /flappy bird/i }));
    expect(
      screen.getByRole("application", { name: /flappy bird game/i }),
    ).toBeInTheDocument();
  });

  it("returns to Home when Back is clicked from Snake", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /snake/i }));
    await user.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the skip-to-content link", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: /skip to main content/i }),
    ).toBeInTheDocument();
  });

  it("renders the theme toggle button while in a game", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /snake/i }));
    expect(
      screen.getByRole("button", { name: /dark mode|light mode/i }),
    ).toBeInTheDocument();
  });
});
