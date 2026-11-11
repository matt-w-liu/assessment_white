import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireDocumentAccess } from '@/lib/documents';
import { HttpError } from '@/lib/errors';
import { withErrors } from '@/lib/http';

type Ctx = { params: { id: string; userId: string } };

/** Revoke a user's access (owner only). */
export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { doc } = await requireDocumentAccess(params.id, user.id, 'share');

  const { count } = await prisma.documentShare.deleteMany({
    where: { documentId: doc.id, userId: params.userId },
  });
  if (count === 0) throw new HttpError(404, 'That user does not have access to this document');
  return new NextResponse(null, { status: 204 });
});
