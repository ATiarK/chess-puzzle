'use client';

import React, { useState } from 'react';
import { PgnParserModal } from './PgnParserModal';
import { ManualPlacementBoard } from './ManualPlacementBoard';
import { SolutionConfirmPanel } from './SolutionConfirmPanel';

export function CreatePuzzleStudio() {
  const [step, setStep] = useState<'position' | 'solution'>('position');
  const [method, setMethod] = useState<'pgn' | 'manual'>('pgn');
  const [selectedFen, setSelectedFen] = useState<string>('');
  const [selectedPgn, setSelectedPgn] = useState<string | undefined>(undefined);

  const handlePositionSelected = (fen: string, pgn?: string) => {
    setSelectedFen(fen);
    setSelectedPgn(pgn);
    setStep('solution');
  };

  return (
    <div className="space-y-6">
      {/* Header & Step Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Puzzle Creation Studio
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {step === 'position'
              ? 'Step 1: Pick a position from a PGN game or set up a custom board.'
              : 'Step 2: Verify Stockfish evaluation, record solution moves, and save.'}
          </p>
        </div>

        {/* Step Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              step === 'position'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            1. Position
          </span>
          <span className="text-slate-600">➔</span>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold ${
              step === 'solution'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            2. Solution & Save
          </span>
        </div>
      </div>

      {step === 'position' ? (
        <div className="space-y-6">
          {/* Method Switcher Tabs */}
          <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 w-fit">
            <button
              type="button"
              onClick={() => setMethod('pgn')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                method === 'pgn'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Method 1: Paste PGN
            </button>
            <button
              type="button"
              onClick={() => setMethod('manual')}
              className={`px-5 py-2 rounded-lg text-xs font-bold transition-all ${
                method === 'manual'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Method 2: Manual Board Setup
            </button>
          </div>

          {method === 'pgn' ? (
            <PgnParserModal
              onSelectPosition={(fen, pgn) => handlePositionSelected(fen, pgn)}
            />
          ) : (
            <ManualPlacementBoard
              onSelectPosition={(fen) => handlePositionSelected(fen)}
            />
          )}
        </div>
      ) : (
        <SolutionConfirmPanel
          initialFen={selectedFen}
          initialPgn={selectedPgn}
          onBack={() => setStep('position')}
        />
      )}
    </div>
  );
}
