import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { config } from '@/lib/config';

export function getClientIp(req: NextRequest): string {
  return req.headers.get('cf-connecting-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || '0.0.0.0';
}
export function getCountry(req: NextRequest): string | null {
  const c = req.headers.get('cf-ipcountry');
  return c && c !== 'XX' ? c : null;
}
export function getSubject(req: NextRequest): { sid: string; isNew: boolean } {
  const existing = req.cookies.get(config.subjectCookie)?.value;
  if (existing) return { sid: existing, isNew: false };
  return { sid: randomUUID(), isNew: true };
}

// ---- request metadata (Cloudflare location headers + browser headers) ----
// Location headers need Cloudflare: Rules > Managed Transforms > "Add visitor location headers".
// ASN needs a Transform Rule setting request header `x-client-asn` = ip.src.asnum.
export interface RequestMeta {
  continentCode: string | null;
  regionCode: string | null;
  city: string | null;
  timezone: string | null;
  latitude: number | null;
  longitude: number | null;
  postalCode: string | null;
  asn: number | null;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'bot' | 'unknown';
  browserFamily: string | null;
  osFamily: string | null;
  browserLang: string | null;
  referrerHost: string | null;
}

function clip(v: string | null, max: number): string | null {
  if (!v) return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

const BOT_UA = /bot|crawl|spider|slurp|curl|wget|python|axios|node-fetch|go-http|java\/|postman|httpclient|headless|phantom|puppeteer|playwright/i;

function deviceTypeOf(ua: string): RequestMeta['deviceType'] {
  if (!ua) return 'unknown';
  if (BOT_UA.test(ua)) return 'bot';
  if (/ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua))) return 'tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'mobile';
  return 'desktop';
}

function browserOf(ua: string): string | null {
  if (!ua) return null;
  if (/edg\//i.test(ua)) return 'edge';
  if (/opr\/|opera/i.test(ua)) return 'opera';
  if (/samsungbrowser/i.test(ua)) return 'samsung';
  if (/ucbrowser/i.test(ua)) return 'uc';
  if (/chrome|crios/i.test(ua)) return 'chrome';
  if (/firefox|fxios/i.test(ua)) return 'firefox';
  if (/safari/i.test(ua)) return 'safari';
  return 'other';
}

function osOf(ua: string): string | null {
  if (!ua) return null;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/cros/i.test(ua)) return 'chromeos';
  if (/mac os/i.test(ua)) return 'macos';
  if (/linux/i.test(ua)) return 'linux';
  return 'other';
}

function refHostOf(ref: string | null): string | null {
  if (!ref) return null;
  try { return clip(new URL(ref).hostname, 255); } catch { return null; }
}

export function getRequestMeta(req: NextRequest): RequestMeta {
  const h = req.headers;
  const ua = h.get('user-agent') ?? '';
  const asnRaw = Number.parseInt(h.get('x-client-asn') ?? '', 10);
  const lat = Number.parseFloat(h.get('cf-iplatitude') ?? '');
  const lon = Number.parseFloat(h.get('cf-iplongitude') ?? '');
  const lang = h.get('accept-language')?.split(',')[0]?.split(';')[0] ?? null;
  return {
    continentCode: clip(h.get('cf-ipcontinent'), 2),
    regionCode: clip(h.get('cf-region-code'), 10),
    city: clip(h.get('cf-ipcity'), 100),
    timezone: clip(h.get('cf-timezone'), 64),
    latitude: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null,
    longitude: Number.isFinite(lon) && Math.abs(lon) <= 180 ? lon : null,
    postalCode: clip(h.get('cf-postal-code'), 16),
    asn: Number.isFinite(asnRaw) && asnRaw > 0 ? asnRaw : null,
    deviceType: deviceTypeOf(ua),
    browserFamily: browserOf(ua),
    osFamily: osOf(ua),
    browserLang: clip(lang, 35),
    referrerHost: refHostOf(h.get('referer')),
  };
}

const COOKIE_OPTS = { httpOnly: true, secure: true, sameSite: 'lax' as const, path: '/', maxAge: 60*60*24*365 };
export function respond(data: unknown, status: number, cookie?: { sid: string; isNew: boolean }): NextResponse {
  const res = NextResponse.json(data, { status });
  if (cookie?.isNew) res.cookies.set(config.subjectCookie, cookie.sid, COOKIE_OPTS);
  return res;
}
export type ErrorCode =
  | 'invalid_request' | 'text_too_long' | 'unsupported_language' | 'invalid_voice'
  | 'voice_not_allowed' | 'daily_limit_reached' | 'weekly_limit_reached' | 'monthly_limit_reached'
  | 'generation_limit_reached' | 'region_unavailable' | 'insufficient_credits'
  | 'blocked' | 'capacity_reached' | 'rate_limited' | 'generation_failed' | 'server_error'
  | 'turnstile_failed' | 'junk_text';
const STATUS: Record<ErrorCode, number> = {
  invalid_request:400, text_too_long:400, unsupported_language:400, invalid_voice:400,
  voice_not_allowed:403, daily_limit_reached:429, weekly_limit_reached:429, monthly_limit_reached:429,
  generation_limit_reached:429, region_unavailable:451, insufficient_credits:402,
  blocked:403, capacity_reached:503, rate_limited:429, generation_failed:502, server_error:500,
  turnstile_failed:403, junk_text:400,
};
export function errorResponse(code: ErrorCode, cookie?: { sid: string; isNew: boolean }): NextResponse {
  return respond({ error: code }, STATUS[code], cookie);
}
export class TtsError extends Error { constructor(public code: ErrorCode) { super(code); } }
