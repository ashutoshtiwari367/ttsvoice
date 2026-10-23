import { createHash } from 'crypto';
export function normalizeText(t: string): string { return t.replace(/\s+/g, ' ').trim(); }
export function sha256(s: string): string { return createHash('sha256').update(s, 'utf8').digest('hex'); }
export function contentHash(p: { text: string; lang: string; voice: string; speed: number; provider: string; }): string {
  return sha256([normalizeText(p.text), p.lang, p.voice, p.speed.toFixed(2), p.provider].join('|'));
}
export function hashIp(ip: string): string { return sha256('ip|' + ip).slice(0, 32); }
