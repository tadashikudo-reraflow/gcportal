import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 1x1 透明GIF (最小バイナリ)
const TRANSPARENT_GIF = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
);

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// GET /api/track/open?cid=1&lid=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cid = parseInt(searchParams.get("cid") ?? "", 10);
  const lid = parseInt(searchParams.get("lid") ?? "", 10);

  if (!isNaN(cid) && !isNaN(lid)) {
    const supabase = getSupabase();
    // 同一リードの重複記録を避けるため、先にチェック
    const { data: existing } = await supabase
      .from("email_events")
      .select("id")
      .eq("campaign_id", cid)
      .eq("lead_id", lid)
      .eq("event_type", "open")
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from("email_events").insert({
        campaign_id: cid,
        lead_id: lid,
        event_type: "open",
      });
    }
  }

  return new NextResponse(TRANSPARENT_GIF, {
    status: 200,
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Pragma: "no-cache",
    },
  });
}
