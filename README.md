# Ajaia Docs

A lightweight collaborative document editor: create, rename and edit rich-text documents in the browser, import files into new documents, and share documents with other users as editors or viewers.

**Live demo:** `<ADD DEPLOYED URL>` · **Walkthrough video:** see [`VIDEO_URL.txt`](VIDEO_URL.txt)

## Demo accounts

All use the password **`demo1234`**. The login page also has one-click sign-in buttons.

| User | Email | Seeded data |
|---|---|---|
| Wesley Turner | `wesley@ajaia.test` | Owns "Welcome to Ajaia Docs" (shared with John as **editor**, Eric as **viewer**) and a private draft. John's notes are shared with them as a **viewer**. |
| John Doe | `john@ajaia.test` | Owns "Weekly sync notes". Can **edit** Wesley's welcome doc. |
| Eric Moon | `eric@ajaia.test` | Can **view** Wesley's welcome doc (read-only). |

**Suggested review flow:**
1. Sign in as Wesley and create a document.
2. Format it, rename it and refresh the page to confirm it persisted.
3. Click **Share** and add `eric@ajaia.test` as *Can edit*.
4. Sign out, sign in as Eric, find the document under **Shared with me** and edit it.
5. Sign in as Eric and open the welcome doc. It's read-only for them.

## Features

| Area | What works |
|---|---|
| Documents | Create, rename (click the title), edit, delete (owner only), reopen. The dashboard separates **Owned by me** and **Shared with me**. |
| Editor | Tiptap (ProseMirror). Bold, italic, underline, strikethrough, Heading 1–3, bulleted and numbered lists, block quotes, undo/redo, clear formatting, and standard keyboard shortcuts. |
| Saving | Autosaves 800 ms after you stop typing, with a "Saving… / All changes saved / Couldn't save — Retry" indicator. Ctrl/Cmd+S saves immediately. The browser warns before you leave with unsaved changes. |
| File upload | **Import file** turns a `.txt`, `.md` or `.docx` file (up to 2 MB) into a new editable document owned by you. Headings, bold, italic, underline, lists and quotes are preserved. Images, tables (their text is kept), links and colours are dropped. Sample files are in [`samples/`](samples/). |
| Sharing | The owner shares by email with **Can edit** or **Can view** access, can change a person's role, or remove their access. Viewers get a read-only editor. Every API route checks permissions on the server. Users without access get a 404, so the API doesn't reveal which documents exist. |
| Persistence | Postgres via Prisma. Content is stored as sanitized HTML, so formatting survives a refresh. |
| Auth | Mocked: seeded users, email and password login, HMAC-signed httpOnly session cookie. |

## Tech stack

Next.js 14 (App Router, route handlers) · React 18 · TypeScript · Tiptap 2 · Prisma 5 + PostgreSQL · zod · mammoth (.docx) · marked (.md) · sanitize-html · Vitest.

## Run locally

Requires **Node 18.18+** (Node 20+ recommended) and a Postgres database. You can run Postgres locally with Docker or use a free Neon database.

```bash
# 1. Install dependencies (also runs `prisma generate`)
npm install

# 2. Configure environment
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
#    then edit DATABASE_URL / SESSION_SECRET if needed

# 3. Start a local Postgres (skip if you're using Neon or another hosted DB)
docker compose up -d

# 4. Create tables and seed demo users and documents
npm run db:setup              # = prisma db push && prisma db seed

# 5. Start the app
npm run dev                   # http://localhost:3000
```

Other scripts:

```bash
npm test            # unit tests (Vitest)
npm run typecheck   # tsc --noEmit
npm run build       # production build (prisma generate + next build)
npm start           # serve the production build
```

## Deploy (free: Vercel + Neon)

1. **Database.** Create a free project at [neon.tech](https://neon.tech) and copy the **direct** (non-pooled) connection string. It ends in `?sslmode=require`.
2. **Create the schema and seed it** from your machine, pointing at Neon:
   ```bash
   # put the Neon URL in .env as DATABASE_URL, then:
   npm run db:setup
   ```
3. **App.** Push the repo to GitHub, import it in [vercel.com](https://vercel.com) (framework preset: Next.js), and set these environment variables:
   - `DATABASE_URL`: the Neon connection string
   - `SESSION_SECRET`: a long random string, e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

   The build command (`npm run build`) already runs `prisma generate`.
4. Open the deployed URL and sign in with a demo account.

## Project structure

```
app/
  page.tsx                     Dashboard (owned / shared lists)
  login/page.tsx               Login with demo accounts
  docs/[id]/page.tsx           Editor page (server-side access check)
  api/auth/{login,logout}      Session cookie in/out
  api/documents                GET list, POST create
  api/documents/[id]           GET, PATCH (autosave/rename), DELETE
  api/documents/[id]/shares    GET, POST (grant/change role), DELETE /[userId]
  api/import                   POST multipart file -> new document
components/                    DocumentEditor, Toolbar, ShareDialog, lists, buttons
lib/
  access.ts                    Pure permission model (owner/editor/viewer x read/edit/share/delete)
  documents.ts                 Data access; every document route goes through requireDocumentAccess
  import.ts, sanitize.ts       File -> HTML conversion and the HTML allowlist
  session.ts, password.ts      Signed session tokens, scrypt hashing
  validation.ts                zod request schemas
prisma/schema.prisma, seed.ts
tests/                         Vitest: access matrix, import/sanitize, sessions and validation
```

## Known limitations

- There is no real-time co-editing. Two people editing the same document at once means the last save wins.
- Auth is mocked, with seeded accounts only. You can only share with existing users; there are no invitations.
- PDF import, images and tables are not supported in the editor.

See [ARCHITECTURE.md](ARCHITECTURE.md) for design decisions and [AI_WORKFLOW.md](AI_WORKFLOW.md) for how AI tools were used.
