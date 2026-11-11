'use client';

import type { Editor } from '@tiptap/react';
import type { ReactNode } from 'react';

type BlockType = 'p' | 'h1' | 'h2' | 'h3';

function ToolButton({
  label,
  shortcut,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  shortcut?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tool-btn${active ? ' is-active' : ''}`}
      title={shortcut ? `${label} (${shortcut})` : label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      // Keep the editor selection when clicking toolbar buttons.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }: { editor: Editor | null }) {
  if (!editor) return <div className="toolbar" aria-hidden />;

  const blockType: BlockType = editor.isActive('heading', { level: 1 })
    ? 'h1'
    : editor.isActive('heading', { level: 2 })
      ? 'h2'
      : editor.isActive('heading', { level: 3 })
        ? 'h3'
        : 'p';

  function setBlockType(value: BlockType) {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (value === 'p') chain.setParagraph().run();
    else chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
  }

  return (
    <div className="toolbar" role="toolbar" aria-label="Formatting">
      <ToolButton label="Undo" shortcut="Ctrl+Z" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        ↶
      </ToolButton>
      <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        ↷
      </ToolButton>

      <span className="tool-sep" aria-hidden />

      <select
        className="tool-select"
        aria-label="Text style"
        value={blockType}
        onChange={(e) => setBlockType(e.target.value as BlockType)}
      >
        <option value="p">Normal text</option>
        <option value="h1">Heading 1</option>
        <option value="h2">Heading 2</option>
        <option value="h3">Heading 3</option>
      </select>

      <span className="tool-sep" aria-hidden />

      <ToolButton label="Bold" shortcut="Ctrl+B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <strong>B</strong>
      </ToolButton>
      <ToolButton label="Italic" shortcut="Ctrl+I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <em>I</em>
      </ToolButton>
      <ToolButton label="Underline" shortcut="Ctrl+U" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <u>U</u>
      </ToolButton>
      <ToolButton label="Strikethrough" shortcut="Ctrl+Shift+S" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <s>S</s>
      </ToolButton>

      <span className="tool-sep" aria-hidden />

      <ToolButton label="Bulleted list" shortcut="Ctrl+Shift+8" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        •≡
      </ToolButton>
      <ToolButton label="Numbered list" shortcut="Ctrl+Shift+7" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        1≡
      </ToolButton>
      <ToolButton label="Quote" shortcut="Ctrl+Shift+B" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        ❝
      </ToolButton>
      <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        ⨯
      </ToolButton>
    </div>
  );
}
