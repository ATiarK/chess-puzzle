'use client';

import React, { useState } from 'react';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { parsePgnToMoves } from '@/lib/chess/utils';

export interface PgnParserModalProps {
  onSelectPosition: (fen: string, pgn: string) => void;
}

const SAMPLE_PGN = `[Event "Live Chess"]
[Site "Chess.com"]
[Date "2024.05.10"]
[White "Magnus Carlsen"]
[Black "Hikaru Nakamura"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6 8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. c4 c6 12. cxb5 axb5 13. Nc3 Bb7 14. Bg5 b4 15. Nb1 h6 16. Bh4 c5 17. dxe5 Nxe4 18. Bxe7 Qxe7 19. exd6 Qf6 20. Nbd2 Nxd6 21. Nc4 Nxc4 22. Bxc4 Nb6 23. Ne5 Rae8 24. Bxf7+ Rxf7 25. Nxf7 Rxe1+ 26. Qxe1 Kxf7 27. Qe3 Qg5 28. Qxg5 hxg5 29. b3 Ke6 30. a3 Kd6 31. axb4 cxb4 32. Ra5 Nd5 33. f3 Bc8 34. Kf2 Bf5 35. Ra7 g6 36. Ra6+ Kc5 37. Ke1 Nf4 38. g3 Nxh3 39. Kd2 Kb5 40. Rd6 Kc5 41. Ra6 Nf2 42. g4 Bd3 43. Re6 1-0`;

export function PgnParserModal({ onSelectPosition }: PgnParserModalProps) {
  const [pgnText, setPgnText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<{ moves: string[]; fens: string[] } | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(0);

  const handleAnalyze = (inputPgn: string) => {
    setError(null);
    const result = parsePgnToMoves(inputPgn);
    if (!result.valid || result.fens.length === 0) {
      setError(result.error || 'Could not parse moves from PGN.');
      setParsed(null);
      return;
    }
    setParsed({ moves: result.moves, fens: result.fens });
    // Default jump to around middle or end
    setCurrentStep(Math.min(result.fens.length - 1, Math.floor(result.fens.length * 0.7)));
  };

  const currentFen = parsed ? parsed.fens[currentStep] || parsed.fens[0] : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-slate-900/60 p-6 rounded-2xl border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-semibold text-slate-200">
            Paste PGN (Game History)
          </label>
          <button
            type="button"
            onClick={() => {
              setPgnText(SAMPLE_PGN);
              handleAnalyze(SAMPLE_PGN);
            }}
            className="text-xs text-emerald-400 hover:underline font-medium"
          >
            Load Sample Game (Carlsen vs Nakamura)
          </button>
        </div>
        <textarea
          value={pgnText}
          onChange={(e) => setPgnText(e.target.value)}
          placeholder="Paste PGN here e.g. 1. e4 e5 2. Nf3 Nc6..."
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
        />
        {error && (
          <p className="mt-2 text-xs text-rose-400 font-medium">{error}</p>
        )}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => handleAnalyze(pgnText)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold text-sm hover:brightness-110 transition-all shadow-md shadow-emerald-500/10"
          >
            Analyze & Stepper
          </button>
        </div>
      </div>

      {parsed && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Chessboard Preview */}
          <div className="lg:col-span-7 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col items-center">
            <div className="w-full mb-3 flex items-center justify-between text-xs font-medium text-slate-400">
              <span>Position Preview</span>
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-emerald-400 font-semibold">
                Move {currentStep} of {parsed.fens.length - 1}
              </span>
            </div>

            <ChessBoardWrapper fen={currentFen} arePiecesDraggable={false} />

            {/* Stepper Controls */}
            <div className="mt-4 flex items-center gap-2 w-full justify-center">
              <button
                type="button"
                onClick={() => setCurrentStep(0)}
                disabled={currentStep === 0}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                start
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                ◀ Prev
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(Math.min(parsed.fens.length - 1, currentStep + 1))}
                disabled={currentStep === parsed.fens.length - 1}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                Next ▶
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(parsed.fens.length - 1)}
                disabled={currentStep === parsed.fens.length - 1}
                className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold disabled:opacity-40 transition-colors"
              >
                End
              </button>
            </div>
          </div>

          {/* Move List & Selection CTA */}
          <div className="lg:col-span-5 bg-slate-900/60 p-5 rounded-2xl border border-slate-800/80 flex flex-col h-[520px]">
            <h3 className="text-sm font-semibold text-slate-200 mb-3">
              Game Move History
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Click any move below to inspect that exact position on the board.
            </p>

            <div className="flex-1 overflow-y-auto pr-1 space-y-1 bg-slate-950/60 rounded-xl p-3 border border-slate-800/50">
              <div className="grid grid-cols-2 gap-1 text-xs">
                {parsed.moves.map((move, index) => {
                  const moveNum = Math.floor(index / 2) + 1;
                  const isWhite = index % 2 === 0;
                  const stepIndex = index + 1;
                  const isSelected = currentStep === stepIndex;

                  return (
                    <button
                      key={`${stepIndex}-${move}`}
                      type="button"
                      onClick={() => setCurrentStep(stepIndex)}
                      className={`text-left px-2.5 py-1.5 rounded-lg font-mono transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold'
                          : 'hover:bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      <span>
                        {isWhite ? `${moveNum}. ` : `${moveNum}... `}
                        {move}
                      </span>
                      {isSelected && <span className="text-[10px] text-emerald-400">●</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onSelectPosition(currentFen, pgnText)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:brightness-110 transition-all"
              >
                Use This Position (Move {currentStep}) ➔
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
