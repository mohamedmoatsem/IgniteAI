/**
 * DataHub — curated live project profiles for the developer's portfolio.
 * These are pre-seeded into Gemini prompts whenever Career Catalyst processes
 * a resume or generates a cover letter, giving the AI concrete, credible
 * project evidence to weave into every output.
 */

export interface ProjectProfile {
  name: string
  description: string
  tech: string
  impact: string
}

export const DATAHUB_PROJECTS: ProjectProfile[] = [
  {
    name: "Aman",
    description:
      "Gemma-powered crisis psychological support app providing AI-driven mental health assistance and real-time intervention for users in distress",
    tech: "Google Gemma LLM, Python, FastAPI, NLP, sentiment analysis",
    impact:
      "Delivers compassionate, AI-guided crisis support at scale, reducing response latency for at-risk individuals",
  },
  {
    name: "SyncSolar Systems",
    description:
      "IoT-based SCADA platform for solar energy monitoring, fault detection, and remote management of distributed solar installations",
    tech: "IoT sensors, SCADA protocols, real-time data pipelines, React dashboard, time-series databases",
    impact:
      "Enables operators to monitor and optimize solar energy output remotely, improving renewable energy reliability and ROI",
  },
  {
    name: "Namaa",
    description:
      "AI-agent smart agriculture ecosystem for food security, precision farming, and autonomous crop management",
    tech: "Multi-agent AI, computer vision, IoT field sensors, Python, geospatial analysis, satellite imagery",
    impact:
      "Increases agricultural yield and food security through intelligent automation, helping farmers make data-driven decisions",
  },
]

/**
 * Returns a formatted string summarising the developer's live project portfolio
 * ready to be appended to any Gemini prompt as context.
 */
export function getUnifiedDataHubContext(): string {
  const lines = DATAHUB_PROJECTS.map(
    (p) =>
      `- **${p.name}**: ${p.description}\n  Stack: ${p.tech}\n  Impact: ${p.impact}`
  )
  return (
    "\n\n## Developer's Live Project Portfolio (DataHub)\n" +
    "The developer has built the following real, production-grade projects. " +
    "Reference them specifically and concretely in your output:\n" +
    lines.join("\n")
  )
}
