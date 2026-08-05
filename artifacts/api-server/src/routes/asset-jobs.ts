import { Router, type IRouter } from "express";
import multer from "multer";
import { desc, eq } from "drizzle-orm";
import { db, assetJobsTable, type AssetJob } from "@workspace/db";
import { GetAssetJobParams } from "@workspace/api-zod";
import { logger } from "../lib/logger";
import { generateText } from "../lib/gemini";
import { extractTextFromFile } from "../lib/file-text";

const router: IRouter = Router();

const ALLOWED_EXTENSIONS = [".xlsx", ".xls", ".csv", ".txt", ".md"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const lower = file.originalname.toLowerCase();
    const allowed = ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
    if (!allowed) {
      callback(new Error("UNSUPPORTED_FILE_TYPE"));
      return;
    }
    callback(null, true);
  },
});

/** Strips internal-only fields (e.g. sourceText) before returning a job over the API. */
function toApiAssetJob(job: AssetJob) {
  return {
    id: job.id,
    filename: job.filename,
    status: job.status,
    language: job.language,
    marketingContent: job.marketingContent,
    ebookContent: job.ebookContent,
    coverSvg: job.coverSvg,
    error: job.error,
    createdAt: job.createdAt,
  };
}

router.get("/assets/jobs", async (_req, res): Promise<void> => {
  const jobs = await db
    .select()
    .from(assetJobsTable)
    .orderBy(desc(assetJobsTable.createdAt));
  res.json(jobs.map(toApiAssetJob));
});

router.post(
  "/assets/jobs",
  (req, res, next) => {
    upload.single("file")(req, res, (err: unknown): void => {
      if (err) {
        res.status(400).json({
          error:
            err instanceof Error && err.message === "UNSUPPORTED_FILE_TYPE"
              ? "Unsupported file type. Please upload an Excel (.xlsx/.xls), CSV, or text/markdown export."
              : "Failed to process the uploaded file",
        });
        return;
      }
      next();
    });
  },
  async (req, res): Promise<void> => {
    const pastedText = typeof req.body?.text === "string" ? req.body.text.trim() : "";

    if (!req.file && !pastedText) {
      res.status(400).json({
        error: "Provide either a file upload or pasted text content",
      });
      return;
    }

    let sourceText: string;
    let filename: string;

    // Exactly one of file/text is used to build the job; if both are
    // present, the file upload takes precedence and the pasted text is
    // ignored (documented in the OpenAPI spec).
    if (req.file) {
      try {
        sourceText = extractTextFromFile({
          buffer: req.file.buffer,
          filename: req.file.originalname,
        });
      } catch (err) {
        req.log.error({ err }, "Failed to extract text from uploaded file");
        res.status(400).json({ error: "Could not read the uploaded file" });
        return;
      }
      filename = req.file.originalname;
    } else {
      sourceText = pastedText;
      filename = "Pasted content";
    }

    if (!sourceText.trim()) {
      res.status(400).json({ error: "The provided content appears to be empty" });
      return;
    }

    const language =
      typeof req.body?.language === "string" && req.body.language.trim()
        ? req.body.language.trim()
        : "en";

    const [job] = await db
      .insert(assetJobsTable)
      .values({
        filename,
        status: "pending",
        sourceText,
        language,
      })
      .returning();

    if (!job) {
      res.status(500).json({ error: "Failed to create job" });
      return;
    }

    res.status(202).json(toApiAssetJob(job));

    // Fire-and-forget background processing; status is polled via GET /assets/jobs/:id.
    void processAssetJob(job.id);
  },
);

router.get("/assets/jobs/:id", async (req, res): Promise<void> => {
  const params = GetAssetJobParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [job] = await db
    .select()
    .from(assetJobsTable)
    .where(eq(assetJobsTable.id, params.data.id));

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }

  res.json(toApiAssetJob(job));
});

async function processAssetJob(jobId: number): Promise<void> {
  const [job] = await db
    .select()
    .from(assetJobsTable)
    .where(eq(assetJobsTable.id, jobId));

  if (!job) {
    return;
  }

  await db
    .update(assetJobsTable)
    .set({ status: "processing" })
    .where(eq(assetJobsTable.id, jobId));

  const langNote =
    job.language && job.language !== "en"
      ? `\n\nIMPORTANT: Write all output text in the language with BCP-47 code "${job.language}".`
      : "";

  try {
    // Sequential calls — Gemini free tier allows only a handful per minute.
    const marketingContent = await generateText({
      systemInstruction:
        "You are the marketing copywriter for Asset Reviver, which turns raw source documents into a ready-to-paste Gumroad product listing. Given raw source material extracted from a document, produce a complete Gumroad listing in clean markdown with exactly these sections, in this order:\n\n" +
        "## Product Name\nA short, sellable product title (not the raw document title) — 5-8 words.\n\n" +
        "## Tagline\nOne sentence (under 20 words) that would sit under the product name on the sales page.\n\n" +
        "## Price Suggestion\nA single suggested USD price (e.g. \"$19\") appropriate for a short digital guide/e-book, with a one-line rationale.\n\n" +
        "## Description\n2-3 punchy paragraphs written in second person (\"you\") that sell the transformation the buyer gets, suitable for pasting directly into Gumroad's product description field.\n\n" +
        "## What's Inside\nA bulleted list of 4-6 concrete selling points / things the buyer will get or learn — specific, not generic.\n\n" +
        "## Who This Is For\nA bulleted list of 2-3 target buyer personas.\n\n" +
        "## Suggested Tags\nA comma-separated list of 5-8 Gumroad discovery tags/keywords.\n\n" +
        "Do not include any preamble, meta-commentary, or text outside these sections." +
        langNote,
      prompt: job.sourceText,
    });

    const ebookContent = await generateText({
      systemInstruction:
        "You are the production editor for Asset Reviver, which restructures raw source documents into e-book metadata and manuscript content formatted for direct use in Amazon KDP. Given raw source material, produce clean markdown with exactly these sections, in this order:\n\n" +
        "## Title\nThe main book title.\n\n" +
        "## Subtitle\nA KDP-style subtitle that clarifies the reader benefit (KDP titles commonly use a title + subtitle pair).\n\n" +
        "## KDP Description (Book Blurb)\nThe back-cover / Amazon detail-page description: 3-4 short paragraphs, benefit-driven, ending with a call to action. This must be usable as-is in KDP's book description field.\n\n" +
        "## Categories\nTwo suggested Amazon/KDP browse categories (e.g. \"Business & Money > Small Business\").\n\n" +
        "## Keywords\nA comma-separated list of exactly 7 KDP backend search keywords/phrases.\n\n" +
        "## Table of Contents\nA numbered list of the chapter titles used below, in order.\n\n" +
        "## Manuscript\nAn Introduction, followed by 3-6 chapters (each as an H3 heading, `### Chapter N: Title`) with well-organized, readable prose expanding on the source material, and a concluding chapter/section that wraps up with a clear takeaway or next step for the reader.\n\n" +
        "Do not include any preamble, meta-commentary, or text outside these sections." +
        langNote,
      prompt: job.sourceText,
    });

    // Cover SVG — a self-contained, decorative book/product cover sketch
    const coverSvg = await generateText({
      systemInstruction:
        "You are a graphic design agent. Given a product name and tagline, generate a complete, self-contained SVG (viewBox=\"0 0 400 560\") representing a stylish digital product cover. " +
        "Use a gradient background, bold centered title text, a decorative geometric or abstract motif, and a subtle tagline at the bottom. " +
        "Return ONLY the raw SVG markup starting with <svg and ending with </svg>. No markdown, no code fences, no explanations.",
      prompt: marketingContent.split("\n").slice(0, 6).join("\n"),
    });

    // Sanitize: keep only the <svg…</svg> portion, strip anything else
    const svgMatch = coverSvg.match(/<svg[\s\S]*<\/svg>/i);
    const sanitizedSvg = svgMatch ? svgMatch[0] : null;

    await db
      .update(assetJobsTable)
      .set({ status: "completed", marketingContent, ebookContent, coverSvg: sanitizedSvg })
      .where(eq(assetJobsTable.id, jobId));
  } catch (err) {
    logger.error({ err, jobId }, "Asset reviver job failed");
    await db
      .update(assetJobsTable)
      .set({
        status: "failed",
        error: err instanceof Error ? err.message : "Unknown error",
      })
      .where(eq(assetJobsTable.id, jobId));
  }
}

export default router;
