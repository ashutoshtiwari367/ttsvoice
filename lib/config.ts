function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}
export const config = {
  defaultBrandId: process.env.DEFAULT_APP_ID || process.env.DEFAULT_BRAND_ID || 'freetts',
  supabaseUrl: req('SUPABASE_URL'),
  supabaseServiceKey: req('SUPABASE_SERVICE_ROLE_KEY'),
  storageProvider: (process.env.STORAGE_PROVIDER || 'supabase') as 'supabase' | 'r2',
  audioBucket: process.env.AUDIO_BUCKET || 'tts-audio',
  signedUrlTtlSeconds: Number(process.env.SIGNED_URL_TTL || '3600'),
  ttsProvider: (process.env.TTS_PROVIDER || 'google') as 'google',
  burstMaxPerMinute: Number(process.env.BURST_MAX_PER_MINUTE || '20'),
  textRetentionDays: Number(process.env.TEXT_RETENTION_DAYS || '365'),
  baseCurrency: 'INR',
  // Code-enforced absolute ceilings. app_config may LOWER these, never raise past them.
  maxCharsHardCeiling: Number(process.env.MAX_CHARS_HARD_CEILING || '5000'),
  dailySafetyCap: Number(process.env.DAILY_SAFETY_CAP || '2000000'),
  subjectCookie: 'tts_sid',
  cacheTtlMs: Number(process.env.CACHE_TTL_MS || String(5 * 60 * 1000)),
} as const;
