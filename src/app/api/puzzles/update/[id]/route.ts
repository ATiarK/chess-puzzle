import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { puzzles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { validateFen } from '@/lib/chess/utils';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Puzzle ID required' }, { status: 400 });
    }

    const body = await req.json();
    const {
      title,
      difficulty,
      fen,
      pgn,
      preMoveFen,
      lastOpponentMove,
      solutionMoves,
    } = body;

    if (title !== undefined && (!title || typeof title !== 'string' || !title.trim())) {
      return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
    }

    if (fen !== undefined && (!fen || typeof fen !== 'string' || !validateFen(fen))) {
      return NextResponse.json({ error: 'A valid FEN position is required' }, { status: 400 });
    }

    if (
      solutionMoves !== undefined &&
      (!Array.isArray(solutionMoves) || solutionMoves.length === 0)
    ) {
      return NextResponse.json(
        { error: 'At least one solution move is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    if (title !== undefined) updateData.title = title.trim();
    if (difficulty !== undefined) updateData.difficulty = difficulty || 'Medium';
    if (fen !== undefined) updateData.fen = fen;
    if (pgn !== undefined) updateData.pgn = pgn || null;
    if (preMoveFen !== undefined) updateData.preMoveFen = preMoveFen || null;
    if (lastOpponentMove !== undefined) updateData.lastOpponentMove = lastOpponentMove || null;
    if (solutionMoves !== undefined) updateData.solutionMoves = solutionMoves;

    const updatedRows = await db
      .update(puzzles)
      .set(updateData)
      .where(and(eq(puzzles.id, id), eq(puzzles.creatorId, userId)))
      .returning();

    if (updatedRows.length === 0) {
      return NextResponse.json(
        { error: 'Puzzle not found or unauthorized to edit' },
        { status: 404 }
      );
    }

    return NextResponse.json({ puzzle: updatedRows[0] }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update puzzle';
    console.error('ERROR updating puzzle:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
