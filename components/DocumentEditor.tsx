'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { ROLE_LABELS, type Role } from '@/lib/access';
import { apiRequest, jsonHeaders } from '@/lib/client';
import { MAX_TITLE_LENGTH } from '@/lib/limits';
import LocalTime from './LocalTime';
import ShareDialog from './ShareDialog';
import Toolbar from './Toolbar';

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
    <div className="editor-shell">
      <header className="editor-header">
        <Link href="/" className="back-link" title="Back to documents">
          ← Docs
        </Link>

        <div className="title-area">
          <input
            className={`title-input${titleError ? ' is-invalid' : ''}`}
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleBlur}
            onKeyDown={onTitleKeyDown}
            readOnly={!canEdit}
            aria-label="Document title"
            aria-invalid={Boolean(titleError)}
          />
          <div className="doc-meta-row">
            <span className={`badge role-${role}`}>{ROLE_LABELS[role]}</span>
            {role !== 'owner' && <span className="muted small">Owned by {doc.owner.name}</span>}
            {canEdit && (
              <SaveIndicator status={status} error={saveError} updatedAt={updatedAt} onRetry={() => void flush()} />
            )}
            {titleError && <span className="form-error small">{titleError}</span>}
          </div>
        </div>

        {role === 'owner' && (
          <button className="btn btn-primary" onClick={() => setShareOpen(true)}>
            Share
          </button>
        )}
      </header>

      {canEdit ? (
        <Toolbar editor={editor} />
      ) : (
        <div className="readonly-banner">You have view-only access. Ask {doc.owner.name} for edit access.</div>
      )}

      <main className="page-area">
        <div className="page">
          {editor ? <EditorContent editor={editor} /> : <div className="editor-loading">Loading editor…</div>}
        </div>
      </main>

      {shareOpen && <ShareDialog documentId={doc.id} onClose={() => setShareOpen(false)} />}
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
  if (status === 'saving') return <span className="save-status muted small">Saving…</span>;
  if (status === 'unsaved') return <span className="save-status muted small">Unsaved changes</span>;
  if (status === 'error') {
    return (
      <span className="save-status form-error small" role="alert">
        Couldn&apos;t save: {error}{' '}
        <button className="link-btn" onClick={onRetry}>
          Retry
        </button>
      </span>
    );
  }
  return (
    <span className="save-status muted small">
      All changes saved · <LocalTime iso={updatedAt} />
    </span>
  );
}
