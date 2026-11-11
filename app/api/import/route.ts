import { NextResponse } from 'next/server';
import { requireApiUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { HttpError } from '@/lib/errors';
import { withErrors } from '@/lib/http';
import { convertFileToDocument } from '@/lib/import';
import { MAX_IMPORT_BYTES } from '@/lib/limits';

/** Upload a .txt / .md / .docx file and turn it into a new editable document. */
export const POST = withErrors(async (req: Request) => {
  const user = await requireApiUser();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, 'Expected a multipart/form-data upload');
  }

  const file = form.get('file');
  if (!file || typeof file === 'string') throw new HttpError(400, 'Choose a file to upload');
  if (file.size > MAX_IMPORT_BYTES) throw new HttpError(413, 'File is larger than 2 MB');

  const buffer = Buffer.from(await file.arrayBuffer());
  const { title, html } = await convertFileToDocument(file.name, buffer);

  const document = await prisma.document.create({
    data: { title, content: html, ownerId: user.id },
    select: { id: true, title: true, updatedAt: true },
  });
  return NextResponse.json({ document }, { status: 201 });
});
