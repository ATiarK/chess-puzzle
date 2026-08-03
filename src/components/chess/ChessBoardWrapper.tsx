'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { useBoardTheme } from '@/context/BoardThemeContext';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';
import { getCustomPieces } from '@/lib/chess/pieces';
import { RotateCcw, Palette } from 'lucide-react';

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
  showControls?: boolean;
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
  showControls = showBoardNotation,
}: ChessBoardWrapperProps) {
  const [boardWidth, setBoardWidth] = useState<number>(440);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { currentTheme, isFlipped, toggleFlip, pieceThemeId } = useBoardTheme();

  const effectiveOrientation = isFlipped
    ? boardOrientation === 'white'
      ? 'black'
      : 'white'
    : boardOrientation;

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
      className={`relative w-full max-w-[600px] mx-auto rounded-2xl overflow-hidden shadow-2xl shadow-black/50 border border-slate-800/80 bg-slate-900/80 p-2 sm:p-4 backdrop-blur-md transition-all ${className}`}
    >
      <div className="w-full aspect-square flex items-center justify-center">
        <Chessboard
          options={{
            position: fen,
            boardOrientation: effectiveOrientation,
            allowDragging: arePiecesDraggable,
            showNotation: showBoardNotation,
            lightSquareStyle: currentTheme.lightSquareStyle,
            darkSquareStyle: currentTheme.darkSquareStyle,
            squareStyles: customSquareStyles,
            pieces: getCustomPieces(pieceThemeId),
            animationDurationInMs: 300,
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

      {/* Quick Controls Bar (Flip & Theme) */}
      {showControls && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFlip}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Flip board between White and Black perspective"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Flip ({effectiveOrientation})</span>
            </button>
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Customize board and piece color theme"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Theme</span>
            </button>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {arePiecesDraggable ? 'Drag & Drop / Click moves' : 'Click to place'}
          </span>
        </div>
      )}

      {/* Theme Customizer Modal */}
      <ThemeCustomizerModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />
    </div>
  );
}
