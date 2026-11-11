# Architecture Note

## Goal and framing

The brief asks for a coherent slice of a Google-Docs-like product within 4–6 hours. I put depth into three things:

1. **A pleasant, trustworthy editing loop.** Autosave, a visible save state, Ctrl+S, and an unsaved-changes guard.
2. **A real, server-enforced sharing model.** Owner, editor and viewer roles, rather than a cosmetic one.
3. **Something reviewers can actually test.** A live deploy, seeded accounts with one-click login, and sample import files.

I deliberately did not build real-time collaboration, comments or version history.

## Shape of the system

```
Browser (React client components)
  ├─ Dashboard: owned / shared lists, New, Import, Delete
  ├─ Editor: Tiptap + toolbar, debounced autosave (PATCH), Share dialog
  │
Next.js 14 App Router (single deployable)
  ├─ Server components: auth + access check before rendering a document
  ├─ Route handlers (/api/*): zod validation → requireDocumentAccess → Prisma
  │
PostgreSQL (Neon in prod, Docker locally)
  User ─< Document (ownerId) ─< DocumentShare (userId, role VIEWER|EDITOR)
```

**Why one Next.js app.** The frontend, the API and server rendering ship in a single Vercel deploy. That's the least infrastructure that still gives a real backend boundary.

## Key decisions

| Decision | Why | Trade-off |
|---|---|---|
| **Tiptap (ProseMirror)** for the editor | Every required format is covered by StarterKit and Underline. It has a mature schema model and keyboard shortcuts. It is headless, so the UI is ours. | It needs a custom toolbar, which was a small cost. |
| **Store content as sanitized HTML** | Imported content converts naturally to HTML (marked and mammoth both produce HTML). Tiptap reads and writes HTML, and HTML is human-readable in the DB. | Tiptap JSON would be more structured. The editor's schema still normalizes everything on load. |
| **Allowlist sanitization on the server** (`lib/sanitize.ts`) for both imports *and* every PATCH | The API can be called without the editor, so it must not trust client HTML. The same allowlist matches the editor's schema. | Unsupported markup (links, images, tables) is dropped. |
| **Pure permission module** (`lib/access.ts`) plus a single gate (`requireDocumentAccess`) | One place defines who can read, edit, share or delete. It is unit-tested exhaustively, and every route and page calls it. A user without access gets a **404**, which avoids leaking document ids. | — |
| **Owner / editor / viewer roles** | This is the minimum that makes sharing meaningful. It is also one of the suggested stretch items, and it falls out of the data model for little cost. | No link sharing and no groups. |
| **Mocked auth**: seeded users, scrypt password hashes, HMAC-signed httpOnly cookie | It shows a real session boundary without OAuth setup. Reviewers can switch users in one click. | No sign-up, no password reset, and sessions can't be revoked server-side. |
| **Postgres via Prisma on Neon** | It persists on serverless hosting. A local SQLite file would be wiped on Vercel. The free tier needs no payment. | Local dev needs Docker or a Neon URL. |
| **Debounced autosave** (800 ms), serialized so only one PATCH is in flight at a time, with failed payloads re-queued | It feels like Docs and avoids lost edits and out-of-order writes from one client. | Last-write-wins between *different* users. |
| **Import creates a new document** rather than being an attachment | It is the most product-relevant upload behaviour ("bring my existing notes in"), and it reuses the editor end to end. | You can't yet import into an existing document. |

## Validation and error handling

- zod schemas cover every request body. Titles are trimmed and limited to 1–200 characters, content to about 1 MB, emails are normalized, and roles are an enum.
- Uploads are checked by extension and size on both client and server, then for UTF-8 validity, a corrupt `.docx`, or files with no readable text. Each of these returns a clear 4xx message.
- `withErrors` maps `HttpError` and `ZodError` to JSON `{ error }` responses with the right status. Unexpected errors are logged and return a generic 500.
- The UI shows inline errors for create, import, share and save. A failed save keeps the changes queued and offers **Retry**.

## Testing

`npm test` runs Vitest on the logic most likely to cause real damage if wrong:

- **Access control**: the full role × action matrix, strangers, anonymous users, and edge cases.
- **Import and sanitization**: Markdown and text conversion, XSS stripping, unsupported, empty, non-UTF-8 and corrupt files.
- **Sessions and validation**: token tampering and expiry, password verification, schema normalization.

## What I would build next (2–4 more hours)

1. **Concurrent-edit safety.** Send `updatedAt` with each save and return a 409 on conflict, with a "reload / overwrite" prompt. Later, use Yjs with a websocket provider for true real-time co-editing and presence.
2. **Version history.** Snapshot on a meaningful save (for example every N minutes) and add a restore view.
3. **Export** to Markdown or PDF, and import into an existing document.
4. **API integration tests** against a test database, plus a Playwright happy-path test of the full share flow.
5. Real auth (email magic link or OAuth) and invitations for people who aren't yet users.
