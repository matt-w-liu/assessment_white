import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../lib/password';
import { SESSION_MAX_AGE_SECONDS, createSessionToken, verifySessionToken } from '../lib/session';
import { shareSchema, updateDocumentSchema } from '../lib/validation';

describe('session tokens', () => {
  it('round-trips a valid token', () => {
    const token = createSessionToken('user_123');
    expect(verifySessionToken(token)).toBe('user_123');
  });

  it('rejects a token whose user id was tampered with', () => {
    const [, exp, sig] = createSessionToken('user_123').split('.');
    expect(verifySessionToken(`admin.${exp}.${sig}`)).toBeNull();
  });

  it('rejects a token with a forged signature or bad shape', () => {
    const [id, exp] = createSessionToken('user_123').split('.');
    expect(verifySessionToken(`${id}.${exp}.forged`)).toBeNull();
    expect(verifySessionToken('garbage')).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
  });

  it('rejects expired tokens', () => {
    const issuedAt = Date.now();
    const token = createSessionToken('user_123', issuedAt);
    const afterExpiry = issuedAt + (SESSION_MAX_AGE_SECONDS + 1) * 1000;
    expect(verifySessionToken(token, afterExpiry)).toBeNull();
  });
});

describe('passwords', () => {
  it('verifies the right password and rejects the wrong one', () => {
    const stored = hashPassword('demo1234');
    expect(verifyPassword('demo1234', stored)).toBe(true);
    expect(verifyPassword('wrong', stored)).toBe(false);
    expect(verifyPassword('demo1234', 'malformed')).toBe(false);
  });
});

describe('request validation', () => {
  it('trims titles and rejects empty ones', () => {
    expect(updateDocumentSchema.parse({ title: '  My doc  ' }).title).toBe('My doc');
    expect(updateDocumentSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('requires at least one field to update', () => {
    const result = updateDocumentSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('normalises share emails and defaults the role to editor', () => {
    expect(shareSchema.parse({ email: '  Bob@Ajaia.TEST ' })).toEqual({ email: 'bob@ajaia.test', role: 'editor' });
    expect(shareSchema.safeParse({ email: 'not-an-email' }).success).toBe(false);
    expect(shareSchema.safeParse({ email: 'a@b.co', role: 'admin' }).success).toBe(false);
  });
});
