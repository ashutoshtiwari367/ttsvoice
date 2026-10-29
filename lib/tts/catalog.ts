/**
 * ==============================================================================
 * lib/tts/catalog.ts — IN-MEMORY LANGUAGE & VOICE CATALOG (ZERO DB DELAY)
 * ==============================================================================
 * All languages and voices are read directly in-memory from `config/control.ts`
 * (merged with any legacy IDs from `catalog-fallback.ts`) instead of querying
 * Supabase tables (`tts_languages` / `models_voices`) on runtime requests.
 * ==============================================================================
 */

import {
  STUDIO_LANGUAGES,
  ALL_LANGUAGES_CATALOG,
  type Language,
  type Voice,
} from '@/config/control';
import { FALLBACK_VOICES, FALLBACK_LANGUAGES } from '@/lib/tts/catalog-fallback';

export { STUDIO_LANGUAGES, ALL_LANGUAGES_CATALOG, type Language, type Voice };

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
  id: string;
  label: string;
  gender: string;
  tier: string;
  preview_url: string | null;
}

export interface LanguagePublic {
  code: string;
  label: string;
  flag: string;
  voices: VoicePublic[];
}

// ── Precomputed Static In-Memory Catalog (Built Once at Module Load, 0ms Access) ──

const PRIMARY_LANGUAGES: LanguageRow[] = STUDIO_LANGUAGES.map((l, idx) => ({
  code: l.code,
  label: l.label,
  sort_order: idx + 1,
}));

const primaryLangCodes = new Set(PRIMARY_LANGUAGES.map((l) => l.code));

export const STATIC_LANGUAGES: LanguageRow[] = [
  ...PRIMARY_LANGUAGES,
  ...FALLBACK_LANGUAGES.filter((l) => !primaryLangCodes.has(l.code)),
];

const SUPPORTED_LANG_SET = new Set<string>(STATIC_LANGUAGES.map((l) => l.code));

const PRIMARY_VOICES: VoiceRow[] = STUDIO_LANGUAGES.flatMap((lang, lIdx) =>
  lang.voices.map((v, vIdx) => ({
    id: v.id,
    language_code: lang.code,
    display_name: v.label,
    gender: v.gender,
    provider: v.provider ?? 'google',
    tier: v.tier ?? 'free',
    cost_per_millchar: v.costPerMillchar ?? (v.tier === 'paid' ? 16 : 4),
    cost_currency: v.costCurrency ?? 'USD',
    preview_url: v.preview_url ?? null,
    sort_order: (lIdx + 1) * 10 + (vIdx + 1),
  }))
);

const primaryVoiceIds = new Set(PRIMARY_VOICES.map((v) => v.id));

export const STATIC_VOICES: VoiceRow[] = [
  ...PRIMARY_VOICES,
  ...FALLBACK_VOICES.filter((v) => !primaryVoiceIds.has(v.id)),
];

const VOICE_BY_ID = new Map<string, VoiceRow>(STATIC_VOICES.map((v) => [v.id, v]));

export const CLIENT_CATALOG: LanguagePublic[] = STUDIO_LANGUAGES.map((l) => ({
  code: l.code,
  label: l.label,
  flag: l.flag,
  voices: l.voices.map((v) => ({
    id: v.id,
    label: v.label,
    gender: v.gender,
    tier: v.tier ?? 'free',
    preview_url: v.preview_url ?? null,
  })),
}));

// ── Synchronous O(1) Helpers (0ms, No Async Overhead) ──

export function isSupportedLanguage(code: string): boolean {
  return SUPPORTED_LANG_SET.has(code);
}

export function getVoiceSync(id: string): VoiceRow | undefined {
  return VOICE_BY_ID.get(id);
}

export function getCatalogForClientSync(): LanguagePublic[] {
  return CLIENT_CATALOG;
}

// ── Backwards-Compatible Async Exports (Resolve Instantly from Memory, No DB Call) ──

export async function getActiveVoices(): Promise<VoiceRow[]> {
  return STATIC_VOICES;
}

export async function getActiveLanguages(): Promise<LanguageRow[]> {
  return STATIC_LANGUAGES;
}

export async function getVoice(id: string): Promise<VoiceRow | undefined> {
  return VOICE_BY_ID.get(id);
}

export async function getCatalogForClient(): Promise<LanguagePublic[]> {
  return CLIENT_CATALOG;
}
