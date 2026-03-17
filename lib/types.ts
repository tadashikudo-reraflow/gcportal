export interface MunicipalityBizRates {
  [business: string]: number | null;
}

export interface Municipality {
  prefecture: string;
  city: string;
  overall_rate: number | null;
  business_rates: MunicipalityBizRates;
}

export interface PrefectureSummary {
  prefecture: string;
  avg_rate: number;
  count: number;
  completed: number;
  critical: number;
}

export interface BusinessSummary {
  business: string;
  avg_rate: number;
  completed: number;
  critical: number;
}

export interface StandardizationSummary {
  data_month: string;
  deadline: string;
  total: number;
  avg_rate: number;
  median_rate: number;
  completed_count: number;
  critical_count: number;
  at_risk_count: number;
  on_track_count: number;
}

export interface StandardizationData {
  summary: StandardizationSummary;
  prefectures: PrefectureSummary[];
  businesses: BusinessSummary[];
  risk_municipalities: Municipality[];
  municipalities: Municipality[];
}
