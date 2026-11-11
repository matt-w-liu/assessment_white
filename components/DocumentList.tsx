import Link from 'next/link';
import { FileText, Lock, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ROLE_LABELS } from '@/lib/access';
import type { DocumentLists } from '@/lib/documents';
import DeleteDocumentButton from './DeleteDocumentButton';
import LocalTime from './LocalTime';
import UserAvatar from './UserAvatar';

function EmptyState({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="rounded-lg border border-dashed bg-card/50 px-6 py-10 text-center">
      <FileText className="mx-auto h-6 w-6 text-muted-foreground/60" aria-hidden />
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
    </div>
  );
}

const rowClass =
  'group relative flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent/40 focus-within:bg-accent/40';
const linkClass =
  'flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-none after:absolute after:inset-0 after:content-[""]';

export function OwnedDocumentList({ documents }: { documents: DocumentLists['owned'] }) {
  if (documents.length === 0) {
    return <EmptyState title="Nothing here yet" hint="Start a new document, or import a .txt, .md or .docx file." />;
  }
  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-sm">
      {documents.map((d) => (
        <li key={d.id} className={rowClass}>
          <Link href={`/docs/${d.id}`} className={linkClass}>
            <DocIcon />
            <span className="min-w-0">
              <span className="block truncate font-medium group-hover:underline group-hover:decoration-border group-hover:underline-offset-4">
                {d.title}
              </span>
              <span className="block text-xs text-muted-foreground">
                Edited <LocalTime iso={d.updatedAt} />
              </span>
            </span>
          </Link>
          <span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:inline-flex">
            {d.shareCount > 0 ? (
              <>
                <Users className="h-3.5 w-3.5" /> {d.shareCount} {d.shareCount === 1 ? 'person' : 'people'}
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5" /> Only you
              </>
            )}
          </span>
          {/* z-10 keeps the menu above the row's full-size link overlay. */}
          <div className="relative z-10">
            <DeleteDocumentButton id={d.id} title={d.title} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SharedDocumentList({ documents }: { documents: DocumentLists['shared'] }) {
  if (documents.length === 0) {
    return <EmptyState title="No shared documents" hint="When someone shares a document with you, it shows up here." />;
  }
  return (
    <ul className="divide-y overflow-hidden rounded-lg border bg-card shadow-sm">
      {documents.map((d) => (
        <li key={d.id} className={rowClass}>
          <Link href={`/docs/${d.id}`} className={linkClass}>
            <DocIcon />
            <span className="min-w-0">
              <span className="block truncate font-medium group-hover:underline group-hover:decoration-border group-hover:underline-offset-4">
                {d.title}
              </span>
              <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <UserAvatar name={d.owner.name} email={d.owner.email} className="h-4 w-4 [&>span]:text-[8px]" />
                <span className="truncate">
                  {d.owner.name} · <LocalTime iso={d.updatedAt} />
                </span>
              </span>
            </span>
          </Link>
          <Badge variant={d.role}>{ROLE_LABELS[d.role]}</Badge>
        </li>
      ))}
    </ul>
  );
}

function DocIcon() {
  return (
    <span className="flex h-10 w-8 shrink-0 flex-col gap-[3px] rounded-[3px] border bg-paper px-1.5 pt-2 shadow-sm" aria-hidden>
      <span className="h-[2px] w-full rounded bg-foreground/30" />
      <span className="h-[2px] w-full rounded bg-foreground/15" />
      <span className="h-[2px] w-3/4 rounded bg-foreground/15" />
      <span className="h-[2px] w-full rounded bg-foreground/15" />
    </span>
  );
}
