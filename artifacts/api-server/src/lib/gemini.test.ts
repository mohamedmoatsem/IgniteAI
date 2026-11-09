import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

const geminiMocks = vi.hoisted(() => ({
  getGenerativeModel: vi.fn(),
  generateContent: vi.fn(),
}));

vi.mock("@google/generative-ai", () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel(...args: unknown[]) {
      return geminiMocks.getGenerativeModel(...args);
    }
  },
}));

describe("Gemini JSON client", () => {
  let gemini: typeof import("./gemini");

  beforeAll(async () => {
    vi.stubEnv("GEMINI_API_KEY", "vitest-placeholder-key");
    gemini = await import("./gemini");
  });

  beforeEach(() => {
    geminiMocks.getGenerativeModel.mockReset();
    geminiMocks.generateContent.mockReset();
    geminiMocks.getGenerativeModel.mockReturnValue({
      generateContent: geminiMocks.generateContent,
    });
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  it("parses a mocked schema-constrained JSON response without a network call", async () => {
    const prompt = "Assess this sample resume.";
    const response = { score: 73, categories: [], topFixes: [] };
    const schema = { type: "OBJECT" };
    geminiMocks.generateContent.mockResolvedValue({
      response: { text: () => JSON.stringify(response) },
    });

    await expect(
      gemini.generateJsonWithSchema({
        prompt,
        systemInstruction: "Return JSON only.",
        responseSchema: schema as never,
      }),
    ).resolves.toEqual(response);

    expect(geminiMocks.getGenerativeModel).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-flash-lite-latest",
        generationConfig: expect.objectContaining({
          responseMimeType: "application/json",
          responseSchema: schema,
        }),
      }),
    );
    expect(geminiMocks.generateContent).toHaveBeenCalledWith(prompt);
  });

  it("surfaces invalid mocked JSON as a typed parse error", async () => {
    geminiMocks.generateContent.mockResolvedValue({
      response: { text: () => "{ definitely not json" },
    });

    await expect(
      gemini.generateJsonWithSchema({
        prompt: "sample",
        systemInstruction: "Return JSON only.",
        responseSchema: {} as never,
      }),
    ).rejects.toMatchObject({ name: "GeminiJsonParseError" });
  });
});
