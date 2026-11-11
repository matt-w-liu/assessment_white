/**
 * Seeded demo accounts. Auth is intentionally mocked for this exercise: these users
 * are created by `npm run db:seed` and listed on the login page for reviewers.
 */
export const DEMO_PASSWORD = 'demo1234';

export const DEMO_USERS = [
  { key: 'wesley', email: 'wesley@ajaia.test', name: 'Wesley Turner', blurb: 'Owns the welcome doc' },
  { key: 'john', email: 'john@ajaia.test', name: 'John Doe', blurb: 'Can edit the welcome doc' },
  { key: 'eric', email: 'eric@ajaia.test', name: 'Eric Moon', blurb: 'Read-only on the welcome doc' },
] as const;
