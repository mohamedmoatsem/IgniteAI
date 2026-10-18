---
name: ATS history and authentication
description: IgniteAI's decision to defer per-user ATS scan history until account authentication exists.
---

IgniteAI does not currently have account authentication. The user explicitly deferred ATS scan history until real authentication (such as Clerk or Supabase) is integrated alongside the payment system. The current ATS feature should only display the active scan; do not add anonymous browser IDs, cookies, or scan persistence.

**Why:** The user chose to keep identity and saved scan history out of the current ATS feature and tie them to a future authenticated product flow.

**How to apply:** When adding saved ATS results or other per-user data, first confirm the selected authentication provider and scope records to a verified server-side identity.
