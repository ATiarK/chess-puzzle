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
    id: 'cyberpunk',
    name: 'Cyberpunk Neon',
    description: 'Futuristic glowing neon 2D silhouettes',
  },
  {
    id: 'nature',
    name: 'Nature Woodland',
    description: 'Organic wooden and leaf-accented pieces',
  },
];

const PIECE_NAMES: string[] = [
  'wK', 'wQ', 'wR', 'wB', 'wN', 'wP',
  'bK', 'bQ', 'bR', 'bB', 'bN', 'bP',
];

export function getCustomPieces(themeId: string): Record<
  string,
  (props?: {
    fill?: string;
    square?: string;
    squareWidth?: number;
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
      squareWidth?: number;
      svgStyle?: React.CSSProperties;
    }) => React.ReactElement
  > = {};

  if (themeId === 'cyberpunk' || themeId === 'nature') {
    PIECE_NAMES.forEach((piece) => {
      result[piece] = ({ squareWidth }: { squareWidth?: number } = {}) => {
        const size = squareWidth || 45;
        // 12% padding ensures tall 2D pieces fit inside the square without overflowing over borders
        const pad = Math.round(size * 0.12);

        return (
          <div
            style={{
              width: `${size}px`,
              height: `${size}px`,
              padding: `${pad}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxSizing: 'border-box',
            }}
            className="pointer-events-none select-none m-auto"
          >
            <img
              src={`/pieces/${themeId}/${piece}.png`}
              alt={piece}
              style={{
                objectFit: 'contain',
              }}
              className="w-full h-full sm:w-[175%] sm:h-[175%] sm:max-w-none sm:max-h-none flex-shrink-0 object-contain pointer-events-none select-none drop-shadow-md m-auto"
              draggable={false}
            />
          </div>
        );
      };
    });
  }

  return result;
}
