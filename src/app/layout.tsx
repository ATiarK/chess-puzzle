import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import {
  ClerkProvider,
  SignInButton,
  Show,
  UserButton,
} from '@clerk/nextjs';
import Link from 'next/link';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Chess Puzzle Sharing App',
  description: 'Create and share tactical chess puzzles from your casual games with friends — no login required to solve.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${outfit.variable} dark h-full antialiased`}>
        <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-slate-950">
          <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-md">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90 transition-opacity"
              >
                <span>♟️ Chess Puzzle</span>
              </Link>
              <nav className="flex items-center gap-6 text-sm font-medium">
                <Link
                  href="/create"
                  className="text-slate-300 hover:text-emerald-400 transition-colors"
                >
                  Create Puzzle
                </Link>
                <Show when="signed-in">
                  <Link
                    href="/dashboard"
                    className="text-slate-300 hover:text-emerald-400 transition-colors"
                  >
                    My Library
                  </Link>
                  <UserButton />
                </Show>
                <Show when="signed-out">
                  <SignInButton mode="modal">
                    <button className="px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-semibold hover:brightness-110 transition-all shadow-md shadow-emerald-500/20">
                      Creator Sign In
                    </button>
                  </SignInButton>
                </Show>
              </nav>
            </div>
          </header>
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            {children}
          </main>
        </body>
      </html>
    </ClerkProvider>
  );
}
