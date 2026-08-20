import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { puzzles } from '../src/db/schema';
import { generateShortId } from '../src/lib/id';
import { eq } from 'drizzle-orm';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log('Fetching all puzzles...');
  const allPuzzles = await db.select().from(puzzles);
  console.log(`Found ${allPuzzles.length} total puzzles.`);

  let migratedCount = 0;
  for (const puzzle of allPuzzles) {
    // If ID is longer than 16 (i.e. UUID format)
    if (puzzle.id.length > 16) {
      const newShortId = generateShortId();
      const oldUuid = puzzle.id;

      console.log(`Migrating puzzle "${puzzle.title}": ${oldUuid} -> ${newShortId}`);

      await db
        .update(puzzles)
        .set({
          id: newShortId,
          legacyId: oldUuid,
        })
        .where(eq(puzzles.id, oldUuid));

      migratedCount++;
    }
  }

  console.log(`Migration complete! Successfully converted ${migratedCount} puzzles to short IDs.`);
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
