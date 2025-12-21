import React, { useMemo, useState } from "react";
import { Chess } from "chess.js";

interface ChessBoardProps {
  fen: string;
  onMove: (from: string, to: string) => void;
}

type Square = {
  file: string;
  rank: number;
  coord: string;
};

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

const ChessBoard: React.FC<ChessBoardProps> = ({ fen, onMove }) => {
  const [selected, setSelected] = useState<string | null>(null);

  const pieceMap = useMemo(() => {
    const chess = new Chess(fen);
    const map: Record<string, string> = {};
    for (let file of FILES) {
      for (let rank of RANKS) {
        const sq = `${file}${rank}`;
        const piece = chess.get(sq as any);
        if (piece) {
          map[sq] = (piece.color === "w" ? piece.type.toUpperCase() : piece.type.toLowerCase());
        }
      }
    }
    return map;
  }, [fen]);

  const squares: Square[] = [];
  for (const rank of RANKS) {
    for (const file of FILES) {
      squares.push({ file, rank, coord: `${file}${rank}` });
    }
  }

  const handleSquareClick = (coord: string) => {
    if (!selected) {
      setSelected(coord);
      return;
    }
    if (selected === coord) {
      setSelected(null);
      return;
    }
    onMove(selected, coord);
    setSelected(null);
  };

  const renderPiece = (symbol: string) => {
    const isWhite = symbol === symbol.toUpperCase();
    const type = symbol.toLowerCase();

    const baseClass = "piece";
    const classes = [baseClass, isWhite ? "piece-white" : "piece-black", `piece-${type}`].join(" ");

    const unicodeMap: Record<string, string> = {
      p: isWhite ? "♙" : "♟",
      r: isWhite ? "♖" : "♜",
      n: isWhite ? "♘" : "♞",
      b: isWhite ? "♗" : "♝",
      q: isWhite ? "♕" : "♛",
      k: isWhite ? "♔" : "♚",
    };

    return <span className={classes}>{unicodeMap[type]}</span>;
  };

  return (
    <div className="board-wrapper">
      <div className="board-coords board-coords-left">
        {RANKS.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
      <div className="board-coords board-coords-bottom">
        {FILES.map((f) => (
          <span key={f}>{f}</span>
        ))}
      </div>
      <div className="board">
        {squares.map((sq, idx) => {
          const isDark = (FILES.indexOf(sq.file) + RANKS.indexOf(sq.rank)) % 2 === 1;
          const piece = pieceMap[sq.coord];
          const isSelected = selected === sq.coord;
          return (
            <button
              key={sq.coord}
              aria-label={sq.coord}
              className={[
                "square",
                isDark ? "square-dark" : "square-light",
                isSelected ? "square-selected" : "",
              ].join(" ")}
              onClick={() => handleSquareClick(sq.coord)}
            >
              {piece && renderPiece(piece)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ChessBoard;
