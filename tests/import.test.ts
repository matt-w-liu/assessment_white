import { describe, expect, it } from 'vitest';
import {
  ImportError,
  convertFileToDocument,
  getExtension,
  textToHtml,
  titleFromFilename,
} from '../lib/import';
import { sanitizeDocHtml } from '../lib/sanitize';

const buf = (s: string) => Buffer.from(s, 'utf-8');

describe('textToHtml', () => {
  it('splits paragraphs on blank lines and keeps single line breaks', () => {
    expect(textToHtml('Hello\nworld\n\nSecond para')).toBe('<p>Hello<br>world</p><p>Second para</p>');
  });

  it('escapes HTML so plain text can never inject markup', () => {
    expect(textToHtml('<script>alert(1)</script> & co')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt; &amp; co</p>',
    );
  });

  it('normalises Windows line endings', () => {
    expect(textToHtml('a\r\n\r\nb')).toBe('<p>a</p><p>b</p>');
  });
});

describe('sanitizeDocHtml', () => {
  it('keeps formatting the editor supports', () => {
    const html = '<h1>T</h1><p><strong>b</strong> <em>i</em> <u>u</u></p><ul><li>x</li></ul><ol><li>y</li></ol>';
    expect(sanitizeDocHtml(html)).toBe(html);
  });

  it('strips scripts, event handlers and unsupported tags but keeps their text', () => {
    const dirty = '<p onclick="steal()">Hi<script>alert(1)</script> <a href="javascript:x">link</a><img src=x onerror=y></p>';
    expect(sanitizeDocHtml(dirty)).toBe('<p>Hi link</p>');
  });

  it('maps legacy/unsupported tags onto supported ones', () => {
    expect(sanitizeDocHtml('<b>a</b><i>b</i><h5>c</h5>')).toBe('<strong>a</strong><em>b</em><h3>c</h3>');
  });
});

describe('convertFileToDocument', () => {
  it('converts markdown with headings, emphasis and lists', async () => {
    const md = '# Plan\n\nSome **bold** and *italic*.\n\n- one\n- two\n\n1. first\n2. second\n';
    const { title, html } = await convertFileToDocument('project_plan.md', buf(md));
    expect(title).toBe('project plan');
    expect(html).toContain('<h1>Plan</h1>');
    expect(html).toContain('<strong>bold</strong>');
    expect(html).toContain('<em>italic</em>');
    expect(html).toMatch(/<ul>\s*<li>one<\/li>/);
    expect(html).toMatch(/<ol>\s*<li>first<\/li>/);
  });

  it('sanitizes raw HTML embedded in markdown', async () => {
    const { html } = await convertFileToDocument('x.md', buf('Hello <script>alert(1)</script><b onclick="x">hi</b>'));
    expect(html).not.toContain('script');
    expect(html).not.toContain('onclick');
    expect(html).toContain('<strong>hi</strong>');
  });

  it('converts plain text files', async () => {
    const { title, html } = await convertFileToDocument('Notes.TXT', buf('line one\n\nline two'));
    expect(title).toBe('Notes');
    expect(html).toBe('<p>line one</p><p>line two</p>');
  });

  it('rejects unsupported file types with 415', async () => {
    await expect(convertFileToDocument('photo.png', buf('x'))).rejects.toMatchObject({
      name: 'ImportError',
      status: 415,
    });
  });

  it('rejects empty files and files with no readable text', async () => {
    await expect(convertFileToDocument('empty.txt', Buffer.alloc(0))).rejects.toBeInstanceOf(ImportError);
    await expect(convertFileToDocument('blank.md', buf('\n\n   \n'))).rejects.toBeInstanceOf(ImportError);
  });

  it('rejects files that are not valid UTF-8 text', async () => {
    await expect(convertFileToDocument('bin.txt', Buffer.from([0xff, 0xfe, 0xfd]))).rejects.toThrow(/UTF-8/);
  });

  it('reports a corrupt .docx as a user-facing error instead of crashing', async () => {
    await expect(convertFileToDocument('broken.docx', buf('not a zip file'))).rejects.toThrow(/valid Word document/);
  });
});

describe('filename helpers', () => {
  it('extracts lowercase extensions', () => {
    expect(getExtension('Report.DOCX')).toBe('.docx');
    expect(getExtension('no-extension')).toBe('');
  });

  it('derives a readable title', () => {
    expect(titleFromFilename('q3-roadmap_final.docx')).toBe('q3 roadmap final');
    expect(titleFromFilename('.md')).toBe('Imported document');
  });
});
