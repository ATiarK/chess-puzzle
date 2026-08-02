'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { FeedbackBanner, type SolvingStatus } from './FeedbackBanner';
import { VictoryModal } from './VictoryModal';
import { makeMove, makeMoveString, whoseTurn } from '@/lib/chess/utils';

export interface PuzzleSolverProps {
  puzzle: {
    id: string;
    title: string;
    fen: string;
    solutionMoves: string[];
    difficulty?: string | null;
  };
}

export function PuzzleSolver({ puzzle }: PuzzleSolverProps) {
  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [status, setStatus] = useState<SolvingStatus>('IDLE');
  const [history, setHistory] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastCorrectFen, setLastCorrectFen] = useState<string>(puzzle.fen);

  const opponentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const boardOrientation = whoseTurn(puzzle.fen) === 'black' ? 'black' : 'white';

  const handleResetAll = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    setCurrentFen(puzzle.fen);
    setLastCorrectFen(puzzle.fen);
    setMoveIndex(0);
    setStatus('IDLE');
    setHistory([]);
    setIsModalOpen(false);
  }, [puzzle.fen]);

  const handleRetry = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    setCurrentFen(lastCorrectFen);
    setStatus('IDLE');
  }, [lastCorrectFen]);

  const playOpponentMove = useCallback(
    (targetIndex: number, fenState: string) => {
      const oppMoveStr = puzzle.solutionMoves[targetIndex];
      if (!oppMoveStr) return;

      const oppResult = makeMoveString(fenState, oppMoveStr);
      if (oppResult) {
        setCurrentFen(oppResult.newFen);
        setLastCorrectFen(oppResult.newFen);
        setHistory((prev) => [...prev, oppResult.san]);

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

  const handlePieceDrop = (args: { sourceSquare: string; targetSquare: string; piece: string }) => {
    if (status === 'SOLVED' || status === 'WRONG_MOVE') return false;

    const result = makeMove(currentFen, {
      from: args.sourceSquare,
      to: args.targetSquare,
    });

    if (!result) return false;

    const expectedMove = puzzle.solutionMoves[moveIndex];
    if (!expectedMove) return false;

    const isSanMatch = result.san === expectedMove;
    const isUciMatch = result.uci === expectedMove.toLowerCase();
    const isMatch = isSanMatch || isUciMatch;

    if (!isMatch) {
      setCurrentFen(result.newFen);
      setStatus('WRONG_MOVE');
      return true;
    }

    // Correct Move!
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
        currentStep={Math.floor(moveIndex / 2) + 1}
        totalSteps={Math.ceil(puzzle.solutionMoves.length / 2)}
      />

      {/* Interactive Chessboard */}
      <ChessBoardWrapper
        fen={currentFen}
        boardOrientation={boardOrientation}
        arePiecesDraggable={status !== 'SOLVED' && status !== 'WRONG_MOVE'}
        onPieceDrop={handlePieceDrop}
      />

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
