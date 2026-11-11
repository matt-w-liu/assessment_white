'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent } from 'react';
import { apiRequest } from '@/lib/client';
import { IMPORT_ACCEPT, IMPORT_HINT, MAX_IMPORT_BYTES, SUPPORTED_IMPORT_EXTENSIONS } from '@/lib/limits';

export default function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after an error
    if (!file) return;

    // Fast client-side checks; the server re-validates everything.
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
      setError(`"${file.name}" isn't supported. ${IMPORT_HINT}.`);
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      setError(`"${file.name}" is larger than 2 MB.`);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append('file', file);
      const { document } = await apiRequest<{ document: { id: string } }>('/api/import', {
        method: 'POST',
        body,
      });
      router.push(`/docs/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setBusy(false);
    }
  }

  return (
    <div className="action-with-error">
      <button className="btn" onClick={() => inputRef.current?.click()} disabled={busy} title={IMPORT_HINT}>
        {busy ? 'Importing…' : 'Import file'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_ACCEPT}
        onChange={onFileChosen}
        hidden
        aria-label="Import a .txt, .md or .docx file"
      />
      <p className={error ? 'form-error small' : 'muted small'} role={error ? 'alert' : undefined}>
        {error ?? IMPORT_HINT}
      </p>
    </div>
  );
}
