import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createMemberToken, MEMBER_COOKIE } from "@/lib/member-auth";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({}));
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from("leads")
    .select("id")
    .eq("email", normalized)
    .or("unsubscribed.is.null,unsubscribed.eq.false")  // NULL も有効（未設定 = 購読中）
    .maybeSingle();

  if (error) {
    console.error("[members/login]", error);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const token = await createMemberToken(normalized);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30日
    path: "/",
  });
  return res;
}
