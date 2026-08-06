import { Router, type IRouter } from "express";
import multer from "multer";
import { desc, eq } from "drizzle-orm";
import { db, resumesTable, jobApplicationsTable, boardsTable } from "@workspace/db";
import {
  GetResumeParams,
  CreateApplicationBody,
  UpdateApplicationBody,
  DeleteApplicationParams,
  UploadResumeBody,
} from "@workspace/api-zod";
import { z } from "zod/v4";

const GetApplicationParams = z.object({ id: z.coerce.number().int().positive() });
import { generateText } from "../lib/gemini";
import { getUnifiedDataHubContext } from "../lib/datahub";

const router: IRouter = Router();

const ALLOWED_RESUME_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".md"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const lower = file.originalname.toLowerCase();
    const allowed = ALLOWED_RESUME_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!allowed) {
      callback(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }
    callback(null, true);
  },
});

/** Extract text from an uploaded resume buffer (PDF/text/markdown). */
function extractResumeText(buffer: Buffer, filename: string): string {
  // For text-based formats (txt, md, docx text layer), decode as UTF-8.
  // PDF binary text extraction is best-effort without a heavy library.
  const text = buffer.toString("utf-8");
  // Remove null bytes and control chars that indicate non-text binary
  const cleaned = text.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f]/g, " ").trim();
  return cleaned.length > 50 ? cleaned : `[Resume file: ${filename}]`;
}

/** Strip sourceText before returning over the API. */
function toApiResume(r: typeof resumesTable.$inferSelect) {
  return {
    id: r.id,
    filename: r.filename,
    country: r.country,
    remote: r.remote,
    parsedSummary: r.parsedSummary,
    skills: r.skills,
    experience: r.experience,
    createdAt: r.createdAt,
  };
}

// ── Resumes ────────────────────────────────────────────────────────────────

router.get("/career/resumes", async (_req, res): Promise<void> => {
  const rows = await db.select().from(resumesTable).orderBy(desc(resumesTable.createdAt));
  res.json(rows.map(toApiResume));
});

router.post(
  "/career/resumes",
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown): void => {
      if (err) {
        res.status(400).json({
          error:
            err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE"
              ? "Unsupported file type. Upload a PDF, Word (.doc/.docx), or text file."
              : "Failed to process the uploaded file",
        });
        return;
      }
      next();
    });
  },
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "A resume file is required" });
      return;
    }

    const sourceText = extractResumeText(req.file.buffer, req.file.originalname);
    const country =
      typeof req.body?.country === "string" ? req.body.country.trim() : undefined;
    const remote =
      req.body?.remote === "true" || req.body?.remote === true ? true : false;

    // Fetch recent JumpStart boards to enrich the resume context
    const recentBoards = await db
      .select({ title: boardsTable.title, prompt: boardsTable.prompt })
      .from(boardsTable)
      .orderBy(desc(boardsTable.createdAt))
      .limit(5);

    const projectContext =
      recentBoards.length > 0
        ? `\n\nActive JumpStart Projects (from the developer's workspace):\n` +
          recentBoards.map((b) => `- ${b.title}: "${b.prompt}"`).join("\n")
        : "";

    // Inject DataHub: pre-seeded portfolio context (Aman, SyncSolar, Namaa)
    const dataHubContext = getUnifiedDataHubContext();

    let parsedSummary: string;
    let skills: string;
    let experience: string;

    try {
      parsedSummary = await generateText({
        systemInstruction:
          "You are a Career Catalyst agent. Parse the resume below and merge it with the developer's " +
          "active JumpStart projects AND their verified DataHub portfolio (Aman, SyncSolar Systems, Namaa) " +
          "to create a rich, credible professional summary. " +
          "Produce a concise 3-5 sentence professional summary that highlights technical strengths, " +
          "real-world impact, and concrete project evidence from both the workspace and the DataHub portfolio. " +
          "Write in third person. Reference specific project names from DataHub where relevant. " +
          "Do not hallucinate details not present in the input.",
        prompt: `Resume text:\n${sourceText}${projectContext}${dataHubContext}`,
      });

      skills = await generateText({
        systemInstruction:
          "Extract a comma-separated list of the top 8-12 technical skills from this resume and project portfolio. " +
          "Include programming languages, frameworks, tools, and platforms evidenced in both the resume and the DataHub projects. " +
          "Output only the comma-separated list.",
        prompt: `Resume text:\n${sourceText}${projectContext}${dataHubContext}`,
      });

      experience = await generateText({
        systemInstruction:
          "Summarize the work experience from this resume as a bulleted markdown list. " +
          "Each bullet: '- **Role** at **Company** (dates if visible): one-sentence description.' " +
          "After formal experience, add a 'Notable Projects' section referencing the DataHub portfolio " +
          "(Aman, SyncSolar Systems, Namaa) with a one-line impact statement each. " +
          "Max 8 bullets total. Do not hallucinate.",
        prompt: `Resume text:\n${sourceText}${projectContext}${dataHubContext}`,
      });
    } catch (err) {
      req.log.error({ err }, "Resume parsing failed");
      res.status(502).json({ error: "Failed to parse resume with AI" });
      return;
    }

    const [resume] = await db
      .insert(resumesTable)
      .values({
        filename: req.file.originalname,
        country: country || null,
        remote,
        sourceText,
        parsedSummary,
        skills,
        experience,
      })
      .returning();

    res.status(201).json(toApiResume(resume!));
  },
);

router.get("/career/resumes/:id", async (req, res): Promise<void> => {
  const params = GetResumeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, params.data.id));
  if (!row) {
    res.status(404).json({ error: "Resume not found" });
    return;
  }
  res.json(toApiResume(row));
});

// ── Applications ───────────────────────────────────────────────────────────

router.get("/career/applications", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(jobApplicationsTable)
    .orderBy(desc(jobApplicationsTable.createdAt));
  res.json(rows);
});

router.post("/career/applications", async (req, res): Promise<void> => {
  const parsed = CreateApplicationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [resume] = await db
    .select()
    .from(resumesTable)
    .where(eq(resumesTable.id, parsed.data.resumeId));

  if (!resume) {
    res.status(400).json({ error: "Resume not found" });
    return;
  }

  // Fetch recent boards for project context
  const recentBoards = await db
    .select({ title: boardsTable.title, prompt: boardsTable.prompt })
    .from(boardsTable)
    .orderBy(desc(boardsTable.createdAt))
    .limit(5);

  const projectContext =
    recentBoards.length > 0
      ? `\nActive projects from developer workspace:\n` +
        recentBoards.map((b) => `- ${b.title}: ${b.prompt}`).join("\n")
      : "";

  // Inject DataHub: pre-seeded portfolio context (Aman, SyncSolar, Namaa)
  const dataHubContext = getUnifiedDataHubContext();

  let coverLetter: string;
  try {
    coverLetter = await generateText({
      systemInstruction:
        "You are a Career Catalyst agent generating hyper-personalised, highly credible cover letters for developers. " +
        "You have access to the developer's verified project portfolio (DataHub). " +
        "Write a professional cover letter (3-4 short paragraphs) that: " +
        "1) Opens with genuine, specific interest in the company and role, " +
        "2) Highlights 2-3 skills from the resume that directly match the job requirements, " +
        "3) Weaves in at least one concrete DataHub project (Aman, SyncSolar Systems, or Namaa) " +
        "   with a specific impact metric or technical detail that proves real-world capability, " +
        "4) Closes with a confident, forward-looking call to action. " +
        "Address it to 'Dear Hiring Manager'. Keep it under 280 words. " +
        "Do not use generic phrases like 'I am passionate about'. Be specific and evidence-driven.",
      prompt:
        `Applying for: ${parsed.data.role} at ${parsed.data.company}\n` +
        (parsed.data.jobDescription
          ? `Job description excerpt: ${parsed.data.jobDescription}\n`
          : "") +
        `\nResume summary: ${resume.parsedSummary}\n` +
        `Skills: ${resume.skills}\n` +
        `Experience: ${resume.experience}` +
        projectContext +
        dataHubContext,
    });
  } catch (err) {
    req.log.error({ err }, "Cover letter generation failed");
    res.status(502).json({ error: "Failed to generate cover letter" });
    return;
  }

  const [app] = await db
    .insert(jobApplicationsTable)
    .values({
      resumeId: parsed.data.resumeId,
      company: parsed.data.company,
      role: parsed.data.role,
      status: "found",
      coverLetter,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  res.status(201).json(app);
});

router.patch("/career/applications/:id", async (req, res): Promise<void> => {
  const params = GetApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = UpdateApplicationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updates: Partial<{ status: "found" | "applying" | "submitted"; notes: string }> = {};
  if (body.data.status) updates.status = body.data.status;
  if (body.data.notes !== undefined) updates.notes = body.data.notes;

  const [updated] = await db
    .update(jobApplicationsTable)
    .set(updates)
    .where(eq(jobApplicationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.json(updated);
});

router.delete("/career/applications/:id", async (req, res): Promise<void> => {
  const params = DeleteApplicationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(jobApplicationsTable)
    .where(eq(jobApplicationsTable.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Application not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
