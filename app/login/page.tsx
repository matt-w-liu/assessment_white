import { redirect } from 'next/navigation';
import LoginForm from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { DEMO_PASSWORD, DEMO_USERS } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="login-page">
      <div className="login-card">
        <div className="brand brand-lg">
          <span className="brand-mark" aria-hidden>
            A
          </span>
          Ajaia Docs
        </div>
        <p className="muted">Sign in to create, edit and share documents.</p>
        <LoginForm
          accounts={DEMO_USERS.map((u) => ({ email: u.email, name: u.name }))}
          demoPassword={DEMO_PASSWORD}
        />
      </div>
    </main>
  );
}
