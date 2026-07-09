import { Router, type IRouter } from "express";
import { ExplainCodeBody } from "@workspace/api-zod";
import { generateText } from "../lib/gemini";

const router: IRouter = Router();

router.post("/livelab/explain", async (req, res): Promise<void> => {
  const parsed = ExplainCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { code, language, question } = parsed.data;

  const prompt = question
    ? `Language: ${language}\n\nCode:\n${code}\n\nQuestion about the code above: ${question}`
    : `Language: ${language}\n\nExplain what the following code does, step by step, in clear prose:\n\n${code}`;

  try {
    const explanation = await generateText({
      systemInstruction:
        "You are an expert programming tutor embedded in a live coding workspace called LiveLab. Explain code clearly and concisely for a developer reading it for the first time. Use short paragraphs or a brief numbered list when it aids clarity. Do not repeat the full code back verbatim.",
      prompt,
    });
    res.json({ explanation });
  } catch (err) {
    req.log.error({ err }, "Gemini explanation generation failed");
    res.status(502).json({ error: "Failed to generate explanation" });
  }
});

export default router;
