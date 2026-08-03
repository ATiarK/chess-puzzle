import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPuzzleById } from '@/lib/puzzles';
import { PuzzleSolver } from '@/components/solve/PuzzleSolver';
import { AlertCircle } from 'lucide-react';

interface SolvePageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: SolvePageProps): Promise<Metadata> {
  const { id } = await params;
  const puzzle = await getPuzzleById(id);

  if (!puzzle) {
    return {
      title: 'Puzzle Not Found - Chess Puzzle',
    };
  }

  return {
    title: `${puzzle.title} - Solve Chess Puzzle`,
    description: `Can you solve this ${puzzle.difficulty || 'normal'} chess tactical puzzle?`,
  };
}

export default async function SolvePuzzlePage({ params }: SolvePageProps) {
  const { id } = await params;
  const puzzle = await getPuzzleById(id);

  if (!puzzle) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-slate-100">
          Puzzle Not Found
        </h1>
        <p className="text-sm text-slate-400">
          We couldn&apos;t find a puzzle matching ID <code className="text-emerald-400">{id}</code>.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all"
        >
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="py-4">
      <PuzzleSolver puzzle={puzzle} />
    </div>
  );
}
