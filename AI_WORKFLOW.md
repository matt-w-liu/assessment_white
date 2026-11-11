# AI Workflow Note

> **Draft. Edit this so it reflects your own experience before submitting.** Reviewers will check it against the walkthrough video. Replace or extend anything marked ✏️.

## Tools used

- **Claude Code** (Anthropic) in VS Code: research, scaffolding, implementation and documentation drafts.
- ✏️ Add any others you used, such as Copilot or ChatGPT.

## Where AI materially sped things up

- **Research and planning.** It compared editor libraries (Tiptap, Lexical and BlockNote) and free hosting with persistent storage (Vercel + Neon versus Render). It also turned the brief into a requirements checklist and a time budget.
- **Boilerplate.** It drafted the Prisma schema, route handlers, zod schemas, CSS and seed data. That is the code that is quick to review but slow to type.
- **Test cases.** It enumerated the full role × action permission matrix and the hostile import inputs: XSS, non-UTF-8 and corrupt `.docx` files.
- **Documentation.** It produced first drafts of the README and architecture note.

## What I changed or rejected

✏️ Replace these with your real examples. The ones below are the decisions made during this build:

- **Rejected local SQLite or file storage.** It is simpler, but it would be wiped on Vercel and Render free tiers, so the live demo would lose data. I chose hosted Postgres (Neon) instead.
- **Rejected Render's free tier for hosting.** It sleeps after 15 minutes idle and takes 30–60 seconds to start cold, which makes a bad first impression for a reviewer.
- **Required server-side sanitization on *every* save**, not only on imports. Trusting the editor's HTML is the easy default, but the API can be called directly.
- **Required 404 (not 403) for users with no access**, so document ids aren't revealed.
- **Required a serialized autosave queue** that re-queues failed payloads, instead of a naive PATCH on every debounce. This prevents out-of-order writes and lost edits on a network error.
- **Pinned Tiptap v2 and Next 14** rather than the newest majors, to avoid API churn (async request APIs, v3 extension changes) inside a tight timebox.
- ✏️ Add anything you rewrote by hand, styling you adjusted, or suggestions you discarded.

## How I verified correctness, UX and reliability

- **Automated:** `npm test` (Vitest) covers access control, import and sanitization, sessions and validation. ✏️ Confirm `npm test`, `npm run typecheck` and `npm run build` pass on your machine, and note anything you had to fix.
- **Manual end-to-end:** ✏️ Describe what you actually clicked through. For example:
  - Create, format, rename, then refresh and check that it persisted.
  - Import `samples/meeting-notes.md` and a real `.docx` file.
  - Share as Wesley, then sign in as John or Eric and confirm edit versus read-only.
  - Call the API as a non-shared user (expect a 404) and as a viewer trying to PATCH (expect a 403).
  - Kill the network mid-save and confirm "Couldn't save — Retry" appears and the change isn't lost.
- **Code review:** I read every generated file before committing it. I focused on the access checks in each route, the sanitizer allowlist, and the autosave race conditions.
