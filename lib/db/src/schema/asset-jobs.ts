import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const assetJobsTable = pgTable("asset_jobs", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  status: text("status", {
    enum: ["pending", "processing", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  sourceText: text("source_text").notNull(),
  language: text("language").notNull().default("en"),
  marketingContent: text("marketing_content"),
  ebookContent: text("ebook_content"),
  coverSvg: text("cover_svg"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertAssetJobSchema = createInsertSchema(assetJobsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAssetJob = z.infer<typeof insertAssetJobSchema>;
export type AssetJob = typeof assetJobsTable.$inferSelect;
