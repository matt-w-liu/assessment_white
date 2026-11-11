import { prisma } from './db';
import { can, fromShareRole, resolveRole, type Action } from './access';
import { HttpError } from './errors';

/** Data access for documents. Every route that touches a document goes through here. */

export async function getDocumentForUser(documentId: string, userId: string) {
  const doc = await prisma.document.findUnique({
    where: { id: documentId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      shares: { select: { userId: true, role: true } },
    },
  });
  if (!doc) return null;
  const role = resolveRole(doc, userId);
  // No access is reported as "not found" so we don't leak which document ids exist.
  if (!role) return null;
  return { doc, role };
}

export type DocumentWithAccess = NonNullable<Awaited<ReturnType<typeof getDocumentForUser>>>;

export async function requireDocumentAccess(documentId: string, userId: string, action: Action) {
  const result = await getDocumentForUser(documentId, userId);
  if (!result) throw new HttpError(404, 'Document not found');
  if (!can(result.role, action)) {
    const verb = { read: 'view', edit: 'edit', share: 'share', delete: 'delete' }[action];
    throw new HttpError(403, `You don't have permission to ${verb} this document`);
  }
  return result;
}

export function serializeDocument(doc: DocumentWithAccess['doc']) {
  return {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    owner: doc.owner,
  };
}

export type SerializedDocument = ReturnType<typeof serializeDocument>;

export async function listDocumentsForUser(userId: string) {
  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, updatedAt: true, _count: { select: { shares: true } } },
    }),
    prisma.documentShare.findMany({
      where: { userId },
      orderBy: { document: { updatedAt: 'desc' } },
      select: {
        role: true,
        document: {
          select: {
            id: true,
            title: true,
            updatedAt: true,
            owner: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  return {
    owned: owned.map((d) => ({
      id: d.id,
      title: d.title,
      updatedAt: d.updatedAt.toISOString(),
      shareCount: d._count.shares,
    })),
    shared: shared.map((s) => ({
      id: s.document.id,
      title: s.document.title,
      updatedAt: s.document.updatedAt.toISOString(),
      role: fromShareRole(s.role),
      owner: s.document.owner,
    })),
  };
}

export type DocumentLists = Awaited<ReturnType<typeof listDocumentsForUser>>;
