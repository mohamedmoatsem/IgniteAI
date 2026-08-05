import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";
import { desc, eq } from "drizzle-orm";
import { db, boardsTable, type BoardColumnJson, type BoardTaskJson } from "@workspace/db";
import {
  CreateBoardBody,
  GetBoardParams,
  DeleteBoardParams,
  DelegateTaskParams,
} from "@workspace/api-zod";
import { generateJson, generateText } from "../lib/gemini";

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

  const uiLang = parsed.data.language ?? "en";
  const langNote =
    uiLang !== "en"
      ? `\n\nIMPORTANT: Write all task titles and descriptions in the language with BCP-47 code "${uiLang}".`
      : "";

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
        "- Produce 3-7 tasks per non-empty column, sized so each task is roughly a few hours to two days of focused work. Avoid duplicate or overlapping tasks across columns." +
        langNote,
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
      language: uiLang,
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

// ---------------------------------------------------------------------------
// Delegate task — Multi-Agent pipeline: Research → Coder → QA
// ---------------------------------------------------------------------------
router.post(
  "/jumpstart/boards/:id/tasks/:taskId/delegate",
  async (req, res): Promise<void> => {
    const params = DelegateTaskParams.safeParse(req.params);
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

    // Locate the task across all columns
    let foundTask: BoardTaskJson | null = null;
    let fromColIdx = -1;
    let fromTaskIdx = -1;
    const columns = board.columns as BoardColumnJson[];
    for (let ci = 0; ci < columns.length; ci++) {
      const ti = columns[ci]!.tasks.findIndex(
        (t) => t.id === params.data.taskId,
      );
      if (ti !== -1) {
        foundTask = columns[ci]!.tasks[ti]!;
        fromColIdx = ci;
        fromTaskIdx = ti;
        break;
      }
    }

    if (!foundTask) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    // ── Agent 1: Research ──────────────────────────────────────────────────
    let researchSummary: string;
    try {
      researchSummary = await generateText({
        systemInstruction:
          "You are the Research Sub-Agent in a multi-agent development pipeline. " +
          "Given a single developer task ticket, identify the key technical requirements, " +
          "relevant APIs or libraries, and any architectural dependencies to be aware of. " +
          "Respond in 3-5 concise bullet points. Keep it tightly scoped to the task.",
        prompt: `Task: ${foundTask.title}\nDescription: ${foundTask.description}`,
      });
    } catch (err) {
      req.log.error({ err }, "Research sub-agent failed");
      res.status(502).json({ error: "Research agent failed" });
      return;
    }

    // ── Agent 2: Coder (context-summarized handoff) ────────────────────────
    let codeSketch: string;
    try {
      codeSketch = await generateText({
        systemInstruction:
          "You are the Coder Sub-Agent. You receive a concise research summary and a task ticket. " +
          "Write a minimal but functional starting code block or pseudocode outline that directly " +
          "implements the task. Include inline comments. Keep output under 40 lines.",
        prompt:
          `Task: ${foundTask.title}\n` +
          `Description: ${foundTask.description}\n\n` +
          `Research handoff (summary):\n${researchSummary}`,
      });
    } catch (err) {
      req.log.error({ err }, "Coder sub-agent failed");
      res.status(502).json({ error: "Coder agent failed" });
      return;
    }

    // ── Agent 3: QA (security + syntax review) ────────────────────────────
    let qaReview: string;
    try {
      qaReview = await generateText({
        systemInstruction:
          "You are the QA Sub-Agent. Review the provided code sketch for security issues, " +
          "syntax errors, edge cases, and readability. Give a 2-4 sentence verdict and list " +
          "any concrete improvements. End with 'STATUS: READY FOR REVIEW' if it passes.",
        prompt:
          `Task: ${foundTask.title}\n\n` +
          `Code sketch:\n${codeSketch}`,
      });
    } catch (err) {
      req.log.error({ err }, "QA sub-agent failed");
      res.status(502).json({ error: "QA agent failed" });
      return;
    }

    const agentNotes =
      `## 🔍 Research Agent\n${researchSummary}\n\n` +
      `## 💻 Coder Agent\n\`\`\`\n${codeSketch}\n\`\`\`\n\n` +
      `## ✅ QA Agent\n${qaReview}`;

    // Move task to "Review & Testing" column, attach agent notes
    const reviewColIdx = columns.findIndex(
      (c) => c.title === "Review & Testing",
    );

    const updatedColumns = columns.map((col, ci) => {
      if (ci === fromColIdx) {
        return {
          ...col,
          tasks: col.tasks.filter((_, ti) => ti !== fromTaskIdx),
        };
      }
      if (ci === reviewColIdx && reviewColIdx !== fromColIdx) {
        return {
          ...col,
          tasks: [
            { ...foundTask!, agentNotes },
            ...col.tasks,
          ] as BoardTaskJson[],
        };
      }
      return col;
    });

    // If task is already in "Review & Testing", just update agentNotes in place
    const finalColumns =
      reviewColIdx === fromColIdx
        ? columns.map((col, ci) =>
            ci === fromColIdx
              ? {
                  ...col,
                  tasks: col.tasks.map((t, ti) =>
                    ti === fromTaskIdx ? { ...t, agentNotes } : t,
                  ),
                }
              : col,
          )
        : updatedColumns;

    const [updated] = await db
      .update(boardsTable)
      .set({ columns: finalColumns })
      .where(eq(boardsTable.id, params.data.id))
      .returning();

    res.json(updated);
  },
);

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
