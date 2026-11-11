import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { requireDocumentAccess, serializeDocument } from '@/lib/documents';
import { readJson, withErrors } from '@/lib/http';
import { sanitizeDocHtml } from '@/lib/sanitize';
import { updateDocumentSchema } from '@/lib/validation';

type Ctx = { params: { id: string } };

export const GET = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  const { doc, role } = await requireDocumentAccess(params.id, user.id, 'read');
  return NextResponse.json({ document: serializeDocument(doc), role });
});

/** Autosave endpoint: rename and/or replace content. Owners and editors only. */
export const PATCH = withErrors(async (req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  await requireDocumentAccess(params.id, user.id, 'edit');
  const input = updateDocumentSchema.parse(await readJson(req));

  const data: { title?: string; content?: string } = {};
  if (input.title !== undefined) data.title = input.title;
  // Defence in depth: the editor only emits safe markup, but the API can be called directly.
  if (input.content !== undefined) data.content = sanitizeDocHtml(input.content);

  const document = await prisma.document.update({
    where: { id: params.id },
    data,
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ document });
});

export const DELETE = withErrors(async (_req: Request, { params }: Ctx) => {
  const user = await requireApiUser();
  await requireDocumentAccess(params.id, user.id, 'delete');
  await prisma.document.delete({ where: { id: params.id } });
  return new NextResponse(null, { status: 204 });
});
