"use client";

import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useCallback } from "react";

// ツールバーボタン
function ToolbarButton({
  onClick, active, title, children,
}: {
  onClick: () => void; active?: boolean; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className="px-2 py-1.5 rounded text-sm transition-colors hover:bg-gray-100"
      style={{
        color: active ? "var(--color-brand-secondary)" : "var(--color-text-secondary)",
        backgroundColor: active ? "#e8eef8" : "transparent",
        fontWeight: active ? "700" : "normal",
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-gray-200 mx-1 flex-shrink-0" />;
}

function Toolbar({ editor }: { editor: Editor }) {
  const addLink = useCallback(() => {
    const url = window.prompt("リンクURLを入力:");
    if (url) editor.chain().focus().setLink({ href: url, target: "_blank" }).run();
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("画像URLを入力:");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  return (
    <div className="flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-xl">
      {/* 文字スタイル */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="太字 (Ctrl+B)">
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="斜体 (Ctrl+I)">
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="下線 (Ctrl+U)">
        <span style={{ textDecoration: "underline" }}>U</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="取り消し線">
        <span style={{ textDecoration: "line-through" }}>S</span>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="インラインコード">
        <code className="font-mono text-xs">｀｀</code>
      </ToolbarButton>

      <Divider />

      {/* 見出し */}
      {([2, 3, 4] as const).map((level) => (
        <ToolbarButton key={level}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
          active={editor.isActive("heading", { level })}
          title={`見出し${level}`}>
          H{level}
        </ToolbarButton>
      ))}

      <Divider />

      {/* 配置 */}
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="左揃え">≡</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="中央揃え">☰</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="右揃え">≡</ToolbarButton>

      <Divider />

      {/* リスト */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="箇条書きリスト">
        ≔
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="番号付きリスト">
        1.
      </ToolbarButton>

      <Divider />

      {/* ブロック */}
      <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="引用">
        "
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="コードブロック">
        <code className="font-mono text-xs">&lt;/&gt;</code>
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="水平線">
        —
      </ToolbarButton>

      <Divider />

      {/* リンク・画像 */}
      <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="リンク挿入">
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().unsetLink().run()} active={false} title="リンク解除">
        🔗̶
      </ToolbarButton>
      <ToolbarButton onClick={addImage} active={false} title="画像挿入">
        🖼
      </ToolbarButton>

      <Divider />

      {/* 元に戻す */}
      <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="元に戻す (Ctrl+Z)">↩</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="やり直し (Ctrl+Y)">↪</ToolbarButton>
    </div>
  );
}

type Props = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export default function RichEditor({ content, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Link.configure({ openOnClick: false, HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" } }),
      Image.configure({ HTMLAttributes: { class: "max-w-full rounded-lg" } }),
      Placeholder.configure({ placeholder: placeholder ?? "本文を入力してください..." }),
      CharacterCount,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose-article outline-none min-h-[60vh] px-5 py-4",
      },
    },
    immediatelyRender: false,
  });

  // 外部からcontentが変わった時（初期ロード）
  useEffect(() => {
    if (editor && content && editor.getHTML() !== content) {
      editor.commands.setContent(content, false as unknown as import("@tiptap/core").SetContentOptions);
    }
  }, [editor, content]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters?.() ?? 0;
  const wordCount = Math.ceil(charCount / 500); // 読了時間（分）

  return (
    <div className="bg-white rounded-xl overflow-hidden" style={{ border: "2px solid var(--color-border)" }}>
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between px-5 py-2 border-t border-gray-100 bg-gray-50">
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          {charCount.toLocaleString()} 文字
        </span>
        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          読了時間 約 {wordCount} 分
        </span>
      </div>
    </div>
  );
}
