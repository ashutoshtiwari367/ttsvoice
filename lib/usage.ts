import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';

export interface BrandRow {
  id: string;
  name: string;
  monetization: 'ads' | 'credits';
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
    .select('id,name,monetization,allowed_language_codes,is_active')
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
  content: string;
  contentHash: string;
  charCount: number;
  isFlagged: boolean;
  flagReason: string | null;
  subjectId?: string | null;
  customerId?: string | null;
  ipHash?: string | null;
  country?: string | null;
  lang?: string;
  voiceId?: string;
  speed?: number;
  status?: string;
  reasonCode?: string | null;
  errorMessage?: string | null;
}): Promise<number | null> {
  const excerpt = p.content.slice(0, 200);

  // R7/R10 & R3: Insert into confirmed LIVE input table: tts_input_header
  const headerPayload: Record<string, any> = {
    retention_code: 'A0',
    anon_subject_id: p.subjectId ?? null,
    customer_id: p.customerId ?? null,
    ip_hash: p.ipHash ?? null,
    country_code: p.country ?? null,
    language_code: p.lang ?? 'hi-IN',
    voice_code: p.voiceId ?? 'default',
    speed: p.speed ?? 1.0,
    char_count: p.charCount,
    content_hash: p.contentHash,
    status: p.status ?? 'live',
    request_mode: 'live',
    was_masked: false,
    text_purged: false,
  };

  if (p.reasonCode) headerPayload.reason_code = p.reasonCode;
  if (p.errorMessage) headerPayload.error_message = p.errorMessage;
  if (excerpt) {
    headerPayload.content_excerpt = excerpt;
    headerPayload.excerpt = excerpt;
  }

  let headerId: number | null = null;
  try {
    const { data: header, error: headerErr } = await admin
      .from('tts_input_header')
      .insert(headerPayload)
      .select('id')
      .single();

    if (!headerErr && header) {
      headerId = header.id as number;

      // Insert original full content into tts_input_item (R4: store original)
      await admin.from('tts_input_item').insert({
        header_id: headerId,
        content: p.content,
        content_hash: p.contentHash,
        char_count: p.charCount,
        retention_code: 'A0',
      });

      return headerId;
    }
  } catch (err) {
    console.error('live_input_header_insert_failed', err);
  }

  // Graceful fallback if reason_code/error_message/content_excerpt columns not yet migrated
  if (!headerId) {
    try {
      const basicPayload = { ...headerPayload };
      delete basicPayload.reason_code;
      delete basicPayload.error_message;
      delete basicPayload.excerpt;
      delete basicPayload.content_excerpt;

      const { data: fallbackHeader } = await admin
        .from('tts_input_header')
        .insert(basicPayload)
        .select('id')
        .single();

      if (fallbackHeader) {
        headerId = fallbackHeader.id as number;
        await admin.from('tts_input_item').insert({
          header_id: headerId,
          content: p.content,
          content_hash: p.contentHash,
          char_count: p.charCount,
          retention_code: 'A0',
        });
        return headerId;
      }
    } catch {
      // ignore
    }
  }

  return headerId;
}

/**
 * Updates tts_input_header with terminal status and reason/error code (R3)
 */
export async function updateInputStatus(
  headerId: number | null,
  status: string,
  reasonCode?: string | null,
  errorMessage?: string | null
): Promise<void> {
  if (!headerId) return;
  try {
    const updatePayload: Record<string, any> = { status };
    if (reasonCode !== undefined) updatePayload.reason_code = reasonCode;
    if (errorMessage !== undefined) updatePayload.error_message = errorMessage;

    const { error } = await admin
      .from('tts_input_header')
      .update(updatePayload)
      .eq('id', headerId);

    if (error) {
      // If column doesn't exist yet, fallback to status
      await admin
        .from('tts_input_header')
        .update({ status })
        .eq('id', headerId);
    }
  } catch (err) {
    console.error('update_input_status_failed', err);
  }
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
  expiresAt?: string | null;
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
  const payload: Record<string, any> = {
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
  };

  if (r.expiresAt) {
    payload.expires_at = r.expiresAt;
  }

  const { error } = await admin.from('tts_generations').insert(payload);
  if (error) {
    // If column expires_at does not yet exist in Supabase table, retry without it
    if (payload.expires_at) {
      delete payload.expires_at;
      const { error: retryError } = await admin.from('tts_generations').insert(payload);
      if (retryError) console.error('log_generation_retry_failed', retryError);
    } else {
      console.error('log_generation_failed', error);
    }
  }
}