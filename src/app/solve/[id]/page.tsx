import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getPuzzleById } from '@/lib/puzzles';
import { PuzzleSolver } from '@/components/solve/PuzzleSolver';

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
      title: 'Puzzle Not Found | Chess Puzzle',
      description: 'This chess puzzle does not exist or has been removed.',
    };
  }

  return {
    title: `${puzzle.title} | Chess Puzzle`,
    description: `Can you solve "${puzzle.title}"? Tactical challenge (${
      puzzle.difficulty || 'Normal'
    } difficulty). No login required!`,
    openGraph: {
      title: `${puzzle.title} — Can you solve this chess puzzle?`,
      description: `Test your chess tactics! Try solving "${puzzle.title}" instantly without signing in.`,
    },
  };
}

export default async function SolvePuzzlePage({ params }: SolvePageProps) {
  const { id } = await params;
  const puzzle = await getPuzzleById(id);

  if (!puzzle) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-4">
        <div className="text-4xl">♟️</div>
        <h1 className="text-xl font-bold text-slate-100">
          Puzzle Not Found
        </h1>
        <p className="text-sm text-slate-400">
          We couldn&apos;t find a puzzle matching ID <code className="text-emerald-400">{id}</code>.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-sm hover:brightness-110 transition-all"
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
