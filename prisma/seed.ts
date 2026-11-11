/**
 * Seeds demo users and a few documents that demonstrate sharing.
 * Idempotent: users are upserted (password reset to the demo password);
 * sample documents are only created the first time.
 */
import { PrismaClient } from '@prisma/client';
import { DEMO_PASSWORD, DEMO_USERS } from '../lib/demo';
import { hashPassword } from '../lib/password';

const prisma = new PrismaClient();

const WELCOME_HTML = `
<h1>Welcome to Ajaia Docs</h1>
<p>This document is <strong>owned by Wesley</strong>. It is shared with <em>John</em> (can edit) and <u>Eric</u> (can view).</p>
<h2>What you can try</h2>
<ul>
  <li><p>Format text with <strong>bold</strong>, <em>italic</em>, <u>underline</u> and headings</p></li>
  <li><p>Create bulleted and numbered lists</p></li>
  <li><p>Rename the document by clicking its title</p></li>
</ul>
<h2>Sharing flow</h2>
<ol>
  <li><p>Sign in as Wesley and open <strong>Share</strong></p></li>
  <li><p>Grant access to another demo user by email</p></li>
  <li><p>Sign in as that user and find it under <em>Shared with me</em></p></li>
</ol>
<blockquote><p>Changes save automatically. Press Ctrl+S to save immediately.</p></blockquote>
`.trim();

const JOHN_NOTES_HTML = `
<h1>Weekly sync notes</h1>
<p>Owned by John and shared with Wesley as a <strong>viewer</strong>, so Wesley sees it read-only.</p>
<h3>Action items</h3>
<ul>
  <li><p>Finalize Q3 roadmap</p></li>
  <li><p>Review onboarding doc</p></li>
</ul>
`.trim();

// Demo accounts from an earlier version of the seed. Removing them also removes
// their documents and shares (cascade), so the database only holds the current demo set.
const LEGACY_DEMO_EMAILS = ['alice@ajaia.test', 'bob@ajaia.test', 'carol@ajaia.test'];

async function main() {
  await prisma.user.deleteMany({ where: { email: { in: LEGACY_DEMO_EMAILS } } });

  const users: Record<string, { id: string }> = {};
  for (const u of DEMO_USERS) {
    const passwordHash = hashPassword(DEMO_PASSWORD);
    users[u.key] = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, passwordHash },
      create: { email: u.email, name: u.name, passwordHash },
      select: { id: true },
    });
  }

  const wesley = users.wesley;
  const john = users.john;
  const eric = users.eric;

  const wesleyDocs = await prisma.document.count({ where: { ownerId: wesley.id } });
  if (wesleyDocs === 0) {
    await prisma.document.create({
      data: {
        title: 'Welcome to Ajaia Docs',
        content: WELCOME_HTML,
        ownerId: wesley.id,
        shares: {
          create: [
            { userId: john.id, role: 'EDITOR' },
            { userId: eric.id, role: 'VIEWER' },
          ],
        },
      },
    });
    await prisma.document.create({
      data: {
        title: 'Wesley private draft',
        content: '<p>Only Wesley can see this one until they share it.</p>',
        ownerId: wesley.id,
      },
    });
  }

  const johnDocs = await prisma.document.count({ where: { ownerId: john.id } });
  if (johnDocs === 0) {
    await prisma.document.create({
      data: {
        title: 'Weekly sync notes',
        content: JOHN_NOTES_HTML,
        ownerId: john.id,
        shares: { create: [{ userId: wesley.id, role: 'VIEWER' }] },
      },
    });
  }

  console.log(`Seeded ${DEMO_USERS.length} demo users (password: ${DEMO_PASSWORD}).`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
