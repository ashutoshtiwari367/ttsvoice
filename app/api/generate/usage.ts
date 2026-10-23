import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';

export interface BrandRow {
  id: string;
  name: string;
  monetization: 'ads' | 'credits';
  req_cap_anon: number;
  req_cap_user: number;
  day_cap_anon: number;
  day_cap_user: number;
  allowed_language_codes: string[];
  is_active: boolean;
}

let brandCache: { row: BrandRow; at: number } | null = null;

export async function getBrand(brandId: string): Promise<BrandRow | null> {
  if (brandCache && brandCache.row.id === brandId && Date.now() - brandCache.at < 60_000) {
    return brandCache.row;
  }
  const { data, error } = await admin
    .from('brands_website')
    .select('id,name,monetization,req_cap_anon,req_cap_user,day_cap_anon,day_cap_user,allowed_language_codes,is_active')
    .eq('id', brandId).eq('is_active', true).single();
  if (error || !data) return null;
  brandCache = { row: data as BrandRow, at: Date.now() };
  return data as BrandRow;
}

// Usage day in IST (limits reset at midnight India time, not UTC).
const IST_OFFSET_MS = 330 * 60 * 1000;
export function today(): string { return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10); }

export async function isBlocked(subjectId: string, ipHash: string): Promise<boolean> {
  const { data, error } = await admin.rpc('is_blocked', { p_subject_id: subjectId, p_ip_hash: ipHash });
  if (error) return false;
  return data === true;
}

export async function todayTotalChars(): Promise<number> {
  const { data, error } = await admin.rpc('today_total_chars');
  if (error) return 0;
  return Number(data ?? 0);
}

export async function findCachedAudio(contentHash: string): Promise<string | null> {
  const { data, error } = await admin
    .from('tts_generations').select('audio_object_key')
    .eq('content_hash', contentHash).eq('status', 'success')
    .not('audio_object_key', 'is', null).limit(1).maybeSingle();
  if (error || !data) return null;
  return data.audio_object_key as string;
}

export async function reserveFreeQuota(brandId: string, subjectKey: string, chars: number, cap: number): Promise<boolean> {
  const { data, error } = await admin.rpc('reserve_free_quota', {
    p_brand_id: brandId, p_subject_key: subjectKey, p_day: today(), p_chars: chars, p_cap: cap,
  });
  if (error) throw error;
  return data === true;
}

export async function refundFreeQuota(brandId: string, subjectKey: string, chars: number) {
  await admin.rpc('refund_free_quota', { p_brand_id: brandId, p_subject_key: subjectKey, p_day: today(), p_chars: chars });
}

export type QuotaResult = 'ok' | 'day_chars' | 'week_chars' | 'month_chars' | 'day_generations';

// Atomic multi-window reserve (migration 0005). Caps: 0 = no limit.
export async function reserveQuota(
  brandId: string, subjectKey: string, chars: number,
  caps: { dayChars: number; weekChars: number; monthChars: number; dayGenerations: number },
): Promise<QuotaResult> {
  const { data, error } = await admin.rpc('reserve_quota', {
    p_brand_id: brandId, p_subject_key: subjectKey, p_day: today(), p_chars: chars,
    p_day_chars: caps.dayChars, p_week_chars: caps.weekChars,
    p_month_chars: caps.monthChars, p_day_generations: caps.dayGenerations,
  });
  if (error) throw error;
  const r = String(data ?? '');
  return (['ok', 'day_chars', 'week_chars', 'month_chars', 'day_generations'].includes(r) ? r : 'day_chars') as QuotaResult;
}

export async function refundQuota(brandId: string, subjectKey: string, chars: number) {
  const { error } = await admin.rpc('refund_quota', { p_brand_id: brandId, p_subject_key: subjectKey, p_day: today(), p_chars: chars });
  if (error) console.error('refund_quota_failed', error);
}

export async function insertInput(p: {
  content: string; contentHash: string; charCount: number; isFlagged: boolean; flagReason: string | null;
}): Promise<number | null> {
  const expires = new Date();
  expires.setUTCDate(expires.getUTCDate() + config.textRetentionDays);
  const { data, error } = await admin.from('tts_inputs').insert({
    content: p.content, content_hash: p.contentHash, char_count: p.charCount,
    is_flagged: p.isFlagged, flag_reason: p.flagReason, text_expires_at: expires.toISOString(),
  }).select('id').single();
  if (error || !data) return null;
  return data.id as number;
}

export interface GenerationLog {
  brandId: string;
  customerId: string | null;
  anonSubjectId: string | null;
  userCategory: string;
  inputId: number | null;
  contentHash: string;
  charCount: number;
  languageCode: string;
  voiceId: string;
  voiceTier: string;
  costSourceCurrency: string;
  costPerMillcharSrc: number;
  fxRateToInr: number;
  estimatedCostSrc: number;
  estimatedCostInr: number;
  speakingRate: number;
  provider: string;
  isCacheHit: boolean;
  audioObjectKey: string;
  countryCode: string | null;
  ipHash: string;
  tier: string;
  isFlagged: boolean;
  status: 'success' | 'failed' | 'blocked';
  // request metadata (migration 0004)
  continentCode?: string | null;
  regionCode?: string | null;
  city?: string | null;
  timezone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  postalCode?: string | null;
  asn?: number | null;
  deviceType?: string | null;
  browserFamily?: string | null;
  osFamily?: string | null;
  browserLang?: string | null;
  referrerHost?: string | null;
  isNewSubject?: boolean | null;
}

export async function logGeneration(r: GenerationLog) {
  const { error } = await admin.from('tts_generations').insert({
    brand_id: r.brandId,
    customer_id: r.customerId,
    anon_subject_id: r.anonSubjectId,
    user_category: r.userCategory,
    input_id: r.inputId,
    content_hash: r.contentHash,
    char_count: r.charCount,
    language_code: r.languageCode,
    voice_id: r.voiceId,
    voice_tier: r.voiceTier,
    cost_source_currency: r.costSourceCurrency,
    cost_per_millchar_src: r.costPerMillcharSrc,
    fx_rate_to_inr: r.fxRateToInr,
    estimated_cost_src: r.estimatedCostSrc,
    estimated_cost_inr: r.estimatedCostInr,
    speaking_rate: r.speakingRate,
    provider: r.provider,
    is_cache_hit: r.isCacheHit,
    audio_object_key: r.audioObjectKey,
    country_code: r.countryCode,
    ip_hash: r.ipHash,
    tier: r.tier,
    is_flagged: r.isFlagged,
    status: r.status,
    continent_code: r.continentCode ?? null,
    region_code: r.regionCode ?? null,
    city: r.city ?? null,
    timezone: r.timezone ?? null,
    latitude: r.latitude ?? null,
    longitude: r.longitude ?? null,
    postal_code: r.postalCode ?? null,
    asn: r.asn ?? null,
    device_type: r.deviceType ?? null,
    browser_family: r.browserFamily ?? null,
    os_family: r.osFamily ?? null,
    browser_lang: r.browserLang ?? null,
    referrer_host: r.referrerHost ?? null,
    is_new_subject: r.isNewSubject ?? null,
  });
  // surface insert failures in logs (previously silent)
  if (error) console.error('log_generation_failed', error);
}
