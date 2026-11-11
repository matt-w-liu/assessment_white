import { NextResponse } from 'next/server';
import { fromShareRole, toShareRole } from '@/lib/access';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireDocumentAccess } from '@/lib/documents';
import { HttpError } from '@/lib/errors';
import { readJson, withErrors } from '@/lib/http';
import { shareSchema } from '@/lib/validation';

type Ctx = { params: { id: string } };

async function listShares(documentId: string) {
  const shares = await prisma.documentShare.findMany({
    where: { documentId },
    orderBy: { createdAt: 'asc' },
    select: { role: true, user: { select: { id: true, email: true, name: true } } },
  });
  return shares.map((s) => ({
    userId: s.user.id,
    email: s.user.email,
    name: s.user.name,
    role: fromShareRole(s.role),
  }));
}

/** Who has access (owner only). */
export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { doc } = await requireDocumentAccess(params.id, user.id, 'share');
  return NextResponse.json({ owner: doc.owner, shares: await listShares(doc.id) });
});

/** Grant (or change) access for a user by email (owner only). */
export const POST = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { doc } = await requireDocumentAccess(params.id, user.id, 'share');
  const { email, role } = shareSchema.parse(await readJson(req));

  const target = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (!target) throw new HttpError(404, `No user found with email ${email}`);
  if (target.id === doc.ownerId) throw new HttpError(400, 'The owner already has full access');

  await prisma.documentShare.upsert({
    where: { documentId_userId: { documentId: doc.id, userId: target.id } },
    create: { documentId: doc.id, userId: target.id, role: toShareRole(role) },
    update: { role: toShareRole(role) },
  });
  return NextResponse.json({ shares: await listShares(doc.id) }, { status: 201 });
});
