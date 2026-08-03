'use client';

import React, { useEffect } from 'react';
import { useBoardTheme, BOARD_THEMES } from '@/context/BoardThemeContext';
import { PIECE_THEMES } from '@/lib/chess/pieces';
import {
  Palette,
  RotateCcw,
  Check,
  X,
  Leaf,
  Trees,
  Moon,
  Waves,
  Sparkles,
} from 'lucide-react';

export interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function renderThemeIcon(iconName: string): React.ReactElement {
  switch (iconName) {
    case 'leaf':
      return <Leaf className="w-4 h-4 text-emerald-400" />;
    case 'tree':
      return <Trees className="w-4 h-4 text-amber-500" />;
    case 'moon':
      return <Moon className="w-4 h-4 text-slate-400" />;
    case 'waves':
      return <Waves className="w-4 h-4 text-cyan-400" />;
    case 'sparkles':
    default:
      return <Sparkles className="w-4 h-4 text-rose-400" />;
  }
}

export function ThemeCustomizerModal({ isOpen, onClose }: ThemeCustomizerModalProps) {
  const {
    currentTheme,
    setThemeId,
    isFlipped,
    toggleFlip,
    pieceThemeId,
    setPieceThemeId,
  } = useBoardTheme();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md my-auto bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl animate-zoom-in max-h-[85vh] flex flex-col overflow-hidden">
        {/* Fixed Modal Header */}
        <div className="shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-emerald-500" />
            <div>
              <h3 className="text-base font-extrabold text-slate-100">
                Board & Color Customization
              </h3>
              <p className="text-[11px] text-slate-400">
                Customize square colors, piece styles, and board perspective.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body with min-h-0 for proper flexbox scrolling */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 overscroll-contain">
          {/* Square Theme Picker */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Board Square Theme
            </label>
            <div className="grid grid-cols-1 gap-2">
              {BOARD_THEMES.map((theme) => {
                const isSelected = currentTheme.id === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setThemeId(theme.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-slate-100 font-bold shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {renderThemeIcon(theme.iconName)}
                      <span className="text-xs font-semibold">{theme.name}</span>
                    </div>

                    {/* Color Swatches */}
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded border border-black/20"
                        style={theme.lightSquareStyle}
                      />
                      <span
                        className="w-4 h-4 rounded border border-black/20"
                        style={theme.darkSquareStyle}
                      />
                      {isSelected && (
                        <Check className="w-4 h-4 ml-1 text-emerald-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Piece Theme Picker - 3-column compact grid */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              Select Chess Piece Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PIECE_THEMES.map((pt) => {
                const isSelected = pieceThemeId === pt.id;
                return (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setPieceThemeId(pt.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-slate-100 font-bold shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <span className="block text-xs font-semibold">{pt.name}</span>
                    <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{pt.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Board Flip Perspective */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold text-slate-200">
                Board Perspective
              </span>
              <span className="text-[11px] text-slate-400">
                Default bottom side: <strong className="text-slate-300">{isFlipped ? 'Black' : 'White'}</strong>
              </span>
            </div>
            <button
              type="button"
              onClick={toggleFlip}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Flip Orientation</span>
            </button>
          </div>
        </div>

        {/* Fixed Modal Footer */}
        <div className="shrink-0 p-4 border-t border-slate-800 bg-slate-900">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-colors"
          >
            Save & Close
          </button>
        </div>
      </div>
    </div>
  );
}
