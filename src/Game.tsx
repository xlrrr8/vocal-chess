import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Chess } from "chess.js";
import ChessBoard from "./ChessBoard";
import VoiceController, { VoiceStatus } from "./VoiceController";


const initialGame = new Chess();

export type MoveRecord = {
  san: string;
  moveNumber: number;
};

const App: React.FC = () => {
  const gameRef = useRef(new Chess());
  const [fen, setFen] = useState(gameRef.current.fen());
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [lastCommand, setLastCommand] = useState<string>("");
  const movesEndRef = useRef<HTMLDivElement>(null);



  useEffect(() => {
    movesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [moves]);

  const safeUpdateGame = () => {
    const game = gameRef.current;
    setFen(game.fen());
    const history = game.history({ verbose: true });
    const formatted: MoveRecord[] = history.map((m, i) => ({
      san: m.san,
      moveNumber: Math.floor(i / 2) + 1,
    }));
    setMoves(formatted);
  };

  const handleSquareClick = (from: string, to: string) => {
    try {
      const move = gameRef.current.move({ from, to, promotion: "q" });
      if (move) {
        safeUpdateGame();
      }
    } catch (e) {
      // Invalid move
    }
  };

  const handleVoiceMove = (from: string, to: string) => {
    try {
      const move = gameRef.current.move({ from, to, promotion: "q" });
      if (move) {
        safeUpdateGame();
      } else {
        throw new Error("Invalid move");
      }
    } catch (e) {
      throw new Error("Invalid move");
    }
  };



  const handleNewGame = () => {
    gameRef.current = new Chess();
    safeUpdateGame();
    setLastCommand("");
  };

  const handleUndo = () => {
    gameRef.current.undo();
    safeUpdateGame();
  };

  const game = gameRef.current;
  const isGameOver = game.isGameOver();
  let gameStatus = "";
  let winner = "";

  if (game.isCheckmate()) {
    const winnerColor = game.turn() === "w" ? "Black" : "White";
    gameStatus = `Checkmate — ${winnerColor} wins`;
    winner = winnerColor;
  } else if (game.isDraw()) {
    gameStatus = "Draw";
  } else if (game.isStalemate()) {
    gameStatus = "Stalemate";
  } else if (game.isCheck()) {
    gameStatus = `${game.turn() === "w" ? "White" : "Black"} is in check`;
  } else {
    gameStatus = `${game.turn() === "w" ? "White" : "Black"} to move`;
  }

  return (
    <div className="app-root">
      {isGameOver && (
        <div className="game-over-overlay">
          <div className="game-over-modal">
            <h2>Game Over</h2>
            <p className="result-text">{gameStatus}</p>
            {winner && <p className="winner-text">Winner: {winner}</p>}
            <button className="primary-btn" onClick={handleNewGame}>
              New Game
            </button>
          </div>
        </div>
      )}

      <div className="app-shell">
        <header className="app-header">
          <div>
            <h1 className="app-title">Vocal chess</h1>
            <p className="app-subtitle">Play chess. Speak your moves.</p>
          </div>
          <div className="header-actions">
            <Link to="/" className="ghost-btn back-btn">
              <span className="back-arrow">←</span>
              Back to Home
            </Link>
            <button className="ghost-btn" onClick={handleNewGame}>
              New Game
            </button>
            <button className="ghost-btn" onClick={handleUndo} disabled={!moves.length || isGameOver}>
              Undo
            </button>
          </div>
        </header>

        <main className="app-main">
          <section className="board-section">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Board</span>
                <span className="badge">{gameStatus}</span>
              </div>
              <ChessBoard fen={fen} onMove={handleSquareClick} />
            </div>


          </section>

          <section className="side-section">
            <div className="card">
              <div className="card-header">
                <span className="card-title">Voice Control</span>
              </div>
              <VoiceController
                onMove={handleVoiceMove}
                onNewGame={handleNewGame}
                onUndo={handleUndo}
                status={voiceStatus}
                setStatus={setVoiceStatus}
                setLastCommand={setLastCommand}
              />
              <div className="last-command">
                <span className="label">Last command</span>
                <span className="value">
                  {lastCommand || "Say something like: “e2 to e4”"}
                </span>
              </div>
              <div className="tips">
                <h3>Try saying:</h3>
                <ul>
                  <li>“e2 to e4”</li>
                  <li>“knight g1 to f3”</li>
                  <li>“castle kingside” / “castle queenside”</li>
                  <li>“undo” or “new game”</li>
                </ul>
              </div>
            </div>

            <div className="card moves-card">
              <div className="card-header">
                <span className="card-title">Moves</span>
              </div>
              <div className="moves-list">
                {moves.length === 0 && (
                  <p className="empty-state">No moves yet. Start the game!</p>
                )}
                {moves.length > 0 && (
                  <ol>
                    {(() => {
                      const rows: JSX.Element[] = [];
                      for (let i = 0; i < moves.length; i += 2) {
                        rows.push(
                          <li key={i} className="moves-row">
                            <span className="move-number">
                              {moves[i].moveNumber}.
                            </span>
                            <span className="move-san">
                              {moves[i]?.san || ""}
                            </span>
                            <span className="move-san">
                              {moves[i + 1]?.san || ""}
                            </span>
                          </li>
                        );
                      }
                      return rows;
                    })()}
                    <div ref={movesEndRef} />
                  </ol>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <span>Built for voice-first chess in a dark, minimal UI.</span>
        </footer>
      </div>
    </div>
  );
};

export default App;
