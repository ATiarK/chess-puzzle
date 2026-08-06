'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { FeedbackBanner, type SolvingStatus } from './FeedbackBanner';
import { VictoryModal } from './VictoryModal';
import { useStockfish } from '@/hooks/useStockfish';
import {
  makeMove,
  makeMoveString,
  whoseTurn,
  resolveInitialOpponentMove,
} from '@/lib/chess/utils';

export interface PuzzleSolverProps {
  puzzle: {
    id: string;
    title: string;
    fen: string;
    pgn?: string | null;
    preMoveFen?: string | null;
    lastOpponentMove?: string | null;
    solutionMoves: string[];
    difficulty?: string | null;
  };
}

export function PuzzleSolver({ puzzle }: PuzzleSolverProps) {
  const { evaluatePosition } = useStockfish();

  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [status, setStatus] = useState<SolvingStatus>('IDLE');
  const [history, setHistory] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastCorrectFen, setLastCorrectFen] = useState<string>(puzzle.fen);
  const [highlightedSquares, setHighlightedSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [introMoveSan, setIntroMoveSan] = useState<string | undefined>(undefined);

  // For GAVE_UP solution viewer
  const [solutionStepIndex, setSolutionStepIndex] = useState<number>(0);

  const opponentTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const introTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const boardOrientation = whoseTurn(puzzle.fen) === 'black' ? 'black' : 'white';

  const startIntroAnimation = useCallback(() => {
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);

    const intro = resolveInitialOpponentMove(puzzle);
    if (intro) {
      setCurrentFen(intro.preMoveFen);
      setLastCorrectFen(puzzle.fen);
      setHighlightedSquares({});
      setStatus('SHOWING_OPPONENT_MOVE');
      setIntroMoveSan(intro.moveSan);

      introTimeoutRef.current = setTimeout(() => {
        setCurrentFen(puzzle.fen);
        setHighlightedSquares({
          [intro.fromSquare]: { backgroundColor: 'rgba(234, 179, 8, 0.4)' },
          [intro.toSquare]: { backgroundColor: 'rgba(234, 179, 8, 0.5)' },
        });
        setStatus('IDLE');
      }, 600);
    } else {
      setCurrentFen(puzzle.fen);
      setLastCorrectFen(puzzle.fen);
      setHighlightedSquares({});
      setStatus('IDLE');
      setIntroMoveSan(undefined);
    }
  }, [puzzle]);

  useEffect(() => {
    const timer = setTimeout(() => {
      startIntroAnimation();
    }, 0);
    return () => {
      clearTimeout(timer);
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    };
  }, [startIntroAnimation]);

  const handleResetAll = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    setMoveIndex(0);
    setHistory([]);
    setIsModalOpen(false);
    setSolutionStepIndex(0);
    startIntroAnimation();
  }, [startIntroAnimation]);

  const handleRetry = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    setCurrentFen(lastCorrectFen);
    setStatus('IDLE');
  }, [lastCorrectFen]);

  const handleGiveUp = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    setStatus('GAVE_UP');
    setCurrentFen(puzzle.fen);
    setSolutionStepIndex(0);
    setHighlightedSquares({});
  }, [puzzle.fen]);

  const fenAtSolutionStep = useCallback(
    (stepIndex: number): { fen: string; from?: string; to?: string } => {
      let fenState = puzzle.fen;
      let fromSquare: string | undefined;
      let toSquare: string | undefined;
      for (let i = 0; i < stepIndex; i++) {
        const moveSan = puzzle.solutionMoves[i];
        if (!moveSan) break;
        const res = makeMoveString(fenState, moveSan);
        if (res) {
          fenState = res.newFen;
          fromSquare = res.from;
          toSquare = res.to;
        } else {
          break;
        }
      }
      return { fen: fenState, from: fromSquare, to: toSquare };
    },
    [puzzle.fen, puzzle.solutionMoves]
  );

  const handleStepSolution = useCallback(
    (newStep: number) => {
      const clamped = Math.max(0, Math.min(newStep, puzzle.solutionMoves.length));
      setSolutionStepIndex(clamped);
      const { fen: nextFen, from, to } = fenAtSolutionStep(clamped);
      setCurrentFen(nextFen);
      if (from && to) {
        setHighlightedSquares({
          [from]: { backgroundColor: 'rgba(16, 185, 129, 0.4)' },
          [to]: { backgroundColor: 'rgba(16, 185, 129, 0.5)' },
        });
      } else {
        setHighlightedSquares({});
      }
    },
    [fenAtSolutionStep, puzzle.solutionMoves.length]
  );

  const playOpponentMove = useCallback(
    (targetIndex: number, fenState: string) => {
      const oppMoveStr = puzzle.solutionMoves[targetIndex];
      if (!oppMoveStr) return;

      const oppResult = makeMoveString(fenState, oppMoveStr);
      if (oppResult) {
        setCurrentFen(oppResult.newFen);
        setLastCorrectFen(oppResult.newFen);
        setHistory((prev) => [...prev, oppResult.san]);
        setHighlightedSquares({
          [oppResult.from]: { backgroundColor: 'rgba(234, 179, 8, 0.4)' },
          [oppResult.to]: { backgroundColor: 'rgba(234, 179, 8, 0.5)' },
        });

        const nextIndex = targetIndex + 1;
        if (nextIndex >= puzzle.solutionMoves.length) {
          setStatus('SOLVED');
          setIsModalOpen(true);
        } else {
          setMoveIndex(nextIndex);
          setStatus('IDLE');
        }
      }
    },
    [puzzle.solutionMoves]
  );

  const playStockfishReply = useCallback(
    async (fenState: string) => {
      try {
        const line = await evaluatePosition(fenState, 12);
        if (line && line.bestMove) {
          const res = makeMoveString(fenState, line.bestMove);
          if (res) {
            setCurrentFen(res.newFen);
            setHistory((prev) => [...prev, res.san]);
            setHighlightedSquares({
              [res.from]: { backgroundColor: 'rgba(56, 189, 248, 0.4)' },
              [res.to]: { backgroundColor: 'rgba(56, 189, 248, 0.5)' },
            });
          }
        }
      } catch {
        // ignore
      }
    },
    [evaluatePosition]
  );

  const handlePieceDrop = (args: { sourceSquare: string; targetSquare: string; piece: string }) => {
    if (
      status === 'SOLVED' ||
      status === 'SHOWING_OPPONENT_MOVE' ||
      status === 'GAVE_UP'
    ) {
      return false;
    }

    if (status === 'FREE_PLAY') {
      const result = makeMove(currentFen, {
        from: args.sourceSquare,
        to: args.targetSquare,
      });
      if (!result) return false;

      setCurrentFen(result.newFen);
      setHistory((prev) => [...prev, result.san]);
      setHighlightedSquares({});
      opponentTimeoutRef.current = setTimeout(() => {
        playStockfishReply(result.newFen);
      }, 400);
      return true;
    }

    const result = makeMove(currentFen, {
      from: args.sourceSquare,
      to: args.targetSquare,
    });

    if (!result) return false;

    const expectedMove = puzzle.solutionMoves[moveIndex];
    if (!expectedMove) {
      // No more moves in solution, treat as Free Play
      setCurrentFen(result.newFen);
      setStatus('FREE_PLAY');
      setHistory((prev) => [...prev, result.san]);
      setHighlightedSquares({});
      opponentTimeoutRef.current = setTimeout(() => {
        playStockfishReply(result.newFen);
      }, 400);
      return true;
    }

    const isSanMatch = result.san === expectedMove;
    const isUciMatch = result.uci === expectedMove.toLowerCase();
    const isMatch = isSanMatch || isUciMatch;

    if (!isMatch) {
      // Diverged from official solution: switch to Free Play Mode against Stockfish!
      setCurrentFen(result.newFen);
      setStatus('FREE_PLAY');
      const newHistory = [...history, result.san];
      setHistory(newHistory);
      setHighlightedSquares({});
      opponentTimeoutRef.current = setTimeout(() => {
        playStockfishReply(result.newFen);
      }, 400);
      return true;
    }

    // Correct Move!
    setHighlightedSquares({});
    const newHistory = [...history, result.san];
    setHistory(newHistory);
    setCurrentFen(result.newFen);
    setLastCorrectFen(result.newFen);

    const nextIndex = moveIndex + 1;
    if (nextIndex >= puzzle.solutionMoves.length) {
      setStatus('SOLVED');
      setIsModalOpen(true);
    } else {
      setStatus('CORRECT_STEP');
      setMoveIndex(nextIndex);
      // Play opponent's reply automatically after 400ms
      opponentTimeoutRef.current = setTimeout(() => {
        playOpponentMove(nextIndex, result.newFen);
      }, 400);
    }

    return true;
  };

  useEffect(() => {
    return () => {
      if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
      if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Puzzle Header Card */}
      <div className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400">
              {puzzle.difficulty || 'Normal'}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-slate-400">
              {boardOrientation === 'white' ? 'White to move' : 'Black to move'}
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 mt-0.5">
            {puzzle.title}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {status !== 'SOLVED' && status !== 'GAVE_UP' && (
            <button
              type="button"
              onClick={handleGiveUp}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Give Up
            </button>
          )}
          <button
            type="button"
            onClick={handleResetAll}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Reset Board
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      <FeedbackBanner
        status={status}
        onRetry={handleRetry}
        onReset={handleResetAll}
        onGiveUp={status !== 'SOLVED' && status !== 'GAVE_UP' ? handleGiveUp : undefined}
        currentStep={Math.floor(moveIndex / 2) + 1}
        totalSteps={Math.ceil(puzzle.solutionMoves.length / 2)}
        lastMoveSan={introMoveSan}
      />

      {/* Interactive Chessboard */}
      <ChessBoardWrapper
        fen={currentFen}
        boardOrientation={boardOrientation}
        arePiecesDraggable={
          status !== 'SOLVED' &&
          status !== 'SHOWING_OPPONENT_MOVE' &&
          status !== 'GAVE_UP'
        }
        onPieceDrop={handlePieceDrop}
        customSquareStyles={highlightedSquares}
      />

      {/* Solution Viewer when GAVE_UP */}
      {status === 'GAVE_UP' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100">
              Official Solution Moves
            </span>
            <span className="text-xs text-slate-400">
              Step {solutionStepIndex} of {puzzle.solutionMoves.length}
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {puzzle.solutionMoves.map((san, idx) => (
              <button
                key={`${idx}-${san}`}
                type="button"
                onClick={() => handleStepSolution(idx + 1)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  idx < solutionStepIndex
                    ? 'bg-emerald-500/30 border border-emerald-500/50 text-emerald-300'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {idx + 1}. {san}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => handleStepSolution(solutionStepIndex - 1)}
              disabled={solutionStepIndex <= 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Previous Move
            </button>
            <button
              type="button"
              onClick={() => handleStepSolution(0)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Reset Position
            </button>
            <button
              type="button"
              onClick={() => handleStepSolution(solutionStepIndex + 1)}
              disabled={solutionStepIndex >= puzzle.solutionMoves.length}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-extrabold disabled:opacity-40 transition-all"
            >
              Next Move
            </button>
          </div>
        </div>
      )}

      {/* Move History Strip */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/60 flex items-center justify-between text-xs font-mono">
        <span className="text-slate-400 font-sans font-semibold">Moves Played:</span>
        <div className="flex flex-wrap gap-1.5">
          {history.length === 0 ? (
            <span className="text-slate-500 italic">No moves yet</span>
          ) : (
            history.map((move, idx) => (
              <span
                key={`${idx}-${move}`}
                className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-bold"
              >
                {idx + 1}. {move}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Celebratory Victory Modal */}
      <VictoryModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSolveAnother={handleResetAll}
        puzzleTitle={puzzle.title}
      />
    </div>
  );
}
