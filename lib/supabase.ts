import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Vendor = {
  id: number;
  name: string;
  short_name: string | null;
  cloud_platform: string | null;
  cloud_confirmed: boolean;
  multitenancy: boolean;
  municipality_count: number | null;
  notes?: string | null;
};

export type Package = {
  id: number;
  vendor_id: number;
  package_name: string;
  business?: string | null;
  exemption_number?: string | null;
  confirmed_date?: string | null;
  vendors?: Vendor;
};

export type Municipality = {
  id: number;
  prefecture: string;
  city: string;
  pref_city_code: string | null;
  size_category: string | null;
};

export type MunicipalityPackageRow = {
  id: number;
  municipality_id: number;
  package_id: number;
  business: string | null;
  adoption_year: number | null;
  source: string | null;
  confidence: string | null;
  packages?: Package & { vendors?: Vendor };
};

export type CostReport = {
  id: number;
  municipality_id: number | null;
  vendor_id: number | null;
  change_ratio: number;
  scope: string;
  source_url: string | null;
  reported_year: number | null;
  notes: string | null;
  vendors?: Vendor;
};
