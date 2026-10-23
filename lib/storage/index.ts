import { config } from '@/lib/config';
import type { AudioStorage } from '@/lib/storage/types';
let impl: AudioStorage | null = null;
export async function getStorage(): Promise<AudioStorage> {
  if (impl) return impl;
  if (config.storageProvider === 'r2') impl = (await import('@/lib/storage/r2')).r2Storage;
  else impl = (await import('@/lib/storage/supabase')).supabaseStorage;
  return impl;
}
export type { AudioStorage };
