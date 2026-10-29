import { admin } from '@/lib/supabase/admin';
import { TtsError } from '@/lib/http';

export interface ValidatedTtsSelection {
  languageCode: string;
  languageId: number | string | null;
  languageLabel: string;
  voiceId: string;
  provider: string;
  gender: string;
  displayName: string;
  tier: string;
  costPerMillchar: number;
  costCurrency: string;
  previewUrl: string | null;
}

/**
 * Validates requested language and voice model combination against the database
 * (`models_voices` and `tts_langugae` / `tts_languages`).
 *
 * Requirements:
 * 1. Must check the live database before any TTS provider is invoked.
 * 2. Confirms language exists and is active (is_active !== false).
 * 3. Confirms model/voice exists and is active (is_active !== false).
 * 4. Confirms voice belongs to the requested language (relationship check).
 * 5. Returns validated record from database so downstream providers only use DB truth.
 * 6. Rejects missing, disabled, unknown, or mismatched records without calling provider.
 * 7. If database is unreachable, throws server_error (HTTP 500) — never falls back to hardcoded data.
 */
export async function validateTtsSelectionAgainstDb(
  rawLang: string | undefined | null,
  rawVoiceId: string | undefined | null
): Promise<ValidatedTtsSelection> {
  const lang = typeof rawLang === 'string' ? rawLang.trim() : '';
  const voiceId = typeof rawVoiceId === 'string' ? rawVoiceId.trim() : '';

  if (!lang || !voiceId) {
    throw new TtsError('invalid_request');
  }

  // ── 1. Query Language Table from Database ──
  // Preserve actual table name `tts_langugae` if present in schema, fallback to `tts_languages`
  let langRow: any = null;
  try {
    let res = await admin.from('tts_langugae').select('*').eq('code', lang).maybeSingle();
    if (
      res.error &&
      (res.error.code === 'PGRST204' ||
        res.error.code === 'PGRST200' ||
        res.error.code === '42P01' ||
        res.error.message.includes('schema cache') ||
        res.error.message.includes('does not exist'))
    ) {
      res = await admin.from('tts_languages').select('*').eq('code', lang).maybeSingle();
    }
    if (res.error) {
      console.error('db_language_validation_query_error', res.error);
      throw new TtsError('server_error');
    }
    langRow = res.data;
  } catch (err) {
    if (err instanceof TtsError) throw err;
    console.error('db_connection_error_language', err);
    throw new TtsError('server_error');
  }

  if (!langRow) {
    throw new TtsError('unsupported_language');
  }

  // Check language is_active / is_enabled status
  const isLangActive =
    langRow.is_active !== false &&
    langRow.is_enabled !== false &&
    (langRow.status ? langRow.status.toLowerCase() === 'active' : true);

  if (!isLangActive) {
    throw new TtsError('voice_not_allowed');
  }

  // ── 2. Query Voice Model Table from Database ──
  let voiceRow: any = null;
  try {
    const res = await admin.from('models_voices').select('*').eq('id', voiceId).maybeSingle();
    if (res.error) {
      console.error('db_voice_validation_query_error', res.error);
      throw new TtsError('server_error');
    }
    voiceRow = res.data;
  } catch (err) {
    if (err instanceof TtsError) throw err;
    console.error('db_connection_error_voice', err);
    throw new TtsError('server_error');
  }

  if (!voiceRow) {
    throw new TtsError('invalid_voice');
  }

  // Check voice is_active / is_enabled status
  const isVoiceActive =
    voiceRow.is_active !== false &&
    voiceRow.is_enabled !== false &&
    (voiceRow.status ? voiceRow.status.toLowerCase() === 'active' : true);

  if (!isVoiceActive) {
    throw new TtsError('voice_not_allowed');
  }

  // ── 3. Validate Language & Voice Relationship / Combination ──
  // The voice's language_code must match the requested language
  if (
    voiceRow.language_code &&
    voiceRow.language_code.toLowerCase() !== langRow.code.toLowerCase()
  ) {
    throw new TtsError('invalid_voice');
  }

  // If tts_language_id foreign key relationship exists, verify it matches
  if (
    voiceRow.tts_language_id != null &&
    langRow.id != null &&
    Number(voiceRow.tts_language_id) !== Number(langRow.id)
  ) {
    throw new TtsError('invalid_voice');
  }

  // ── 4. Resolve Trusted Configuration from Database Record ──
  return {
    languageCode: langRow.code,
    languageId: langRow.id ?? null,
    languageLabel: langRow.label || langRow.code,
    voiceId: voiceRow.id,
    provider: voiceRow.provider || 'google',
    gender: voiceRow.gender || 'female',
    displayName: voiceRow.display_name || voiceRow.id,
    tier: voiceRow.tier || 'free',
    costPerMillchar: Number(voiceRow.cost_per_millchar) || (voiceRow.tier === 'paid' ? 16 : 4),
    costCurrency: voiceRow.cost_currency || 'USD',
    previewUrl: voiceRow.preview_url || null,
  };
}
