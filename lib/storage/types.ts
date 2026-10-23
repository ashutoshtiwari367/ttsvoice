export interface AudioStorage {
  name: string;
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  url(key: string, ttlSeconds: number): Promise<string>;
}
