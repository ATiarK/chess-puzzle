'use client';

import React from 'react';
import Link from 'next/link';
import { Trophy, Sparkles, ArrowRight, Plus } from 'lucide-react';

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
      <div className="relative w-full max-w-md p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl text-center space-y-6 animate-zoom-in">
        {/* Celebratory sparkles icon background */}
        <div className="absolute top-4 right-4 text-emerald-400/30 pointer-events-none">
          <Sparkles className="w-6 h-6 animate-pulse" />
        </div>

        {/* Trophy Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg">
          <Trophy className="w-8 h-8" />
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
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Solve Another Puzzle</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          <Link
            href="/create"
            className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span>Create & Share Your Own Puzzles</span>
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
