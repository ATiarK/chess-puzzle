'use client';

import React, { useState } from 'react';
import type { Puzzle } from '@/db/schema';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { useStockfish } from '@/hooks/useStockfish';
import {
  validateFen,
  resolveInitialOpponentMove,
  whoseTurn,
  makeMove,
  suggestDifficultyFromEval,
} from '@/lib/chess/utils';
import { X, Sparkles, Check, AlertCircle, RotateCcw, Play, LayoutGrid, Plus, Trash2 } from 'lucide-react';

export interface EditPuzzleModalProps {
  puzzle: Puzzle;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedPuzzle: Puzzle) => void;
}

const DIFFICULTIES: ('Easy' | 'Medium' | 'Hard' | 'Master')[] = [
  'Easy',
  'Medium',
  'Hard',
  'Master',
];

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

export function EditPuzzleModal({
  puzzle,
  isOpen,
  onClose,
  onSaveSuccess,
}: EditPuzzleModalProps) {
  // Tabs: 'position' (piece palette/board setup), 'intro' (opponent move), 'solution' (tactical moves)
  const [activeTab, setActiveTab] = useState<'position' | 'intro' | 'solution'>('position');
  const [selectedTool, setSelectedTool] = useState<string>('K');
  const [turn, setTurn] = useState<'w' | 'b'>(
    whoseTurn(puzzle.fen) === 'white' ? 'w' : 'b'
  );

  const { evaluatePosition, isEvaluating } = useStockfish();
  const [title, setTitle] = useState(puzzle.title);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master'>(
    (puzzle.difficulty as 'Easy' | 'Medium' | 'Hard' | 'Master') || 'Medium'
  );
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master' | null>(null);

  // Intro Move state
  const [preMoveFen, setPreMoveFen] = useState<string>(
    puzzle.preMoveFen || puzzle.fen
  );
  const [lastOpponentMove, setLastOpponentMove] = useState<string>(
    puzzle.lastOpponentMove || ''
  );

  // Puzzle starting FEN & Solution state
  const [fen, setFen] = useState<string>(puzzle.fen);

  const initialAlternative = (puzzle as unknown as { alternativeSolutions?: string[][] }).alternativeSolutions || [];
  const initialLines = [puzzle.solutionMoves || [], ...initialAlternative];

  const [allLines, setAllLines] = useState<string[][]>(initialLines.length > 0 ? initialLines : [[]]);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);

  // Function to replay moves to build FEN history
  const buildFenHistoryForLine = (startFen: string, moves: string[]): string[] => {
    const history = [startFen];
    let curr = startFen;
    for (const moveSan of moves) {
      const res = makeMove(curr, { from: moveSan.slice(0, 2), to: moveSan.slice(2, 4) }); // or makeMoveString
      if (res) {
        curr = res.newFen;
        history.push(curr);
      } else {
        break;
      }
    }
    return history;
  };

  const [lineFenHistories, setLineFenHistories] = useState<string[][]>(() => {
    return (initialLines.length > 0 ? initialLines : [[]]).map((line) =>
      buildFenHistoryForLine(puzzle.fen, line)
    );
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const primarySolutionMoves = allLines[0] || [];

  const handleSuggestDifficulty = async () => {
    try {
      const res = await evaluatePosition(fen, 15);
      if (res && res.evaluationText) {
        const suggestion = suggestDifficultyFromEval(res.evaluationText, primarySolutionMoves.length);
        setSuggestedDifficulty(suggestion);
      }
    } catch {
      // ignore
    }
  };

  // Board FEN grid manipulation for Tab 1 (Position editor)
  const fenPlacementPart = fen.split(' ')[0];

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

  const arrayToFen = (grid: (string | null)[][], currentTurn: 'w' | 'b'): string => {
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
    return `${rowStrings.join('/')} ${currentTurn} - - 0 1`;
  };

  const squareToCoords = (square: string): { row: number; col: number } | null => {
    if (square.length < 2) return null;
    const file = square.charCodeAt(0) - 97;
    const rank = parseInt(square[1], 10);
    const row = 8 - rank;
    return { row, col: file };
  };

  const handleSquareClick = (square: string) => {
    if (activeTab !== 'position') return;
    const coords = squareToCoords(square);
    if (!coords) return;

    const grid = fenToArray(fenPlacementPart);
    if (selectedTool === 'X') {
      grid[coords.row][coords.col] = null;
    } else {
      grid[coords.row][coords.col] = selectedTool;
    }

    const newFen = arrayToFen(grid, turn);
    setFen(newFen);
    setPreMoveFen(newFen);
    setLastOpponentMove('');
    setAllLines([[]]);
    setLineFenHistories([[newFen]]);
    setActiveLineIndex(0);
  };

  const handleTurnChange = (newTurn: 'w' | 'b') => {
    setTurn(newTurn);
    const grid = fenToArray(fenPlacementPart);
    const newFen = arrayToFen(grid, newTurn);
    setFen(newFen);
    setPreMoveFen(newFen);
    setLastOpponentMove('');
    setAllLines([[]]);
    setLineFenHistories([[newFen]]);
    setActiveLineIndex(0);
  };

  const handleAutoDetectFromPgn = () => {
    setError(null);
    const detected = resolveInitialOpponentMove(puzzle);
    if (detected) {
      setPreMoveFen(detected.preMoveFen);
      setLastOpponentMove(detected.moveSan);
      setFen(puzzle.fen);
      const baseFen = puzzle.fen;
      setAllLines([[]]);
      setLineFenHistories([[baseFen]]);
      setActiveLineIndex(0);
    } else {
      setError(
        'Could not auto-detect intro move from stored PGN. You can play the opponent move directly on the board.'
      );
    }
  };

  const handleClearIntroMove = () => {
    setLastOpponentMove('');
    setPreMoveFen(fen);
  };

  // Interactive Piece Drop Handler for Intro Tab
  const handleIntroPieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }): boolean => {
    setError(null);
    const res = makeMove(preMoveFen, {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (!res) {
      setError('Illegal chess move for the opponent.');
      return false;
    }

    setLastOpponentMove(res.san);
    setFen(res.newFen);

    setAllLines([[]]);
    setLineFenHistories([[res.newFen]]);
    setActiveLineIndex(0);
    return true;
  };

  // Interactive Piece Drop Handler for Solution Tab
  const handleSolutionPieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string }): boolean => {
    setError(null);
    const currentLineFen = lineFenHistories[activeLineIndex]?.[lineFenHistories[activeLineIndex]?.length - 1] || fen;
    const res = makeMove(currentLineFen, {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    });

    if (!res) {
      setError('Illegal chess move in solution sequence.');
      return false;
    }

    setAllLines((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [...(next[activeLineIndex] || []), res.san];
      return next;
    });
    setLineFenHistories((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [...(next[activeLineIndex] || []), res.newFen];
      return next;
    });
    return true;
  };

  const handleUndoSolutionMove = () => {
    const activeMoves = allLines[activeLineIndex] || [];
    const activeHistory = lineFenHistories[activeLineIndex] || [fen];
    if (activeMoves.length === 0) return;

    const nextMoves = activeMoves.slice(0, -1);
    const nextHistory = activeHistory.slice(0, -1);

    setAllLines((prev) => {
      const next = [...prev];
      next[activeLineIndex] = nextMoves;
      return next;
    });
    setLineFenHistories((prev) => {
      const next = [...prev];
      next[activeLineIndex] = nextHistory;
      return next;
    });
  };

  const handleResetSolution = () => {
    setAllLines((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [];
      return next;
    });
    setLineFenHistories((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [fen];
      return next;
    });
  };

  const handleAddLine = () => {
    const newIdx = allLines.length;
    setAllLines((prev) => [...prev, []]);
    setLineFenHistories((prev) => [...prev, [fen]]);
    setActiveLineIndex(newIdx);
  };

  const handleDeleteLine = (idxToDelete: number) => {
    if (idxToDelete === 0) return;
    setAllLines((prev) => prev.filter((_, idx) => idx !== idxToDelete));
    setLineFenHistories((prev) => prev.filter((_, idx) => idx !== idxToDelete));
    const nextActive = Math.max(0, activeLineIndex - (activeLineIndex >= idxToDelete ? 1 : 0));
    setActiveLineIndex(nextActive);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title is required.');
      return;
    }

    if (!validateFen(fen.trim())) {
      setError('Valid Starting FEN is required.');
      return;
    }

    const primaryMoves = allLines[0] || [];
    if (primaryMoves.length === 0) {
      setError('Please record at least one solution move for Line 1.');
      return;
    }

    const alternativeSolutions = allLines.slice(1).filter((l) => l.length > 0);

    setIsSaving(true);
    try {
      const res = await fetch(`/api/puzzles/update/${puzzle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          difficulty,
          fen: fen.trim(),
          preMoveFen: lastOpponentMove ? preMoveFen.trim() : null,
          lastOpponentMove: lastOpponentMove.trim() || null,
          solutionMoves: primaryMoves,
          alternativeSolutions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update puzzle.');
      }

      onSaveSuccess(data.puzzle);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save puzzle.';
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const currentSolutionFen = lineFenHistories[activeLineIndex]?.[lineFenHistories[activeLineIndex]?.length - 1] || fen;

  const currentBoardFen =
    activeTab === 'intro'
      ? preMoveFen
      : activeTab === 'solution'
      ? currentSolutionFen
      : fen;

  const boardTurn = whoseTurn(currentBoardFen);

  const currentActiveMoves = allLines[activeLineIndex] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl border border-slate-800 w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-2xl p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-100">
              Interactive Puzzle Editor
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Edit pieces on the board, play the opponent intro move, or record solution lines visually.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Title & Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Puzzle Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                placeholder="e.g. Greek Gift Sacrifice"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={`py-2 rounded-xl text-xs font-bold transition-all ${
                      difficulty === d
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={handleSuggestDifficulty}
                  disabled={isEvaluating}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  Suggest Difficulty (Stockfish)
                </button>

                {suggestedDifficulty && (
                  <button
                    type="button"
                    onClick={() => setDifficulty(suggestedDifficulty)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30 transition-colors"
                  >
                    Suggested: {suggestedDifficulty} (Click to apply)
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('position')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'position'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>1. Edit Position</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intro')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'intro'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>2. Opponent Intro Move</span>
              {lastOpponentMove && (
                <span className="px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 text-[10px] font-extrabold">
                  {lastOpponentMove}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('solution')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'solution'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-4 h-4" />
              <span>3. Solution Moves</span>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-[10px] font-extrabold">
                {allLines.map(l => l.length).reduce((a, b) => a + b, 0)}
              </span>
            </button>
          </div>

          {/* Main Interactive Board Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            {/* Left/Top: Board */}
            <div className="md:col-span-7 flex flex-col items-center justify-center">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
                {activeTab === 'position'
                  ? 'Click squares or drag to place pieces'
                  : activeTab === 'intro'
                  ? 'Play Opponent Move on Board'
                  : `Record Solution (${boardTurn === 'white' ? 'White' : 'Black'} to move)`}
              </span>

              <div className="w-full max-w-[340px]">
                <ChessBoardWrapper
                  fen={currentBoardFen}
                  arePiecesDraggable={activeTab !== 'position'}
                  onPieceDrop={
                    activeTab === 'intro'
                      ? handleIntroPieceDrop
                      : activeTab === 'solution'
                      ? handleSolutionPieceDrop
                      : undefined
                  }
                  onSquareClick={
                    activeTab === 'position' ? handleSquareClick : undefined
                  }
                />
              </div>
            </div>

            {/* Right/Bottom: Tab Specific Controls */}
            <div className="md:col-span-5 space-y-4">
              {activeTab === 'position' ? (
                <div className="space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Piece Placement Palette
                    </h4>
                    <p className="text-xs text-slate-400">
                      Select a piece and click any square on the board to add, replace, or remove pieces.
                    </p>

                    <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {PIECE_PALETTE.map((tool) => {
                        const isSelected = selectedTool === tool.symbol;
                        return (
                          <button
                            key={tool.symbol}
                            type="button"
                            onClick={() => setSelectedTool(tool.symbol)}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                              isSelected
                                ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 font-bold'
                                : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                            }`}
                          >
                            <span className="truncate">{tool.label}</span>
                            <span className="font-mono text-xs px-1 py-0.5 rounded bg-slate-800">
                              {tool.symbol}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">Turn to move:</span>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTurnChange('w')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            turn === 'w'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          White
                        </button>
                        <button
                          type="button"
                          onClick={() => handleTurnChange('b')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            turn === 'b'
                              ? 'bg-emerald-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Black
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFen(STARTING_FEN);
                          setPreMoveFen(STARTING_FEN);
                          setLastOpponentMove('');
                          setAllLines([[]]);
                          setLineFenHistories([[STARTING_FEN]]);
                          setActiveLineIndex(0);
                          setTurn('w');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                      >
                        Reset Start
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setFen(EMPTY_FEN);
                          setPreMoveFen(EMPTY_FEN);
                          setLastOpponentMove('');
                          setAllLines([[]]);
                          setLineFenHistories([[EMPTY_FEN]]);
                          setActiveLineIndex(0);
                          setTurn('w');
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                      >
                        Clear Board
                      </button>
                    </div>
                  </div>

                  {puzzle.pgn && (
                    <button
                      type="button"
                      onClick={handleAutoDetectFromPgn}
                      className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-detect from PGN history</span>
                    </button>
                  )}
                </div>
              ) : activeTab === 'intro' ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                      Opponent Intro Move
                    </h4>
                    {lastOpponentMove ? (
                      <div className="space-y-2">
                        <p className="text-sm text-slate-200 font-medium">
                          Opponent plays <strong className="text-amber-400 font-mono text-base">{lastOpponentMove}</strong> before the puzzle starts.
                        </p>
                        <button
                          type="button"
                          onClick={handleClearIntroMove}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Clear Intro Move</span>
                        </button>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        Drag any piece on the chessboard to play the move that leads into your puzzle position.
                      </p>
                    )}
                  </div>

                  {puzzle.pgn && (
                    <button
                      type="button"
                      onClick={handleAutoDetectFromPgn}
                      className="w-full py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-detect from PGN</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">
                      Recorded Solution Lines
                    </h4>

                    {/* Solution Line Selector Tabs */}
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {allLines.map((line, idx) => (
                        <div key={idx} className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setActiveLineIndex(idx)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                              activeLineIndex === idx
                                ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm'
                                : 'bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            <span>{idx === 0 ? 'Line 1' : `Line ${idx + 1}`}</span>
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-300 font-mono">
                              {line.length}
                            </span>
                          </button>
                          {idx > 0 && activeLineIndex === idx && (
                            <button
                              type="button"
                              onClick={() => handleDeleteLine(idx)}
                              className="p-1 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors"
                              title="Delete line"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={handleAddLine}
                        className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700/60"
                        title="Add an alternative solution line"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Line</span>
                      </button>
                    </div>

                    {currentActiveMoves.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                        {currentActiveMoves.map((san, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold text-xs"
                          >
                            {idx + 1}. {san}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400">
                        {activeLineIndex === 0
                          ? 'No moves recorded for Line 1. Drag pieces on the board.'
                          : `No moves recorded for Line ${activeLineIndex + 1}. Drag pieces on the board.`}
                      </p>
                    )}
                  </div>

                  {currentActiveMoves.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleUndoSolutionMove}
                        className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Undo Last</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleResetSolution}
                        className="py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 text-xs font-bold transition-colors"
                      >
                        Reset Line
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
