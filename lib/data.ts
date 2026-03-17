import { StandardizationData } from "./types";
import rawData from "@/public/data/standardization.json";

export function getStandardizationData(): StandardizationData {
  return rawData as StandardizationData;
}

export function formatRate(rate: number | null): string {
  if (rate === null) return "—";
  return `${(rate * 100).toFixed(1)}%`;
}

export function getRateColor(rate: number | null): string {
  if (rate === null) return "bg-gray-200";
  if (rate >= 1.0) return "bg-green-500";
  if (rate >= 0.8) return "bg-blue-400";
  if (rate >= 0.5) return "bg-yellow-400";
  return "bg-red-500";
}

export function getRateTextColor(rate: number | null): string {
  if (rate === null) return "text-gray-400";
  if (rate >= 1.0) return "text-green-600";
  if (rate >= 0.8) return "text-blue-600";
  if (rate >= 0.5) return "text-yellow-600";
  return "text-red-600";
}

export function getRiskLabel(rate: number | null): string {
  if (rate === null) return "不明";
  if (rate >= 1.0) return "完了";
  if (rate >= 0.8) return "順調";
  if (rate >= 0.5) return "要注意";
  return "危機";
}
