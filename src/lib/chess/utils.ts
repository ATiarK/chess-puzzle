import { Chess, Move } from 'chess.js';
import { cleanPgn } from '@/lib/chess/edge-cases';

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
  from: string;
  to: string;
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
    // Load PGN after cleaning comments, clock annotations, and sub-variations
    const cleaned = cleanPgn(pgnString);
    chess.loadPgn(cleaned || pgnString);
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
      from: result.from,
      to: result.to,
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
      from: result.from,
      to: result.to,
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

export interface OpponentIntroMove {
  preMoveFen: string;
  moveSan: string;
  fromSquare: string;
  toSquare: string;
}

/**
 * Resolves the opponent's last move that led to the puzzle position for intro animations.
 */
export function resolveInitialOpponentMove(puzzle: {
  fen: string;
  pgn?: string | null;
  preMoveFen?: string | null;
  lastOpponentMove?: string | null;
}): OpponentIntroMove | null {
  const fenMatch = (f1: string, f2: string) =>
    f1.split(' ').slice(0, 4).join(' ') === f2.split(' ').slice(0, 4).join(' ');

  if (puzzle.preMoveFen && puzzle.lastOpponentMove) {
    const res = makeMoveString(puzzle.preMoveFen, puzzle.lastOpponentMove);
    if (res) {
      return {
        preMoveFen: puzzle.preMoveFen,
        moveSan: res.san,
        fromSquare: res.from,
        toSquare: res.to,
      };
    }
  }

  if (puzzle.pgn) {
    const parsed = parsePgnToMoves(puzzle.pgn);
    if (parsed.valid && parsed.fens.length > 1) {
      const idx = parsed.fens.findIndex((f) => fenMatch(f, puzzle.fen));
      if (idx > 0) {
        const preFen = parsed.fens[idx - 1];
        const moveStr = parsed.moves[idx - 1];
        const res = makeMoveString(preFen, moveStr);
        if (res) {
          return {
            preMoveFen: preFen,
            moveSan: res.san,
            fromSquare: res.from,
            toSquare: res.to,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Recommends puzzle difficulty based on Stockfish evaluation text and solution length.
 */
export function suggestDifficultyFromEval(
  evalText: string,
  solutionLength: number
): 'Easy' | 'Medium' | 'Hard' | 'Master' {
  const lowerEval = evalText.toLowerCase();

  if (lowerEval.includes('mate in 1') || lowerEval.includes('mate in 2') || solutionLength <= 1) {
    return 'Easy';
  }

  if (lowerEval.includes('mate in 3') || lowerEval.includes('mate in 4') || solutionLength === 2) {
    return 'Medium';
  }

  if (lowerEval.includes('mate') || solutionLength === 3 || solutionLength === 4) {
    return 'Hard';
  }

  return 'Master';
}

