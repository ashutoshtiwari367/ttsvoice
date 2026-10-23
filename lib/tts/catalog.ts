import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';
import { FALLBACK_VOICES, FALLBACK_LANGUAGES } from '@/lib/tts/catalog-fallback';

export interface VoiceRow {
  id: string;
  language_code: string;
  display_name: string;
  gender: string;
  provider: string;
  tier: string;
  cost_per_millchar: number;
  cost_currency: string;
  preview_url: string | null;
  sort_order: number;
}

export interface LanguageRow {
  code: string;
  label: string;
  sort_order: number;
}

export interface VoicePublic {
  id: string; label: string; gender: string; tier: string; preview_url: string | null;
}
export interface LanguagePublic {
  code: string; label: string; voices: VoicePublic[];
}

let voiceCache: VoiceRow[] | null = null;
let voiceAt = 0;
let langCache: LanguageRow[] | null = null;
let langAt = 0;

async function fetchVoices(): Promise<VoiceRow[]> {
  const { data, error } = await admin
    .from('models_voices')
    .select('id,language_code,display_name,gender,provider,tier,cost_per_millchar,cost_currency,preview_url,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as VoiceRow[];
}

async function fetchLanguages(): Promise<LanguageRow[]> {
  const { data, error } = await admin
    .from('tts_languages')
    .select('code,label,sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []) as LanguageRow[];
}

export async function getActiveVoices(): Promise<VoiceRow[]> {
  const now = Date.now();
  if (voiceCache && now - voiceAt < config.cacheTtlMs) return voiceCache;
  try {
    const rows = await fetchVoices();
    const existingIds = new Set(rows.map((r) => r.id));
    const merged = [...rows, ...FALLBACK_VOICES.filter((v) => !existingIds.has(v.id))];
    if (merged.length > 0) { voiceCache = merged; voiceAt = now; return merged; }
    return voiceCache ?? FALLBACK_VOICES;
  } catch {
    return voiceCache ?? FALLBACK_VOICES;
  }
}

async function getActiveLanguages(): Promise<LanguageRow[]> {
  const now = Date.now();
  if (langCache && now - langAt < config.cacheTtlMs) return langCache;
  try {
    const rows = await fetchLanguages();
    const existingCodes = new Set(rows.map((r) => r.code));
    const merged = [...rows, ...FALLBACK_LANGUAGES.filter((l) => !existingCodes.has(l.code))];
    if (merged.length > 0) { langCache = merged; langAt = now; return merged; }
    return langCache ?? FALLBACK_LANGUAGES;
  } catch {
    return langCache ?? FALLBACK_LANGUAGES;
  }
}

export async function getVoice(id: string): Promise<VoiceRow | undefined> {
  const voices = await getActiveVoices();
  return voices.find((v) => v.id === id);
}

// Shaped for the frontend selector, grouped by language (languages drive the list).
export async function getCatalogForClient(): Promise<LanguagePublic[]> {
  const [voices, languages] = await Promise.all([getActiveVoices(), getActiveLanguages()]);
  const labelByCode = new Map(languages.map((l) => [l.code, l.label]));
  const out: LanguagePublic[] = languages.map((l) => ({ code: l.code, label: l.label, voices: [] }));
  const byCode = new Map(out.map((o) => [o.code, o]));
  for (const v of voices) {
    const group = byCode.get(v.language_code);
    if (!group) continue;
    group.voices.push({
      id: v.id, label: v.display_name, gender: v.gender, tier: v.tier, preview_url: v.preview_url,
    });
  }
  // keep only languages that actually have active voices
  return out.filter((o) => o.voices.length > 0 || labelByCode.has(o.code));
}
