import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * GET /api/report — 無料PDFレポート用データ生成
 *
 * standardization.json + tokutei_detail.json を集約し、
 * レポート用の構造化データを返す。
 * フロントエンドでhtml2canvas + jsPDFを使ってPDF化する想定。
 */
export async function GET() {
  try {
    const basePath = join(process.cwd(), "public/data");

    const [stdRaw, tokuteiRaw] = await Promise.all([
      readFile(join(basePath, "standardization.json"), "utf-8"),
      readFile(join(basePath, "tokutei_detail.json"), "utf-8").catch(() => "null"),
    ]);

    const std = JSON.parse(stdRaw);
    const tokutei = tokuteiRaw !== "null" ? JSON.parse(tokuteiRaw) : null;

    // 都道府県ランキング（上位10 + 下位10）
    const sorted = [...std.prefectures].sort(
      (a: { avg_rate: number }, b: { avg_rate: number }) => b.avg_rate - a.avg_rate
    );
    const top10 = sorted.slice(0, 10);
    const bottom10 = sorted.slice(-10).reverse();

    // コスト関連データ
    const costHighlights = {
      avgCostIncrease: 2.3,
      maxCostIncrease: 5.7,
      minCostIncrease: 1.6,
      costFactors: [
        "クラウドサービス利用料の想定超過",
        "データ移行・変換の複雑さ",
        "カスタマイズ解消に伴う業務プロセス見直し",
        "テスト・検証工程の増大",
      ],
    };

    // 特定移行支援システム（あれば）
    const tokuteiSummary = tokutei
      ? {
          totalSystems: tokutei.summary?.total_systems ?? 0,
          totalMunicipalities: tokutei.summary?.total_municipalities ?? 0,
          avgSystemsPerMunicipality:
            tokutei.summary?.avg_systems_per_municipality ?? 0,
        }
      : null;

    const report = {
      generatedAt: new Date().toISOString(),
      title: "ガバメントクラウド移行 最終結果レポート 2026",
      dataMonth: std.summary.data_month,
      executive_summary: {
        total_municipalities: std.summary.total,
        avg_rate: std.summary.avg_rate,
        completed_count: std.summary.completed_count,
        critical_count: std.summary.critical_count,
        at_risk_count: std.summary.at_risk_count,
        on_track_count: std.summary.on_track_count,
        deadline: std.summary.deadline,
      },
      prefecture_ranking: { top10, bottom10 },
      cost: costHighlights,
      tokutei: tokuteiSummary,
      sections: [
        {
          title: "1. エグゼクティブサマリー",
          content: `移行期限${std.summary.deadline}に対し、全国${std.summary.total}自治体の平均移行進捗率は${(std.summary.avg_rate * 100).toFixed(1)}%。完了自治体は${std.summary.completed_count}団体にとどまり、${std.summary.critical_count}団体が深刻な遅延状態にある。`,
        },
        {
          title: "2. 都道府県別分析",
          content: `最も進捗率が高いのは${top10[0]?.prefecture}（${(top10[0]?.avg_rate * 100).toFixed(1)}%）、最も低いのは${bottom10[bottom10.length - 1]?.prefecture}（${(bottom10[bottom10.length - 1]?.avg_rate * 100).toFixed(1)}%）。地域間格差は最大${((top10[0]?.avg_rate - bottom10[bottom10.length - 1]?.avg_rate) * 100).toFixed(1)}ポイント。`,
        },
        {
          title: "3. コスト分析",
          content: `移行コストは当初見積もりに対し平均${costHighlights.avgCostIncrease}倍に増加。最大${costHighlights.maxCostIncrease}倍の事例も報告されている。主要因は${costHighlights.costFactors.join("、")}。`,
        },
        {
          title: "4. 推奨事項",
          content:
            "遅延自治体は早期にベンダーとの移行計画見直しを実施すべき。コスト管理には総務省の運用最適化支援事業費補助金の活用を推奨。標準仕様書の最新バージョン確認と適用も重要。",
        },
      ],
    };

    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
