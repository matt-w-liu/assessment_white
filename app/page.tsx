import AppHeader from '@/components/AppHeader';
import { OwnedDocumentList, SharedDocumentList } from '@/components/DocumentList';
import ImportButton from '@/components/ImportButton';
import NewDocumentButton from '@/components/NewDocumentButton';
import { requirePageUser } from '@/lib/auth';
import { listDocumentsForUser } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const user = await requirePageUser();
  const { owned, shared } = await listDocumentsForUser(user.id);

  return (
    <>
      <AppHeader user={user} />
      <main className="container">
        <div className="page-heading">
          <h1>Documents</h1>
          <div className="page-actions">
            <ImportButton />
            <NewDocumentButton />
          </div>
        </div>

        <section className="doc-section" aria-labelledby="owned-heading">
          <h2 id="owned-heading">
            Owned by me <span className="count">{owned.length}</span>
          </h2>
          <OwnedDocumentList documents={owned} />
        </section>

        <section className="doc-section" aria-labelledby="shared-heading">
          <h2 id="shared-heading">
            Shared with me <span className="count">{shared.length}</span>
          </h2>
          <SharedDocumentList documents={shared} />
        </section>
      </main>
    </>
  );
}
