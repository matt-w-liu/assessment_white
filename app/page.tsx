import AppHeader from '@/components/AppHeader';
import Greeting from '@/components/Greeting';
import { OwnedDocumentList, SharedDocumentList } from '@/components/DocumentList';
import ImportButton from '@/components/ImportButton';
import NewDocumentButton from '@/components/NewDocumentButton';
import { requirePageUser } from '@/lib/auth';
import { listDocumentsForUser } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requirePageUser();
  const { owned, shared } = await listDocumentsForUser(user.id);
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <AppHeader user={user} />
      <main className="container pb-20 pt-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              <Greeting firstName={firstName} />
            </p>
            <h1 className="mt-1 font-serif text-4xl font-semibold tracking-tight">Your documents</h1>
          </div>
          <div className="flex items-start gap-2">
            <ImportButton />
            <NewDocumentButton />
          </div>
        </div>

        <section className="mt-10" aria-labelledby="owned-heading">
          <SectionHeading id="owned-heading" label="Owned by me" count={owned.length} />
          <OwnedDocumentList documents={owned} />
        </section>

        <section className="mt-12" aria-labelledby="shared-heading">
          <SectionHeading id="shared-heading" label="Shared with me" count={shared.length} />
          <SharedDocumentList documents={shared} />
        </section>
      </main>
    </>
  );
}

function SectionHeading({ id, label, count }: { id: string; label: string; count: number }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <h2 id={id} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </h2>
      <span className="text-xs tabular-nums text-muted-foreground/80">{count}</span>
      <div className="h-px flex-1 bg-border" aria-hidden />
    </div>
  );
}
