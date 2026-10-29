import { NextRequest, NextResponse } from 'next/server';
import { getVoiceSync } from '@/lib/tts/catalog';
import { selectProvider } from '@/lib/tts/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Bounded in-memory cache so voice previews are synthesized once and served instantly
const MAX_CACHE_ENTRIES = 150;
const previewCache = new Map<string, Buffer>();

function getSampleSentence(lang: string, voiceName: string, gender: string): string {
  const shortName = voiceName.split(' ')[0] || 'AI';
  const isFemale = gender === 'female';

  switch (lang) {
    case 'hi-IN':
      return isFemale
        ? `नमस्ते, मेरा नाम ${shortName} है। आप मेरी स्वाभाविक हिंदी आवाज़ सुन रहे हैं।`
        : `नमस्ते, मेरा नाम ${shortName} है। आप मेरी स्पष्ट और प्राकृतिक हिंदी आवाज़ सुन रहे हैं।`;
    case 'en-IN':
      return `Hello, I am ${shortName}. This is a studio preview of my natural Indian English voice.`;
    case 'ta-IN':
      return 'வணக்கம்! இது எனது இயல்பான தமிழ் குரல் மாதிரி.';
    case 'te-IN':
      return 'నమస్కారం! ఇది నా సహజమైన తెలుగు వాయిస్ నమూనా.';
    case 'mr-IN':
      return 'नमस्कार! आपण माझा नैसर्गिक मराठी आवाज ऐकत आहात.';
    case 'bn-IN':
      return 'নমস্কার! আপনি আমার স্বাভাবিক বাংলা কণ্ঠস্বর শুনছেন।';
    case 'gu-IN':
      return 'નમસ્તે! તમે મારો કુદરતી ગુજરાતી અવાજ સાંભળી રહ્યા છો.';
    case 'kn-IN':
      return 'ನಮಸ್ಕಾರ! ಇದು ನನ್ನ ಸಹಜವಾದ ಕನ್ನಡ ಧ್ವನಿಯ ಮಾದರಿ.';
    case 'ml-IN':
      return 'നമസ്കാരം! ഇത് എന്റെ സ്വാഭാവിക മലയാളം ശബ്ദ സാമ്പിളാണ്.';
    case 'pa-IN':
      return 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਤੁਸੀਂ ਮੇਰੀ ਕੁਦਰਤੀ ਪੰਜਾਬੀ ਆਵਾਜ਼ ਸੁਣ ਰਹੇ ਹੋ।';
    case 'ur-IN':
      return 'آداب! آپ میری قدرتی اردو آواز کا نمونہ سن رہے ہیں۔';
    case 'or-IN':
      return 'ନମସ୍କାର! ଏହା ମୋର ପ୍ରାକୃତିକ ଓଡ଼ିଆ ସ୍ୱରର ନମୁନା ଅଟେ।';
    case 'as-IN':
      return 'নমস্কাৰ! আপুনি মোৰ স্বাভাৱিক অসমীয়া কণ্ঠস্বৰ শুনি আছে।';
    case 'es-ES':
      return `¡Hola! Soy ${shortName}. Estás escuchando una muestra de mi voz natural en español.`;
    case 'fr-FR':
      return `Bonjour ! Je suis ${shortName}. Voici un aperçu de ma voix naturelle en français.`;
    case 'de-DE':
      return `Hallo! Ich bin ${shortName}. Sie hören eine Vorschau meiner natürlichen deutschen Stimme.`;
    case 'ar-XA':
      return 'مرحباً! أنت تستمع الآن إلى عينة من صوتي العربي الطبيعي.';
    case 'ja-JP':
      return 'こんにちは！私の自然な日本語の音声サンプルをお聴きいただいています。';
    default:
      return `Hello, I am ${shortName}. You are listening to a preview of my natural studio voice.`;
  }
}

export async function POST(req: NextRequest) {
  let body: { lang?: string; voice?: string; speed?: number; pitch?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const lang = typeof body.lang === 'string' ? body.lang.trim() : '';
  const voiceId = typeof body.voice === 'string' ? body.voice.trim() : '';
  const rawSpeed = typeof body.speed === 'number' && Number.isFinite(body.speed) ? body.speed : 1.0;
  const speed = Math.max(0.5, Math.min(2.0, Number(rawSpeed.toFixed(1))));
  const rawPitch = typeof body.pitch === 'number' && Number.isFinite(body.pitch) ? body.pitch : 0;
  const pitch = Math.max(-10, Math.min(10, Math.round(rawPitch)));

  if (!lang || !voiceId) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  // Instant 0ms in-memory lookup from `lib/tts/catalog` (`config/control.ts`)
  const voiceRow = getVoiceSync(voiceId);

  if (!voiceRow || voiceRow.language_code !== lang) {
    return NextResponse.json({ error: 'invalid_voice' }, { status: 400 });
  }

  const cacheKey = `${lang}|${voiceId}|${speed.toFixed(1)}|${pitch}`;
  const cached = previewCache.get(cacheKey);
  if (cached) {
    return new NextResponse(new Uint8Array(cached), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  }

  const sampleText = getSampleSentence(lang, voiceRow.display_name, voiceRow.gender);

  try {
    const provider = selectProvider(voiceRow.provider || 'google');
    const audio = await provider.synthesize({
      text: sampleText,
      lang,
      voice: voiceRow.id,
      speed,
      pitch,
    });

    if (previewCache.size >= MAX_CACHE_ENTRIES) {
      const oldestKey = previewCache.keys().next().value;
      if (oldestKey) previewCache.delete(oldestKey);
    }
    previewCache.set(cacheKey, audio);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('voice_preview_error', err);
    return NextResponse.json({ error: 'preview_failed' }, { status: 502 });
  }
}

