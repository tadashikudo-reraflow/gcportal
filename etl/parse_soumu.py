#!/usr/bin/env python3
from __future__ import annotations
import json, statistics
from pathlib import Path

EXCEL_FILE = Path(__file__).parent / "shikucho_progress.xlsx"
OUT_DIR = Path(__file__).parent.parent / "public/data"

BUSINESSES = [
    "住民記録","選挙人名簿管理","固定資産税","個人住民税","法人住民税",
    "軽自動車税","就学","国民年金","国民健康保険","後期高齢者医療",
    "介護保険","障害者福祉","生活保護","健康管理","児童手当",
    "児童扶養手当","子ども・子育て支援","戸籍","戸籍附票","印鑑登録"
]

def _pct(v):
    if v is None: return None
    try: return round(float(v), 4)
    except: return None

def run():
    import openpyxl
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    wb = openpyxl.load_workbook(EXCEL_FILE, read_only=True, data_only=True)
    ws = wb["令和8年1月_進捗状況"]
    rows = list(ws.iter_rows(min_row=3, values_only=True))

    municipalities = []
    for row in rows:
        if not row[0] or not row[1]: continue
        municipalities.append({
            "prefecture": str(row[0]).strip(),
            "city": str(row[1]).strip(),
            "overall_rate": _pct(row[2]),
            "business_rates": {biz: _pct(row[3+i]) if (3+i)<len(row) else None
                               for i,biz in enumerate(BUSINESSES)},
        })

    rates = [m["overall_rate"] for m in municipalities if m["overall_rate"] is not None]
    completed = sum(1 for r in rates if r >= 1.0)
    critical  = sum(1 for r in rates if r < 0.5)
    at_risk   = sum(1 for r in rates if 0.5 <= r < 0.8)

    pref_map: dict[str,list[float]] = {}
    for m in municipalities:
        if m["overall_rate"] is None: continue
        pref_map.setdefault(m["prefecture"],[]).append(m["overall_rate"])

    biz_summary = []
    for biz in BUSINESSES:
        vals = [m["business_rates"].get(biz) for m in municipalities if m["business_rates"].get(biz) is not None]
        if not vals: continue
        biz_summary.append({"business":biz,"avg_rate":round(statistics.mean(vals),4),
            "completed":sum(1 for v in vals if v>=1.0),"critical":sum(1 for v in vals if v<0.5)})

    out = {
        "summary": {"data_month":"2026-01","deadline":"2026-03-31","total":len(municipalities),
            "avg_rate":round(statistics.mean(rates),4),"median_rate":round(statistics.median(rates),4),
            "completed_count":completed,"critical_count":critical,"at_risk_count":at_risk,
            "on_track_count":len(rates)-completed-critical-at_risk},
        "prefectures": [{"prefecture":p,"avg_rate":round(statistics.mean(v),4),"count":len(v),
            "completed":sum(1 for x in v if x>=1.0),"critical":sum(1 for x in v if x<0.5)}
            for p,v in sorted(pref_map.items())],
        "businesses": biz_summary,
        "risk_municipalities": sorted([m for m in municipalities if m["overall_rate"] is not None and m["overall_rate"]<1.0],
            key=lambda m:m["overall_rate"])[:100],
        "municipalities": municipalities,
    }
    with open(OUT_DIR/"standardization.json","w",encoding="utf-8") as f:
        json.dump(out,f,ensure_ascii=False,indent=2)
    print(f"✅ {len(municipalities)}自治体 / 平均{statistics.mean(rates):.1%} / 危機:{critical}")

if __name__=="__main__": run()
