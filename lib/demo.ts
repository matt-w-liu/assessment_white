/**
 * Seeded demo accounts. Auth is intentionally mocked for this exercise: these users
 * are created by `npm run db:seed` and listed on the login page for reviewers.
 */
export const DEMO_PASSWORD = 'demo1234';

export const DEMO_USERS = [
  { key: 'alice', email: 'alice@ajaia.test', name: 'Alice Chen' },
  { key: 'bob', email: 'bob@ajaia.test', name: 'Bob Rivera' },
  { key: 'carol', email: 'carol@ajaia.test', name: 'Carol Singh' },
] as const;
