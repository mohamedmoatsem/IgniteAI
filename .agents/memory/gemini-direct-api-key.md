---
name: Gemini direct API key quirks
description: What to do when calling the Gemini API directly with a user-provided GEMINI_API_KEY (not via Replit's managed AI Integrations proxy)
---

When the managed `setupReplitAIIntegrations({ providerSlug: "gemini" })` flow returns `awaiting_account_upgrade`, fall back to `requestSecrets` for the user's own `GEMINI_API_KEY` and call `@google/generative-ai` directly from the server.

Model selection is unreliable on free-tier keys:
- Versioned IDs like `gemini-2.5-pro` and `gemini-2.5-flash` frequently 404 ("no longer available") or hit a hard `limit: 0` free-tier quota for pro models.
- The `-latest` aliases are more stable. `gemini-flash-lite-latest` worked reliably; `gemini-flash-latest` intermittently 503'd ("high demand").
- Free tier allows only ~5 requests/minute — run sequential Gemini calls, not `Promise.all`, and retry 429/503 with backoff of several seconds up to ~25-30s (short backoffs like 500ms-4s aren't enough).

**Why:** discovered while wiring three Gemini-backed features (board generation, code explanation, content generation) — every hardcoded versioned model name failed until switching to `gemini-flash-lite-latest` with a long retry backoff and sequential calls.

**How to apply:** when building a fresh Gemini integration with a raw API key, verify available models via `GET https://generativelanguage.googleapis.com/v1beta/models?key=...` before hardcoding a model name, prefer a `-latest` alias, and always wrap calls in retry-with-backoff for 429/503.
