import type { Metadata } from "next";
import TopNav from "./TopNav";

export const metadata: Metadata = {
  title: "GCInsight Admin",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <TopNav />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "clamp(16px, 4vw, 32px) clamp(12px, 3vw, 24px)" }}>
        {children}
      </main>
    </div>
  );
}
