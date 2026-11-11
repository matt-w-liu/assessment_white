'use client';

import Link from 'next/link';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="center-message">
      <h1>Something went wrong</h1>
      <p className="muted">{error.message || 'An unexpected error occurred.'}</p>
      <div className="row-gap">
        <button className="btn" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn btn-primary">
          Back to documents
        </Link>
      </div>
    </main>
  );
}
