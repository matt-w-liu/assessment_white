import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from './db';
import { HttpError } from './errors';
import { SESSION_COOKIE, SESSION_MAX_AGE_SECONDS, verifySessionToken } from './session';

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
};

export async function getCurrentUser() {
  const userId = verifySessionToken(cookies().get(SESSION_COOKIE)?.value);
  if (!userId) return null;
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });
}

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;

/** For API routes: throws a 401 HttpError when not signed in. */
export async function requireApiUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new HttpError(401, 'You need to sign in');
  return user;
}

/** For server-rendered pages: redirects to /login when not signed in. */
export async function requirePageUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  return user;
}
