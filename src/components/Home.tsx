interface HomeProps {
  onPlaySnake?: () => void;
  onPlay2048?: () => void;
  onPlayTetris?: () => void;
  onPlayFlappy?: () => void;
}

function Home({ onPlaySnake, onPlay2048, onPlayTetris, onPlayFlappy }: HomeProps) {

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 relative overflow-hidden">
      {/* Arcade cabinet effect background */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500 rounded-full mix-blend-screen blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500 rounded-full mix-blend-screen blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center">
          {/* Marquee style title */}
          <div className="mb-8 relative">
            <div className="inline-block">
              <h1 className="text-8xl font-black mb-0 tracking-wider arcade-title" style={{
                background: 'linear-gradient(90deg, #FF006E, #FFBE0B, #3A86FF, #FB5607)',
                backgroundSize: '300% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 0 30px rgba(255,0,110,0.8)',
                animation: 'rainbow 3s linear infinite'
              }}>
                ARCADE
              </h1>
              <p className="text-3xl font-bold text-cyan-400 neon-text mt-2" style={{
                textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff, 0 0 30px #0088ff'
              }}>
                ▶ CHOOSE YOUR GAME ◀
              </p>
            </div>
          </div>

          {/* Game selection - arcade cabinet style */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto mt-16">
            {/* Snake Cabinet */}
            <button
              onClick={onPlaySnake}
              className="arcade-cabinet-button"
              style={{
                perspective: '1000px',
                transform: 'rotateY(0deg)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotateY(-5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotateY(0deg)';
              }}
            >
              <div className="bg-gray-800 border-4 border-yellow-400 rounded-lg p-6 relative shadow-2xl"
                style={{
                  boxShadow: '0 0 20px rgba(250,204,21,0.6), inset 0 0 20px rgba(34,197,94,0.2)'
                }}>
                <div className="bg-black rounded p-4 mb-4 border-2 border-green-500" style={{
                  boxShadow: 'inset 0 0 20px rgba(34,197,94,0.4)'
                }}>
                  <p className="text-6xl">🐍</p>
                </div>
                <h2 className="text-2xl font-black text-green-400 mb-2 neon-text" style={{
                  textShadow: '0 0 10px #00ff00, 0 0 20px #00aa00'
                }}>
                  SNAKE
                </h2>
                <p className="text-yellow-300 font-bold text-sm">CLASSIC ARCADE</p>
                <div className="mt-4 text-xs text-gray-400 font-mono">
                  ▲ ◄ ▼ ► MOVE  SPACE START
                </div>
              </div>
            </button>

            {/* 2048 Cabinet */}
            <button
              onClick={onPlay2048}
              className="arcade-cabinet-button"
              style={{
                perspective: '1000px',
                transform: 'rotateY(0deg)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotateY(5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotateY(0deg)';
              }}
            >
              <div className="bg-gray-800 border-4 border-pink-400 rounded-lg p-6 relative shadow-2xl"
                style={{
                  boxShadow: '0 0 20px rgba(244,114,182,0.6), inset 0 0 20px rgba(59,130,246,0.2)'
                }}>
                <div className="bg-black rounded p-4 mb-4 border-2 border-blue-500" style={{
                  boxShadow: 'inset 0 0 20px rgba(59,130,246,0.4)'
                }}>
                  <p className="text-6xl">🎯</p>
                </div>
                <h2 className="text-2xl font-black text-blue-400 mb-2 neon-text" style={{
                  textShadow: '0 0 10px #0088ff, 0 0 20px #0055ff'
                }}>
                  2048
                </h2>
                <p className="text-pink-300 font-bold text-sm">PUZZLE CHALLENGE</p>
                <div className="mt-4 text-xs text-gray-400 font-mono">
                  ▲ ◄ ▼ ► MOVE  ENTER PLAY
                </div>
              </div>
            </button>

            {/* Tetris Cabinet */}
            <button
              onClick={onPlayTetris}
              className="arcade-cabinet-button"
              style={{
                perspective: '1000px',
                transform: 'rotateY(0deg)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotateY(-5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotateY(0deg)';
              }}
            >
              <div className="bg-gray-800 border-4 border-red-400 rounded-lg p-6 relative shadow-2xl"
                style={{
                  boxShadow: '0 0 20px rgba(239,68,68,0.6), inset 0 0 20px rgba(34,197,94,0.2)'
                }}>
                <div className="bg-black rounded p-4 mb-4 border-2 border-cyan-400" style={{
                  boxShadow: 'inset 0 0 20px rgba(34,211,238,0.4)'
                }}>
                  <p className="text-6xl">⬜</p>
                </div>
                <h2 className="text-2xl font-black text-cyan-400 mb-2 neon-text" style={{
                  textShadow: '0 0 10px #00ffff, 0 0 20px #0088ff'
                }}>
                  TETRIS
                </h2>
                <p className="text-red-300 font-bold text-sm">FALLING BLOCKS</p>
                <div className="mt-4 text-xs text-gray-400 font-mono">
                  ▲ ◄ ▼ ► MOVE  SPACE START
                </div>
              </div>
            </button>

            {/* Flappy Bird Cabinet */}
            <button
              onClick={onPlayFlappy}
              className="arcade-cabinet-button"
              style={{
                perspective: '1000px',
                transform: 'rotateY(0deg)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) rotateY(5deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotateY(0deg)';
              }}
            >
              <div className="bg-gray-800 border-4 border-yellow-400 rounded-lg p-6 relative shadow-2xl"
                style={{
                  boxShadow: '0 0 20px rgba(250,204,21,0.6), inset 0 0 20px rgba(59,130,246,0.2)'
                }}>
                <div className="bg-black rounded p-4 mb-4 border-2 border-yellow-400" style={{
                  boxShadow: 'inset 0 0 20px rgba(250,204,21,0.4)'
                }}>
                  <p className="text-6xl">🐦</p>
                </div>
                <h2 className="text-2xl font-black text-yellow-400 mb-2 neon-text" style={{
                  textShadow: '0 0 10px #ffff00, 0 0 20px #ffaa00'
                }}>
                  FLAPPY BIRD
                </h2>
                <p className="text-blue-300 font-bold text-sm">PIPE DODGER</p>
                <div className="mt-4 text-xs text-gray-400 font-mono">
                  SPACE CLICK FLAP  AVOID PIPES
                </div>
              </div>
            </button>
          </div>

          {/* Arcade footer */}
          <div className="mt-16 text-center">
            <p className="text-gray-500 font-mono text-sm tracking-wider">
              ★ INSERT COIN ★ © 2026 ARCADE GAMES INC ★ TOKENS: ∞ ★
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes rainbow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&display=swap');

        .arcade-title {
          font-family: 'Orbitron', monospace;
          letter-spacing: 4px;
        }

        .neon-text {
          font-family: 'Orbitron', monospace;
          letter-spacing: 2px;
        }

        .arcade-cabinet-button {
          all: unset;
          cursor: pointer;
          display: block;
          width: 100%;
        }

        .arcade-cabinet-button:active div {
          transform: translateY(2px);
          box-shadow: 0 0 15px rgba(250,204,21,0.4), inset 0 0 20px rgba(34,197,94,0.1) !important;
        }
      `}</style>
    </div>
  );
}

export default Home;
