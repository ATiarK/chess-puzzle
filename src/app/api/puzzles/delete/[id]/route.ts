import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { puzzles } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function DELETE(
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

    const deletedRows = await db
      .delete(puzzles)
      .where(and(eq(puzzles.id, id), eq(puzzles.creatorId, userId)))
      .returning();

    if (deletedRows.length === 0) {
      return NextResponse.json(
        { error: 'Puzzle not found or unauthorized to delete' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, deletedId: id }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete puzzle';
    console.error('ERROR deleting puzzle:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
