import Link from 'next/link';
import { ROLE_LABELS } from '@/lib/access';
import type { DocumentLists } from '@/lib/documents';
import DeleteDocumentButton from './DeleteDocumentButton';
import LocalTime from './LocalTime';

export function OwnedDocumentList({ documents }: { documents: DocumentLists['owned'] }) {
  if (documents.length === 0) {
    return <p className="empty-state">You don&apos;t own any documents yet. Create one or import a file to get started.</p>;
  }
  return (
    <ul className="doc-list">
      {documents.map((d) => (
        <li key={d.id} className="doc-item">
          <Link href={`/docs/${d.id}`} className="doc-link">
            <span className="doc-icon" aria-hidden>
              ▤
            </span>
            <span className="doc-text">
              <span className="doc-title">{d.title}</span>
              <span className="doc-meta">
                Edited <LocalTime iso={d.updatedAt} />
              </span>
            </span>
          </Link>
          <span className={d.shareCount > 0 ? 'badge badge-shared' : 'badge'}>
            {d.shareCount > 0 ? `Shared with ${d.shareCount}` : 'Private'}
          </span>
          <DeleteDocumentButton id={d.id} title={d.title} />
        </li>
      ))}
    </ul>
  );
}

export function SharedDocumentList({ documents }: { documents: DocumentLists['shared'] }) {
  if (documents.length === 0) {
    return <p className="empty-state">Nothing has been shared with you yet.</p>;
  }
  return (
    <ul className="doc-list">
      {documents.map((d) => (
        <li key={d.id} className="doc-item">
          <Link href={`/docs/${d.id}`} className="doc-link">
            <span className="doc-icon doc-icon-shared" aria-hidden>
              ▤
            </span>
            <span className="doc-text">
              <span className="doc-title">{d.title}</span>
              <span className="doc-meta">
                Owned by {d.owner.name} · Edited <LocalTime iso={d.updatedAt} />
              </span>
            </span>
          </Link>
          <span className={`badge role-${d.role}`}>{ROLE_LABELS[d.role]}</span>
        </li>
      ))}
    </ul>
  );
}
