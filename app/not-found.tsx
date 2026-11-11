import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold tracking-tight">Document not found</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        It may have been deleted, or it hasn&apos;t been shared with you.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Back to documents</Link>
      </Button>
    </main>
  );
}
