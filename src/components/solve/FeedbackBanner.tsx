'use client';

import React from 'react';
import { Check, X } from 'lucide-react';

export type SolvingStatus = 'IDLE' | 'CORRECT_STEP' | 'WRONG_MOVE' | 'SOLVED';

export interface FeedbackBannerProps {
  status: SolvingStatus;
  onRetry: () => void;
  onReset: () => void;
  currentStep: number;
  totalSteps: number;
}

export function FeedbackBanner({
  status,
  onRetry,
  onReset,
  currentStep,
  totalSteps,
}: FeedbackBannerProps) {
  if (status === 'IDLE') {
    return (
      <div className="w-full p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
        <span>
          Tactical Challenge — Move {currentStep} of {totalSteps}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="text-slate-400 hover:text-slate-200 underline"
        >
          Reset Board
        </button>
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
      <span>★ Brilliant! You solved the puzzle!</span>
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
