'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export type SolvingStatus =
  | 'IDLE'
  | 'SHOWING_OPPONENT_MOVE'
  | 'CORRECT_STEP'
  | 'WRONG_MOVE'
  | 'FREE_PLAY'
  | 'GAVE_UP'
  | 'SOLVED';

export interface FeedbackBannerProps {
  status: SolvingStatus;
  onRetry: () => void;
  onReset: () => void;
  onGiveUp?: () => void;
  currentStep: number;
  totalSteps: number;
  lastMoveSan?: string;
}

export function FeedbackBanner({
  status,
  onRetry,
  onReset,
  onGiveUp,
  currentStep,
  totalSteps,
  lastMoveSan,
}: FeedbackBannerProps) {
  if (status === 'SHOWING_OPPONENT_MOVE') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/50 flex items-center justify-between text-xs font-bold text-amber-300 animate-pulse">
        <span>
          {lastMoveSan
            ? `Opponent is playing ${lastMoveSan}... Watch the board!`
            : 'Opponent is playing their move... Watch the board!'}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-amber-400 hover:text-amber-200 underline font-normal"
        >
          Reset Board
        </button>
      </div>
    );
  }

  if (status === 'FREE_PLAY') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-cyan-500/20 border border-cyan-500/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-bold text-cyan-300">
        <div>
          <span>Free Play Mode — Playing against Stockfish</span>
          <p className="text-[11px] text-cyan-400/80 font-normal mt-0.5">
            You moved differently from the puzzle solution. Stockfish will reply to your moves.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-lg bg-cyan-500 text-slate-950 font-extrabold hover:brightness-110 transition-all shadow-md"
          >
            Retry Puzzle
          </button>
          {onGiveUp && (
            <button
              type="button"
              onClick={onGiveUp}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
            >
              Give Up (Show Solution)
            </button>
          )}
        </div>
      </div>
    );
  }

  if (status === 'GAVE_UP') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-slate-800 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-slate-200">
        <div>
          <span className="text-amber-400 font-bold">Solution Revealed</span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            You gave up on this puzzle. Use the solution viewer below the board to step through the official moves.
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold transition-all"
        >
          Reset Board
        </button>
      </div>
    );
  }

  if (status === 'IDLE') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>
          Tactical Challenge — Move {currentStep} of {totalSteps}
          {lastMoveSan && (
            <span className="ml-2 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold">
              Opponent played {lastMoveSan}
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          {onGiveUp && (
            <button
              type="button"
              onClick={onGiveUp}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              Give Up
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-slate-400 hover:text-slate-200 underline"
          >
            Reset Board
          </button>
        </div>
      </div>
    );
  }

  if (status === 'CORRECT_STEP') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-between text-xs font-bold text-emerald-300 animate-pulse">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Correct move! Playing opponent response...</span>
        </div>
        <span>
          Move {currentStep} of {totalSteps}
        </span>
      </div>
    );
  }

  if (status === 'WRONG_MOVE') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-between text-xs font-bold text-rose-300">
        <div className="flex items-center gap-2">
          <X className="w-4 h-4 text-rose-400 shrink-0" />
          <span>Incorrect move. That doesn&apos;t solve the puzzle.</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="px-3.5 py-1.5 rounded-lg bg-rose-500 text-slate-950 font-extrabold hover:brightness-110 transition-all shadow-md"
          >
            Try Again
          </button>
          {onGiveUp && (
            <button
              type="button"
              onClick={onGiveUp}
              className="text-xs text-rose-300/80 hover:text-rose-100 transition-colors"
            >
              Give Up
            </button>
          )}
          <button
            type="button"
            onClick={onReset}
            className="text-rose-300 hover:underline font-normal"
          >
            Reset All
          </button>
        </div>
      </div>
    );
  }

  // SOLVED
  return (
    <div className="w-full p-4 rounded-xl bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 border border-emerald-400 flex items-center justify-between text-sm font-extrabold text-emerald-300">
      <span>Brilliant! You solved the puzzle!</span>
      <button
        type="button"
        onClick={onReset}
        className="text-xs text-slate-300 hover:underline font-medium"
      >
        Replay
      </button>
    </div>
  );
}
