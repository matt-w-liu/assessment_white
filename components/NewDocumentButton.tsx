'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, jsonHeaders } from '@/lib/client';
import { Button } from '@/components/ui/button';

export default function NewDocumentButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function create() {
    setBusy(true);
    try {
      const { document } = await apiRequest<{ document: { id: string } }>('/api/documents', {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({}),
      });
      router.push(`/docs/${document.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not create document');
      setBusy(false);
    }
  }

  return (
    <Button onClick={create} disabled={busy}>
      {busy ? <Loader2 className="animate-spin" /> : <Plus />}
      New document
    </Button>
  );
}
