![Tests Passing](https://img.shields.io/badge/tests-passing-brightgreen)

# IgniteAI

IgniteAI is an AI-assisted workspace for developers and job seekers. It combines idea planning, code assistance, file transformation, and career tools in a localized React and TypeScript application backed by a Node.js API.

## Product modules

IgniteAI has four primary workspaces and five core capabilities. ATS Score is the fifth capability and is presented inside Career Catalyst rather than as a separate navigation screen.

1. **JumpStart** — turns an idea into a structured project board and can run a Research → Coder → QA multi-agent workflow.
2. **LiveLab** — provides AI-assisted code explanations and development support.
3. **Asset Reviver** — extracts and transforms supported documents and spreadsheets into useful content.
4. **Career Catalyst** — parses uploaded resumes, creates targeted career materials, and tracks job applications.
5. **ATS Score** — compares resume text with a job description and reports a weighted score, category breakdown, and specific fixes.

Career Catalyst can also use the project portfolio context in DataHub, including Aman (Gemma-powered crisis psychological support), SyncSolar Systems (solar SCADA monitoring), and Namaa (AI-agent smart agriculture).

## System architecture

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, and Radix UI.
- **API:** Node.js, Express, and TypeScript, organized as a separate workspace service.
- **AI:** Google Gemini through the server-side `@google/generative-ai` client. The browser does not receive the API key.
- **Contracts and data:** shared Zod/OpenAPI packages, PostgreSQL, and Drizzle ORM.
- **Resume extraction:** `pdftotext` for PDF, `antiword` for legacy DOC, `unzip` for DOCX, plus native text/Markdown reading.
- **Localization:** English, Arabic, French, Spanish, and German, including right-to-left Arabic presentation.

## System Architect

**Mohamed Moatsem — System Architect**

The architecture emphasizes clear boundaries between the UI, API, AI calls, and data contracts. The System Architect contribution includes:

- Designing the Research → Coder → QA agent workflow.
- Structuring prompts and strict JSON response validation for AI features.
- Keeping Gemini credentials on the server and isolating external AI calls behind a shared client.
- Adding quota-free unit tests that mock Gemini responses while exercising ATS validation and real PDF/DOCX/text extraction.

## Development setup

### Requirements

- Node.js 24
- pnpm 10.26.1
- For PDF/DOC/DOCX resume extraction outside Replit: Poppler (`pdftotext`), `antiword`, and `unzip`.

The root manifest pins pnpm. Enable Corepack and install the pinned version if needed:

```bash
corepack enable
corepack prepare pnpm@10.26.1 --activate
pnpm install --frozen-lockfile
```

Configure `GEMINI_API_KEY` as a Replit Secret. The API also needs the project database environment configured. Do not commit credentials or put them in frontend variables. Replit workflows supply each service's `PORT` and `BASE_PATH`.

Start the project with the Replit **Run** workflow. For local development, run the API and web services in separate terminals with the environment required by their artifact configuration:

```bash
PORT=8080 pnpm --filter @workspace/api-server run dev
PORT=24115 BASE_PATH=/ pnpm --filter @workspace/igniteai run dev
```

## Quality checks

```bash
pnpm test
pnpm run typecheck
pnpm run build
```

The automated tests use mocked Gemini responses and make no external AI requests. The build command runs typechecking and builds the API, IgniteAI web app, and component preview service with their configured environment values.

## Current scope

Authentication and per-user ATS scan history are not enabled yet. Resume processing and ATS scoring are available for the current session; real account-based history is deferred until authentication is integrated.
