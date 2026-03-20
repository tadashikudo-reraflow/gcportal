import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import DocumentsClient from "./DocumentsClient";

export default async function DocumentsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const expected = process.env.ADMIN_PASSWORD ?? "gcinsight2025";
  if (token !== expected) redirect("/admin/login?next=/admin/documents");

  return <DocumentsClient />;
}
