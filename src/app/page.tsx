import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="py-12 flex flex-col items-center text-center gap-12">
      {/* Hero Section */}
      <section className="max-w-3xl space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
          <span>Casual Chess • Instant Share • Zero Login</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Turn Your Best Chess Moments Into{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
            Shareable Puzzles
          </span>
        </h1>
        <p className="text-lg text-slate-300 leading-relaxed max-w-2xl mx-auto">
          Spot a brilliant tactical sequence during your post-game review? Capture any position from your casual chess.com games, confirm the winning line with Stockfish, and send a link to your friend.
        </p>
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/create"
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold hover:brightness-110 transition-all shadow-lg shadow-emerald-500/25 flex items-center gap-2"
          >
            <span>Create a Puzzle Now</span>
            <span>→</span>
          </Link>
          <Link
            href="/dashboard"
            className="px-8 py-3.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 font-semibold border border-slate-800 transition-all"
          >
            View My Library
          </Link>
        </div>
      </section>

      {/* 3-Step Feature Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full pt-8">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col items-start text-left gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
            1
          </div>
          <h3 className="text-xl font-bold text-slate-100">Paste PGN or Place Pieces</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Import a PGN from your latest game and step through the moves, or manually arrange pieces on an interactive board.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col items-start text-left gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold">
            2
          </div>
          <h3 className="text-xl font-bold text-slate-100">Stockfish Assisted Setup</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Verify tactics with Stockfish WASM. Save single-move puzzles or short forced sequences like mate-in-2 or mate-in-3.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm flex flex-col items-start text-left gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold">
            3
          </div>
          <h3 className="text-xl font-bold text-slate-100">Friends Solve Anonymously</h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            Send a unique link. Your friend opens the board instantly on any device and plays out the solution without needing an account.
          </p>
        </div>
      </section>
    </div>
  );
}
