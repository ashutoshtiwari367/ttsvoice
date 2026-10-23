import type { TtsProvider } from '@/lib/tts/types';
import { googleProvider } from '@/lib/tts/providers/google';

// Route to a provider by name. Add elevenlabs/kokoro here later; nothing else changes.
export function selectProvider(providerName: string): TtsProvider {
  switch (providerName) {
    case 'google':
    default:
      return googleProvider;
    // case 'elevenlabs': return elevenLabsProvider;
    // case 'kokoro':     return kokoroProvider;
  }
}
