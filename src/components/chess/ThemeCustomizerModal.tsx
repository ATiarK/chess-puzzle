'use client';

import React from 'react';
import { useBoardTheme, BOARD_THEMES } from '@/context/BoardThemeContext';

export interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ThemeCustomizerModal({ isOpen, onClose }: ThemeCustomizerModalProps) {
  const { currentTheme, setThemeId, isFlipped, toggleFlip } = useBoardTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md p-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl shadow-cyan-500/10 space-y-5 animate-zoom-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-100">
              🎨 Board & Color Customization
            </h3>
            <p className="text-xs text-slate-400">
              Customize square colors and default board perspective.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-sm font-bold px-2 py-1"
          >
            ✕
          </button>
        </div>

        {/* Square Theme Picker */}
        <div className="space-y-2.5">
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
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-slate-100 font-bold shadow-md'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{theme.icon}</span>
                    <span className="text-sm">{theme.name}</span>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex items-center gap-1">
                    <span
                      className="w-5 h-5 rounded border border-black/20"
                      style={theme.lightSquareStyle}
                    />
                    <span
                      className="w-5 h-5 rounded border border-black/20"
                      style={theme.darkSquareStyle}
                    />
                    {isSelected && (
                      <span className="ml-2 text-emerald-400 text-xs">✓ Active</span>
                    )}
                  </div>
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
            <span className="text-xs text-slate-400">
              Current default: <strong className="text-slate-300">{isFlipped ? 'Black at bottom' : 'White at bottom'}</strong>
            </span>
          </div>
          <button
            type="button"
            onClick={toggleFlip}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <span>🔄 Flip Orientation</span>
          </button>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-lg hover:brightness-110 transition-all"
          >
            Done ➔
          </button>
        </div>
      </div>
    </div>
  );
}
