export function audioObjectKey(tier: string, hash: string, date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `audio/${tier}/${y}/${m}/${d}/${hash}.mp3`;
}
