import { pgTable, varchar, text, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { generateShortId } from '@/lib/id';

export const puzzles = pgTable('puzzles', {
  id: varchar('id', { length: 36 }).$defaultFn(() => generateShortId()).primaryKey(),
  creatorId: varchar('creator_id', { length: 128 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  fen: text('fen').notNull(),
  pgn: text('pgn'),
  solutionMoves: text('solution_moves').array().notNull(),
  alternativeSolutions: jsonb('alternative_solutions').$type<string[][]>().default([]),
  difficulty: varchar('difficulty', { length: 32 }).default('normal'),
  preMoveFen: text('pre_move_fen'),
  lastOpponentMove: varchar('last_opponent_move', { length: 32 }),
  legacyId: varchar('legacy_id', { length: 36 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Puzzle = typeof puzzles.$inferSelect;
export type NewPuzzle = typeof puzzles.$inferInsert;
