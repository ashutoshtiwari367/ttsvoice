import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';

// Entitlements come from the `pricing_plans` table (one row per brand per tier).
// Code defaults apply only if the plan row is missing or inactive.
// Code hard maxima always win. 0 = no limit for that window (req is always bounded).

export type LimitTier = 'anon' | 'free' | 'paid';

export interface Limits {
  reqChars: number;        // per generation (always > 0)
  dayChars: number;        // per IST day
  weekChars: number;       // rolling 7 days
  monthChars: number;      // calendar month
  dayGenerations: number;  // generations per IST day
}

export interface PlanLimits extends Limits {
  planId: string | null;   // null = code defaults were used
  ipDayChars: number;      // per-IP-hash daily ceiling (0 = off)
  ipDayGenerations: number;
  allowPremiumVoices: boolean;
}

interface PlanRow {
  id: string;
  brand_id: string;
  plan_code: string;
  req_cap: number;
  day_cap: number;
  week_cap: number;
  month_cap: number;
  day_gen_cap: number;
  ip_day_cap: number;
  ip_day_gen_cap: number;
  allow_premium_voices: boolean;
}

const DEFAULTS: Record<LimitTier, Omit<PlanLimits, 'planId'>> = {
  anon: { reqChars: 500, dayChars: 500,  weekChars: 10_000, monthChars: 0,       dayGenerations: 0, ipDayChars: 10_000, ipDayGenerations: 0, allowPremiumVoices: false },
  free: { reqChars: 1000, dayChars: 1000, weekChars: 50_000, monthChars: 0,       dayGenerations: 0, ipDayChars: 20_000, ipDayGenerations: 0, allowPremiumVoices: true },
  paid: { reqChars: 10_000, dayChars: 0,      weekChars: 0,      monthChars: 200_000, dayGenerations: 0, ipDayChars: 0,      ipDayGenerations: 0, allowPremiumVoices: true },
};

const HARD_MAX = {
  reqChars: config.maxCharsHardCeiling,   // provider single-request ceiling
  dayChars: 1_000_000,
  weekChars: 5_000_000,
  monthChars: 20_000_000,
  dayGenerations: 10_000,
  ipDayChars: 5_000_000,
  ipDayGenerations: 100_000,
};

const PLAN_CACHE_MS = 60_000;
let planCache: { rows: PlanRow[]; at: number } | null = null;

async function loadPlans(): Promise<PlanRow[]> {
  if (planCache && Date.now() - planCache.at < PLAN_CACHE_MS) return planCache.rows;
  const { data, error } = await admin
    .from('pricing_plans')
    .select('id,brand_id,plan_code,req_cap,day_cap,week_cap,month_cap,day_gen_cap,ip_day_cap,ip_day_gen_cap,allow_premium_voices')
    .eq('is_active', true);
  if (error || !data) return planCache?.rows ?? [];   // keep last good copy on DB error
  planCache = { rows: data as PlanRow[], at: Date.now() };
  return planCache.rows;
}

function bound(v: number, max: number): number {
  return v === 0 ? 0 : Math.min(v, max);   // 0 = no limit, otherwise never above the hard max
}

// planCode: the customer's plan (later from customers.plan_id); defaults to the tier name
export async function getPlanLimits(brandId: string, tier: LimitTier, planCode?: string): Promise<PlanLimits> {
  const code = planCode ?? tier;
  const row = (await loadPlans()).find((p) => p.brand_id === brandId && p.plan_code === code);
  if (!row) return { planId: null, ...DEFAULTS[tier] };

  return {
    planId: row.id,
    reqChars: row.req_cap > 0 ? Math.min(row.req_cap, HARD_MAX.reqChars) : HARD_MAX.reqChars,
    dayChars: bound(row.day_cap, HARD_MAX.dayChars),
    weekChars: bound(row.week_cap, HARD_MAX.weekChars),
    monthChars: bound(row.month_cap, HARD_MAX.monthChars),
    dayGenerations: bound(row.day_gen_cap, HARD_MAX.dayGenerations),
    ipDayChars: bound(row.ip_day_cap, HARD_MAX.ipDayChars),
    ipDayGenerations: bound(row.ip_day_gen_cap, HARD_MAX.ipDayGenerations),
    allowPremiumVoices: row.allow_premium_voices,
  };
}