'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { apiRequest, jsonHeaders } from '@/lib/client';

type ShareRole = 'viewer' | 'editor';
interface ShareEntry {
  userId: string;
  email: string;
  name: string;
  role: ShareRole;
}
interface Owner {
  id: string;
  name: string;
  email: string;
}

export default function ShareDialog({ documentId, onClose }: { documentId: string; onClose: () => void }) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const base = `/api/documents/${documentId}/shares`;

  const load = useCallback(async () => {
    try {
      const data = await apiRequest<{ owner: Owner; shares: ShareEntry[] }>(base);
      setOwner(data.owner);
      setShares(data.shares);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load sharing settings');
    } finally {
      setLoading(false);
    }
  }, [base]);

  useEffect(() => {
    void load();
    emailRef.current?.focus();
  }, [load]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function grant(targetEmail: string, targetRole: ShareRole) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const data = await apiRequest<{ shares: ShareEntry[] }>(base, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({ email: targetEmail, role: targetRole }),
      });
      setShares(data.shares);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not share document');
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const target = email.trim();
    if (!target) {
      setError('Enter an email address');
      return;
    }
    if (await grant(target, role)) {
      setNotice(`Shared with ${target}`);
      setEmail('');
    }
  }

  async function revoke(entry: ShareEntry) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<void>(`${base}/${entry.userId}`, { method: 'DELETE' });
      setShares((prev) => prev.filter((s) => s.userId !== entry.userId));
      setNotice(`Removed access for ${entry.email}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove access');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="share-title">Share document</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <form className="share-form" onSubmit={onSubmit}>
          <input
            ref={emailRef}
            type="email"
            placeholder="Add people by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            aria-label="Email address"
            disabled={busy}
          />
          <select value={role} onChange={(e) => setRole(e.target.value as ShareRole)} aria-label="Access level" disabled={busy}>
            <option value="editor">Can edit</option>
            <option value="viewer">Can view</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            Share
          </button>
        </form>
        <p className="small muted">Demo users: alice@ajaia.test, bob@ajaia.test, carol@ajaia.test</p>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="form-notice" role="status">
            {notice}
          </p>
        )}

        <h3 className="share-subheading">People with access</h3>
        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <ul className="share-list">
            {owner && (
              <li className="share-row">
                <div>
                  <div>{owner.name}</div>
                  <div className="small muted">{owner.email}</div>
                </div>
                <span className="badge role-owner">Owner</span>
              </li>
            )}
            {shares.map((s) => (
              <li key={s.userId} className="share-row">
                <div>
                  <div>{s.name}</div>
                  <div className="small muted">{s.email}</div>
                </div>
                <div className="row-gap">
                  <select
                    value={s.role}
                    aria-label={`Access level for ${s.email}`}
                    disabled={busy}
                    onChange={(e) => void grant(s.email, e.target.value as ShareRole)}
                  >
                    <option value="editor">Can edit</option>
                    <option value="viewer">Can view</option>
                  </select>
                  <button className="btn btn-ghost btn-danger btn-sm" disabled={busy} onClick={() => void revoke(s)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {shares.length === 0 && <li className="muted small">Not shared with anyone yet.</li>}
          </ul>
        )}
      </div>
    </div>
  );
}
