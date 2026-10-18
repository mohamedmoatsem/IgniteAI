import { z } from "zod/v4";
import { SchemaType, type ResponseSchema } from "@google/generative-ai";

export const ATS_CATEGORIES = [
  {
    id: "keyword_match",
    label: "Keyword Match",
    weight: 30,
    fallbackIssue:
      "Retry the scan to compare resume keywords with the job description.",
  },
  {
    id: "formatting_parseability",
    label: "Formatting & Parseability",
    weight: 20,
    fallbackIssue:
      "Retry with text-based resume content to assess ATS parseability.",
  },
  {
    id: "section_completeness",
    label: "Section Completeness",
    weight: 15,
    fallbackIssue:
      "Retry the scan to check which standard resume sections are present.",
  },
  {
    id: "action_verbs_impact",
    label: "Action Verbs & Impact",
    weight: 20,
    fallbackIssue:
      "Retry the scan to assess action verbs and measurable results in your bullets.",
  },
  {
    id: "length_readability",
    label: "Length & Readability",
    weight: 15,
    fallbackIssue:
      "Retry the scan to assess resume length and readability.",
  },
] as const;

const categoryIds = ATS_CATEGORIES.map((category) => category.id) as [
  (typeof ATS_CATEGORIES)[number]["id"],
  ...(typeof ATS_CATEGORIES)[number]["id"][],
];

const strictCategorySchema = z
  .object({
    id: z.enum(categoryIds),
    label: z.enum(ATS_CATEGORIES.map((category) => category.label) as [
      (typeof ATS_CATEGORIES)[number]["label"],
      ...(typeof ATS_CATEGORIES)[number]["label"][],
    ]),
    score: z.number().int().min(0).max(100),
    weight: z.number().int().min(1).max(100),
    issues: z.array(z.string().trim().min(8).max(500)).min(1).max(5),
  })
  .strict();

const strictAtsScoreSchema = z
  .object({
    score: z.number().int().min(0).max(100),
    categories: z.array(strictCategorySchema).length(5),
    topFixes: z.array(z.string().trim().min(8).max(500)).min(3).max(5),
  })
  .strict();

export const ATS_GEMINI_RESPONSE_SCHEMA: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    score: {
      type: SchemaType.INTEGER,
      description: "Weighted total ATS score from 0 to 100.",
    },
    categories: {
      type: SchemaType.ARRAY,
      minItems: ATS_CATEGORIES.length,
      maxItems: ATS_CATEGORIES.length,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ATS_CATEGORIES.map((category) => category.id),
          },
          label: {
            type: SchemaType.STRING,
            format: "enum",
            enum: ATS_CATEGORIES.map((category) => category.label),
          },
          score: { type: SchemaType.INTEGER },
          weight: { type: SchemaType.INTEGER },
          issues: {
            type: SchemaType.ARRAY,
            minItems: 1,
            maxItems: 5,
            items: { type: SchemaType.STRING },
          },
        },
        required: ["id", "label", "score", "weight", "issues"],
      },
    },
    topFixes: {
      type: SchemaType.ARRAY,
      minItems: 3,
      maxItems: 5,
      items: { type: SchemaType.STRING },
    },
  },
  required: ["score", "categories", "topFixes"],
};

export type AtsScoreResult = z.infer<typeof strictAtsScoreSchema>;

const GENERIC_ISSUES = [
  /\bimprove (your )?resume\b/i,
  /\bmake (your )?resume better\b/i,
  /\badd more details\b/i,
  /\buse action verbs\b/i,
  /\badd more keywords\b/i,
];

const ACTION_WORDS = [
  "add",
  "added",
  "adding",
  "include",
  "included",
  "including",
  "insert",
  "mention",
  "highlight",
  "replace",
  "quantify",
  "quantified",
  "move",
  "remove",
  "rewrite",
  "specify",
  "clarify",
  "state",
  "list",
  "name",
  "define",
  "create",
  "organize",
  "separate",
  "split",
  "combine",
  "reduce",
  "trim",
  "condense",
  "cut",
  "format",
  "reformat",
  "tailor",
  "reorder",
  "shorten",
  "expand",
  "align",
  "measure",
  "demonstrate",
  "provide",
  "use",
  "ajouter",
  "ajoutez",
  "mentionnez",
  "indiquez",
  "soulignez",
  "incluez",
  "inscrivez",
  "remplacez",
  "quantifiez",
  "clarifiez",
  "raccourcissez",
  "réduisez",
  "déplacez",
  "supprimez",
  "précisez",
  "adaptez",
  "organisez",
  "complétez",
  "añade",
  "agrega",
  "incluye",
  "incorpora",
  "menciona",
  "destaca",
  "especifica",
  "sustituye",
  "cuantifica",
  "mueve",
  "elimina",
  "reduce",
  "acorta",
  "organiza",
  "completa",
  "aclara",
  "füge",
  "ergänze",
  "nennen",
  "ersetze",
  "quantifiziere",
  "reduziere",
  "ordne",
  "liste",
  "benenne",
  "formatiere",
  "verschiebe",
  "entferne",
  "kürze",
  "überarbeite",
  "gliedere",
  "angleiche",
];

const ARABIC_ACTION_WORDS = [
  "أضف",
  "أدرج",
  "استبدل",
  "استخدم",
  "حدد",
  "حدّد",
  "اذكر",
  "رتب",
  "انقل",
  "احذف",
  "اختصر",
  "وسع",
  "وسّع",
  "نسّق",
  "وضّح",
  "قِس",
  "أبرز",
];

function hasActionWord(normalizedIssue: string): boolean {
  const hasLatinAction = ACTION_WORDS.some((word) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(?:^|[^\\p{L}])${escaped}(?=$|[^\\p{L}])`, "iu").test(
      normalizedIssue,
    );
  });
  return (
    hasLatinAction ||
    ARABIC_ACTION_WORDS.some((word) => normalizedIssue.includes(word))
  );
}

function hasSpecificActionableIssue(issues: string[]): boolean {
  return issues.some((issue) => {
    const normalized = issue.trim().toLowerCase();
    return (
      normalized.length >= 25 &&
      hasActionWord(normalized) &&
      !GENERIC_ISSUES.some((pattern) => pattern.test(normalized))
    );
  });
}

/**
 * Validates Gemini's output against the strict response contract, checks that
 * the fixed categories/weights are present exactly once, and derives the score
 * from the weighted breakdown rather than trusting a conflicting total.
 */
export function validateAtsScoreResult(value: unknown): AtsScoreResult | null {
  const parsed = strictAtsScoreSchema.safeParse(value);
  if (!parsed.success) return null;

  const expected = new Map(
    ATS_CATEGORIES.map((category) => [
      category.id,
      { label: category.label, weight: category.weight },
    ]),
  );
  const seen = new Set<string>();

  for (const category of parsed.data.categories) {
    const definition = expected.get(category.id);
    if (
      !definition ||
      seen.has(category.id) ||
      category.label !== definition.label ||
      category.weight !== definition.weight ||
      !hasSpecificActionableIssue(category.issues)
    ) {
      return null;
    }
    seen.add(category.id);
  }

  if (seen.size !== ATS_CATEGORIES.length) return null;

  const weightedScore = Math.round(
    parsed.data.categories.reduce(
      (sum, category) => sum + category.score * category.weight,
      0,
    ) / 100,
  );

  return { ...parsed.data, score: weightedScore };
}

/** Valid, explicit fallback; the UI localizes its copy and labels it as a fallback. */
export function createAtsScoreFallback(): AtsScoreResult {
  return {
    score: 0,
    categories: ATS_CATEGORIES.map((category) => ({
      id: category.id,
      label: category.label,
      score: 0,
      weight: category.weight,
      issues: [category.fallbackIssue],
    })),
    topFixes: [
      "Fallback result: this is not a validated ATS score. Retry the scan.",
      "Keep the job description and resume text available for another scan.",
      "Use text-based resume content so the document can be assessed.",
    ],
  };
}

