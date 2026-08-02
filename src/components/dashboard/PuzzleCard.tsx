'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChessBoardWrapper } from '@/components/chess/ChessBoardWrapper';
import { whoseTurn } from '@/lib/chess/utils';
import type { Puzzle } from '@/db/schema';

export interface PuzzleCardProps {
  puzzle: Puzzle;
  onDelete: (id: string) => void;
  onUpdateTitle: (id: string, newTitle: string) => void;
}

export function PuzzleCard({ puzzle, onDelete, onUpdateTitle }: PuzzleCardProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(puzzle.title);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const turn = whoseTurn(puzzle.fen);
  const formattedDate = new Date(puzzle.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/solve/${puzzle.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      // fallback prompt
      prompt('Copy Share Link:', shareUrl);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || editTitle.trim() === puzzle.title) {
      setIsEditing(false);
      return;
    }

    try {
      const res = await fetch(`/api/puzzles/update/${puzzle.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: editTitle.trim(), difficulty: puzzle.difficulty }),
      });

      if (res.ok) {
        onUpdateTitle(puzzle.id, editTitle.trim());
      }
    } catch (e) {
      console.error('Failed to update title:', e);
    } finally {
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/puzzles/delete/${puzzle.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onDelete(puzzle.id);
      }
    } catch (e) {
      console.error('Failed to delete puzzle:', e);
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-slate-900/75 rounded-2xl border border-slate-800/80 overflow-hidden shadow-xl flex flex-col justify-between transition-all hover:border-slate-700">
      {/* Mini Chessboard Preview */}
      <div className="p-3 bg-slate-950/60 border-b border-slate-800/60 relative group">
        <Link href={`/solve/${puzzle.id}`} target="_blank" className="block cursor-pointer">
          <ChessBoardWrapper
            fen={puzzle.fen}
            arePiecesDraggable={false}
            showBoardNotation={false}
            className="!max-w-[280px] hover:opacity-90 transition-opacity"
          />
        </Link>

        {/* Turn Badge */}
        <span className="absolute bottom-5 left-5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-slate-900/90 border border-slate-700 text-slate-200 shadow">
          {turn === 'white' ? 'White to move' : 'Black to move'}
        </span>
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-400">
              {puzzle.difficulty || 'Normal'}
            </span>
            <span className="text-[11px] text-slate-500">{formattedDate}</span>
          </div>

          {isEditing ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <h3
                onClick={() => setIsEditing(true)}
                className="text-base font-bold text-slate-100 line-clamp-1 cursor-pointer hover:text-emerald-400 transition-colors"
                title="Click to edit title"
              >
                {puzzle.title}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-slate-500 hover:text-slate-300 text-xs font-medium"
              >
                ✎
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/solve/${puzzle.id}`}
              target="_blank"
              className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs text-center transition-colors flex items-center justify-center gap-1"
            >
              <span>Test Solve ↗</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyShareLink}
              className={`py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 ${
                isCopied
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
              }`}
            >
              <span>{isCopied ? 'Copied! ✓' : 'Share Link 🔗'}</span>
            </button>
          </div>

          {/* Delete Confirm */}
          {showConfirmDelete ? (
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between text-xs">
              <span className="text-rose-300 font-semibold">Delete puzzle?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-2.5 py-1 rounded bg-rose-500 text-slate-950 font-bold"
                >
                  {isDeleting ? '...' : 'Yes'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="text-slate-400 hover:text-slate-200"
                >
                  No
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmDelete(true)}
              className="w-full py-1 text-xs text-slate-500 hover:text-rose-400 transition-colors text-center"
            >
              Delete Puzzle
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
