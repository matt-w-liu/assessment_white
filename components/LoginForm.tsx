'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

interface Props {
  accounts: { email: string; name: string }[];
  demoPassword: string;
}

export default function LoginForm({ accounts, demoPassword }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function signIn(emailValue: string, passwordValue: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(data?.error || 'Sign in failed');
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(email, password);
  }

  return (
    <>
      <form className="form" onSubmit={onSubmit} noValidate>
        <label className="field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy || !email || !password}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="demo-accounts">
        <p className="small muted">
          Demo accounts (password <code>{demoPassword}</code>) — click to sign in:
        </p>
        <div className="demo-list">
          {accounts.map((a) => (
            <button
              key={a.email}
              type="button"
              className="demo-account"
              disabled={busy}
              onClick={() => {
                setEmail(a.email);
                setPassword(demoPassword);
                void signIn(a.email, demoPassword);
              }}
            >
              <strong>{a.name}</strong>
              <span className="small muted">{a.email}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
