import { admin } from '@/lib/supabase/admin';
import { config } from '@/lib/config';
import type { AudioStorage } from '@/lib/storage/types';
export const supabaseStorage: AudioStorage = {
  name: 'supabase',
  async put(key, bytes, contentType) {
    const { error } = await admin.storage.from(config.audioBucket).upload(key, bytes, { contentType, upsert: true });
    if (error) throw error;
  },
  async url(key, ttlSeconds) {
    const { data, error } = await admin.storage.from(config.audioBucket).createSignedUrl(key, ttlSeconds);
    if (error || !data) throw error ?? new Error('supabase: signed url failed');
    return data.signedUrl;
  },
  async delete(key) {
    try {
      await admin.storage.from(config.audioBucket).remove([key]);
    } catch (err) {
      console.warn('supabase_storage_delete_failed', key, err);
    }
  },
};
