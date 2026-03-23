"use client";

import { useState, useRef, useEffect } from "react";

const GLOSSARY: Record<string, string> = {
  "ガバメントクラウド": "政府が整備したクラウドサービス利用環境。AWS・Azure・GCP・OCI・さくらの5社が認定。自治体の情報システムをこの基盤上に移行する国策。",
  "標準化": "地方公共団体の基幹業務（住民基本台帳、税、福祉等20業務）のシステムを、国が定めた標準仕様に準拠させること。標準化法に基づく。",
  "特定移行": "デジタル庁が認定した「特定移行支援システム」の対象自治体。2026年3月末の移行期限が適用されず、別途スケジュール（概ね5年以内）が設定される。",
  "完了率": "対象業務システムのうち、ガバメントクラウドへの移行が完了した割合。業務ベースとシステム数ベースの2種類の算出方法がある。",
  "特定移行認定": "デジタル庁が認定した「特定移行支援システム」の対象団体（935団体）。期限延長が認められ、2026年3月末の移行期限が適用されない。",
  "遅延リスク": "移行完了率が50%未満で、かつ特定移行認定を受けていない自治体。期限内の完了が危ぶまれる状態。",
  "コスト増": "ガバメントクラウド移行に伴い、従来のオンプレミス環境と比較して運用コストが増加すること。中核市平均で約2.3倍の増加が報告されている。",
  "20業務": "標準化法の対象となる20の基幹業務。住民基本台帳、個人住民税、固定資産税、国民健康保険、国民年金、児童手当、生活保護、介護保険など。",
};

type Props = {
  term: string;
  children: React.ReactNode;
};

export default function GlossaryTooltip({ term, children }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const definition = GLOSSARY[term];

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (!definition) return <>{children}</>;

  return (
    <span ref={ref} className="glossary-trigger">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        className="glossary-term"
        aria-describedby={open ? `glossary-${term}` : undefined}
      >
        {children}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="glossary-icon">
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      </button>
      {open && (
        <span id={`glossary-${term}`} className="glossary-popup" role="tooltip">
          <span className="glossary-popup-title">{term}</span>
          <span className="glossary-popup-body">{definition}</span>
        </span>
      )}
    </span>
  );
}
