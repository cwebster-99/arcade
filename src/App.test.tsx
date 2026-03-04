import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import App from "./App";

describe("App", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders the home page by default", () => {
    render(<App />);
    // Home page contains the game selection cards
    expect(screen.getByText(/snake/i)).toBeInTheDocument();
    expect(screen.getByText(/2048/i)).toBeInTheDocument();
    expect(screen.getByText(/tetris/i)).toBeInTheDocument();
    expect(screen.getByText(/flappy/i)).toBeInTheDocument();
  });

  it("renders skip-to-main-content link", () => {
    render(<App />);
    expect(
      screen.getByRole("link", { name: /skip to main content/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the Snake game", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /snake/i }));
    expect(
      screen.getByRole("application", { name: /snake game/i }),
    ).toBeInTheDocument();
  });

  it("navigates back to home from a game", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /snake/i }));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    // Home cards should be visible again
    expect(screen.getByText(/2048/i)).toBeInTheDocument();
  });

  it("navigates to the 2048 game", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /2048/i }));
    expect(
      screen.getByRole("application", { name: /2048 game/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the Tetris game", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /tetris/i }));
    expect(
      screen.getByRole("application", { name: /tetris game/i }),
    ).toBeInTheDocument();
  });

  it("navigates to the Flappy Bird game", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /flappy/i }));
    expect(
      screen.getByRole("application", { name: /flappy bird game/i }),
    ).toBeInTheDocument();
  });

  it("toggles the theme and persists it in localStorage", () => {
    render(<App />);
    // Theme toggle is in the GameLayout header, navigate to a game first
    fireEvent.click(screen.getByRole("button", { name: /snake/i }));
    const toggleBtn = screen.getByRole("button", { name: /dark mode/i });
    fireEvent.click(toggleBtn);
    expect(localStorage.getItem("theme")).toBe("dark");
    // Button label should now read "Light Mode"
    expect(
      screen.getByRole("button", { name: /light mode/i }),
    ).toBeInTheDocument();
  });

  it("loads persisted theme from localStorage", () => {
    localStorage.setItem("theme", "dark");
    render(<App />);
    // Navigate to a game so the theme toggle button is rendered
    fireEvent.click(screen.getByRole("button", { name: /snake/i }));
    expect(
      screen.getByRole("button", { name: /light mode/i }),
    ).toBeInTheDocument();
  });
});

describe("App — theme toggle is accessible from game views", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("shows theme toggle button inside a game view", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: /snake/i }));
    expect(
      screen.getByRole("button", { name: /dark mode|light mode/i }),
    ).toBeInTheDocument();
  });
});
