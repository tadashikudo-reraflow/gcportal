import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "GCInsight Widget",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "transparent",
        padding: "0",
        margin: "0",
      }}
    >
      {children}
    </div>
  );
}
