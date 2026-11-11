'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest, jsonHeaders } from '@/lib/client';

export default function NewDocumentButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setError(null);
    try {
      const { document } = await apiRequest<{ document: { id: string } }>('/api/documents', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });
      router.push(`/docs/${document.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create document');
      setBusy(false);
    }
  }

  return (
    <div className="action-with-error">
      <button className="btn btn-primary" onClick={create} disabled={busy}>
        {busy ? 'Creating…' : '+ New document'}
      </button>
      {error && (
        <p className="form-error small" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
