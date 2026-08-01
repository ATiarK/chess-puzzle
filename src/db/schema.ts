import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const puzzles = pgTable('puzzles', {
  id: uuid('id').defaultRandom().primaryKey(),
  creatorId: varchar('creator_id', { length: 128 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  fen: text('fen').notNull(),
  pgn: text('pgn'),
  solutionMoves: text('solution_moves').array().notNull(),
  difficulty: varchar('difficulty', { length: 32 }).default('normal'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Puzzle = typeof puzzles.$inferSelect;
export type NewPuzzle = typeof puzzles.$inferInsert;
