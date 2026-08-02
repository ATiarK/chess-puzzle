# ♟️ Chess Puzzle Creator & Public Solver Studio

A premium, interactive web application for creating, analyzing, and sharing tactical chess puzzles. Built with **Next.js 16 (App Router)**, **Neon Serverless PostgreSQL**, **Drizzle ORM**, **Clerk Authentication**, and **Stockfish 16 WASM Web Worker**.

---

## ✨ Key Features

- **🎨 Two-Step Puzzle Creation Studio**:
  - **Method 1: Paste PGN** — Load PGN games (from Lichess, Chess.com, or OTB games), use an interactive half-move stepper (`|◄`, `◄`, `►`, `►|`) to jump to the tactical turning point.
  - **Method 2: Manual Board Placement** — Interactive piece palette for White and Black, board clear tool, turn selector (`White to move` / `Black to move`), and live FEN structural validation.
- **⚡ Stockfish 16 Engine Assistant**:
  - Web Worker-based non-blocking Stockfish 16 WASM evaluation.
  - One-click **"Adopt Engine Move"** to record tactical solutions instantly or play moves manually.
- **🌍 Public Anonymous Solver (`/solve/[id]`)**:
  - No login required to solve puzzles!
  - Animated feedback banners (Emerald glow for correct moves, Ruby shake for wrong moves with an instant "Try Again" retry loop).
  - Multi-move sequence support with automatic 400ms opponent reply execution.
  - Celebratory **Victory Modal** with trophy badge and "Solve Another" / "Create Your Own" viral loop links.
- **📚 Personal Creator Library (`/dashboard`)**:
  - Authenticated creator dashboard displaying all saved puzzles in a responsive masonry grid with static FEN chessboard thumbnails.
  - One-click **Share Link (`🔗`)** copying direct `/solve/[id]` URL with toast notification.
  - Inline title editing and puzzle deletion with ownership enforcement.
- **🚀 Production-Ready & SEO Optimized**:
  - Dynamic OpenGraph metadata (`[Title] — Can you solve this chess puzzle?`).
  - Strip PGN comments, variations, clock times (`cleanPgn`), and validate board integrity.

---

## 🛠️ Technology Stack

| Component | Technology |
| :--- | :--- |
| **Framework** | Next.js 16.2 (App Router, Turbopack, Server Components) |
| **Database** | Neon Serverless PostgreSQL (`@neondatabase/serverless`) |
| **ORM** | Drizzle ORM (`drizzle-orm`, `drizzle-kit`) |
| **Authentication** | Clerk (`@clerk/nextjs` resource-based auth checks) |
| **Chess Engine & Logic** | `chess.js` (validation/PGN) + Stockfish 16 WASM via Blob Web Worker |
| **Chess UI** | `react-chessboard` v5 (responsive wrapper) |
| **Styling** | Vanilla CSS / Tailwind CSS v4 (Glassmorphism, custom dark scrollbars) |

---

## 📂 Project Structure & Phase Documentation

The complete engineering specifications and phase breakdown are documented in the `./docs` directory:

```
docs/
├── chess-puzzle-app-spec.md                # Main comprehensive specification
└── phases/
    ├── phase-01-project-setup-and-db.md    # Initial setup, Neon DB, Drizzle schema, Clerk Auth
    ├── phase-02-chess-engine-and-board-core.md # Chess.js wrappers, Stockfish Web Worker hook
    ├── phase-03-puzzle-creation-flow.md    # PGN stepper, Manual board palette, Solution Studio
    ├── phase-04-solving-experience.md      # Public anonymous /solve/[id] page & feedback loop
    ├── phase-05-personal-library-and-sharing.md # /dashboard library, share link copy, DELETE/PATCH APIs
    └── phase-06-ui-polish-and-deployment.md # Aesthetics, cleanPgn edge-case handling, Vercel config
```

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have **Node.js 20+** and **Yarn** installed.

### 2. Configure Environment Variables
Create a `.env` file in the project root with your Neon PostgreSQL and Clerk keys:

```env
# Neon Database Connection String (Serverless Postgres)
DATABASE_URL="postgresql://user:password@ep-...neon.tech/neondb?sslmode=require&channel_binding=require"

# Clerk Authentication Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Clerk Auth Routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

### 3. Install Dependencies & Set Up Database
Install node modules and push the Drizzle schema (`puzzles` table) to your Neon Postgres database:

```bash
# Install dependencies
yarn install

# Push schema to Neon Postgres
yarn db:push
```

### 4. Run Development Server
Start the local Next.js development server:

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Database Schema Overview

The Drizzle ORM schema (`src/db/schema.ts`) defines the `puzzles` table:

- `id`: UUID (Primary Key)
- `creatorId`: Text (Clerk user ID, Indexed)
- `title`: Text (Puzzle title)
- `fen`: Text (Starting position FEN)
- `pgn`: Text (Optional PGN game source)
- `solutionMoves`: JSONB array of SAN move strings (e.g., `["Qxh7+", "Kxh7", "Rh3#"]`)
- `difficulty`: Text (`Easy` | `Medium` | `Hard` | `Master`)
- `createdAt` / `updatedAt`: Timestamp

---

## 🌐 Production Deployment (Vercel)

1. Connect your repository to [Vercel](https://vercel.com).
2. Add your `.env` environment variables (`DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`).
3. Vercel automatically detects Next.js and uses `vercel.json` for security headers and cache optimization on public `/solve/*` routes.
