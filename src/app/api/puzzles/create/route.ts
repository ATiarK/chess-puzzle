import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { puzzles } from '@/db/schema';
import { validateFen } from '@/lib/chess/utils';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized — please sign in' }, { status: 401 });
    }

    const body = await req.json();
    const { title, fen, pgn, solutionMoves, alternativeSolutions, difficulty, preMoveFen, lastOpponentMove } = body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return NextResponse.json({ error: 'Puzzle title is required' }, { status: 400 });
    }

    if (!fen || typeof fen !== 'string' || !validateFen(fen)) {
      return NextResponse.json({ error: 'A valid FEN position is required' }, { status: 400 });
    }

    if (!Array.isArray(solutionMoves) || solutionMoves.length === 0) {
      return NextResponse.json(
        { error: 'At least one solution move is required' },
        { status: 400 }
      );
    }

    const [newPuzzle] = await db
      .insert(puzzles)
      .values({
        creatorId: userId,
        title: title.trim(),
        fen,
        pgn: pgn || null,
        solutionMoves,
        alternativeSolutions: Array.isArray(alternativeSolutions) ? alternativeSolutions : [],
        difficulty: difficulty || 'Medium',
        preMoveFen: preMoveFen || null,
        lastOpponentMove: lastOpponentMove || null,
      })
      .returning();

    return NextResponse.json({ puzzle: newPuzzle }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create puzzle';
    console.error('ERROR creating puzzle:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
