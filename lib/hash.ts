import { createHash } from 'crypto';
export function normalizeText(t: string): string { return t.replace(/\s+/g, ' ').trim(); }
export function sha256(s: string): string { return createHash('sha256').update(s, 'utf8').digest('hex'); }
export function contentHash(p: { text: string; lang: string; voice: string; speed: number; pitch?: number; provider: string; }): string {
  const parts = [normalizeText(p.text), p.lang, p.voice, p.speed.toFixed(2), p.provider];
  if (typeof p.pitch === 'number' && p.pitch !== 0) {
    parts.push(`p:${p.pitch.toFixed(1)}`);
  }
  return sha256(parts.join('|'));
}
export function hashIp(ip: string): string { return sha256('ip|' + ip).slice(0, 32); }
