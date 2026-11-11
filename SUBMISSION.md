# Submission: Ajaia Docs

**Candidate:** Wesley Turner

## Links

- **Live product:** `<ADD DEPLOYED URL>`
- **Walkthrough video:** see `VIDEO_URL.txt`
- **Google Drive folder:** `<ADD DRIVE FOLDER LINK>`

## Test accounts (password `demo1234` for all)

- `alice@ajaia.test`: owner of the shared "Welcome" doc
- `bob@ajaia.test`: editor on Alice's doc; owner of "Weekly sync notes"
- `carol@ajaia.test`: viewer (read-only) on Alice's doc

The login page has one-click buttons for each account.

## What's included

| Item | Location |
|---|---|
| Source code | `app/`, `components/`, `lib/`, `prisma/`, config files |
| Setup and run instructions | `README.md` |
| Architecture note | `ARCHITECTURE.md` |
| AI workflow note | `AI_WORKFLOW.md` |
| Automated tests | `tests/` (run with `npm test`) |
| Sample files for upload | `samples/meeting-notes.md`, `samples/plain-notes.txt` |
| Walkthrough video URL | `VIDEO_URL.txt` |
| This file | `SUBMISSION.md` |
| Screenshots | `<optional: screenshots/ folder>` |

## Status

**Working end to end**
- Create, rename, edit, autosave, reopen and delete documents.
- Rich text: bold, italic, underline, strikethrough, H1–H3, bulleted and numbered lists, quotes, undo/redo.
- Import `.txt`, `.md` and `.docx` files (up to 2 MB) as new editable documents.
- Sharing by email with editor or viewer roles; change a role or remove access. The dashboard separates owned and shared documents; viewers get a read-only editor.
- Permissions enforced on the server for every route. Data persists in Postgres.
- Validation and error states across the API and UI. Unit tests.

**Intentionally out of scope**
- Real-time co-editing and presence (it's last-write-wins), comments, version history, real auth and sign-up, PDF import, images and tables.

**Next, with 2–4 more hours**
1. Conflict detection on save (409 plus a prompt), then Yjs real-time collaboration.
2. Version history with restore.
3. Export to Markdown or PDF.
4. API integration tests and a Playwright test of the share flow.
