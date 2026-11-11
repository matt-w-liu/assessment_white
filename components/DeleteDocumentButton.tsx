'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiRequest } from '@/lib/client';

export default function DeleteDocumentButton({ id, title }: { id: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete() {
    if (!window.confirm(`Delete "${title}"? This can't be undone.`)) return;
    setBusy(true);
    try {
      await apiRequest<void>(`/api/documents/${id}`, { method: 'DELETE' });
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Could not delete document');
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-ghost btn-danger btn-sm" onClick={onDelete} disabled={busy} aria-label={`Delete ${title}`}>
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  );
}
