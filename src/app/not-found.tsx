import React from 'react';
import Link from 'next/link';
import { Home, Plus, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-500 mb-6 shadow-xl">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">
        Error 404
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-100 mt-2">
        Position Not Found
      </h1>

      <p className="max-w-md text-sm text-slate-400 mt-3">
        The chess puzzle or page you are looking for does not exist, has been deleted, or the link is invalid.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-8 w-full max-w-xs sm:max-w-none justify-center">
        <Link
          href="/"
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
        >
          <Home className="w-4 h-4" />
          <span>Return Home</span>
        </Link>

        <Link
          href="/create"
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Puzzle</span>
        </Link>
      </div>
    </div>
  );
}
