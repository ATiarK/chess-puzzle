'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BoardTheme {
  id: string;
  name: string;
  icon: string;
  lightSquareStyle: React.CSSProperties;
  darkSquareStyle: React.CSSProperties;
}

export const BOARD_THEMES: BoardTheme[] = [
  {
    id: 'emerald',
    name: 'Emerald Green',
    icon: '🌿',
    lightSquareStyle: { backgroundColor: '#ebecd0' },
    darkSquareStyle: { backgroundColor: '#739552' },
  },
  {
    id: 'wood',
    name: 'Classic Wood',
    icon: '🪵',
    lightSquareStyle: { backgroundColor: '#f0d9b5' },
    darkSquareStyle: { backgroundColor: '#b58863' },
  },
  {
    id: 'slate',
    name: 'Slate Midnight',
    icon: '🌙',
    lightSquareStyle: { backgroundColor: '#cbd5e1' },
    darkSquareStyle: { backgroundColor: '#334155' },
  },
  {
    id: 'ocean',
    name: 'Ocean Blue',
    icon: '🌊',
    lightSquareStyle: { backgroundColor: '#dee3e6' },
    darkSquareStyle: { backgroundColor: '#8ca2ad' },
  },
  {
    id: 'coral',
    name: 'Coral Glass',
    icon: '🌸',
    lightSquareStyle: { backgroundColor: '#fde2e4' },
    darkSquareStyle: { backgroundColor: '#f48498' },
  },
];

const THEME_STORAGE_KEY = 'chess_puzzle_board_theme';
const FLIP_STORAGE_KEY = 'chess_puzzle_board_flipped';

export interface BoardThemeContextValue {
  currentTheme: BoardTheme;
  setThemeId: (id: string) => void;
  isFlipped: boolean;
  toggleFlip: () => void;
}

const BoardThemeContext = createContext<BoardThemeContextValue>({
  currentTheme: BOARD_THEMES[0],
  setThemeId: () => {},
  isFlipped: false,
  toggleFlip: () => {},
});

export function BoardThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<string>('emerald');
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedThemeId = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedThemeId && BOARD_THEMES.some((t) => t.id === savedThemeId)) {
        setThemeIdState(savedThemeId);
      }
      const savedFlipped = localStorage.getItem(FLIP_STORAGE_KEY);
      if (savedFlipped === 'true') {
        setIsFlipped(true);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const setThemeId = (id: string) => {
    setThemeIdState(id);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, id);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleFlip = () => {
    setIsFlipped((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(FLIP_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors
      }
      return next;
    });
  };

  const currentTheme =
    BOARD_THEMES.find((t) => t.id === themeId) || BOARD_THEMES[0];

  return (
    <BoardThemeContext.Provider
      value={{
        currentTheme,
        setThemeId,
        isFlipped,
        toggleFlip,
      }}
    >
      {children}
    </BoardThemeContext.Provider>
  );
}

export function useBoardTheme() {
  return useContext(BoardThemeContext);
}
