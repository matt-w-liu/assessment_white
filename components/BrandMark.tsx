import { cn } from '@/lib/utils';

/** Small folded-page mark + wordmark. Drawn inline so there's no image asset to manage. */
export default function BrandMark({ className, size = 'md' }: { className?: string; size?: 'md' | 'lg' }) {
  const box = size === 'lg' ? 'h-9 w-9' : 'h-7 w-7';
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span className={cn('relative inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground', box)}>
        <svg viewBox="0 0 24 24" className="h-[60%] w-[60%]" fill="none" aria-hidden>
          <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M14 3v4h4" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          <path d="M9 12h6M9 16h4" stroke="hsl(var(--brand-soft))" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <span className={cn('font-serif font-semibold tracking-tight', size === 'lg' ? 'text-2xl' : 'text-lg')}>
        Ajaia Docs
      </span>
    </span>
  );
}
