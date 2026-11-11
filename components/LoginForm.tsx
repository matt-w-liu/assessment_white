'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UserAvatar from './UserAvatar';

interface Props {
  accounts: { email: string; name: string; blurb: string }[];
  demoPassword: string;
}

export default function LoginForm({ accounts, demoPassword }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Which control started the sign-in: 'form' or a demo account's email.
  const [pending, setPending] = useState<string | null>(null);

  async function signIn(emailValue: string, passwordValue: string, source: string) {
    setBusy(true);
    setPending(source);
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
      setPending(null);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void signIn(email, password, 'form');
  }

  return (
    <>
      <form className="mt-8 space-y-4" onSubmit={onSubmit} noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy || !email || !password}>
          {pending === 'form' && <Loader2 className="animate-spin" />}
          Sign in
        </Button>
      </form>

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-medium">Try a demo account</h2>
          <span className="text-xs text-muted-foreground">
            password <code className="rounded bg-muted px-1 py-0.5 font-mono">{demoPassword}</code>
          </span>
        </div>
        <ul className="mt-3 divide-y overflow-hidden rounded-lg border bg-card">
          {accounts.map((a) => (
            <li key={a.email}>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  setEmail(a.email);
                  setPassword(demoPassword);
                  void signIn(a.email, demoPassword, a.email);
                }}
                className="group flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-accent/60 focus-visible:bg-accent/60 focus-visible:outline-none disabled:opacity-60"
              >
                <UserAvatar name={a.name} email={a.email} className="h-9 w-9" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{a.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {a.email} · {a.blurb}
                  </span>
                </span>
                {pending === a.email ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
