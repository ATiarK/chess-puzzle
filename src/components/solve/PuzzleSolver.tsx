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
  getPieceAt,
  getLegalMovesForSquare,
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
    alternativeSolutions?: string[][] | null;
    difficulty?: string | null;
  };
}

export function PuzzleSolver({ puzzle }: PuzzleSolverProps) {
  const { evaluatePosition } = useStockfish();

  const allSolutionLines: string[][] = [
    puzzle.solutionMoves,
    ...(puzzle.alternativeSolutions || []).filter((l) => Array.isArray(l) && l.length > 0),
  ];

  const [currentFen, setCurrentFen] = useState<string>(puzzle.fen);
  const [moveIndex, setMoveIndex] = useState<number>(0);
  const [matchingLines, setMatchingLines] = useState<string[][]>(allSolutionLines);

  const [status, setStatus] = useState<SolvingStatus>('IDLE');
  const [history, setHistory] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [lastCorrectFen, setLastCorrectFen] = useState<string>(puzzle.fen);
  const [highlightedSquares, setHighlightedSquares] = useState<
    Record<string, React.CSSProperties>
  >({});
  const [optionSquares, setOptionSquares] = useState<Record<string, React.CSSProperties>>({});
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [introMoveSan, setIntroMoveSan] = useState<string | undefined>(undefined);

  // For GAVE_UP solution viewer
  const [solutionStepIndex, setSolutionStepIndex] = useState<number>(0);
  const [viewerLineIndex, setViewerLineIndex] = useState<number>(0);

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
      setOptionSquares({});
      setSelectedSquare(null);
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
      setOptionSquares({});
      setSelectedSquare(null);
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
    setMatchingLines(allSolutionLines);
    setHistory([]);
    setIsModalOpen(false);
    setSolutionStepIndex(0);
    setViewerLineIndex(0);
    setSelectedSquare(null);
    setOptionSquares({});
    startIntroAnimation();
  }, [allSolutionLines, startIntroAnimation]);

  const handleRetry = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    setCurrentFen(lastCorrectFen);
    setSelectedSquare(null);
    setOptionSquares({});
    setStatus('IDLE');
  }, [lastCorrectFen]);

  const handleGiveUp = useCallback(() => {
    if (opponentTimeoutRef.current) clearTimeout(opponentTimeoutRef.current);
    if (introTimeoutRef.current) clearTimeout(introTimeoutRef.current);
    setStatus('GAVE_UP');
    setCurrentFen(puzzle.fen);
    setSolutionStepIndex(0);
    setViewerLineIndex(0);
    setHighlightedSquares({});
  }, [puzzle.fen]);

  const activeViewerMoves = allSolutionLines[viewerLineIndex] || puzzle.solutionMoves;

  const fenAtSolutionStep = useCallback(
    (stepIndex: number, movesLine: string[]): { fen: string; from?: string; to?: string } => {
      let fenState = puzzle.fen;
      let fromSquare: string | undefined;
      let toSquare: string | undefined;
      for (let i = 0; i < stepIndex; i++) {
        const moveSan = movesLine[i];
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
    [puzzle.fen]
  );

  const handleStepSolution = useCallback(
    (newStep: number, lineIdx = viewerLineIndex) => {
      const movesLine = allSolutionLines[lineIdx] || puzzle.solutionMoves;
      const clamped = Math.max(0, Math.min(newStep, movesLine.length));
      setSolutionStepIndex(clamped);
      setViewerLineIndex(lineIdx);
      const { fen: nextFen, from, to } = fenAtSolutionStep(clamped, movesLine);
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
    [allSolutionLines, fenAtSolutionStep, puzzle.solutionMoves, viewerLineIndex]
  );

  const playOpponentMove = useCallback(
    (targetIndex: number, fenState: string, activeLine: string[]) => {
      const oppMoveStr = activeLine[targetIndex];
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
        setSelectedSquare(null);
        setOptionSquares({});

        const nextIndex = targetIndex + 1;
        if (nextIndex >= activeLine.length) {
          setStatus('SOLVED');
          setIsModalOpen(true);
        } else {
          setMoveIndex(nextIndex);
          setStatus('IDLE');
        }
      }
    },
    []
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

    setSelectedSquare(null);
    setOptionSquares({});

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

    // Filter matching lines for current moveIndex
    const nextMatchingLines = matchingLines.filter((line) => {
      const expected = line[moveIndex];
      if (!expected) return false;
      return result.san === expected || result.uci === expected.toLowerCase();
    });

    if (nextMatchingLines.length === 0) {
      // Diverged from all official solutions: switch to Free Play Mode against Stockfish!
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

    // Correct Move matching at least one solution line!
    setMatchingLines(nextMatchingLines);
    const chosenLine = nextMatchingLines[0];

    setHighlightedSquares({});
    const newHistory = [...history, result.san];
    setHistory(newHistory);
    setCurrentFen(result.newFen);
    setLastCorrectFen(result.newFen);

    const nextIndex = moveIndex + 1;
    if (nextIndex >= chosenLine.length) {
      setStatus('SOLVED');
      setIsModalOpen(true);
    } else {
      setStatus('CORRECT_STEP');
      setMoveIndex(nextIndex);
      // Play opponent's reply automatically after 400ms using the chosen line
      opponentTimeoutRef.current = setTimeout(() => {
        playOpponentMove(nextIndex, result.newFen, chosenLine);
      }, 400);
    }

    return true;
  };

  const onSquareClick = (square: string) => {
    if (
      status === 'SOLVED' ||
      status === 'WRONG_MOVE' ||
      status === 'SHOWING_OPPONENT_MOVE'
    ) {
      return;
    }

    // If a square is already selected
    if (selectedSquare) {
      if (square === selectedSquare) {
        // Deselect if clicking the same square
        setSelectedSquare(null);
        setOptionSquares({});
        return;
      }

      const pieceAtSquare = getPieceAt(currentFen, square);
      if (pieceAtSquare && pieceAtSquare.color === whoseTurn(currentFen)) {
        // Change selection to another piece of the same color
        setSelectedSquare(square);
        const legalMoves = getLegalMovesForSquare(currentFen, square);
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
        piece: getPieceAt(currentFen, selectedSquare)?.type || '',
      };
      
      handlePieceDrop(dropArgs);
    } else {
      // No square selected yet
      const pieceAtSquare = getPieceAt(currentFen, square);
      if (pieceAtSquare && pieceAtSquare.color === whoseTurn(currentFen)) {
        setSelectedSquare(square);
        const legalMoves = getLegalMovesForSquare(currentFen, square);
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
        currentStep={Math.floor(moveIndex / 2) + 1}
        totalSteps={Math.ceil((matchingLines[0]?.length || puzzle.solutionMoves.length) / 2)}
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
        onSquareClick={onSquareClick}
        customSquareStyles={{ ...highlightedSquares, ...optionSquares }}
      />

      {/* Solution Viewer when GAVE_UP */}
      {status === 'GAVE_UP' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-100">
              Official Solution Moves
            </span>
            <span className="text-xs text-slate-400">
              Step {solutionStepIndex} of {activeViewerMoves.length}
            </span>
          </div>

          {/* Line Selector when multiple solution lines exist */}
          {allSolutionLines.length > 1 && (
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800/80">
              <span className="text-xs font-semibold text-slate-400">Solution Line:</span>
              <div className="flex flex-wrap gap-1.5">
                {allSolutionLines.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleStepSolution(0, idx)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      viewerLineIndex === idx
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {idx === 0 ? 'Line 1 (Primary)' : `Line ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {activeViewerMoves.map((san, idx) => (
              <button
                key={`${idx}-${san}`}
                type="button"
                onClick={() => handleStepSolution(idx + 1, viewerLineIndex)}
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
              onClick={() => handleStepSolution(solutionStepIndex - 1, viewerLineIndex)}
              disabled={solutionStepIndex <= 0}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              Previous Move
            </button>
            <button
              type="button"
              onClick={() => handleStepSolution(0, viewerLineIndex)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Reset Position
            </button>
            <button
              type="button"
              onClick={() => handleStepSolution(solutionStepIndex + 1, viewerLineIndex)}
              disabled={solutionStepIndex >= activeViewerMoves.length}
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
