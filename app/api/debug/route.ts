import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const adminKey = process.env.GCINSIGHT_ADMIN_KEY;
  if (!adminKey || auth !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    service_role_key: process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 30) + "...",
    service_role_key_full: process.env.SUPABASE_SERVICE_ROLE_KEY,
    anon_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 30) + "...",
    timestamp: new Date().toISOString()
  });
}
