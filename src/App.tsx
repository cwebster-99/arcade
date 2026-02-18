import { ReactNode, useState } from "react";
import Home from "./components/Home";
import SnakeGame from "./components/SnakeGame";
import Game2048 from "./components/Game2048";
import TetrisGame from "./components/TetrisGame";
import FlappyGame from "./components/FlappyGame";

interface GameLayoutProps {
  title: string;
  children: ReactNode;
  onBack: () => void;
  onThemeChange: () => void;
  theme: "light" | "dark";
  bgColor?: string;
}

function GameLayout({
  title,
  children,
  onBack,
  onThemeChange,
  theme,
  bgColor = "bg-white",
}: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <header className="text-center mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="text-sm text-blue-600 underline"
            >
              &larr; Back
            </button>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">{title}</h1>
            <button
              onClick={onThemeChange}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                theme === "dark"
                  ? "bg-gray-700 text-white hover:bg-gray-600"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
            >
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </header>
        <main
          className={
            bgColor === "bg-black" ? "max-w-4xl mx-auto" : "max-w-2xl mx-auto"
          }
        >
          <div className={`${bgColor} rounded-lg shadow-lg p-6 mb-6`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem("theme");
      return stored === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  const [view, setView] = useState<
    "home" | "snake" | "2048" | "tetris" | "flappy"
  >("home");

  const handleThemeChange = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    try {
      localStorage.setItem("theme", newTheme);
    } catch {
      // localStorage may be unavailable
    }
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <div>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-white dark:bg-gray-800 px-3 py-2 rounded shadow"
      >
        Skip to main content
      </a>

      {view === "home" && (
        <Home
          onPlaySnake={() => setView("snake")}
          onPlay2048={() => setView("2048")}
          onPlayTetris={() => setView("tetris")}
          onPlayFlappy={() => setView("flappy")}
        />
      )}

      {view === "snake" && (
        <GameLayout
          title="Snake"
          onBack={() => setView("home")}
          onThemeChange={handleThemeChange}
          theme={theme}
        >
          <SnakeGame />
        </GameLayout>
      )}

      {view === "2048" && (
        <GameLayout
          title="2048"
          onBack={() => setView("home")}
          onThemeChange={handleThemeChange}
          theme={theme}
        >
          <Game2048 />
        </GameLayout>
      )}

      {view === "tetris" && (
        <GameLayout
          title="TETRIS"
          onBack={() => setView("home")}
          onThemeChange={handleThemeChange}
          theme={theme}
          bgColor="bg-black"
        >
          <TetrisGame />
        </GameLayout>
      )}

      {view === "flappy" && (
        <GameLayout
          title="FLAPPY BIRD"
          onBack={() => setView("home")}
          onThemeChange={handleThemeChange}
          theme={theme}
        >
          <FlappyGame />
        </GameLayout>
      )}
    </div>
  );
}

export default App;
