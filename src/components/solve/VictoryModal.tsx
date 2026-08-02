'use client';

import React from 'react';
import Link from 'next/link';

export interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSolveAnother?: () => void;
  puzzleTitle: string;
}

export function VictoryModal({
  isOpen,
  onClose,
  onSolveAnother,
  puzzleTitle,
}: VictoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl shadow-emerald-500/20 text-center space-y-6 animate-zoom-in">
        {/* Glow backdrop */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 blur-2xl opacity-40 pointer-events-none" />

        {/* Celebratory sparkles */}
        <div className="absolute -top-4 -left-4 text-2xl animate-bounce pointer-events-none">
          ✨
        </div>
        <div className="absolute -top-2 -right-4 text-2xl animate-pulse pointer-events-none">
          🎉
        </div>
        <div className="absolute -bottom-4 right-8 text-xl animate-bounce pointer-events-none">
          🌟
        </div>

        {/* Trophy Icon */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-4xl shadow-xl shadow-emerald-500/30">
          🏆
        </div>

        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Tactical Success
          </span>
          <h2 className="text-2xl font-extrabold text-slate-100 mt-1">
            Puzzle Solved!
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            You successfully solved <strong className="text-slate-200">{puzzleTitle}</strong>.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {onSolveAnother && (
            <button
              type="button"
              onClick={onSolveAnother}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
            >
              Solve Another Puzzle ➔
            </button>
          )}

          <Link
            href="/create"
            className="block w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Create & Share Your Own Puzzles
          </Link>

          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors block mx-auto pt-1"
          >
            Close / Replay Board
          </button>
        </div>
      </div>
    </div>
  );
}
