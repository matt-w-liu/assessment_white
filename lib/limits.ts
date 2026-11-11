/** Shared limits/config that are safe to import from both client and server code. */

export const MAX_TITLE_LENGTH = 200;
/** Max size of a document's HTML content, in characters (~1 MB). */
export const MAX_CONTENT_LENGTH = 1_000_000;

export const SUPPORTED_IMPORT_EXTENSIONS = ['.txt', '.md', '.markdown', '.docx'] as const;
export const IMPORT_ACCEPT = SUPPORTED_IMPORT_EXTENSIONS.join(',');
/** Kept well under Vercel's 4.5 MB request body limit. */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;
export const IMPORT_HINT = 'Supports .txt, .md and .docx files up to 2 MB';
