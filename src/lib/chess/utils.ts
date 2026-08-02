import { Chess, Move } from 'chess.js';

export interface ParsedPgnResult {
  valid: boolean;
  error?: string;
  moves: string[]; // SAN moves e.g. ["e4", "e5", "Nf3"]
  fens: string[];  // FEN after each move (0 is starting FEN, 1 is after move 0, etc.)
  headers?: Record<string, string>;
}

export interface MoveResult {
  newFen: string;
  san: string;
  uci: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isCapture: boolean;
}

/**
 * Validates whether a given string is a legal FEN position.
 */
export function validateFen(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.fen() !== '';
  } catch {
    return false;
  }
}

/**
 * Determines whose turn it is from a FEN ('white' or 'black').
 */
export function whoseTurn(fen: string): 'white' | 'black' {
  try {
    const chess = new Chess(fen);
    return chess.turn() === 'w' ? 'white' : 'black';
  } catch {
    return 'white';
  }
}

/**
 * Checks if the position in FEN is checkmate.
 */
export function isCheckmate(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.isCheckmate();
  } catch {
    return false;
  }
}

/**
 * Checks if the position in FEN is in check.
 */
export function isCheck(fen: string): boolean {
  try {
    const chess = new Chess(fen);
    return chess.inCheck();
  } catch {
    return false;
  }
}

/**
 * Parses a PGN string into a list of SAN moves and intermediate FEN positions.
 */
export function parsePgnToMoves(pgnString: string): ParsedPgnResult {
  try {
    const chess = new Chess();
    // Load PGN
    chess.loadPgn(pgnString);
    const historyMoves = chess.history();
    if (historyMoves.length === 0) {
      return {
        valid: false,
        error: 'No valid chess moves found in the PGN.',
        moves: [],
        fens: [],
      };
    }

    // Replay moves to record exact FEN at every step
    const replay = new Chess();
    const fens: string[] = [replay.fen()]; // index 0 = start position
    for (const move of historyMoves) {
      replay.move(move);
      fens.push(replay.fen());
    }

    return {
      valid: true,
      moves: historyMoves,
      fens,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Invalid PGN format';
    return {
      valid: false,
      error: message,
      moves: [],
      fens: [],
    };
  }
}

/**
 * Converts a move (from/to/promotion) into SAN and UCI and returns the new FEN if legal.
 */
export function makeMove(
  currentFen: string,
  move: { from: string; to: string; promotion?: string }
): MoveResult | null {
  try {
    const chess = new Chess(currentFen);
    const result: Move = chess.move({
      from: move.from,
      to: move.to,
      promotion: move.promotion || 'q',
    });

    if (!result) return null;

    const uci = `${result.from}${result.to}${result.promotion || ''}`;

    return {
      newFen: chess.fen(),
      san: result.san,
      uci,
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isCapture: result.flags.includes('c') || result.flags.includes('e'),
    };
  } catch {
    return null;
  }
}

/**
 * Executes a SAN or UCI string move and returns the new FEN if legal.
 */
export function makeMoveString(
  currentFen: string,
  moveString: string
): MoveResult | null {
  try {
    const chess = new Chess(currentFen);
    const result: Move = chess.move(moveString);

    if (!result) return null;

    const uci = `${result.from}${result.to}${result.promotion || ''}`;

    return {
      newFen: chess.fen(),
      san: result.san,
      uci,
      isCheck: chess.inCheck(),
      isCheckmate: chess.isCheckmate(),
      isCapture: result.flags.includes('c') || result.flags.includes('e'),
    };
  } catch {
    return null;
  }
}


/**
 * Checks if a candidate move (SAN or UCI string) is legal in currentFen.
 */
export function isLegalMove(currentFen: string, moveString: string): boolean {
  try {
    const chess = new Chess(currentFen);
    const move = chess.move(moveString);
    return !!move;
  } catch {
    return false;
  }
}

/**
 * Normalizes a move string to UCI format (e.g., 'e4' or 'e2e4' -> 'e2e4').
 */
export function normalizeMoveToUci(currentFen: string, moveString: string): string | null {
  try {
    const chess = new Chess(currentFen);
    const result = chess.move(moveString);
    if (!result) return null;
    return `${result.from}${result.to}${result.promotion || ''}`;
  } catch {
    return null;
  }
}

/**
 * Normalizes a move string to SAN format (e.g., 'e2e4' -> 'e4').
 */
export function normalizeMoveToSan(currentFen: string, moveString: string): string | null {
  try {
    const chess = new Chess(currentFen);
    const result = chess.move(moveString);
    if (!result) return null;
    return result.san;
  } catch {
    return null;
  }
}
