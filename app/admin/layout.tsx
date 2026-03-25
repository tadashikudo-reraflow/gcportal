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
      <main style={{ maxWidth: 720, margin: "0 auto", padding: "48px 16px" }}>
        {children}
      </main>
    </div>
  );
}
