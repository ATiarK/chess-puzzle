import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { puzzles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

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
    const { title, difficulty } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Valid title is required' }, { status: 400 });
    }

    const updatedRows = await db
      .update(puzzles)
      .set({
        title: title.trim(),
        difficulty: difficulty || 'Medium',
        updatedAt: new Date(),
      })
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
