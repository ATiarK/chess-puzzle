import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { puzzles } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { PersonalLibraryGrid } from '@/components/dashboard/PersonalLibraryGrid';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Puzzle Library | Dashboard',
  description: 'Manage, edit, delete, and share your personal library of saved chess puzzles.',
};

export default async function DashboardPage() {
  const { userId } = await auth.protect();

  const userPuzzles = await db
    .select()
    .from(puzzles)
    .where(eq(puzzles.creatorId, userId))
    .orderBy(desc(puzzles.createdAt));

  return (
    <div className="space-y-8 py-2">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-100">
          Personal Puzzle Library
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Manage your saved chess puzzles, copy one-click shareable links, and challenge friends.
        </p>
      </div>

      <PersonalLibraryGrid initialPuzzles={userPuzzles} />
    </div>
  );
}
