"use client";

/** サーバーコンポーネント内でも使える PDF モーダル起動ボタン。
 *  className / style でスタイルを上書き可能。
 */
export default function PdfCTAButton({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("openPdfModal"))}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
