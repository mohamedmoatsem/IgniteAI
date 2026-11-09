import { describe, expect, it } from "vitest";
import {
  ATS_CATEGORIES,
  createAtsScoreFallback,
  getAtsScoreValidationFailure,
  validateAtsScoreResult,
} from "./ats-score";

function validResponse() {
  const scores = [90, 80, 70, 60, 50];
  const issues = [
    "Add Kubernetes to the skills section; the posting requests it, but it is missing from this resume.",
    "Format the experience dates consistently; the newest role uses month and year while the older role omits months.",
    "Add an Education heading; the resume lists a degree but does not label its education section.",
    "Quantify the API migration bullet with its measured latency result; the current line gives no outcome.",
    "Trim the summary to two lines; its six sentences repeat the same backend skills.",
  ];

  return {
    score: 0,
    categories: ATS_CATEGORIES.map((category, index) => ({
      id: category.id,
      label: category.label,
      score: scores[index]!,
      weight: category.weight,
      issues: [issues[index]!],
    })),
    topFixes: [
      "Add Kubernetes to the skills section.",
      "Quantify the API migration result.",
      "Format experience dates consistently.",
    ],
  };
}

describe("ATS score validation", () => {
  it("validates the five fixed categories and derives the weighted score", () => {
    const result = validateAtsScoreResult(validResponse());

    expect(result).not.toBeNull();
    expect(result?.categories).toHaveLength(5);
    expect(result?.score).toBe(73);
    expect(getAtsScoreValidationFailure(validResponse())).toBeNull();
  });

  it("rejects generic or non-actionable category feedback", () => {
    const response = validResponse();
    response.categories[0]!.issues = ["Improve your resume with more keywords."];

    expect(validateAtsScoreResult(response)).toBeNull();
    expect(getAtsScoreValidationFailure(response)).toBe(
      "non_actionable_issue:keyword_match",
    );
  });

  it("rejects duplicate categories", () => {
    const response = validResponse();
    response.categories[4] = { ...response.categories[0]! };

    expect(validateAtsScoreResult(response)).toBeNull();
  });

  it("creates a clearly marked zero-score fallback with all categories", () => {
    const fallback = createAtsScoreFallback();

    expect(fallback.score).toBe(0);
    expect(fallback.categories).toHaveLength(5);
    expect(fallback.categories.every((category) => category.score === 0)).toBe(
      true,
    );
    expect(fallback.topFixes[0]).toContain("Fallback result");
  });
});
