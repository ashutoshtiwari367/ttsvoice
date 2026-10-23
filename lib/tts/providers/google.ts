import textToSpeech from '@google-cloud/text-to-speech';
import type { TtsProvider, SynthesizeParams } from '@/lib/tts/types';

let client: InstanceType<typeof textToSpeech.TextToSpeechClient> | null = null;

function getClient() {
  if (client) return client;

  // 1. Direct JSON string in GOOGLE_CREDENTIALS_JSON
  const json = process.env.GOOGLE_CREDENTIALS_JSON;
  if (json) {
    try {
      const c = JSON.parse(json);
      const privateKey = c.private_key
        ? c.private_key.replace(/\\n/g, '\n')
        : undefined;
      client = new textToSpeech.TextToSpeechClient({
        projectId: c.project_id,
        credentials: {
          client_email: c.client_email,
          private_key: privateKey,
        },
      });
      return client;
    } catch (e) {
      console.error('Failed to parse GOOGLE_CREDENTIALS_JSON', e);
    }
  }

  // 2. Separate environment variables
  if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
    client = new textToSpeech.TextToSpeechClient({
      projectId: process.env.GOOGLE_PROJECT_ID,
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });
    return client;
  }

  // 3. File path in GOOGLE_APPLICATION_CREDENTIALS or Google default credentials
  client = new textToSpeech.TextToSpeechClient();
  return client;
}

import { sanitizeTtsText } from '@/lib/tts/textSanitizer';

export const googleProvider: TtsProvider = {
  name: 'google',
  async synthesize({ text, lang, voice, speed }: SynthesizeParams): Promise<Buffer> {
    // R4: Strip emojis/symbols before sending to Google, keep punctuation
    const textForGoogle = sanitizeTtsText(text) || text;
    const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GOOGLE_API_KEY;

    // Direct Google Cloud Text-to-Speech REST API (if API Key provided)
    if (apiKey) {
      const response = await fetch(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { text: textForGoogle },
            voice: { languageCode: lang, name: voice },
            audioConfig: { audioEncoding: 'MP3', speakingRate: speed },
          }),
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errDetail =
          errJson.error?.message ||
          `Google TTS HTTP ${response.status}: ${response.statusText}`;
        console.error('google_rest_tts_error', errDetail);
        throw new Error(`google_tts_failed: ${errDetail}`);
      }

      const data = await response.json();
      if (!data.audioContent) {
        throw new Error('google: empty audioContent from REST API');
      }

      return Buffer.from(data.audioContent, 'base64');
    }

    // Google Cloud SDK client (if Service Account provided)
    const [resp] = await getClient().synthesizeSpeech({
      input: { text: textForGoogle },
      voice: { languageCode: lang, name: voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: speed },
    });

    if (!resp.audioContent) {
      throw new Error('google: empty audioContent from SDK client');
    }

    return Buffer.from(resp.audioContent as Uint8Array);
  },
};
