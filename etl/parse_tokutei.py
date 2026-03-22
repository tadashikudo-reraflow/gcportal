#!/usr/bin/env python3
"""Parse digital_tokutei_202512.xlsx (デジタル庁 特定移行支援システム該当見込み).

Input Excel structure (sheet '結果一覧'):
  Row 1: Title row (merged)
  Row 2: Empty
  Row 3: Header - 団体コード, 自治体名, 自治体区分, 業務1..業務20, 共通機能
  Row 4+: Data - code, name, type, then '●' marks for applicable systems

Output: public/data/tokutei_detail.json
  Enriched version of existing tokutei_municipalities.json with per-business breakdown.
"""
from __future__ import annotations

import json
from pathlib import Path

EXCEL_FILE = Path(__file__).parent / "data/gov_downloads/digital_tokutei_202512.xlsx"
OUT_DIR = Path(__file__).parent.parent / "public/data"

# 20 standard businesses + shared function, matching the Excel column order
BUSINESSES = [
    "住民基本台帳", "印鑑登録", "戸籍", "戸籍の附票", "選挙人名簿管理",
    "個人住民税", "法人住民税", "固定資産税", "軽自動車税", "就学",
    "国民年金", "国民健康保険", "後期高齢者医療", "介護保険", "障害者福祉",
    "生活保護", "健康管理", "児童手当", "児童扶養手当", "子ども・子育て支援",
    "共通機能",
]

# Prefecture extraction from municipality name
PREFECTURES = [
    "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
    "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
    "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
    "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
    "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
    "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
    "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
]

# Prefecture code prefix mapping (first 2 digits of 団体コード)
PREF_CODE_MAP = {f"{i+1:02d}": p for i, p in enumerate(PREFECTURES)}


def _extract_prefecture(code: str, name: str) -> str:
    """Extract prefecture from code or municipality name."""
    if code and len(code) >= 2:
        prefix = code[:2]
        if prefix in PREF_CODE_MAP:
            return PREF_CODE_MAP[prefix]

    for pref in PREFECTURES:
        if name.startswith(pref):
            city = name[len(pref):]
            return pref

    return ""


def _extract_city(name: str) -> str:
    """Extract city name by removing prefecture prefix."""
    for pref in PREFECTURES:
        if name.startswith(pref):
            return name[len(pref):]
    return name


def run():
    import openpyxl

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
    ws = wb["結果一覧"]
    rows = list(ws.iter_rows(values_only=True))
    wb.close()

    # Row 3 (index 2) is the header
    header = rows[2]

    # Parse header to confirm business column mapping
    # col0=団体コード, col1=自治体名, col2=自治体区分, col3-23=businesses
    print(f"Header columns: {len(header)}")
    print(f"Business columns from header: {[str(h).strip() if h else '' for h in header[3:]]}")

    municipalities = []
    pref_stats = {}
    biz_stats = {biz: {"total": 0, "count": 0} for biz in BUSINESSES}

    for row in rows[3:]:
        if not row[0] or not row[1]:
            continue

        code = str(row[0]).strip()
        name = str(row[1]).strip()
        category = str(row[2]).strip() if row[2] else ""
        prefecture = _extract_prefecture(code, name)
        city = _extract_city(name)

        # Parse business marks
        applicable_businesses = []
        business_detail = {}
        for j, biz in enumerate(BUSINESSES):
            col_idx = 3 + j
            mark = row[col_idx] if col_idx < len(row) else None
            is_applicable = mark is not None and str(mark).strip() == "●"
            business_detail[biz] = is_applicable
            if is_applicable:
                applicable_businesses.append(biz)
                biz_stats[biz]["count"] += 1
            biz_stats[biz]["total"] += 1

        municipalities.append({
            "code": code,
            "prefecture": prefecture,
            "city": city,
            "name": name,
            "category": category,
            "applicable_count": len(applicable_businesses),
            "applicable_businesses": applicable_businesses,
            "business_detail": business_detail,
        })

        # Prefecture aggregation
        if prefecture not in pref_stats:
            pref_stats[prefecture] = {
                "municipality_count": 0,
                "total_applicable": 0,
                "municipalities": [],
            }
        pref_stats[prefecture]["municipality_count"] += 1
        pref_stats[prefecture]["total_applicable"] += len(applicable_businesses)
        pref_stats[prefecture]["municipalities"].append(city)

    # Build business summary
    business_summary = []
    for biz in BUSINESSES:
        s = biz_stats[biz]
        rate = round(s["count"] / s["total"], 4) if s["total"] > 0 else 0.0
        business_summary.append({
            "business": biz,
            "applicable_count": s["count"],
            "total_municipalities": s["total"],
            "applicable_rate": rate,
        })

    # Build prefecture summary
    prefecture_summary = []
    for pref in PREFECTURES:
        if pref in pref_stats:
            ps = pref_stats[pref]
            prefecture_summary.append({
                "prefecture": pref,
                "municipality_count": ps["municipality_count"],
                "total_applicable_systems": ps["total_applicable"],
                "avg_applicable": round(
                    ps["total_applicable"] / ps["municipality_count"], 2
                ) if ps["municipality_count"] > 0 else 0,
            })

    # Total system count
    total_systems = sum(m["applicable_count"] for m in municipalities)

    # Delay reason analysis: municipalities with many applicable businesses
    high_risk = sorted(
        [m for m in municipalities if m["applicable_count"] >= 10],
        key=lambda m: m["applicable_count"],
        reverse=True,
    )

    out = {
        "updated_at": "2026-03-21",
        "source": "デジタル庁 特定移行支援システムの該当見込み一覧（令和7年12月末時点）",
        "source_url": "https://www.digital.go.jp/policies/local_governments",
        "summary": {
            "total_municipalities": len(municipalities),
            "total_applicable_systems": total_systems,
            "avg_applicable_per_municipality": round(
                total_systems / len(municipalities), 2
            ) if municipalities else 0,
            "high_risk_count": len(high_risk),
        },
        "business_summary": business_summary,
        "prefecture_summary": prefecture_summary,
        "high_risk_municipalities": [{
            "code": m["code"],
            "prefecture": m["prefecture"],
            "city": m["city"],
            "category": m["category"],
            "applicable_count": m["applicable_count"],
            "applicable_businesses": m["applicable_businesses"],
        } for m in high_risk[:50]],
        "municipalities": [{
            "code": m["code"],
            "prefecture": m["prefecture"],
            "city": m["city"],
            "name": m["name"],
            "category": m["category"],
            "applicable_count": m["applicable_count"],
            "applicable_businesses": m["applicable_businesses"],
        } for m in municipalities],
    }

    out_path = OUT_DIR / "tokutei_detail.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print(
        f"Done: {len(municipalities)} municipalities, "
        f"{total_systems} applicable systems, "
        f"{len(high_risk)} high-risk (>=10 systems)"
    )
    print(f"Output: {out_path}")

    # --- Generate tokutei_municipalities.json (市区町村のみ) ---
    muni_only = [m for m in municipalities if m["category"] != "都道府県"]
    muni_list = []
    for m in muni_only:
        muni_list.append({
            "prefecture": m["prefecture"],
            "city": m["city"],
        })
    # Sort by prefecture order then city name
    pref_idx = {p: i for i, p in enumerate(PREFECTURES)}
    muni_list.sort(key=lambda m: (pref_idx.get(m["prefecture"], 99), m["city"]))

    muni_out = {
        "updated_at": out["updated_at"],
        "source": out["source"],
        "source_url": out["source_url"],
        "total_count": len(municipalities),  # 都道府県含む公式総数
        "municipality_count": len(muni_list),  # 市区町村のみ
        "system_count": total_systems,
        "municipalities": muni_list,
    }

    muni_path = OUT_DIR / "tokutei_municipalities.json"
    with open(muni_path, "w", encoding="utf-8") as f:
        json.dump(muni_out, f, ensure_ascii=False, indent=2)

    print(
        f"Municipalities JSON: {len(muni_list)} entries "
        f"(total_count={len(municipalities)}, municipality_count={len(muni_list)})"
    )
    print(f"Output: {muni_path}")


if __name__ == "__main__":
    run()
