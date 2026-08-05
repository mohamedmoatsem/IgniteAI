import { pgTable, serial, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export interface BoardTaskJson {
  id: string;
  title: string;
  description: string;
  /** Notes/snippet produced by delegating this task to the background AI agent. */
  agentNotes?: string;
}

export interface BoardColumnJson {
  id: string;
  title: string;
  tasks: BoardTaskJson[];
}

export const boardsTable = pgTable("boards", {
  id: serial("id").primaryKey(),
  prompt: text("prompt").notNull(),
  title: text("title").notNull(),
  language: text("language").notNull().default("en"),
  columns: jsonb("columns").$type<BoardColumnJson[]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertBoardSchema = createInsertSchema(boardsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertBoard = z.infer<typeof insertBoardSchema>;
export type Board = typeof boardsTable.$inferSelect;
