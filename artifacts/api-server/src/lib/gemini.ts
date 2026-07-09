import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "./logger";

const apiKey = process.env["GEMINI_API_KEY"];

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY environment variable is required but was not provided.",
  );
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Extracts the first top-level JSON object or array from a text blob,
 * stripping markdown code fences that Gemini sometimes wraps responses in.
 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  return candidate.trim();
}

async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  // The free Gemini tier is limited to a handful of requests per minute, so
  // 429/503 responses need longer backoffs than a typical transient retry.
  const delaysMs = [3000, 10000, 25000];
  let lastErr: unknown;
  for (let attempt = 0; attempt <= delaysMs.length; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number } | undefined)?.status;
      const retryable = status === 503 || status === 429;
      if (!retryable || attempt === delaysMs.length) {
        throw err;
      }
      await new Promise((resolve) => setTimeout(resolve, delaysMs[attempt]));
    }
  }
  throw lastErr;
}

export async function generateJson<T>(params: {
  prompt: string;
  systemInstruction: string;
}): Promise<T> {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    systemInstruction: params.systemInstruction,
    generationConfig: { responseMimeType: "application/json" },
  });

  const result = await withRetry(() => model.generateContent(params.prompt));
  const text = result.response.text();

  try {
    return JSON.parse(extractJson(text)) as T;
  } catch (err) {
    logger.error({ err, text }, "Failed to parse Gemini JSON response");
    throw new Error("Gemini returned a response that could not be parsed");
  }
}

export async function generateText(params: {
  prompt: string;
  systemInstruction: string;
}): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: "gemini-flash-lite-latest",
    systemInstruction: params.systemInstruction,
  });

  const result = await withRetry(() => model.generateContent(params.prompt));
  return result.response.text();
}
