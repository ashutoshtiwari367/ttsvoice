import { admin } from '@/lib/supabase/admin';
import type { RequestMeta } from '@/lib/http';

// Geo / network blocking from the `block_rules` table (cached ~60s).
// Person-level bans (cookie / IP hash) stay in `blocklist`.
// Returns null when allowed; 'block' wins over 'busy' when several rules match.
export type GeoAction = 'busy' | 'block';

interface RuleRow {
  brand_id: string | null;
  rule_type: 'country' | 'region' | 'city' | 'postal_prefix' | 'asn';
  match_value: string;
  action: GeoAction;
  expires_at: string | null;
}

const RULE_CACHE_MS = 60_000;
let ruleCache: { rows: RuleRow[]; at: number } | null = null;

async function loadRules(): Promise<RuleRow[]> {
  if (ruleCache && Date.now() - ruleCache.at < RULE_CACHE_MS) return ruleCache.rows;
  const { data, error } = await admin
    .from('block_rules')
    .select('brand_id,rule_type,match_value,action,expires_at')
    .eq('is_active', true);
  if (error || !data) return ruleCache?.rows ?? [];   // keep last good copy on DB error
  ruleCache = { rows: data as RuleRow[], at: Date.now() };
  return ruleCache.rows;
}

export async function geoCheck(brandId: string, country: string | null, meta: RequestMeta | undefined): Promise<GeoAction | null> {
  const now = Date.now();
  const rules = (await loadRules()).filter((r) =>
    (r.brand_id === null || r.brand_id === brandId) &&
    (r.expires_at === null || new Date(r.expires_at).getTime() > now));
  if (rules.length === 0) return null;

  const c = (country ?? '').toLowerCase();
  const region = c && meta?.regionCode ? `${c}-${meta.regionCode.toLowerCase()}` : '';
  const city = (meta?.city ?? '').toLowerCase();
  const postal = (meta?.postalCode ?? '').toLowerCase();
  const asn = meta?.asn != null ? String(meta.asn) : '';

  let result: GeoAction | null = null;
  for (const r of rules) {
    const v = r.match_value.trim().toLowerCase();
    const hit =
      (r.rule_type === 'country' && c !== '' && c === v) ||
      (r.rule_type === 'region' && region !== '' && region === v) ||
      (r.rule_type === 'city' && city !== '' && city === v) ||
      (r.rule_type === 'postal_prefix' && postal !== '' && postal.startsWith(v)) ||
      (r.rule_type === 'asn' && asn !== '' && asn === v);
    if (!hit) continue;
    if (r.action === 'block') return 'block';
    result = 'busy';
  }
  return result;
}