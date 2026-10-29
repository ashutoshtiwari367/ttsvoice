import { config } from '@/lib/config';
import { contentHash, hashIp, normalizeText } from '@/lib/hash';
import { TtsError, type ErrorCode, type RequestMeta } from '@/lib/http';
import { getVoiceSync, type VoiceRow } from '@/lib/tts/catalog';
import { validateTtsSelectionAgainstDb } from '@/lib/tts/dbValidation';
import { selectProvider } from '@/lib/tts/providers';
import { getStorage } from '@/lib/storage';
import { audioObjectKey } from '@/lib/storage/keys';
import { getActiveRate } from '@/lib/currency';
import { getConfigInt, getConfigValue, getConfigBool, getServiceStatus } from '@/lib/appconfig';
import { getPlanLimits, type PlanLimits, type LimitTier } from '@/lib/limits';
import { geoCheck } from '@/lib/geo';
import {
  getBrand, isBlocked, todayTotalChars, findCachedAudio,
  reserveQuota, refundQuota, insertInput, updateInputStatus, logGeneration, type QuotaResult,
} from '@/lib/usage';
import { spendUserCredits, refundUserCredits } from '@/lib/credits';
import { sanitizeTtsText } from '@/lib/tts/textSanitizer';
import { validateAllowanceForGeneration } from '@/lib/allowance';
import { triggerBackgroundCleanup } from '@/lib/history/cleanup';

// Hard cap on how much text we STORE per request (protects the DB from junk floods).
// char_count still records the full submitted length.
const INPUT_STORE_MAX_CHARS = 20_000;

const DEFAULT_BUSY_MESSAGE =
  'Our servers are busy right now. Please try again in 2 to 5 minutes and your audio will be ready.';

type InputId = Awaited<ReturnType<typeof insertInput>> | null;

export interface GenerateInput {
  text: string;
  lang: string;
  voiceId: string;
  speed: number;
  pitch?: number;
  subjectId: string;
  ip: string;
  country: string | null;
  meta?: RequestMeta;          // Cloudflare + browser header metadata
  isNewSubject?: boolean;      // request arrived without our cookie
  turnstileToken?: string | null; // Cloudflare Turnstile verification token (R9)
  // single-app MVP: anonymous free human. These widen later for signed-in/paid/api.
  customerId?: string | null;
  userTier?: 'free' | 'paid';
  userCategory?: 'human' | 'system' | 'api';
}

export interface GenerateResult {
  url: string;
  cached: boolean;
  chars: number;
  busy?: boolean;     // true when generation is paused or failed (message holds the notice)
  message?: string;
  mock?: boolean;     // true when a sample was returned instead of real audio
}

interface Ctx extends GenerateInput {
  customerId: string | null;
  userTier: 'free' | 'paid';
  userCategory: 'human' | 'system' | 'api';
  limitTier: LimitTier;
  limits: PlanLimits;
  subjectKey: string;          // customer id when signed in, else anon cookie id
  ipHash: string;
  chars: number;
  hash: string;
  voice: VoiceRow;
  brandId: string;
  provider: string;
  inputId: InputId;
}

interface Reservation {
  ipKey: string | null;        // null when the IP ceiling did not apply
}

const QUOTA_ERROR: Record<Exclude<QuotaResult, 'ok'>, ErrorCode> = {
  day_chars: 'daily_limit_reached',
  week_chars: 'weekly_limit_reached',
  month_chars: 'monthly_limit_reached',
  day_generations: 'generation_limit_reached',
};

function tierOf(customerId: string | null, userTier: 'free' | 'paid'): LimitTier {
  if (customerId === null) return 'anon';
  return userTier === 'paid' ? 'paid' : 'free';
}

async function verifyTurnstile(token: string | null | undefined, ip: string): Promise<boolean> {
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY || process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true; // if secret key not set in environment, allow
  if (!token) return false;
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
        remoteip: ip,
      }),
    });
    const outcome = await res.json();
    return outcome.success === true;
  } catch {
    return false;
  }
}

// ---- orchestrator ----
// sanity -> blocklist -> save input -> geo -> switch -> validate -> mock -> cache -> global cap -> reserve -> synth -> store -> log
export async function generateTts(input: GenerateInput): Promise<GenerateResult> {
  const text = typeof input.text === 'string' ? input.text : '';
  if (text.trim().length === 0) throw new TtsError('invalid_request');

  // Blocked subjects are rejected before anything is stored.
  const ipHash = hashIp(input.ip);
  if (await isBlocked(input.subjectId, ipHash)) throw new TtsError('blocked');

  // 1. Save the input FIRST, in every path (also geo-blocked: that text is useful fraud intel).
  //    Inputs with no linked tts_generations row = not generated (busy / mock / rejected / geo).
  const inputId = await saveInputEarly(input, text);

  // R9: Cloudflare Turnstile on the generate action only (if turnstile_enabled)
  const turnstileEnabled = await getConfigBool('turnstile_enabled', false);
  if (turnstileEnabled) {
    const isValid = await verifyTurnstile(input.turnstileToken, input.ip);
    if (!isValid) {
      await updateInputStatus(inputId, 'rejected', 'turnstile_failed', 'Bot verification challenge failed');
      throw new TtsError('turnstile_failed');
    }
  }

  // 2. Geo / network blocking (block_rules table)
  const geo = await geoCheck(config.defaultBrandId, input.country, input.meta);
  if (geo === 'block') {
    await updateInputStatus(inputId, 'rejected', 'region_unavailable', 'Region unavailable');
    throw new TtsError('region_unavailable');
  }
  if (geo === 'busy') {
    await updateInputStatus(inputId, 'busy', 'geo_busy', 'Service busy in your region');
    return busyResult(input.lang, text.length);
  }

  // 3. Service switch: 'live' | 'busy' | 'mock'
  const status = await getServiceStatus();
  if (status === 'busy') {
    await updateInputStatus(inputId, 'busy', 'service_busy', DEFAULT_BUSY_MESSAGE);
    return busyResult(input.lang, text.length);
  }

  // 4. Validation (hard errors stay honest errors: bad voice, too long, etc.)
  let ctx: Ctx;
  try {
    ctx = await validateRequest({ ...input, text }, ipHash, inputId);
  } catch (err: any) {
    if (err instanceof TtsError) {
      await updateInputStatus(inputId, 'validation_failed', err.code, err.message);
    }
    throw err;
  }

  if (status === 'mock') {
    await updateInputStatus(inputId, 'mock', null, null);
    return mockResult(ctx);
  }

  // 5. Check audio cache first (saves provider synthesis cost while still debiting user allowance)
  const cachedKey = await findInCache(ctx);

  // 6. Global daily circuit-breaker (only needed when calling live provider)
  if (!cachedKey && (await overGlobalCap(ctx.chars))) {
    await updateInputStatus(inputId, 'busy', 'global_cap_reached', 'Daily safety capacity reached');
    return busyResult(ctx.lang, ctx.chars);
  }

  // 7. Subject quota / character debit + IP ceiling, atomic, refunded on failure.
  let reservation: Reservation;
  try {
    reservation = await reserveUsage(ctx);
  } catch (err: any) {
    if (err instanceof TtsError) {
      await updateInputStatus(inputId, 'validation_failed', err.code, err.message);
    }
    throw err;
  }

  if (cachedKey) return finalize(ctx, cachedKey, true);

  let objectKey: string;
  try {
    const audio = await synthesizeAudio(ctx);
    objectKey = await storeAudio(ctx, audio);
  } catch (e) {
    console.error('generation_failed', e);
    await releaseUsage(ctx, reservation);
    await recordGeneration(ctx, '', false, 'failed');
    await updateInputStatus(inputId, 'provider_failed', 'generation_failed', String(e));
    // Auto-busy: a provider failure gets the honest busy notice + retry, not an error.
    return busyResult(ctx.lang, ctx.chars);
  }
  return finalize(ctx, objectKey, false);
}

async function saveInputEarly(input: GenerateInput, text: string): Promise<InputId> {
  try {
    // Instant in-memory lookup so the hash matches the generation hash without DB delay.
    const voice = getVoiceSync(input.voiceId) ?? null;
    const stored = text.length > INPUT_STORE_MAX_CHARS ? text.slice(0, INPUT_STORE_MAX_CHARS) : text;
    return await insertInput({
      content: stored,
      contentHash: contentHash({
        text, lang: input.lang, voice: input.voiceId, speed: input.speed, pitch: input.pitch, provider: voice?.provider ?? 'unknown',
      }),
      charCount: text.length,
      isFlagged: false,
      flagReason: null,
      subjectId: input.subjectId,
      customerId: input.customerId,
      ipHash: hashIp(input.ip),
      country: input.country,
      lang: input.lang,
      voiceId: input.voiceId,
      speed: input.speed,
      status: 'live',
    });
  } catch (e) {
    // Saving the input must never block generation.
    console.error('input_save_failed', e);
    return null;
  }
}

async function validateRequest(input: GenerateInput, ipHash: string, inputId: InputId): Promise<Ctx> {
  const text = input.text;

  const brand = await getBrand(config.defaultBrandId);
  if (!brand) throw new TtsError('server_error');

  // Validate language and voice model against live database (models_voices & tts_languages/tts_langugae)
  const validatedSelection = await validateTtsSelectionAgainstDb(input.lang, input.voiceId);

  // If brand configuration has explicit allowed_language_codes restriction, check it
  if (brand.allowed_language_codes && brand.allowed_language_codes.length > 0) {
    if (!brand.allowed_language_codes.includes(validatedSelection.languageCode)) {
      throw new TtsError('unsupported_language');
    }
  }

  // Resolve trusted voice configuration directly from the database record
  const voice: VoiceRow = {
    id: validatedSelection.voiceId,
    language_code: validatedSelection.languageCode,
    display_name: validatedSelection.displayName,
    gender: validatedSelection.gender,
    provider: validatedSelection.provider,
    tier: validatedSelection.tier,
    cost_per_millchar: validatedSelection.costPerMillchar,
    cost_currency: validatedSelection.costCurrency,
    preview_url: validatedSelection.previewUrl,
    sort_order: 0,
  };

  const customerId = input.customerId ?? null;
  const userTier = input.userTier ?? 'free';

  // entitlements from the plans table
  const limitTier = tierOf(customerId, userTier);
  const limits = await getPlanLimits(brand.id, limitTier);
  if (voice.tier === 'paid' && !limits.allowPremiumVoices) throw new TtsError('voice_not_allowed');

  const chars = text.length;
  // per-request: tier limit, optionally lowered further by the global per_request_hard_ceiling key
  const ceiling = Math.min(
    limits.reqChars,
    await getConfigInt('per_request_hard_ceiling', config.maxCharsHardCeiling, config.maxCharsHardCeiling),
  );
  if (chars > ceiling) throw new TtsError('text_too_long');

  // Strict character allowance check (500 chars guest, fresh 500 chars free, plan limit paid)
  const allowanceOutcome = await validateAllowanceForGeneration({
    charCount: chars,
    customerId,
    subjectId: input.subjectId,
  });

  if (!allowanceOutcome.valid) {
    if (allowanceOutcome.code === 'daily_limit_reached') {
      throw new TtsError('daily_limit_reached');
    }
    throw new TtsError('text_too_long');
  }

  return {
    ...input,
    lang: validatedSelection.languageCode,
    voiceId: validatedSelection.voiceId,
    customerId,
    userTier,
    userCategory: input.userCategory ?? 'human',
    limitTier,
    limits,
    subjectKey: customerId ?? input.subjectId,
    ipHash,
    chars,
    hash: contentHash({
      text,
      lang: validatedSelection.languageCode,
      voice: validatedSelection.voiceId,
      speed: input.speed,
      pitch: input.pitch,
      provider: voice.provider,
    }),
    voice,
    brandId: brand.id,
    provider: voice.provider,
    inputId,
  };
}

async function findInCache(ctx: Ctx): Promise<string | null> {
  return findCachedAudio(ctx.hash);
}

async function overGlobalCap(chars: number): Promise<boolean> {
  // config can lower, never exceed the code cap
  const dailyCap = await getConfigInt('daily_safety_cap', config.dailySafetyCap, config.dailySafetyCap);
  return (await todayTotalChars()) + chars > dailyCap;
}

async function reserveUsage(ctx: Ctx): Promise<Reservation> {
  // Paid credit tier: debit characters using Supabase spend_credits
  if (ctx.limitTier === 'paid' && ctx.customerId && ctx.inputId) {
    const debit = await spendUserCredits(ctx.customerId, ctx.chars, ctx.inputId);
    if (!debit.success) {
      throw new TtsError('insufficient_credits');
    }
    return { ipKey: null };
  }

  // Free / Anonymous quota path
  // Per subject (cookie / account): the real per-user limits across all windows.
  const subj = await reserveQuota(ctx.brandId, ctx.subjectKey, ctx.chars, ctx.limits);
  if (subj !== 'ok') throw new TtsError(QUOTA_ERROR[subj]);

  // Per IP hash: generous ceiling against cookie clearing / incognito (from the plan; 0 = off).
  const ipApplies = ctx.limits.ipDayChars > 0 || ctx.limits.ipDayGenerations > 0;
  if (!ipApplies) return { ipKey: null };

  const ipKey = `ip:${ctx.ipHash}`;
  let ipRes: QuotaResult;
  try {
    ipRes = await reserveQuota(ctx.brandId, ipKey, ctx.chars, {
      dayChars: ctx.limits.ipDayChars, weekChars: 0, monthChars: 0, dayGenerations: ctx.limits.ipDayGenerations,
    });
  } catch (e) {
    // RPC error: give back the subject reservation so the user is not charged for nothing
    await refundQuota(ctx.brandId, ctx.subjectKey, ctx.chars);
    throw e;
  }
  if (ipRes !== 'ok') {
    await refundQuota(ctx.brandId, ctx.subjectKey, ctx.chars);
    throw new TtsError(QUOTA_ERROR[ipRes]);
  }
  return { ipKey };
}

async function releaseUsage(ctx: Ctx, r: Reservation): Promise<void> {
  if (ctx.limitTier === 'paid' && ctx.inputId) {
    await refundUserCredits(ctx.inputId);
    return;
  }
  await refundQuota(ctx.brandId, ctx.subjectKey, ctx.chars);
  if (r.ipKey) await refundQuota(ctx.brandId, r.ipKey, ctx.chars);
}

async function synthesizeAudio(ctx: Ctx): Promise<Buffer> {
  const stripEmojis = await getConfigBool('strip_emojis', true);
  const textForSynth = stripEmojis ? sanitizeTtsText(ctx.text) : ctx.text;
  const provider = selectProvider(ctx.provider);
  return provider.synthesize({
    text: textForSynth || ctx.text,
    lang: ctx.lang,
    voice: ctx.voiceId,
    speed: ctx.speed,
    pitch: ctx.pitch ?? 0,
  });
}

async function storeAudio(ctx: Ctx, audio: Buffer): Promise<string> {
  const storage = await getStorage();
  const key = audioObjectKey(ctx.userTier, ctx.hash);
  await storage.put(key, audio, 'audio/mpeg');
  return key;
}

// ---- busy / mock helpers ----

async function busyResult(lang: string, chars: number): Promise<GenerateResult> {
  const message = await getConfigValue('tts_busy_message', DEFAULT_BUSY_MESSAGE);
  const url = await sampleUrl([`samples/system-busy-${lang}.mp3`, 'samples/system-busy.mp3']);
  return { url, cached: false, chars, busy: true, message };
}

async function mockResult(ctx: Ctx): Promise<GenerateResult> {
  const gender = ctx.voice.gender === 'male' ? 'male' : 'female';
  const url = await sampleUrl([`samples/mock-${ctx.lang}-${gender}.mp3`, `samples/mock-${gender}.mp3`]);
  return { url, cached: false, chars: ctx.chars, mock: true };
}

// First sample key that resolves wins; '' if none (frontend shows the message only).
async function sampleUrl(keys: string[]): Promise<string> {
  const storage = await getStorage();
  for (const key of keys) {
    try {
      const url = await storage.url(key, config.signedUrlTtlSeconds);
      if (url) return url;
    } catch {
      // missing sample: try the next fallback
    }
  }
  return '';
}

// ---- logging ----

async function recordGeneration(ctx: Ctx, objectKey: string, cacheHit: boolean, status: 'success' | 'failed') {
  const fxRate = await getActiveRate(ctx.voice.cost_currency, config.baseCurrency);
  const costSrc = cacheHit ? 0 : (ctx.chars / 1_000_000) * ctx.voice.cost_per_millchar;

  // Calculate expiration timestamp
  // Guest: 30 minutes
  // Logged-in Free: 24 hours
  // Paid: 30 days
  let expiresAt: string;
  if (!ctx.customerId) {
    expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  } else if (ctx.userTier === 'free') {
    expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  } else {
    expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  }

  await logGeneration({
    brandId: ctx.brandId, customerId: ctx.customerId, anonSubjectId: ctx.subjectId,
    userCategory: ctx.userCategory, inputId: ctx.inputId, contentHash: ctx.hash, charCount: ctx.chars,
    languageCode: ctx.lang, voiceId: ctx.voiceId, voiceTier: ctx.voice.tier,
    costSourceCurrency: ctx.voice.cost_currency, costPerMillcharSrc: ctx.voice.cost_per_millchar,
    fxRateToInr: fxRate, estimatedCostSrc: Number(costSrc.toFixed(6)),
    estimatedCostInr: Number((costSrc * fxRate).toFixed(6)),
    speakingRate: ctx.speed, provider: ctx.provider, isCacheHit: cacheHit,
    audioObjectKey: objectKey, countryCode: ctx.country, ipHash: ctx.ipHash,
    tier: ctx.userTier, isFlagged: false, status, expiresAt,
    continentCode: ctx.meta?.continentCode ?? null,
    regionCode: ctx.meta?.regionCode ?? null,
    city: ctx.meta?.city ?? null,
    timezone: ctx.meta?.timezone ?? null,
    latitude: ctx.meta?.latitude ?? null,
    longitude: ctx.meta?.longitude ?? null,
    postalCode: ctx.meta?.postalCode ?? null,
    asn: ctx.meta?.asn ?? null,
    deviceType: ctx.meta?.deviceType ?? null,
    browserFamily: ctx.meta?.browserFamily ?? null,
    osFamily: ctx.meta?.osFamily ?? null,
    browserLang: ctx.meta?.browserLang ?? null,
    referrerHost: ctx.meta?.referrerHost ?? null,
    isNewSubject: ctx.isNewSubject ?? null,
  });
}

async function finalize(ctx: Ctx, objectKey: string, cacheHit: boolean): Promise<GenerateResult> {
  await recordGeneration(ctx, objectKey, cacheHit, 'success');
  await updateInputStatus(ctx.inputId, 'generated', null, null);
  triggerBackgroundCleanup();
  const storage = await getStorage();
  const url = await storage.url(objectKey, config.signedUrlTtlSeconds);
  return { url, cached: cacheHit, chars: ctx.chars };
}