"use client";

import { useEffect, useRef } from "react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "neutral",
  fontFamily: "system-ui, sans-serif",
  fontSize: 18,
  // ⚠️ securityLevel: "loose" 必須 — "strict" にすると innerHTML 挿入が制限され
  // L75 の `wrapper.innerHTML = svg` が機能せず Mermaid 図が描画されなくなる。
  securityLevel: "loose",
  flowchart: {
    padding: 20,
    nodeSpacing: 40,
    rankSpacing: 60,
    useMaxWidth: false,
  },
});

/**
 * 記事HTML内の <code class="language-mermaid"> ブロックを
 * Mermaid SVGに変換するクライアントコンポーネント。
 *
 * 使い方: 記事本文を包む要素の ref を渡す代わりに、
 * 記事HTML全体をこのコンポーネントで包む。
 */
export default function MermaidRenderer({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    // remark-html は ```mermaid を <pre><code class="language-mermaid">...</code></pre> に変換する
    const codeBlocks = ref.current.querySelectorAll(
      'code.language-mermaid'
    );

    // 「参考資料・出典」セクションを自動検出して class 付与
    const headings = ref.current.querySelectorAll("h2");
    headings.forEach((h2) => {
      const text = h2.textContent ?? "";
      if (text.includes("参考資料") || text.includes("出典")) {
        // h2 以降の兄弟要素を wrapper で包む
        const wrapper = document.createElement("div");
        wrapper.className = "sources-section";
        h2.parentNode?.insertBefore(wrapper, h2);
        wrapper.appendChild(h2);
        let next = wrapper.nextSibling;
        while (next) {
          const sibling = next;
          next = next.nextSibling;
          wrapper.appendChild(sibling);
        }
      }
    });

    codeBlocks.forEach(async (block, i) => {
      const pre = block.parentElement;
      if (!pre || pre.tagName !== "PRE") return;

      const code = block.textContent ?? "";
      if (!code.trim()) return;

      const id = `mermaid-${Date.now()}-${i}`;
      try {
        const { svg } = await mermaid.render(id, code.trim());
        const wrapper = document.createElement("div");
        wrapper.className = "mermaid-diagram";
        wrapper.innerHTML = svg;
        pre.replaceWith(wrapper);
      } catch {
        // レンダリング失敗時はコードブロックをそのまま残す
        pre.classList.add("mermaid-error");
      }
    });
  }, [html]);

  return (
    <div
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
