import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET /api/track/click?url=https://example.com&cid=1&lid=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  const cid = parseInt(searchParams.get("cid") ?? "", 10);
  const lid = parseInt(searchParams.get("lid") ?? "", 10);

  if (!url) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  if (!isNaN(cid) && !isNaN(lid)) {
    const supabase = getSupabase();
    await supabase.from("email_events").insert({
      campaign_id: cid,
      lead_id: lid,
      event_type: "click",
      url,
    });
  }

  return NextResponse.redirect(url, 302);
}
