// @ts-nocheck
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import type { AudioStorage } from '@/lib/storage/types';
let s3 = null;
function client() {
  if (s3) return s3;
  s3 = new S3Client({ region:'auto', endpoint: process.env.R2_ENDPOINT,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } });
  return s3;
}
export const r2Storage: AudioStorage = {
  name: 'r2',
  async put(key, bytes, contentType) {
    await client().send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key, Body: bytes,
      ContentType: contentType, CacheControl: 'public, max-age=31536000, immutable' }));
  },
  async url(key) { return `${process.env.R2_PUBLIC_BASE}/${key}`; },
  async delete(key) {
    try {
      const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
      await client().send(new DeleteObjectCommand({ Bucket: process.env.R2_BUCKET, Key: key }));
    } catch (err) {
      console.warn('r2_storage_delete_failed', key, err);
    }
  },
};
