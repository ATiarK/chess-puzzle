/**
 * Strips annotations, clock times, comments, and sub-variations from PGN strings
 * so that standard chess parsers can load complex Lichess/Chess.com games cleanly.
 */
export function cleanPgn(pgn: string): string {
  if (!pgn) return '';

  let cleaned = pgn;

  // 1. Remove bracketed comments { ... } including nested lines and [%clk ...]
  cleaned = cleaned.replace(/\{[^}]*\}/gm, ' ');

  // 2. Remove recursive variation parentheses ( ... )
  // We apply repeatedly to handle nested variations ((...))
  let prev = '';
  while (prev !== cleaned) {
    prev = cleaned;
    cleaned = cleaned.replace(/\([^()]*\)/gm, ' ');
  }

  // 3. Remove NAG evaluation symbols ($1, $2, $4, $10, etc.)
  cleaned = cleaned.replace(/\$\d+/gm, ' ');

  // 4. Normalize whitespace and line breaks in move section
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned;
}

/**
 * Validates whether a custom FEN has legal King counts and no pawns on illegal ranks (1 and 8).
 */
export function isPositionStructureValid(fen: string): {
  valid: boolean;
  whiteKings: number;
  blackKings: number;
  invalidPawns: boolean;
  reason?: string;
} {
  const placement = fen.split(' ')[0] || '';
  const rows = placement.split('/');

  let whiteKings = 0;
  let blackKings = 0;
  let invalidPawns = false;

  rows.forEach((row, rowIndex) => {
    for (const char of row) {
      if (char === 'K') whiteKings++;
      if (char === 'k') blackKings++;
      if ((rowIndex === 0 || rowIndex === 7) && (char === 'P' || char === 'p')) {
        invalidPawns = true;
      }
    }
  });

  const kingsValid = whiteKings === 1 && blackKings === 1;

  let reason: string | undefined;
  if (!kingsValid) {
    reason = `Board must have exactly 1 White King and 1 Black King (Found: ${whiteKings}W / ${blackKings}B).`;
  } else if (invalidPawns) {
    reason = 'Pawns cannot be placed on the 1st or 8th rank.';
  }

  return {
    valid: kingsValid && !invalidPawns,
    whiteKings,
    blackKings,
    invalidPawns,
    reason,
  };
}
