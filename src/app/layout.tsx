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
import { BoardThemeProvider } from '@/context/BoardThemeContext';
import { Crown, Plus, Folder, LogIn } from 'lucide-react';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
});

export const metadata: Metadata = {
  title: 'Chess Puzzle Sharing App',
  description: 'Create and share tactical chess puzzles from your casual games with friends — no login required to solve.',
  icons: {
    icon: [
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
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
          <BoardThemeProvider>
            <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/75 backdrop-blur-md">
              <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link
                  href="/"
                  className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-100 hover:text-emerald-400 transition-colors"
                >
                  <Crown className="w-5 h-5 text-emerald-500" />
                  <span>Chess Puzzle</span>
                </Link>
                <nav className="flex items-center gap-3 sm:gap-6 text-sm font-medium">
                  <Show when="signed-in">
                    <Link
                      href="/create"
                      title="Create Puzzle"
                      aria-label="Create Puzzle"
                      className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <Plus className="w-5 h-5 md:hidden" />
                      <span className="hidden md:inline">Create Puzzle</span>
                    </Link>
                    <Link
                      href="/dashboard"
                      title="My Library"
                      aria-label="My Library"
                      className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                    >
                      <Folder className="w-5 h-5 md:hidden" />
                      <span className="hidden md:inline">My Library</span>
                    </Link>
                    <UserButton />
                  </Show>

                  <Show when="signed-out">
                    <SignInButton mode="modal" forceRedirectUrl="/create">
                      <button
                        type="button"
                        title="Create Puzzle"
                        aria-label="Create Puzzle"
                        className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                      >
                        <Plus className="w-5 h-5 md:hidden" />
                        <span className="hidden md:inline">Create Puzzle</span>
                      </button>
                    </SignInButton>

                    <SignInButton mode="modal" forceRedirectUrl="/dashboard">
                      <button
                        type="button"
                        title="My Library"
                        aria-label="My Library"
                        className="text-slate-300 hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                      >
                        <Folder className="w-5 h-5 md:hidden" />
                        <span className="hidden md:inline">My Library</span>
                      </button>
                    </SignInButton>

                    <SignInButton mode="modal">
                      <button className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-all shadow-md flex items-center gap-1.5 text-xs sm:text-sm">
                        <LogIn className="w-4 h-4 md:hidden" />
                        <span className="hidden md:inline">Creator Sign In</span>
                        <span className="md:hidden">Sign In</span>
                      </button>
                    </SignInButton>
                  </Show>
                </nav>
              </div>
            </header>
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
            {children}
          </main>
          </BoardThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

