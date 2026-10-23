import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';

// Active rate = latest rate_date on-or-before today, for a currency pair.
// Memory-cached; falls back to a sane default if the table is unreachable.
const cache = new Map<string, { rate: number; at: number }>();

export async function getActiveRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;
  const key = `${from}>${to}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < config.cacheTtlMs) return hit.rate;
  try {
    const { data, error } = await admin
      .from('currency_rates')
      .select('rate')
      .eq('from_currency', from)
      .eq('to_currency', to)
      .lte('rate_date', new Date().toISOString().slice(0, 10))
      .order('rate_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error || !data) throw error ?? new Error('no rate');
    const rate = Number(data.rate);
    cache.set(key, { rate, at: Date.now() });
    return rate;
  } catch {
    if (hit) return hit.rate;         // stale is better than nothing
    return from === 'USD' && to === 'INR' ? 90 : 1; // last-ditch default
  }
}
