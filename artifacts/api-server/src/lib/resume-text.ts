import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";

const MAX_EXTRACTED_BYTES = 8 * 1024 * 1024;
const EXTRACTION_TIMEOUT_MS = 20_000;
const MIN_RESUME_CHARACTERS = 50;

export class ResumeTextExtractionError extends Error {
  constructor(
    message: string,
    readonly statusCode: 413 | 422 | 500,
  ) {
    super(message);
    this.name = "ResumeTextExtractionError";
  }
}

function runExtractor(
  command: string,
  args: string[],
  input?: Buffer,
  maxOutputBytes = MAX_EXTRACTED_BYTES,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let outputBytes = 0;
    const output: Buffer[] = [];
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });

    const fail = (error: ResumeTextExtractionError) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (child.pid && !child.killed) child.kill("SIGKILL");
      reject(error);
    };

    const timeout = setTimeout(() => {
      fail(
        new ResumeTextExtractionError(
          "The document took too long to process.",
          422,
        ),
      );
    }, EXTRACTION_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => {
      outputBytes += chunk.length;
      if (outputBytes > maxOutputBytes) {
        fail(
          new ResumeTextExtractionError(
            "The extracted document is too large to process.",
            413,
          ),
        );
        return;
      }
      output.push(chunk);
    });

    // Drain stderr so child processes cannot block, but never log document data.
    child.stderr.on("data", () => undefined);
    child.stdin.on("error", () => undefined);

    child.once("error", (error: NodeJS.ErrnoException) => {
      fail(
        new ResumeTextExtractionError(
          error.code === "ENOENT"
            ? "A required document extraction tool is unavailable."
            : "The document extraction process failed.",
          500,
        ),
      );
    });

    child.once("close", (exitCode) => {
      if (settled) return;
      clearTimeout(timeout);
      if (exitCode !== 0) {
        settled = true;
        reject(
          new ResumeTextExtractionError(
            "The file could not be decoded as a supported document.",
            422,
          ),
        );
        return;
      }
      settled = true;
      resolve(Buffer.concat(output, outputBytes));
    });

    child.stdin.end(input);
  });
}

async function withTemporaryFile<T>(
  buffer: Buffer,
  extension: string,
  callback: (filePath: string) => Promise<T>,
): Promise<T> {
  const directory = await mkdtemp(join(tmpdir(), "igniteai-resume-"));
  const filePath = join(directory, `resume${extension}`);
  try {
    await writeFile(filePath, buffer, { flag: "wx", mode: 0o600 });
    return await callback(filePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function decodeXmlEntities(value: string): string {
  return value.replace(
    /&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos);/gi,
    (entity, token: string) => {
      if (token[0] === "#") {
        const codePoint = token[1]?.toLowerCase() === "x"
          ? Number.parseInt(token.slice(2), 16)
          : Number.parseInt(token.slice(1), 10);
        if (
          Number.isInteger(codePoint) &&
          codePoint >= 0 &&
          codePoint <= 0x10ffff &&
          !(codePoint >= 0xd800 && codePoint <= 0xdfff)
        ) {
          return String.fromCodePoint(codePoint);
        }
        return "";
      }

      switch (token.toLowerCase()) {
        case "amp":
          return "&";
        case "lt":
          return "<";
        case "gt":
          return ">";
        case "quot":
          return '"';
        case "apos":
          return "'";
        default:
          return entity;
      }
    },
  );
}

function extractWordXmlText(xml: string): string {
  const paragraphs: string[] = [];
  const paragraphPattern =
    /<(?:[A-Za-z_][\w.-]*:)?p(?:\s[^>]*)?>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?p\s*>/gi;
  const inlinePattern =
    /<(?:[A-Za-z_][\w.-]*:)?t\b[^>]*>([\s\S]*?)<\/(?:[A-Za-z_][\w.-]*:)?t\s*>|<(?:[A-Za-z_][\w.-]*:)?(tab|br|cr)\b[^>]*\/?>/gi;

  for (const paragraph of xml.matchAll(paragraphPattern)) {
    const content: string[] = [];
    for (const token of paragraph[1]!.matchAll(inlinePattern)) {
      if (token[1] !== undefined) {
        content.push(decodeXmlEntities(token[1]));
      } else if (token[2]?.toLowerCase() === "tab") {
        content.push("\t");
      } else {
        content.push("\n");
      }
    }
    const text = content.join("").trim();
    if (text) paragraphs.push(text);
  }

  return paragraphs.join("\n");
}

async function extractDocxText(buffer: Buffer): Promise<string> {
  return withTemporaryFile(buffer, ".docx", async (archivePath) => {
    const listing = (
      await runExtractor(
        "unzip",
        ["-Z1", archivePath],
        undefined,
        1024 * 1024,
      )
    ).toString("utf8");

    const entries = [...new Set(listing.split(/\r?\n/).map((entry) => entry.trim()))]
      .filter((entry) =>
        /^word\/(?:document|header\d*|footer\d*|footnotes|endnotes)\.xml$/i.test(
          entry,
        ),
      );
    if (!entries.includes("word/document.xml")) {
      throw new ResumeTextExtractionError(
        "The Word document does not contain a readable document body.",
        422,
      );
    }

    const orderedEntries = [
      "word/document.xml",
      ...entries.filter((entry) => entry !== "word/document.xml"),
    ];
    const parts: string[] = [];
    let totalXmlBytes = 0;

    for (const entry of orderedEntries) {
      const remainingBytes = MAX_EXTRACTED_BYTES - totalXmlBytes;
      const xml = await runExtractor(
        "unzip",
        ["-p", archivePath, entry],
        undefined,
        remainingBytes,
      );
      totalXmlBytes += xml.length;
      const text = extractWordXmlText(xml.toString("utf8"));
      if (text) parts.push(text);
    }

    return parts.join("\n");
  });
}

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\u0000/g, "")
    .replace(/\f/g, "\n\n")
    .replace(/[\x01-\x08\x0b\x0e-\x1f\x7f]/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResumeText(
  buffer: Buffer,
  filename: string,
): Promise<string> {
  const extension = extname(filename).toLowerCase();
  let extracted: string;

  switch (extension) {
    case ".pdf":
      extracted = (
        await runExtractor(
          "pdftotext",
          ["-layout", "-enc", "UTF-8", "-", "-"],
          buffer,
        )
      ).toString("utf8");
      break;
    case ".doc":
      extracted = await withTemporaryFile(buffer, ".doc", async (filePath) =>
        (await runExtractor("antiword", ["-t", filePath])).toString("utf8"),
      );
      break;
    case ".docx":
      extracted = await extractDocxText(buffer);
      break;
    case ".txt":
    case ".md":
      extracted = buffer.toString("utf8");
      break;
    default:
      throw new ResumeTextExtractionError(
        "This file type is not supported.",
        422,
      );
  }

  const normalized = normalizeExtractedText(extracted);
  if (normalized.length < MIN_RESUME_CHARACTERS) {
    throw new ResumeTextExtractionError(
      "No readable resume text was found in this file.",
      422,
    );
  }

  return normalized;
}
