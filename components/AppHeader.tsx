import Link from 'next/link';

export default function AppHeader({ user }: { user: { name: string; email: string } }) {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <span className="brand-mark" aria-hidden>
          A
        </span>
        Ajaia Docs
      </Link>
      <div className="user-menu">
        <span className="user-name" title={user.email}>
          {user.name}
          <span className="muted small"> · {user.email}</span>
        </span>
        <form action="/api/auth/logout" method="post">
          <button type="submit" className="btn btn-ghost">
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
