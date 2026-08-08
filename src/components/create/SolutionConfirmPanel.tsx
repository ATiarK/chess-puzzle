'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { useStockfish } from '@/hooks/useStockfish';
import { makeMove, whoseTurn, suggestDifficultyFromEval, getPieceAt, getLegalMovesForSquare } from '@/lib/chess/utils';
import { Sparkles, Play, RotateCcw, Plus, Trash2 } from 'lucide-react';

export interface SolutionConfirmPanelProps {
  initialFen: string;
  initialPgn?: string;
  preMoveFen?: string | null;
  lastOpponentMove?: string | null;
  onBack: () => void;
}

export function SolutionConfirmPanel({
  initialFen,
  initialPgn,
  preMoveFen,
  lastOpponentMove,
  onBack,
}: SolutionConfirmPanelProps) {
  const router = useRouter();
  const { evaluatePosition, isEvaluating, lastResult } = useStockfish();

  const [activeTab, setActiveTab] = useState<'solution' | 'intro'>('solution');
  const [baseFen, setBaseFen] = useState<string>(initialFen);
  const [effectivePreMoveFen, setEffectivePreMoveFen] = useState<string | null>(
    preMoveFen || null
  );
  const [effectiveLastOpponentMove, setEffectiveLastOpponentMove] = useState<string | null>(
    lastOpponentMove || null
  );

  const [currentFen, setCurrentFen] = useState<string>(initialFen);

  // Solution lines state: index 0 is primary, 1+ are alternative lines
  const [allLines, setAllLines] = useState<string[][]>([[]]);
  const [lineFenHistories, setLineFenHistories] = useState<string[][]>([[initialFen]]);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(0);

  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master'>('Medium');
  const [suggestedDifficulty, setSuggestedDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primarySolutionMoves = allLines[0] || [];

  const handleSuggestDifficulty = async () => {
    try {
      const res = lastResult || (await evaluatePosition(baseFen, 15));
      if (res && res.evaluationText) {
        const suggestion = suggestDifficultyFromEval(res.evaluationText, primarySolutionMoves.length);
        setSuggestedDifficulty(suggestion);
      }
    } catch {
      // ignore
    }
  };

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});

  useEffect(() => {
    setSelectedSquare(null);
    setOptionSquares({});
  }, [activeTab, activeLineIndex]);

  // Automatically evaluate position whenever currentFen changes
  useEffect(() => {
    evaluatePosition(currentFen, 15).catch(() => {
      // ignore
    });
  }, [currentFen, evaluatePosition]);

  const handlePieceDrop = (args: { sourceSquare: string; targetSquare: string; piece: string }) => {
    setSelectedSquare(null);
    setOptionSquares({});

    if (activeTab === 'intro') {
      const fromFen = effectivePreMoveFen || baseFen;
      const result = makeMove(fromFen, {
        from: args.sourceSquare,
        to: args.targetSquare,
        promotion: 'q',
      });
      if (!result) {
        setError('Illegal move for opponent intro.');
        return false;
      }
      setError(null);
      setEffectivePreMoveFen(fromFen);
      setEffectiveLastOpponentMove(result.san);
      setBaseFen(result.newFen);

      // Reset solution lines because starting position updated
      setAllLines([[]]);
      setLineFenHistories([[result.newFen]]);
      setActiveLineIndex(0);
      setCurrentFen(result.newFen);
      setActiveTab('solution');
      return true;
    }

    const currentLineFen = lineFenHistories[activeLineIndex]?.[lineFenHistories[activeLineIndex]?.length - 1] || baseFen;
    const result = makeMove(currentLineFen, {
      from: args.sourceSquare,
      to: args.targetSquare,
    });

    if (!result) return false;

    setAllLines((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [...(next[activeLineIndex] || []), result.san];
      return next;
    });
    setLineFenHistories((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [...(next[activeLineIndex] || []), result.newFen];
      return next;
    });
    setCurrentFen(result.newFen);
    return true;
  };

  const handleClearIntroMove = () => {
    setEffectiveLastOpponentMove(null);
    setEffectivePreMoveFen(null);
  };

  const handleAdoptEngineMove = () => {
    if (!lastResult || !lastResult.bestMove) return;

    const from = lastResult.bestMove.slice(0, 2);
    const to = lastResult.bestMove.slice(2, 4);
    const promotion = lastResult.bestMove.slice(4, 5) || undefined;

    const currentLineFen = lineFenHistories[activeLineIndex]?.[lineFenHistories[activeLineIndex]?.length - 1] || baseFen;
    const result = makeMove(currentLineFen, { from, to, promotion });
    if (result) {
      setAllLines((prev) => {
        const next = [...prev];
        next[activeLineIndex] = [...(next[activeLineIndex] || []), result.san];
        return next;
      });
      setLineFenHistories((prev) => {
        const next = [...prev];
        next[activeLineIndex] = [...(next[activeLineIndex] || []), result.newFen];
        return next;
      });
      setCurrentFen(result.newFen);
    }
  };

  const handleUndo = () => {
    const activeMoves = allLines[activeLineIndex] || [];
    const activeHistory = lineFenHistories[activeLineIndex] || [baseFen];
    if (activeMoves.length === 0) return;

    const newMoves = activeMoves.slice(0, -1);
    const newHistory = activeHistory.slice(0, -1);

    setAllLines((prev) => {
      const next = [...prev];
      next[activeLineIndex] = newMoves;
      return next;
    });
    setLineFenHistories((prev) => {
      const next = [...prev];
      next[activeLineIndex] = newHistory;
      return next;
    });
    setCurrentFen(newHistory[newHistory.length - 1]);
  };

  const handleResetMoves = () => {
    setAllLines((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [];
      return next;
    });
    setLineFenHistories((prev) => {
      const next = [...prev];
      next[activeLineIndex] = [baseFen];
      return next;
    });
    setCurrentFen(baseFen);
  };

  const handleAddLine = () => {
    const newIdx = allLines.length;
    setAllLines((prev) => [...prev, []]);
    setLineFenHistories((prev) => [...prev, [baseFen]]);
    setActiveLineIndex(newIdx);
    setCurrentFen(baseFen);
  };

  const handleDeleteLine = (idxToDelete: number) => {
    if (idxToDelete === 0) return; // Cannot delete primary line
    setAllLines((prev) => prev.filter((_, idx) => idx !== idxToDelete));
    setLineFenHistories((prev) => prev.filter((_, idx) => idx !== idxToDelete));
    const nextActive = Math.max(0, activeLineIndex - (activeLineIndex >= idxToDelete ? 1 : 0));
    setActiveLineIndex(nextActive);
    const history = lineFenHistories[nextActive] || [baseFen];
    setCurrentFen(history[history.length - 1]);
  };

  const handleSelectLineTab = (idx: number) => {
    setActiveLineIndex(idx);
    const history = lineFenHistories[idx] || [baseFen];
    setCurrentFen(history[history.length - 1]);
  };

  const handleSavePuzzle = async () => {
    if (!title.trim()) {
      setError('Please provide a title for this puzzle.');
      return;
    }

    const primaryMoves = allLines[0] || [];
    if (primaryMoves.length === 0) {
      setError('Please record at least one solution move for Line 1.');
      return;
    }

    const alternativeSolutions = allLines.slice(1).filter((line) => line.length > 0);

    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/puzzles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          fen: baseFen,
          pgn: initialPgn || null,
          preMoveFen: effectiveLastOpponentMove ? effectivePreMoveFen : null,
          lastOpponentMove: effectiveLastOpponentMove || null,
          solutionMoves: primaryMoves,
          alternativeSolutions,
          difficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save puzzle');
      }

      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving puzzle';
      setError(msg);
      setIsSaving(false);
    }
  };

  const currentTurn = whoseTurn(currentFen);
  const boardFenToRender = activeTab === 'intro' ? effectivePreMoveFen || baseFen : currentFen;

  const handleSquareClick = (square: string) => {
    const fen = boardFenToRender;
    const turn = whoseTurn(fen);

    if (selectedSquare) {
      if (square === selectedSquare) {
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      const pieceAtSquare = getPieceAt(fen, square);
      if (pieceAtSquare && pieceAtSquare.color === turn) {
        setSelectedSquare(square);
        const legalMoves = getLegalMovesForSquare(fen, square);
        const options: Record<string, React.CSSProperties> = {};
        options[square] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        legalMoves.forEach((move) => {
          options[move] = {
            background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
            borderRadius: '50%',
          };
        });
        setOptionSquares(options);
        return;
      }

      // Attempt move
      const dropArgs = {
        sourceSquare: selectedSquare,
        targetSquare: square,
        piece: getPieceAt(fen, selectedSquare)?.type || '',
      };
      handlePieceDrop(dropArgs);
    } else {
      const pieceAtSquare = getPieceAt(fen, square);
      if (pieceAtSquare && pieceAtSquare.color === turn) {
        setSelectedSquare(square);
        const legalMoves = getLegalMovesForSquare(fen, square);
        const options: Record<string, React.CSSProperties> = {};
        options[square] = { backgroundColor: 'rgba(255, 255, 0, 0.4)' };
        legalMoves.forEach((move) => {
          options[move] = {
            background: 'radial-gradient(circle, rgba(0,0,0,.1) 25%, transparent 25%)',
            borderRadius: '50%',
          };
        });
        setOptionSquares(options);
      }
    }
  };

  const currentActiveMoves = allLines[activeLineIndex] || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Board & Engine Assistant Column */}
      <div className="lg:col-span-7 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col items-center">
        <div className="w-full mb-3 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('solution')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                activeTab === 'solution'
                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Record Solution ({currentTurn === 'white' ? 'White' : 'Black'})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intro')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                activeTab === 'intro'
                  ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {effectiveLastOpponentMove ? `Intro: ${effectiveLastOpponentMove}` : '+ Add Intro Move'}
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            ← Change Starting Position
          </button>
        </div>

        {activeTab === 'intro' && (
          <div className="w-full mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
            <span>
              Drag an opponent piece to set the introductory move leading into this puzzle.
            </span>
            {effectiveLastOpponentMove && (
              <button
                type="button"
                onClick={handleClearIntroMove}
                className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            )}
          </div>
        )}

        <ChessBoardWrapper
          fen={boardFenToRender}
          arePiecesDraggable={true}
          onPieceDrop={handlePieceDrop}
          onSquareClick={handleSquareClick}
          customSquareStyles={optionSquares}
        />

        {/* Engine Analysis Banner */}
        <div className="mt-4 w-full p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Stockfish Engine
              </span>
              {isEvaluating ? (
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-semibold animate-pulse">
                  Analyzing...
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold">
                  Ready (Depth 15)
                </span>
              )}
            </div>

            {lastResult ? (
              <div className="mt-1 flex items-center gap-3 text-xs">
                <span
                  className={`font-mono font-bold ${
                    lastResult.evaluationText.startsWith('-') ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  Eval: {lastResult.evaluationText}
                </span>
                {lastResult.bestMove && (
                  <span className="text-slate-400">
                    Best: <strong className="text-slate-200">{lastResult.bestMove}</strong>
                  </span>
                )}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">
                Move pieces to begin engine evaluation...
              </p>
            )}
          </div>

          {lastResult?.bestMove && (
            <button
              type="button"
              onClick={handleAdoptEngineMove}
              className="px-3.5 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
            >
              Adopt Best Move ({lastResult.bestMove})
            </button>
          )}
        </div>
      </div>

      {/* Solution Moves & Puzzle Details Column */}
      <div className="lg:col-span-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                Recorded Solution Sequence
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Play out winning lines on the board. You can add multiple alternative winning solutions!
              </p>
            </div>
          </div>

          {/* Solution Line Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {allLines.map((line, idx) => (
              <div key={idx} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSelectLineTab(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                    activeLineIndex === idx
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-slate-800/80 border border-slate-700/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{idx === 0 ? 'Line 1 (Primary)' : `Line ${idx + 1}`}</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-900 text-[10px] text-slate-300 font-mono">
                    {line.length}
                  </span>
                </button>
                {idx > 0 && activeLineIndex === idx && (
                  <button
                    type="button"
                    onClick={() => handleDeleteLine(idx)}
                    className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors"
                    title="Delete alternative line"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddLine}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1 border border-slate-700/60"
              title="Add an alternative solution line"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Line</span>
            </button>
          </div>

          {/* Moves List Box */}
          <div className="min-h-[120px] max-h-[220px] overflow-y-auto p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 mb-4">
            {currentActiveMoves.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center py-6">
                <p className="text-xs text-slate-500 font-medium">
                  {activeLineIndex === 0
                    ? 'No moves recorded yet for Line 1. Make moves on the board to start!'
                    : `No moves recorded yet for Line ${activeLineIndex + 1}. Make moves on the board!`}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {currentActiveMoves.map((move, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold"
                  >
                    {i + 1}. {move}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Move Controls */}
          <div className="flex items-center gap-2 mb-6">
            <button
              type="button"
              onClick={handleUndo}
              disabled={currentActiveMoves.length === 0}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Undo Move
            </button>
            <button
              type="button"
              onClick={handleResetMoves}
              disabled={currentActiveMoves.length === 0}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Clear Line
            </button>
          </div>

          {/* Save Puzzle Form */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Puzzle Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Greek Gift Sacrifice on h7"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Difficulty Rating
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['Easy', 'Medium', 'Hard', 'Master'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`py-2 rounded-lg text-xs font-bold transition-all ${
                      difficulty === level
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {level}
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
        </div>

        <div>
          {error && (
            <p className="mb-3 text-xs text-rose-400 font-semibold bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSavePuzzle}
            disabled={isSaving || primarySolutionMoves.length === 0 || !title.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving to Database...' : 'Save Puzzle to Library ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}
