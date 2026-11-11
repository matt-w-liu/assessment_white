'use client';

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { apiRequest, jsonHeaders } from '@/lib/client';
import { DEMO_USERS } from '@/lib/demo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import UserAvatar from './UserAvatar';

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

interface Props {
  documentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareDialog({ documentId, open, onOpenChange }: Props) {
  const [owner, setOwner] = useState<Owner | null>(null);
  const [shares, setShares] = useState<ShareEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<ShareRole>('editor');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = `/api/documents/${documentId}/shares`;

  const load = useCallback(async () => {
    setLoading(true);
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
    if (open) {
      setError(null);
      void load();
    }
  }, [open, load]);

  async function grant(targetEmail: string, targetRole: ShareRole) {
    setBusy(true);
    setError(null);
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
      toast.success(`Shared with ${target}`);
      setEmail('');
    }
  }

  async function revoke(entry: ShareEntry) {
    setBusy(true);
    setError(null);
    try {
      await apiRequest<void>(`${base}/${entry.userId}`, { method: 'DELETE' });
      setShares((prev) => prev.filter((s) => s.userId !== entry.userId));
      toast(`Removed ${entry.name}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove access');
    } finally {
      setBusy(false);
    }
  }

  // Demo users who don't have access yet, offered as one-click suggestions.
  const taken = new Set([owner?.email, ...shares.map((s) => s.email)]);
  const suggestions = loading ? [] : DEMO_USERS.filter((u) => !taken.has(u.email));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] gap-0 p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Share document</DialogTitle>
          <DialogDescription>People you add can find it under &ldquo;Shared with me&rdquo;.</DialogDescription>
        </DialogHeader>

        <div className="px-6">
          <form className="flex flex-col gap-2 sm:flex-row" onSubmit={onSubmit}>
            <Input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              disabled={busy}
              className="flex-1"
            />
            <div className="flex gap-2">
              <Select value={role} onValueChange={(v) => setRole(v as ShareRole)} disabled={busy}>
                <SelectTrigger className="w-[112px]" aria-label="Access level">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="editor">Can edit</SelectItem>
                  <SelectItem value="viewer">Can view</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" disabled={busy || !email.trim()}>
                {busy && <Loader2 className="animate-spin" />}
                Invite
              </Button>
            </div>
          </form>

          {suggestions.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              <span>Suggestions:</span>
              {suggestions.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => setEmail(u.email)}
                  className="rounded-full border bg-card px-2 py-0.5 text-foreground transition-colors hover:border-ring hover:bg-brand-soft"
                >
                  {u.name}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <Separator className="mt-5" />

        <div className="p-6 pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">People with access</h3>
          {loading ? (
            <div className="space-y-3 py-1">
              {[0, 1].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
                  <div className="h-3 w-40 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="-mx-2 max-h-[280px] overflow-auto">
              {owner && (
                <PersonRow name={owner.name} email={owner.email}>
                  <Badge variant="owner">Owner</Badge>
                </PersonRow>
              )}
              {shares.map((s) => (
                <PersonRow key={s.userId} name={s.name} email={s.email}>
                  <Select value={s.role} onValueChange={(v) => void grant(s.email, v as ShareRole)} disabled={busy}>
                    <SelectTrigger
                      className="h-8 w-[104px] border-transparent bg-transparent text-xs shadow-none hover:bg-accent"
                      aria-label={`Access level for ${s.email}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Can edit</SelectItem>
                      <SelectItem value="viewer">Can view</SelectItem>
                    </SelectContent>
                  </Select>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={busy}
                        onClick={() => void revoke(s)}
                        aria-label={`Remove ${s.email}`}
                      >
                        <X />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Remove access</TooltipContent>
                  </Tooltip>
                </PersonRow>
              ))}
              {shares.length === 0 && (
                <li className="px-2 py-3 text-sm text-muted-foreground">Only you can see this right now.</li>
              )}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PersonRow({ name, email, children }: { name: string; email: string; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent/40">
      <UserAvatar name={name} email={email} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{name}</div>
        <div className="truncate text-xs text-muted-foreground">{email}</div>
      </div>
      <div className="flex items-center gap-1">{children}</div>
    </li>
  );
}
