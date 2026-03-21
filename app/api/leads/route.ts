import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const ORGANIZATION_TYPES = [
  "municipality",
  "it_vendor",
  "consultant",
  "politician",
  "media",
  "other",
] as const;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * POST /api/leads — リード（メアド+所属）を保存
 *
 * Beehiiv API連携: BEEHIIV_API_KEY + BEEHIIV_PUBLICATION_ID が設定されていれば
 * 購読者を自動追加する。
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, organization_type, source } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    const orgType = ORGANIZATION_TYPES.includes(organization_type)
      ? organization_type
      : "other";

    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          email: email.toLowerCase().trim(),
          organization_type: orgType,
          source: source || "report",
        },
        { onConflict: "email" }
      )
      .select("id, email, organization_type")
      .single();

    if (error) {
      console.error("Supabase leads error:", error);
      return NextResponse.json(
        { error: "登録に失敗しました" },
        { status: 500 }
      );
    }

    // Beehiiv API連携（設定されていれば）
    const beehiivApiKey = process.env.BEEHIIV_API_KEY;
    const beehiivPubId = process.env.BEEHIIV_PUBLICATION_ID;

    if (beehiivApiKey && beehiivPubId) {
      try {
        await fetch(
          `https://api.beehiiv.com/v2/publications/${beehiivPubId}/subscriptions`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${beehiivApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email.toLowerCase().trim(),
              reactivate_existing: true,
              send_welcome_email: true,
              custom_fields: [
                { name: "organization_type", value: orgType },
              ],
            }),
          }
        );
      } catch (e) {
        // Beehiiv連携失敗してもリード保存は成功扱い
        console.error("Beehiiv API error:", e);
      }
    }

    return NextResponse.json({ success: true, lead: data });
  } catch {
    return NextResponse.json(
      { error: "リクエストの処理に失敗しました" },
      { status: 500 }
    );
  }
}
