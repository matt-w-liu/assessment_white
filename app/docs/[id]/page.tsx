import { notFound } from 'next/navigation';
import DocumentEditor from '@/components/DocumentEditor';
import { requirePageUser } from '@/lib/auth';
import { getDocumentForUser, serializeDocument } from '@/lib/documents';

export const dynamic = 'force-dynamic';

export default async function DocumentPage({ params }: { params: { id: string } }) {
  const user = await requirePageUser();
  const result = await getDocumentForUser(params.id, user.id);
  if (!result) notFound();

  return <DocumentEditor document={serializeDocument(result.doc)} role={result.role} />;
}
