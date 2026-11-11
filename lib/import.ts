import mammoth from 'mammoth';
import { marked } from 'marked';
import { HttpError } from './errors';
import { MAX_IMPORT_BYTES, MAX_TITLE_LENGTH, SUPPORTED_IMPORT_EXTENSIONS } from './limits';
import { sanitizeDocHtml } from './sanitize';

/** File → editable document conversion (server-side). */

export class ImportError extends HttpError {
  constructor(message: string, status = 400) {
    super(status, message);
    this.name = 'ImportError';
  }
}

export function getExtension(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot).toLowerCase();
}

export function titleFromFilename(filename: string): string {
  const base = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return (base || 'Imported document').slice(0, MAX_TITLE_LENGTH);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Plain text → paragraphs (blank-line separated), single newlines → <br>. */
export function textToHtml(text: string): string {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export async function markdownToHtml(markdown: string): Promise<string> {
  return await marked.parse(markdown, { gfm: true });
}

export async function docxToHtml(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.convertToHtml({ buffer });
    return result.value;
  } catch {
    throw new ImportError('Could not read this .docx file. Is it a valid Word document?');
  }
}

function decodeUtf8(buffer: Uint8Array): string {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer).replace(/^﻿/, '');
  } catch {
    throw new ImportError('This file is not valid UTF-8 text');
  }
}

export async function convertFileToDocument(
  filename: string,
  buffer: Buffer,
): Promise<{ title: string; html: string }> {
  const ext = getExtension(filename);
  if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ImportError(
      `Unsupported file type "${ext || 'none'}". Supported types: .txt, .md, .docx`,
      415,
    );
  }
  if (buffer.length === 0) throw new ImportError('The file is empty');
  if (buffer.length > MAX_IMPORT_BYTES) throw new ImportError('File is larger than 2 MB', 413);

  let html: string;
  switch (ext) {
    case '.txt':
      html = textToHtml(decodeUtf8(buffer));
      break;
    case '.md':
    case '.markdown':
      html = await markdownToHtml(decodeUtf8(buffer));
      break;
    default:
      html = await docxToHtml(buffer);
  }

  const clean = sanitizeDocHtml(html);
  if (!clean.replace(/<[^>]*>/g, '').trim()) {
    throw new ImportError('No readable text was found in this file');
  }
  return { title: titleFromFilename(filename), html: clean };
}
