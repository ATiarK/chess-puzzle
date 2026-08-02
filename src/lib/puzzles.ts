import { db } from '@/lib/db';
import { puzzles, type Puzzle } from '@/db/schema';
import { eq, ne, sql } from 'drizzle-orm';

export async function getPuzzleById(id: string): Promise<Puzzle | null> {
  try {
    const [puzzle] = await db
      .select()
      .from(puzzles)
      .where(eq(puzzles.id, id))
      .limit(1);

    return puzzle || null;
  } catch (error) {
    console.error('Error fetching puzzle by id:', error);
    return null;
  }
}

export async function getRandomPuzzleId(excludeId?: string): Promise<string | null> {
  try {
    const query = db
      .select({ id: puzzles.id })
      .from(puzzles)
      .orderBy(sql`RANDOM()`)
      .limit(1);

    if (excludeId) {
      query.where(ne(puzzles.id, excludeId));
    }

    const [randomPuzzle] = await query;
    return randomPuzzle?.id || null;
  } catch (error) {
    console.error('Error fetching random puzzle id:', error);
    return null;
  }
}
