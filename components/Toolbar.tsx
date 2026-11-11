'use client';

import type { Editor } from '@tiptap/react';
import type { ReactNode } from 'react';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  RemoveFormatting,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Toggle
          size="sm"
          pressed={active}
          disabled={disabled}
          aria-label={label}
          // Keep the editor selection when clicking toolbar buttons.
          onMouseDown={(e) => e.preventDefault()}
          onPressedChange={onClick}
        >
          {children}
        </Toggle>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 font-mono text-[10px] opacity-60">{shortcut}</span>}
      </TooltipContent>
    </Tooltip>
  );
}

const Divider = () => <Separator orientation="vertical" className="mx-1 h-5" />;

export default function Toolbar({ editor }: { editor: Editor | null }) {
  const shell =
    'sticky top-14 z-20 flex min-h-11 flex-wrap items-center gap-0.5 rounded-lg border bg-card/95 px-2 py-1 shadow-sm backdrop-blur';
  if (!editor) return <div className={shell} aria-hidden />;

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
    <div className={shell} role="toolbar" aria-label="Formatting">
      <ToolButton label="Undo" shortcut="Ctrl+Z" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}>
        <Undo2 />
      </ToolButton>
      <ToolButton label="Redo" shortcut="Ctrl+Shift+Z" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}>
        <Redo2 />
      </ToolButton>

      <Divider />

      <Select value={blockType} onValueChange={(v) => setBlockType(v as BlockType)}>
        <SelectTrigger className="h-8 w-[130px] border-transparent bg-transparent shadow-none hover:bg-accent" aria-label="Text style">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="p">Normal text</SelectItem>
          <SelectItem value="h1">
            <span className="font-serif text-lg font-semibold">Heading 1</span>
          </SelectItem>
          <SelectItem value="h2">
            <span className="font-serif text-base font-semibold">Heading 2</span>
          </SelectItem>
          <SelectItem value="h3">
            <span className="text-xs font-semibold uppercase tracking-wide">Heading 3</span>
          </SelectItem>
        </SelectContent>
      </Select>

      <Divider />

      <ToolButton label="Bold" shortcut="Ctrl+B" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold />
      </ToolButton>
      <ToolButton label="Italic" shortcut="Ctrl+I" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic />
      </ToolButton>
      <ToolButton label="Underline" shortcut="Ctrl+U" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline />
      </ToolButton>
      <ToolButton label="Strikethrough" shortcut="Ctrl+Shift+S" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough />
      </ToolButton>

      <Divider />

      <ToolButton label="Bulleted list" shortcut="Ctrl+Shift+8" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List />
      </ToolButton>
      <ToolButton label="Numbered list" shortcut="Ctrl+Shift+7" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered />
      </ToolButton>
      <ToolButton label="Quote" shortcut="Ctrl+Shift+B" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote />
      </ToolButton>

      <Divider />

      <ToolButton label="Clear formatting" onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
        <RemoveFormatting />
      </ToolButton>
    </div>
  );
}
