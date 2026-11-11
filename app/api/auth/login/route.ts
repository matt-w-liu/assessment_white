import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sessionCookieOptions } from '@/lib/auth';
import { HttpError } from '@/lib/errors';
import { readJson, withErrors } from '@/lib/http';
import { verifyPassword } from '@/lib/password';
import { SESSION_COOKIE, createSessionToken } from '@/lib/session';
import { loginSchema } from '@/lib/validation';

export const POST = withErrors(async (req: Request) => {
  const { email, password } = loginSchema.parse(await readJson(req));

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new HttpError(401, 'Invalid email or password');
  }

  const res = NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } });
  res.cookies.set(SESSION_COOKIE, createSessionToken(user.id), sessionCookieOptions);
  return res;
});
