'use client';

import React from 'react';

export interface PieceThemeOption {
  id: string;
  name: string;
  description: string;
}

export const PIECE_THEMES: PieceThemeOption[] = [
  {
    id: 'standard',
    name: 'Standard Classic',
    description: 'Traditional Staunton chess piece set',
  },
  {
    id: 'modern',
    name: 'Modern Neo',
    description: 'High-contrast bold geometric silhouettes',
  },
  {
    id: 'minimal',
    name: 'Minimal Outline',
    description: 'Crisp simplified outline design',
  },
];

const PIECE_NAMES: string[] = [
  'wK', 'wQ', 'wR', 'wB', 'wN', 'wP',
  'bK', 'bQ', 'bR', 'bB', 'bN', 'bP',
];

/**
 * Helper to render custom piece SVG wrappers for Modern and Minimal themes.
 */
function renderCustomPieceSvg(piece: string, themeId: string): React.ReactElement {
  const isWhite = piece.startsWith('w');
  const type = piece[1]; // K, Q, R, B, N, P

  const fill = isWhite ? '#ffffff' : '#1e293b';
  const stroke = isWhite ? '#0f172a' : '#94a3b8';
  const strokeWidth = themeId === 'minimal' ? 2.5 : 1.5;
  const opacity = 1;

  const getPath = (t: string) => {
    switch (t) {
      case 'K':
        return 'M22 10l-4-6h-4l-4 6v4h12v-4zm-6-8v3m-2-1h4M10 18h12v4H10v-4z';
      case 'Q':
        return 'M8 12l2-6 6 3 6-3 2 6v4H8v-4zm2 8h12v4H10v-4z';
      case 'R':
        return 'M9 10h14v8H9v-8zm1-4h3v4h-3V6zm5 0h3v4h-3V6zm5 0h3v4h-3V6zM10 20h12v2H10v-2z';
      case 'B':
        return 'M16 6a5 5 0 015 5c0 4-5 7-5 7s-5-3-5-7a5 5 0 015-5zm-6 14h12v2H10v-2z';
      case 'N':
        return 'M10 16l2-8 6-2-2 6 4 4v2H10zm0 4h12v2H10v-2z';
      case 'P':
      default:
        return 'M13 10a3 3 0 116 0c0 3-3 4-3 4s-3-1-3-4zm-2 8h10v3H11v-3z';
    }
  };

  return (
    <svg
      viewBox="0 0 32 32"
      className="w-full h-full drop-shadow-sm select-none"
      style={{ opacity }}
    >
      <path
        d={getPath(type)}
        fill={themeId === 'minimal' ? 'none' : fill}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function getCustomPieces(themeId: string): Record<
  string,
  (props?: {
    fill?: string;
    square?: string;
    svgStyle?: React.CSSProperties;
  }) => React.ReactElement
> | undefined {
  if (themeId === 'standard' || !themeId) {
    return undefined;
  }

  const result: Record<
    string,
    (props?: {
      fill?: string;
      square?: string;
      svgStyle?: React.CSSProperties;
    }) => React.ReactElement
  > = {};
  PIECE_NAMES.forEach((piece) => {
    result[piece] = () => renderCustomPieceSvg(piece, themeId);
  });

  return result;
}
