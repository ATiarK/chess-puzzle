'use client';

import React, { useState, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { useBoardTheme } from '@/context/BoardThemeContext';
import { ThemeCustomizerModal } from './ThemeCustomizerModal';
import { getCustomPieces } from '@/lib/chess/pieces';
import { FlipVertical2, Palette, Undo2, Redo2 } from 'lucide-react';

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
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
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
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ChessBoardWrapperProps) {
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const { currentTheme, isFlipped, toggleFlip, pieceThemeId } = useBoardTheme();

  const effectiveOrientation = isFlipped
    ? boardOrientation === 'white'
      ? 'black'
      : 'white'
    : boardOrientation;

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

      {/* Quick Controls Bar (Undo/Redo & Flip/Theme) */}
      {showControls && (
        <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-slate-400">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 text-slate-200 transition-colors flex items-center justify-center shadow-sm"
              title="Undo Move"
            >
              <Undo2 className="w-3.5 h-3.5 text-slate-300" />
            </button>
            <button
              type="button"
              onClick={onRedo}
              disabled={!canRedo}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800/80 text-slate-200 transition-colors flex items-center justify-center shadow-sm"
              title="Redo Move"
            >
              <Redo2 className="w-3.5 h-3.5 text-slate-300" />
            </button>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFlip}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center shadow-sm"
              title={`Flip Board (Current: ${effectiveOrientation})`}
            >
              <FlipVertical2 className="w-3.5 h-3.5 text-emerald-400" />
            </button>
            <button
              type="button"
              onClick={() => setIsThemeModalOpen(true)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors flex items-center justify-center shadow-sm"
              title="Customize Theme"
            >
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
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
