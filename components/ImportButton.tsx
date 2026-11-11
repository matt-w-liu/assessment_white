'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState, type ChangeEvent } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest } from '@/lib/client';
import { IMPORT_ACCEPT, IMPORT_HINT, MAX_IMPORT_BYTES, SUPPORTED_IMPORT_EXTENSIONS } from '@/lib/limits';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export default function ImportButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  async function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file after an error
    if (!file) return;

    // Fast client-side checks; the server re-validates everything.
    const ext = file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')).toLowerCase() : '';
    if (!(SUPPORTED_IMPORT_EXTENSIONS as readonly string[]).includes(ext)) {
      toast.error(`"${file.name}" isn't supported`, { description: `${IMPORT_HINT}.` });
      return;
    }
    if (file.size > MAX_IMPORT_BYTES) {
      toast.error(`"${file.name}" is larger than 2 MB`);
      return;
    }

    setBusy(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { document } = await apiRequest<{ document: { id: string } }>('/api/import', {
        method: 'POST',
        body,
      });
      router.push(`/docs/${document.id}`);
    } catch (err) {
      toast.error('Import failed', { description: err instanceof Error ? err.message : undefined });
      setBusy(false);
    }
  }

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Upload />}
            {busy ? 'Importing…' : 'Import'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{IMPORT_HINT}</TooltipContent>
      </Tooltip>
      <input
        ref={inputRef}
        type="file"
        accept={IMPORT_ACCEPT}
        onChange={onFileChosen}
        hidden
        aria-label="Import a .txt, .md or .docx file"
      />
    </>
  );
}
