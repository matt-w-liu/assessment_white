'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { ArrowLeft, Check, CircleAlert, Eye, Loader2, UserPlus } from 'lucide-react';
import { ROLE_LABELS, type Role } from '@/lib/access';
import { apiRequest, jsonHeaders } from '@/lib/client';
import { MAX_TITLE_LENGTH } from '@/lib/limits';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import LocalTime from './LocalTime';
import ShareDialog from './ShareDialog';
import Toolbar from './Toolbar';
import UserAvatar from './UserAvatar';

type SaveStatus = 'saved' | 'unsaved' | 'saving' | 'error';
type Pending = { title?: string; content?: string };

interface Props {
  document: {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
    owner: { name: string; email: string };
  };
  role: Role;
}

const AUTOSAVE_DELAY_MS = 800;

const hasPending = (p: Pending) => p.title !== undefined || p.content !== undefined;

export default function DocumentEditor({ document: doc, role }: Props) {
  const canEdit = role !== 'viewer';

  const [title, setTitle] = useState(doc.title);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(doc.updatedAt);
  const [shareOpen, setShareOpen] = useState(false);

  const savedTitle = useRef(doc.title);
  const pending = useRef<Pending>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef<Promise<void> | null>(null);
  const statusRef = useRef<SaveStatus>('saved');

  const updateStatus = useCallback((next: SaveStatus) => {
    statusRef.current = next;
    setStatus(next);
  }, []);

  /** Sends all pending changes. Serialised: never more than one PATCH in flight. */
  const flush = useCallback(async (): Promise<void> => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (inFlight.current) await inFlight.current;
    if (!hasPending(pending.current)) return;

    const payload = pending.current;
    pending.current = {};

    const run = (async () => {
      updateStatus('saving');
      try {
        const res = await apiRequest<{ document: { title: string; updatedAt: string } }>(
          `/api/documents/${doc.id}`,
          { method: 'PATCH', headers: jsonHeaders, body: JSON.stringify(payload) },
        );
        if (payload.title !== undefined) savedTitle.current = res.document.title;
        setUpdatedAt(res.document.updatedAt);
        setSaveError(null);
        updateStatus(hasPending(pending.current) ? 'unsaved' : 'saved');
      } catch (err) {
        // Keep the failed changes queued (newer edits win) so "Retry" or the next edit resends them.
        pending.current = { ...payload, ...pending.current };
        setSaveError(err instanceof Error ? err.message : 'Save failed');
        updateStatus('error');
      }
    })();

    inFlight.current = run;
    await run;
    inFlight.current = null;
  }, [doc.id, updateStatus]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  const scheduleSave = useCallback(() => {
    updateStatus('unsaved');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flushRef.current(), AUTOSAVE_DELAY_MS);
  }, [updateStatus]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Placeholder.configure({ placeholder: canEdit ? 'Start writing…' : 'This document is empty.' }),
    ],
    content: doc.content,
    editable: canEdit,
    immediatelyRender: false,
    editorProps: {
      attributes: { class: 'doc-content', 'aria-label': 'Document body' },
    },
    onUpdate: ({ editor: e }) => {
      pending.current.content = e.getHTML();
      scheduleSave();
    },
  });

  // Warn before leaving with unsaved changes; flush on in-app navigation (unmount).
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (statusRef.current !== 'saved') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      void flushRef.current();
    };
  }, []);

  // Ctrl/Cmd+S saves immediately instead of opening the browser's "save page" dialog.
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void flushRef.current();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    window.document.title = `${title.trim() || 'Untitled document'} – Ajaia Docs`;
  }, [title]);

  function onTitleChange(value: string) {
    setTitle(value);
    const trimmed = value.trim();
    if (!trimmed) {
      setTitleError('Title cannot be empty');
      delete pending.current.title;
      return;
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
      setTitleError(`Title must be ${MAX_TITLE_LENGTH} characters or fewer`);
      delete pending.current.title;
      return;
    }
    setTitleError(null);
    pending.current.title = trimmed;
    scheduleSave();
  }

  function onTitleBlur() {
    if (!title.trim() || titleError) {
      // Revert invalid titles to the last saved one.
      setTitle(savedTitle.current);
      setTitleError(null);
    } else {
      setTitle(title.trim());
    }
  }

  function onTitleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      editor?.commands.focus('start');
    }
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex h-14 max-w-[1080px] items-center gap-3 px-4 sm:px-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="shrink-0">
                <Link href="/" aria-label="Back to documents">
                  <ArrowLeft />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>All documents</TooltipContent>
          </Tooltip>

          <div className="min-w-0 flex-1">
            <input
              className={cn(
                '-ml-1.5 w-full truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 font-serif text-lg font-semibold leading-tight outline-none transition-colors',
                canEdit && 'hover:border-border focus:border-ring focus:bg-card',
                titleError && 'border-destructive focus:border-destructive',
                !canEdit && 'cursor-default',
              )}
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onBlur={onTitleBlur}
              onKeyDown={onTitleKeyDown}
              readOnly={!canEdit}
              aria-label="Document title"
              aria-invalid={Boolean(titleError)}
            />
            <div className="flex min-h-[18px] items-center gap-2 overflow-hidden whitespace-nowrap text-xs text-muted-foreground">
              {titleError ? (
                <span className="text-destructive">{titleError}</span>
              ) : canEdit ? (
                <SaveIndicator status={status} error={saveError} updatedAt={updatedAt} onRetry={() => void flush()} />
              ) : (
                <span>
                  Edited <LocalTime iso={updatedAt} />
                </span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {role !== 'owner' && (
              <span className="hidden items-center gap-2 text-xs text-muted-foreground md:inline-flex">
                <UserAvatar name={doc.owner.name} email={doc.owner.email} className="h-6 w-6 [&>span]:text-[10px]" />
                {doc.owner.name}&apos;s document
              </span>
            )}
            <Badge variant={role} className={role === 'owner' ? 'hidden sm:inline-flex' : undefined}>
              {ROLE_LABELS[role]}
            </Badge>
            {role === 'owner' && (
              <Button size="sm" onClick={() => setShareOpen(true)}>
                <UserPlus /> Share
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[880px] px-3 pb-24 pt-4 sm:px-5">
        {canEdit ? (
          <Toolbar editor={editor} />
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-amber-300/60 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
            <Eye className="h-4 w-4 shrink-0" />
            You can read this document but not change it. Ask {doc.owner.name} if you need edit access.
          </div>
        )}

        <main className="mt-4 rounded-sm border bg-paper px-6 py-10 shadow-page sm:px-16 sm:py-16 md:min-h-[1056px] md:px-[72px]">
          {editor ? (
            <EditorContent editor={editor} />
          ) : (
            <div className="space-y-3" aria-label="Loading editor">
              <div className="h-8 w-2/3 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
            </div>
          )}
        </main>
      </div>

      <ShareDialog documentId={doc.id} open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}

function SaveIndicator({
  status,
  error,
  updatedAt,
  onRetry,
}: {
  status: SaveStatus;
  error: string | null;
  updatedAt: string;
  onRetry: () => void;
}) {
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === 'unsaved') {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved changes
      </span>
    );
  }
  if (status === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-destructive" role="alert">
        <CircleAlert className="h-3 w-3" /> Couldn&apos;t save: {error}
        <button className="font-medium underline underline-offset-2" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check className="h-3 w-3 text-brand" /> Saved · <LocalTime iso={updatedAt} />
    </span>
  );
}
