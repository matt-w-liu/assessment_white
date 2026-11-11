import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { listDocumentsForUser } from '@/lib/documents';
import { readJsonOptional, withErrors } from '@/lib/http';
import { createDocumentSchema } from '@/lib/validation';

/** List documents I own and documents shared with me. */
export const GET = withErrors(async () => {
  const user = await requireApiUser();
  return NextResponse.json(await listDocumentsForUser(user.id));
});

/** Create a new (empty) document owned by the current user. */
export const POST = withErrors(async (req: Request) => {
  const user = await requireApiUser();
  const { title } = createDocumentSchema.parse(await readJsonOptional(req));

  const document = await prisma.document.create({
    data: { title: title ?? 'Untitled document', content: '', ownerId: user.id },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ document }, { status: 201 });
});
