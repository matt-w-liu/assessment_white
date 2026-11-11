import { describe, expect, it } from 'vitest';
import { can, resolveRole, type AccessSubject, type Action, type Role } from '../lib/access';

const doc: AccessSubject = {
  ownerId: 'alice',
  shares: [
    { userId: 'bob', role: 'EDITOR' },
    { userId: 'carol', role: 'VIEWER' },
  ],
};

describe('resolveRole', () => {
  it('identifies the owner', () => {
    expect(resolveRole(doc, 'alice')).toBe('owner');
  });

  it('maps share rows to editor/viewer roles', () => {
    expect(resolveRole(doc, 'bob')).toBe('editor');
    expect(resolveRole(doc, 'carol')).toBe('viewer');
  });

  it('gives no access to users without a share, or anonymous users', () => {
    expect(resolveRole(doc, 'mallory')).toBeNull();
    expect(resolveRole(doc, null)).toBeNull();
    expect(resolveRole(doc, undefined)).toBeNull();
    expect(resolveRole(doc, '')).toBeNull();
  });

  it('owner wins even if a stray share row exists for them', () => {
    const odd: AccessSubject = { ownerId: 'alice', shares: [{ userId: 'alice', role: 'VIEWER' }] };
    expect(resolveRole(odd, 'alice')).toBe('owner');
  });
});

describe('can (permission matrix)', () => {
  const matrix: Record<Role, Record<Action, boolean>> = {
    owner: { read: true, edit: true, share: true, delete: true },
    editor: { read: true, edit: true, share: false, delete: false },
    viewer: { read: true, edit: false, share: false, delete: false },
  };

  for (const [role, actions] of Object.entries(matrix) as [Role, Record<Action, boolean>][]) {
    for (const [action, allowed] of Object.entries(actions) as [Action, boolean][]) {
      it(`${role} ${allowed ? 'can' : 'cannot'} ${action}`, () => {
        expect(can(role, action)).toBe(allowed);
      });
    }
  }

  it('denies everything when there is no role', () => {
    for (const action of ['read', 'edit', 'share', 'delete'] as Action[]) {
      expect(can(null, action)).toBe(false);
    }
  });

  it('end to end: a viewer of the doc cannot edit it, a stranger cannot read it', () => {
    expect(can(resolveRole(doc, 'carol'), 'edit')).toBe(false);
    expect(can(resolveRole(doc, 'mallory'), 'read')).toBe(false);
    expect(can(resolveRole(doc, 'bob'), 'edit')).toBe(true);
  });
});
