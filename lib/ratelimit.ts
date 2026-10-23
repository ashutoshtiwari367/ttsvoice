import { config } from '@/lib/config';
const hits = new Map<string, number[]>();
const WINDOW_MS = 60_000;
export function allowBurst(key: string): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= config.burstMaxPerMinute) { hits.set(key, arr); return false; }
  arr.push(now); hits.set(key, arr); return true;
}
setInterval(() => {
  const now = Date.now();
  for (const [k, arr] of hits) {
    const kept = arr.filter((t) => now - t < WINDOW_MS);
    if (kept.length === 0) hits.delete(k); else hits.set(k, kept);
  }
}, WINDOW_MS).unref?.();
