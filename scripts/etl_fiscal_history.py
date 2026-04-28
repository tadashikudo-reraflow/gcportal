#!/usr/bin/env python3
"""
自治体 財政指標 時系列ETL (R2〜R6 5年分)
municipality_fiscal_history テーブルに INSERT ... ON CONFLICT DO UPDATE

データソース: 総務省 地方公共団体の主要財政指標一覧
  /tmp/muni_finance/fiscal_R02.xlsx (令和2年度)
  /tmp/muni_finance/fiscal_R03.xlsx (令和3年度)
  /tmp/muni_finance/fiscal_R04.xlsx (令和4年度)
  /tmp/muni_finance/fiscal_index.xlsx (令和5年度)
  /tmp/muni_finance/fiscal_R06.xlsx (令和6年度)

実行方法:
  # 通常 (service_role key が使える場合)
  SUPABASE_SERVICE_ROLE_KEY=$(pbpaste) python3 scripts/etl_fiscal_history.py

  # service_role 401 の場合 → SQL生成モード
  python3 scripts/etl_fiscal_history.py --gen-sql
  # → /tmp/fiscal_history_batches/ に JS バッチファイルを出力
  # → Chrome MCP で実行
"""

import sys, os, json, openpyxl, urllib.request

DRY_RUN = "--dry-run" in sys.argv
GEN_SQL = "--gen-sql" in sys.argv

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "https://msbwmfggvtyexvhmlifn.supabase.co")
ANON_KEY     = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
SERVICE_KEY  = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

PROJECT_REF  = "msbwmfggvtyexvhmlifn"

YEAR_FILES = {
    2020: "/tmp/muni_finance/fiscal_R02.xlsx",
    2021: "/tmp/muni_finance/fiscal_R03.xlsx",
    2022: "/tmp/muni_finance/fiscal_R04.xlsx",
    2023: "/tmp/muni_finance/fiscal_index.xlsx",
    2024: "/tmp/muni_finance/fiscal_R06.xlsx",
}

PREF_CODE_MAP = {
    "01":"北海道","02":"青森県","03":"岩手県","04":"宮城県","05":"秋田県",
    "06":"山形県","07":"福島県","08":"茨城県","09":"栃木県","10":"群馬県",
    "11":"埼玉県","12":"千葉県","13":"東京都","14":"神奈川県","15":"新潟県",
    "16":"富山県","17":"石川県","18":"福井県","19":"山梨県","20":"長野県",
    "21":"岐阜県","22":"静岡県","23":"愛知県","24":"三重県","25":"滋賀県",
    "26":"京都府","27":"大阪府","28":"兵庫県","29":"奈良県","30":"和歌山県",
    "31":"鳥取県","32":"島根県","33":"岡山県","34":"広島県","35":"山口県",
    "36":"徳島県","37":"香川県","38":"愛媛県","39":"高知県","40":"福岡県",
    "41":"佐賀県","42":"長崎県","43":"熊本県","44":"大分県","45":"宮崎県",
    "46":"鹿児島県","47":"沖縄県",
}

KE_VARIANTS = {"ヶ": "ケ", "ケ": "ヶ"}

def load_fiscal_year(path, year):
    wb = openpyxl.load_workbook(path)
    ws = wb.active
    result = {}
    for row in ws.iter_rows(values_only=True):
        code = row[0]
        if not code or not str(code).isdigit():
            continue
        pref = str(row[1]).strip()
        city = str(row[2]).strip()
        def sf(v):
            if v is None: return None
            s = str(v).strip()
            return None if s in ("-","","－") else float(s)
        result[(pref, city)] = {
            "fiscal_strength": sf(row[3]),
            "current_expenditure_ratio": sf(row[4]),
            "real_debt_ratio": sf(row[5]),
            "future_burden_ratio": sf(row[6]),
        }
    print(f"[{year}] {len(result)}行ロード")
    return result


def fetch_municipalities():
    all_rows = []
    offset, limit = 0, 1000
    while True:
        url = f"{SUPABASE_URL}/rest/v1/municipalities?select=id,prefecture,city&limit={limit}&offset={offset}"
        req = urllib.request.Request(url, headers={
            "apikey": ANON_KEY,
            "Authorization": f"Bearer {ANON_KEY}",
        })
        with urllib.request.urlopen(req) as r:
            batch = json.loads(r.read())
        all_rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit
    print(f"[supabase] {len(all_rows)}件取得")
    return all_rows


def upsert_batch(rows_sql_values):
    """rows_sql_values: list of "(id, year, fs, cer, rdr, fbr)" strings"""
    vals = ",\n  ".join(rows_sql_values)
    sql = f"""INSERT INTO municipality_fiscal_history
  (municipality_id, fiscal_year, fiscal_strength, current_expenditure_ratio, real_debt_ratio, future_burden_ratio)
VALUES
  {vals}
ON CONFLICT (municipality_id, fiscal_year) DO UPDATE SET
  fiscal_strength = EXCLUDED.fiscal_strength,
  current_expenditure_ratio = EXCLUDED.current_expenditure_ratio,
  real_debt_ratio = EXCLUDED.real_debt_ratio,
  future_burden_ratio = EXCLUDED.future_burden_ratio"""

    if DRY_RUN:
        print(f"  [DRY] {len(rows_sql_values)} rows")
        return True

    url = f"{SUPABASE_URL}/rest/v1/municipality_fiscal_history"
    # REST UPSERT approach
    body = json.dumps([]).encode()  # placeholder
    # Use Management API for direct SQL
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        method="POST",
        headers={
            "Authorization": f"Bearer {SERVICE_KEY}",
            "Content-Type": "application/json",
        }
    )
    with urllib.request.urlopen(req) as r:
        return r.status == 200


def gen_sql_batches(all_values, batch_size=300):
    """Chrome MCP用JSバッチファイルを生成"""
    os.makedirs("/tmp/fiscal_history_batches", exist_ok=True)
    batches = [all_values[i:i+batch_size] for i in range(0, len(all_values), batch_size)]
    for i, batch in enumerate(batches):
        vals = ",\n  ".join(batch)
        sql = f"""INSERT INTO municipality_fiscal_history
  (municipality_id, fiscal_year, fiscal_strength, current_expenditure_ratio, real_debt_ratio, future_burden_ratio)
VALUES
  {vals}
ON CONFLICT (municipality_id, fiscal_year) DO UPDATE SET
  fiscal_strength = EXCLUDED.fiscal_strength,
  current_expenditure_ratio = EXCLUDED.current_expenditure_ratio,
  real_debt_ratio = EXCLUDED.real_debt_ratio,
  future_burden_ratio = EXCLUDED.future_burden_ratio"""

        js = f"""const token = JSON.parse(localStorage.getItem('supabase.dashboard.auth.token')).access_token;
fetch('https://api.supabase.com/v1/projects/msbwmfggvtyexvhmlifn/database/query', {{
  method: 'POST',
  headers: {{ 'Authorization': `Bearer ${{token}}`, 'Content-Type': 'application/json' }},
  body: JSON.stringify({{ query: {json.dumps(sql)} }})
}}).then(r => r.json()).then(d => JSON.stringify(d))"""

        path = f"/tmp/fiscal_history_batches/b{i+1:02d}.js"
        with open(path, "w") as f:
            f.write(js)
    print(f"[gen-sql] {len(batches)}バッチ生成 → /tmp/fiscal_history_batches/")
    return len(batches)


def main():
    # 1. 全年度データロード
    all_fiscal = {}  # (year, pref, city) → metrics
    for year, path in YEAR_FILES.items():
        data = load_fiscal_year(path, year)
        for (pref, city), metrics in data.items():
            all_fiscal[(year, pref, city)] = metrics

    # 2. municipality_id マップ取得
    munis = fetch_municipalities()
    muni_map = {}
    for m in munis:
        muni_map[(m["prefecture"], m["city"])] = m["id"]
        # ヶ/ケ 両方登録
        city2 = m["city"]
        for a, b in KE_VARIANTS.items():
            if a in city2:
                muni_map[(m["prefecture"], city2.replace(a, b))] = m["id"]

    # 3. マッチング + SQL VALUES生成
    def q(v): return "NULL" if v is None else str(v)

    all_values = []
    no_match = []
    for (year, pref, city), metrics in sorted(all_fiscal.items()):
        mid = muni_map.get((pref, city))
        if not mid:
            no_match.append(f"{year} {pref} {city}")
            continue
        row = (f"({mid}, {year}, "
               f"{q(metrics['fiscal_strength'])}, "
               f"{q(metrics['current_expenditure_ratio'])}, "
               f"{q(metrics['real_debt_ratio'])}, "
               f"{q(metrics['future_burden_ratio'])})")
        all_values.append(row)

    print(f"\n[match] {len(all_values)}件マッチ / 未マッチ {len(no_match)}件")

    # 4. 実行モード分岐
    if GEN_SQL:
        n = gen_sql_batches(all_values)
        print(f"Chrome MCPで /tmp/fiscal_history_batches/b01.js 〜 b{n:02d}.js を実行してください")
        return

    if not SERVICE_KEY:
        print("ERROR: --gen-sql か SUPABASE_SERVICE_ROLE_KEY が必要")
        sys.exit(1)

    # REST API upsert (batch)
    BATCH = 300
    success = 0
    for i in range(0, len(all_values), BATCH):
        batch = all_values[i:i+BATCH]
        ok = upsert_batch(batch)
        if ok:
            success += len(batch)
        print(f"  batch {i//BATCH+1}: {'OK' if ok else 'ERROR'} ({len(batch)}行)")

    print(f"\n[done] {success}/{len(all_values)}件 upsert完了")


if __name__ == "__main__":
    main()
