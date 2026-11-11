'use client';

import Link from 'next/link';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">Error</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{error.message || 'An unexpected error occurred.'}</p>
      <div className="mt-6 flex gap-2">
        <Button variant="outline" onClick={reset}>
          <RotateCw /> Try again
        </Button>
        <Button asChild>
          <Link href="/">Back to documents</Link>
        </Button>
      </div>
    </main>
  );
}
