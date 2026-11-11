/**
 * Access-control rules for documents. Pure functions (no DB, no framework) so the
 * whole permission model is unit-testable and every API route goes through it.
 */

export type Role = 'owner' | 'editor' | 'viewer';
export type Action = 'read' | 'edit' | 'share' | 'delete';
export type ShareRoleValue = 'VIEWER' | 'EDITOR';
export type ShareRoleInput = 'viewer' | 'editor';

export interface AccessSubject {
  ownerId: string;
  shares: ReadonlyArray<{ userId: string; role: ShareRoleValue }>;
}

const PERMISSIONS: Record<Role, ReadonlySet<Action>> = {
  owner: new Set<Action>(['read', 'edit', 'share', 'delete']),
  editor: new Set<Action>(['read', 'edit']),
  viewer: new Set<Action>(['read']),
};

/** Returns the user's role on a document, or null if they have no access at all. */
export function resolveRole(doc: AccessSubject, userId: string | null | undefined): Role | null {
  if (!userId) return null;
  if (doc.ownerId === userId) return 'owner';
  const share = doc.shares.find((s) => s.userId === userId);
  if (!share) return null;
  return fromShareRole(share.role);
}

export function can(role: Role | null, action: Action): boolean {
  return role !== null && PERMISSIONS[role].has(action);
}

export function toShareRole(role: ShareRoleInput): ShareRoleValue {
  return role === 'editor' ? 'EDITOR' : 'VIEWER';
}

export function fromShareRole(role: ShareRoleValue): ShareRoleInput {
  return role === 'EDITOR' ? 'editor' : 'viewer';
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: 'Owner',
  editor: 'Can edit',
  viewer: 'Can view',
};
