import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// POST /api/webhooks/resend — Resendバウンス/苦情Webhook
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { type, data } = body as {
    type: string;
    data?: { to?: string[] };
  };

  if (type !== "email.bounced" && type !== "email.complained") {
    return NextResponse.json({ ok: true });
  }

  const emails: string[] = data?.to ?? [];
  if (emails.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const supabase = getSupabase();
  await supabase
    .from("leads")
    .update({
      unsubscribed: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .in("email", emails);

  return NextResponse.json({ ok: true });
}
