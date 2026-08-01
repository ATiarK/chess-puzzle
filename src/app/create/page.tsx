import { auth } from '@clerk/nextjs/server';
import { CreatePuzzleStudio } from '@/components/create/CreatePuzzleStudio';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Chess Puzzle | Studio',
  description: 'Create tactical chess puzzles by pasting a PGN game or setting up an interactive board.',
};

export default async function CreatePuzzlePage() {
  // Enforce authentication for creator routes
  await auth.protect();

  return (
    <div className="py-2">
      <CreatePuzzleStudio />
    </div>
  );
}
