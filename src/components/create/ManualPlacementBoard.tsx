'use client';

import React, { useState } from 'react';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { validateFen } from '@/lib/chess/utils';
import { useBoardTheme } from '@/context/BoardThemeContext';


export interface ManualPlacementBoardProps {
  onSelectPosition: (fen: string) => void;
}

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const EMPTY_FEN = '8/8/8/8/8/8/8/8 w - - 0 1';

const PIECE_PALETTE: { label: string; symbol: string; color: 'w' | 'b' | 'trash' }[] = [
  { label: 'White King', symbol: 'K', color: 'w' },
  { label: 'White Queen', symbol: 'Q', color: 'w' },
  { label: 'White Rook', symbol: 'R', color: 'w' },
  { label: 'White Bishop', symbol: 'B', color: 'w' },
  { label: 'White Knight', symbol: 'N', color: 'w' },
  { label: 'White Pawn', symbol: 'P', color: 'w' },
  { label: 'Black King', symbol: 'k', color: 'b' },
  { label: 'Black Queen', symbol: 'q', color: 'b' },
  { label: 'Black Rook', symbol: 'r', color: 'b' },
  { label: 'Black Bishop', symbol: 'b', color: 'b' },
  { label: 'Black Knight', symbol: 'n', color: 'b' },
  { label: 'Black Pawn', symbol: 'p', color: 'b' },
  { label: 'Remove Piece', symbol: 'X', color: 'trash' },
];

export function ManualPlacementBoard({ onSelectPosition }: ManualPlacementBoardProps) {
  const [boardFen, setBoardFen] = useState<string>(STARTING_FEN);
  const [selectedTool, setSelectedTool] = useState<string>('K');
  const [turn, setTurn] = useState<'w' | 'b'>('w');
  const { isFlipped } = useBoardTheme();

  // Convert FEN string to 8x8 array so we can place or clear pieces easily
  const fenPlacementPart = boardFen.split(' ')[0];

  const fenToArray = (fenString: string): (string | null)[][] => {
    const rows = fenString.split('/');
    return rows.map((row) => {
      const rowArray: (string | null)[] = [];
      for (const char of row) {
        if (!isNaN(parseInt(char, 10))) {
          const emptyCount = parseInt(char, 10);
          for (let i = 0; i < emptyCount; i++) rowArray.push(null);
        } else {
          rowArray.push(char);
        }
      }
      return rowArray;
    });
  };

  const arrayToFen = (grid: (string | null)[][]): string => {
    const rowStrings = grid.map((row) => {
      let result = '';
      let emptyCount = 0;
      for (const cell of row) {
        if (cell === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            result += emptyCount;
            emptyCount = 0;
          }
          result += cell;
        }
      }
      if (emptyCount > 0) result += emptyCount;
      return result;
    });
    return `${rowStrings.join('/')} ${turn} - - 0 1`;
  };

  // Convert square e.g. "e4" to row/col coordinates
  const squareToCoords = (square: string): { row: number; col: number } | null => {
    if (square.length < 2) return null;
    const file = square.charCodeAt(0) - 97; // 'a' -> 0
    const rank = parseInt(square[1], 10); // 1-8
    const row = 8 - rank;
    return { row, col: file };
  };

  const handleSquareClick = (square: string) => {
    const coords = squareToCoords(square);
    if (!coords) return;

    const grid = fenToArray(fenPlacementPart);
    if (selectedTool === 'X') {
      grid[coords.row][coords.col] = null;
    } else {
      grid[coords.row][coords.col] = selectedTool;
    }

    setBoardFen(arrayToFen(grid));
  };

  const handlePieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }) => {
    const sourceCoords = squareToCoords(sourceSquare);
    const targetCoords = squareToCoords(targetSquare);
    if (!sourceCoords || !targetCoords) return false;

    const grid = fenToArray(fenPlacementPart);
    const piece = grid[sourceCoords.row][sourceCoords.col];
    if (!piece) return false;

    grid[sourceCoords.row][sourceCoords.col] = null;
    grid[targetCoords.row][targetCoords.col] = piece;

    setBoardFen(arrayToFen(grid));
    return true;
  };

  const handlePaletteDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const symbol = e.dataTransfer.getData('text/piece');
    if (!symbol) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    let col = Math.floor((x / rect.width) * 8);
    let row = Math.floor((y / rect.height) * 8);
    if (row >= 0 && row < 8 && col >= 0 && col < 8) {
      if (isFlipped) {
        row = 7 - row;
        col = 7 - col;
      }
      const grid = fenToArray(fenPlacementPart);
      grid[row][col] = symbol === 'X' ? null : symbol;
      setBoardFen(arrayToFen(grid));
    }
  };

  // Update FEN turn when turn toggle changes
  const handleTurnChange = (newTurn: 'w' | 'b') => {
    setTurn(newTurn);
    const parts = boardFen.split(' ');
    parts[1] = newTurn;
    setBoardFen(parts.join(' '));
  };

  // Validity checks
  const currentGrid = fenToArray(fenPlacementPart);
  let whiteKings = 0;
  let blackKings = 0;
  let invalidPawns = false;

  currentGrid.forEach((row, rowIndex) => {
    row.forEach((cell) => {
      if (cell === 'K') whiteKings++;
      if (cell === 'k') blackKings++;
      if ((rowIndex === 0 || rowIndex === 7) && (cell === 'P' || cell === 'p')) {
        invalidPawns = true;
      }
    });
  });

  const isKingsValid = whiteKings === 1 && blackKings === 1;
  const isFenValid = validateFen(boardFen);
  const isReady = isKingsValid && !invalidPawns && isFenValid;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Board Column */}
      <div className="lg:col-span-7 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col items-center">
        <div className="w-full mb-3 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">Interactive Board Setup</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setBoardFen(STARTING_FEN);
                setTurn('w');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Reset Start
            </button>
            <button
              type="button"
              onClick={() => {
                setBoardFen(EMPTY_FEN);
                setTurn('w');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Clear Board
            </button>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handlePaletteDrop}
          className="w-full"
        >
          <ChessBoardWrapper
            fen={boardFen}
            arePiecesDraggable={true}
            onPieceDrop={handlePieceDrop}
            onSquareClick={handleSquareClick}
          />
        </div>

        {/* Turn Selector */}
        <div className="mt-5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 w-full flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">
            Whose Turn To Move? (Set after placing pieces)
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleTurnChange('w')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                turn === 'w'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              White to move
            </button>
            <button
              type="button"
              onClick={() => handleTurnChange('b')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                turn === 'b'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Black to move
            </button>
          </div>
        </div>
      </div>

      {/* Palette & CTA Column */}
      <div className="lg:col-span-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between h-full min-h-[520px]">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-2">
            Piece Placement Palette
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Select a piece tool to click squares, or drag and drop pieces directly onto the board.
          </p>

          <div className="grid grid-cols-2 gap-2">
            {PIECE_PALETTE.map((tool) => {
              const isSelected = selectedTool === tool.symbol;
              return (
                <button
                  key={tool.symbol}
                  type="button"
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('text/piece', tool.symbol)}
                  onClick={() => setSelectedTool(tool.symbol)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition-all cursor-grab active:cursor-grabbing ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span>{tool.label}</span>
                  <span className="font-mono text-sm px-1.5 py-0.5 rounded bg-slate-800">
                    {tool.symbol}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Validity Banner */}
          <div className="mt-6 p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Position Validity Check
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span>Kings count (1 White, 1 Black):</span>
                <span className={isKingsValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {isKingsValid ? 'Legal' : `Illegal (${whiteKings}W / ${blackKings}B)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Pawns on 1st/8th rank:</span>
                <span className={!invalidPawns ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {!invalidPawns ? 'Legal' : 'Illegal pawns'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>FEN structure valid:</span>
                <span className={isFenValid ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {isFenValid ? 'Legal' : 'Invalid check'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => onSelectPosition(boardFen)}
            disabled={!isReady}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isReady ? 'Use This Position ➔' : 'Fix Board Errors To Continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
