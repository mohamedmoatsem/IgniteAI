import { pgTable, serial, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

export const resumesTable = pgTable("resumes", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  country: text("country"),
  remote: boolean("remote"),
  parsedSummary: text("parsed_summary").notNull().default(""),
  skills: text("skills"),
  experience: text("experience"),
  /** Raw extracted text — never returned in API responses. */
  sourceText: text("source_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const jobApplicationsTable = pgTable("job_applications", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull().references(() => resumesTable.id),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: text("status", { enum: ["found", "applying", "submitted"] })
    .notNull()
    .default("found"),
  coverLetter: text("cover_letter"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Resume = typeof resumesTable.$inferSelect;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;
