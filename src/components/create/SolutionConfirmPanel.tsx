'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { useStockfish } from '@/hooks/useStockfish';
import { makeMove, whoseTurn } from '@/lib/chess/utils';

export interface SolutionConfirmPanelProps {
  initialFen: string;
  initialPgn?: string;
  onBack: () => void;
}

export function SolutionConfirmPanel({
  initialFen,
  initialPgn,
  onBack,
}: SolutionConfirmPanelProps) {
  const router = useRouter();
  const { evaluatePosition, isEvaluating, lastResult } = useStockfish();

  const [currentFen, setCurrentFen] = useState<string>(initialFen);
  const [fenHistory, setFenHistory] = useState<string[]>([initialFen]);
  const [solutionMoves, setSolutionMoves] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master'>('Medium');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Automatically evaluate position whenever currentFen changes
  useEffect(() => {
    evaluatePosition(currentFen, 15).catch(() => {
      // ignore
    });
  }, [currentFen, evaluatePosition]);

  const handlePieceDrop = (args: { sourceSquare: string; targetSquare: string; piece: string }) => {
    const result = makeMove(currentFen, {
      from: args.sourceSquare,
      to: args.targetSquare,
    });

    if (!result) return false;

    setSolutionMoves((prev) => [...prev, result.san]);
    setCurrentFen(result.newFen);
    setFenHistory((prev) => [...prev, result.newFen]);
    return true;
  };

  const handleAdoptEngineMove = () => {
    if (!lastResult || !lastResult.bestMove) return;

    const from = lastResult.bestMove.slice(0, 2);
    const to = lastResult.bestMove.slice(2, 4);
    const promotion = lastResult.bestMove.slice(4, 5) || undefined;

    const result = makeMove(currentFen, { from, to, promotion });
    if (result) {
      setSolutionMoves((prev) => [...prev, result.san]);
      setCurrentFen(result.newFen);
      setFenHistory((prev) => [...prev, result.newFen]);
    }
  };

  const handleUndo = () => {
    if (solutionMoves.length === 0) return;
    const newMoves = solutionMoves.slice(0, -1);
    const newHistory = fenHistory.slice(0, -1);
    setSolutionMoves(newMoves);
    setFenHistory(newHistory);
    setCurrentFen(newHistory[newHistory.length - 1]);
  };

  const handleResetMoves = () => {
    setSolutionMoves([]);
    setFenHistory([initialFen]);
    setCurrentFen(initialFen);
  };

  const handleSavePuzzle = async () => {
    if (!title.trim()) {
      setError('Please provide a title for this puzzle.');
      return;
    }
    if (solutionMoves.length === 0) {
      setError('Please record at least one solution move.');
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/puzzles/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          fen: initialFen,
          pgn: initialPgn || null,
          solutionMoves,
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Board & Engine Assistant Column */}
      <div className="lg:col-span-7 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col items-center">
        <div className="w-full mb-3 flex items-center justify-between text-xs font-medium">
          <span className="text-slate-400">
            Record Solution Moves ({currentTurn === 'white' ? 'White' : 'Black'} to move)
          </span>
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-slate-400 hover:text-slate-200 underline"
          >
            ← Change Starting Position
          </button>
        </div>

        <ChessBoardWrapper
          fen={currentFen}
          arePiecesDraggable={true}
          onPieceDrop={handlePieceDrop}
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
                  Ready
                </span>
              )}
            </div>
            {lastResult ? (
              <div className="mt-1 flex items-center gap-3">
                <span className="text-lg font-extrabold text-emerald-400">
                  {lastResult.evaluationText}
                </span>
                <span className="text-xs text-slate-400">
                  Best: <strong className="text-slate-200">{lastResult.bestMove || '—'}</strong>
                </span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-1">Calculating best continuation...</p>
            )}
          </div>

          <button
            type="button"
            onClick={handleAdoptEngineMove}
            disabled={!lastResult || !lastResult.bestMove}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors disabled:opacity-40"
          >
            + Adopt Engine Move
          </button>
        </div>
      </div>

      {/* Solution Sequence & Save CTA Column */}
      <div className="lg:col-span-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between min-h-[540px]">
        <div>
          <h3 className="text-sm font-semibold text-slate-200 mb-2">
            Recorded Solution Sequence
          </h3>
          <p className="text-xs text-slate-400 mb-3">
            Play winning moves on the board or adopt Stockfish suggestions.
          </p>

          {/* Moves box */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 min-h-[140px] max-h-[220px] overflow-y-auto mb-4">
            {solutionMoves.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-8">
                No solution moves recorded yet. Play a move on the chessboard above!
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {solutionMoves.map((move, i) => (
                  <span
                    key={`${i}-${move}`}
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
              disabled={solutionMoves.length === 0}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Undo Move
            </button>
            <button
              type="button"
              onClick={handleResetMoves}
              disabled={solutionMoves.length === 0}
              className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Clear Moves
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
            disabled={isSaving || solutionMoves.length === 0 || !title.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving to Database...' : 'Save Puzzle to Library ➔'}
          </button>
        </div>
      </div>
    </div>
  );
}
