import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';

// TVARVC-style config reader: memory cache -> app_config table -> code default.
// All keys are stored and queried case-insensitively.
let cache: Map<string, string> | null = null;
let cachedAt = 0;

async function load(): Promise<Map<string, string>> {
  const now = Date.now();
  if (cache && now - cachedAt < config.cacheTtlMs) return cache;
  try {
    const { data, error } = await admin.from('app_config').select('key,value');
    if (error) throw error;
    const m = new Map<string, string>();
    for (const r of data ?? []) {
      if (r.key) m.set(String(r.key).toLowerCase().trim(), String(r.value ?? ''));
    }
    cache = m;
    cachedAt = now;
    return m;
  } catch {
    return cache ?? new Map();
  }
}

/**
 * Reads an integer config value case-insensitively with hard ceiling safety.
 */
export async function getConfigInt(key: string, fallback: number, hardMax?: number): Promise<number> {
  const m = await load();
  const raw = m.get(key.toLowerCase().trim());
  let v = raw !== undefined && !Number.isNaN(Number(raw)) ? Number(raw) : fallback;
  if (hardMax !== undefined) v = Math.min(v, hardMax); // config can only lower, never breach
  return v;
}

/**
 * Reads a boolean config flag case-insensitively (e.g. true, 1, yes, on).
 */
export async function getConfigBool(key: string, fallback: boolean): Promise<boolean> {
  const m = await load();
  const raw = m.get(key.toLowerCase().trim());
  if (raw === undefined) return fallback;
  const s = raw.toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'on';
}

/**
 * String config reader (cached, case-insensitive).
 */
export async function getConfigValue(key: string, fallback: string): Promise<string> {
  const m = await load();
  return m.get(key.toLowerCase().trim()) ?? fallback;
}

/**
 * Service status is UNCACHED so the switch takes effect instantly.
 * 'live' = normal | 'busy' = friendly message, no API call | 'mock' = sample, no API call
 */
export async function getServiceStatus(): Promise<string> {
  try {
    const { data, error } = await admin
      .from('app_config')
      .select('value')
      .eq('key', 'tts_service_status')
      .maybeSingle();
    if (error || !data) return 'live';
    return (data.value as string)?.toLowerCase().trim() || 'live';
  } catch {
    return 'live';
  }
}