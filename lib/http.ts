import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { HttpError } from './errors';

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
}

/** Like readJson, but an empty body is treated as `{}`. */
export async function readJsonOptional(req: Request): Promise<unknown> {
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Request body must be valid JSON');
  }
}

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: err.issues[0]?.message ?? 'Invalid request', issues: err.issues },
      { status: 400 },
    );
  }
  if (err instanceof HttpError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  console.error('[api] unexpected error', err);
  return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
}

/** Wraps a route handler so thrown HttpError/ZodError become JSON error responses. */
export function withErrors<A extends unknown[]>(handler: (...args: A) => Promise<Response>) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      return errorResponse(err);
    }
  };
}
