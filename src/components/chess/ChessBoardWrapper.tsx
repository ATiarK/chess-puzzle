'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';

export interface PieceDropArgs {
  sourceSquare: string;
  targetSquare: string;
  piece: string;
}

export interface ChessBoardWrapperProps {
  fen: string;
  onPieceDrop?: (args: PieceDropArgs) => boolean;
  onSquareClick?: (square: string) => void;
  boardOrientation?: 'white' | 'black';
  arePiecesDraggable?: boolean;
  customSquareStyles?: Record<string, React.CSSProperties>;
  className?: string;
  showBoardNotation?: boolean;
}

export function ChessBoardWrapper({
  fen,
  onPieceDrop,
  onSquareClick,
  boardOrientation = 'white',
  arePiecesDraggable = true,
  customSquareStyles = {},
  className = '',
  showBoardNotation = true,
}: ChessBoardWrapperProps) {
  const [boardWidth, setBoardWidth] = useState<number>(440);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function updateSize() {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth;
        setBoardWidth(Math.min(Math.max(width, 240), 600));
      }
    }

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`w-full max-w-[600px] aspect-square mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800/80 bg-slate-900/80 p-2 sm:p-4 backdrop-blur-md transition-all ${className}`}
    >
      <div className="w-full h-full flex items-center justify-center">
        <Chessboard
          options={{
            position: fen,
            boardOrientation,
            allowDragging: arePiecesDraggable,
            showNotation: showBoardNotation,
            darkSquareStyle: { backgroundColor: '#1e293b' },
            lightSquareStyle: { backgroundColor: '#334155' },
            squareStyles: customSquareStyles,
            animationDurationInMs: 200,
            onPieceDrop: onPieceDrop
              ? ({ sourceSquare, targetSquare, piece }) => {
                  if (!targetSquare) return false;
                  return onPieceDrop({
                    sourceSquare,
                    targetSquare,
                    piece: piece.pieceType,
                  });
                }
              : undefined,
            onSquareClick: onSquareClick
              ? ({ square }) => {
                  onSquareClick(square);
                }
              : undefined,
          }}
        />
      </div>
    </div>
  );
}
