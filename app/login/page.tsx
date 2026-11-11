import { redirect } from 'next/navigation';
import BrandMark from '@/components/BrandMark';
import LoginForm from '@/components/LoginForm';
import { getCurrentUser } from '@/lib/auth';
import { DEMO_PASSWORD, DEMO_USERS } from '@/lib/demo';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  if (await getCurrentUser()) redirect('/');

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left: a quiet "paper" panel that hints at what the app is for. */}
      <section className="relative hidden overflow-hidden border-r bg-secondary/60 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <BrandMark size="lg" />

        <div className="relative mx-auto w-full max-w-md">
          <div className="absolute -left-4 top-6 h-full w-full rotate-[-3deg] rounded-md border bg-card/60" aria-hidden />
          <div className="relative rounded-md border bg-paper p-8 shadow-page">
            <p className="font-serif text-2xl font-semibold leading-snug">Weekly sync notes</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Shared with 2 people</p>
            <div className="mt-6 space-y-3 font-serif text-[15px] leading-relaxed text-foreground/80">
              <p>
                Roadmap looks <strong className="text-foreground">mostly settled</strong>. Two open questions on
                onboarding, picked up below.
              </p>
              <ul className="list-disc space-y-1 pl-5 marker:text-muted-foreground">
                <li>Finalize Q3 roadmap</li>
                <li>
                  Review the onboarding doc <em>before Friday</em>
                </li>
              </ul>
              <p className="border-l-2 border-brand pl-3 italic text-muted-foreground">Saved a moment ago.</p>
            </div>
          </div>
        </div>

        <p className="max-w-sm font-serif text-lg italic text-muted-foreground">
          Write it down, share it with the right people, and keep working on the same page.
        </p>
      </section>

      {/* Right: sign in */}
      <section className="flex items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <BrandMark className="mb-10 lg:hidden" />
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-muted-foreground">Sign in to pick up where you left off.</p>
          <LoginForm
            accounts={DEMO_USERS.map((u) => ({ email: u.email, name: u.name, blurb: u.blurb }))}
            demoPassword={DEMO_PASSWORD}
          />
        </div>
      </section>
    </main>
  );
}
