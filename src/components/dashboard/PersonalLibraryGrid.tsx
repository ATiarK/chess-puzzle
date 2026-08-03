'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PuzzleCard } from './PuzzleCard';
import type { Puzzle } from '@/db/schema';
import { Crown, Plus } from 'lucide-react';

export interface PersonalLibraryGridProps {
  initialPuzzles: Puzzle[];
}

export function PersonalLibraryGrid({ initialPuzzles }: PersonalLibraryGridProps) {
  const [puzzles, setPuzzles] = useState<Puzzle[]>(initialPuzzles);

  const handleDelete = (deletedId: string) => {
    setPuzzles((prev) => prev.filter((p) => p.id !== deletedId));
  };

  const handleUpdatePuzzle = (updatedPuzzle: Puzzle) => {
    setPuzzles((prev) =>
      prev.map((p) => (p.id === updatedPuzzle.id ? updatedPuzzle : p))
    );
  };

  if (puzzles.length === 0) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900/60 rounded-3xl border border-slate-800 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Crown className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">
          Your Puzzle Library is Empty
        </h2>
        <p className="text-sm text-slate-400">
          You haven&apos;t created any chess puzzles yet. Open the studio to create and share your first tactical challenge!
        </p>
        <Link
          href="/create"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-md transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Puzzle</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
        <span>Showing {puzzles.length} Saved {puzzles.length === 1 ? 'Puzzle' : 'Puzzles'}</span>
        <Link
          href="/create"
          className="px-3.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold hover:bg-emerald-500/30 transition-colors"
        >
          + New Puzzle
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        {puzzles.map((puzzle) => (
          <PuzzleCard
            key={puzzle.id}
            puzzle={puzzle}
            onDelete={handleDelete}
            onUpdatePuzzle={handleUpdatePuzzle}
          />
        ))}
      </div>
    </div>
  );
}
