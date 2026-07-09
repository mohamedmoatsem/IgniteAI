import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";
import { desc, eq } from "drizzle-orm";
import { db, boardsTable, type BoardColumnJson } from "@workspace/db";
import {
  CreateBoardBody,
  GetBoardParams,
  DeleteBoardParams,
} from "@workspace/api-zod";
import { generateJson } from "../lib/gemini";

const router: IRouter = Router();

const generatedBoardSchema = z.object({
  title: z.string().min(1),
  columns: z
    .array(
      z.object({
        title: z.string().min(1),
        tasks: z
          .array(
            z.object({
              title: z.string().min(1),
              description: z.string(),
            }),
          )
          .default([]),
      }),
    )
    .min(1),
});

type GeneratedBoard = z.infer<typeof generatedBoardSchema>;

/** The fixed JumpStart column set, in order, that every generated board must conform to. */
const REQUIRED_COLUMN_TITLES = [
  "Backlog",
  "Design & Planning",
  "In Progress",
  "Review & Testing",
  "Done",
] as const;

/**
 * Normalizes raw (schema-validated) Gemini output into the exact 5 fixed
 * columns, in order, regardless of how the model ordered/named/split them.
 * Tasks from any unrecognized column are folded into "Backlog" so no work
 * the model generated is silently dropped. "Done" is always forced empty
 * since this is a freshly generated plan.
 */
function normalizeGeneratedBoard(generated: GeneratedBoard): GeneratedBoard {
  const byTitle = new Map<string, GeneratedBoard["columns"][number]["tasks"]>();
  for (const title of REQUIRED_COLUMN_TITLES) {
    byTitle.set(title, []);
  }

  for (const column of generated.columns) {
    const normalizedTitle = REQUIRED_COLUMN_TITLES.find(
      (required) => required.toLowerCase() === column.title.trim().toLowerCase(),
    );
    const target = normalizedTitle ?? "Backlog";
    byTitle.get(target)!.push(...column.tasks);
  }

  return {
    title: generated.title,
    columns: REQUIRED_COLUMN_TITLES.map((title) => ({
      title,
      // "Done" always starts empty for a freshly generated plan, even if the
      // model (incorrectly) put tasks there.
      tasks: title === "Done" ? [] : byTitle.get(title)!,
    })),
  };
}

router.get("/jumpstart/boards", async (_req, res): Promise<void> => {
  const boards = await db
    .select()
    .from(boardsTable)
    .orderBy(desc(boardsTable.createdAt));
  res.json(boards);
});

router.post("/jumpstart/boards", async (req, res): Promise<void> => {
  const parsed = CreateBoardBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let generated: GeneratedBoard;
  try {
    const raw = await generateJson<unknown>({
      systemInstruction:
        "You are a senior engineering lead running JumpStart, a tool that turns a raw tech/product idea into an actionable software delivery plan. Given a project or goal description, break it down into a Kanban board a development team could start executing immediately.\n\n" +
        "Respond with strict JSON only, matching this shape: " +
        '{"title": string, "columns": [{"title": string, "tasks": [{"title": string, "description": string}]}]}.\n\n' +
        "Rules:\n" +
        "- Use exactly these 5 columns, in this order: \"Backlog\", \"Design & Planning\", \"In Progress\", \"Review & Testing\", \"Done\". Leave \"Done\" empty (no tasks) since this is a fresh plan.\n" +
        "- Decompose the idea into concrete engineering work, not vague milestones. Cover the full stack implied by the idea where relevant: data model / schema, backend API or services, frontend / UI, third-party integrations, authentication, testing, and deployment / launch readiness.\n" +
        "- \"Design & Planning\" should hold upfront decisions (architecture, tech stack, data model, key UX flows) that should happen before heavy implementation.\n" +
        "- \"Backlog\" should hold implementation and polish work not yet started; \"In Progress\" should hold the 2-4 highest-priority tasks to start on immediately; \"Review & Testing\" should hold QA, code review, and validation tasks.\n" +
        "- Each task title must be a short, actionable developer-ticket phrase starting with a verb (e.g. \"Design the user schema\", \"Build the checkout API endpoint\", \"Wire up Stripe webhook handling\") — never a vague noun phrase like \"Backend\" or \"Testing\".\n" +
        "- Each task description must be 1-2 sentences of concrete implementation detail or acceptance criteria — specific enough that an engineer could pick it up without asking clarifying questions.\n" +
        "- Produce 3-7 tasks per non-empty column, sized so each task is roughly a few hours to two days of focused work. Avoid duplicate or overlapping tasks across columns.",
      prompt: parsed.data.prompt,
    });
    generated = normalizeGeneratedBoard(generatedBoardSchema.parse(raw));
  } catch (err) {
    req.log.error({ err }, "Gemini board generation failed");
    res.status(502).json({ error: "Failed to generate board" });
    return;
  }

  const columns: BoardColumnJson[] = generated.columns.map((column: GeneratedBoard["columns"][number]) => ({
    id: randomUUID(),
    title: column.title,
    tasks: column.tasks.map((task: GeneratedBoard["columns"][number]["tasks"][number]) => ({
      id: randomUUID(),
      title: task.title,
      description: task.description,
    })),
  }));

  const [board] = await db
    .insert(boardsTable)
    .values({
      prompt: parsed.data.prompt,
      title: generated.title,
      columns,
    })
    .returning();

  res.status(201).json(board);
});

router.get("/jumpstart/boards/:id", async (req, res): Promise<void> => {
  const params = GetBoardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [board] = await db
    .select()
    .from(boardsTable)
    .where(eq(boardsTable.id, params.data.id));

  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }

  res.json(board);
});

router.delete("/jumpstart/boards/:id", async (req, res): Promise<void> => {
  const params = DeleteBoardParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [board] = await db
    .delete(boardsTable)
    .where(eq(boardsTable.id, params.data.id))
    .returning();

  if (!board) {
    res.status(404).json({ error: "Board not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
