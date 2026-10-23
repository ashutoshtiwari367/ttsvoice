import type { VoiceRow, LanguageRow } from '@/lib/tts/catalog';

// Comprehensive language list covering all major Indian languages and popular global languages.
export const FALLBACK_LANGUAGES: LanguageRow[] = [
  // Indian Languages
  { code: 'hi-IN', label: 'Hindi (हिन्दी)', sort_order: 1 },
  { code: 'en-IN', label: 'Indian English', sort_order: 2 },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)', sort_order: 3 },
  { code: 'te-IN', label: 'Telugu (తెలుగు)', sort_order: 4 },
  { code: 'mr-IN', label: 'Marathi (मराठी)', sort_order: 5 },
  { code: 'bn-IN', label: 'Bengali (বাংলা)', sort_order: 6 },
  { code: 'gu-IN', label: 'Gujarati (ગુજરાતી)', sort_order: 7 },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)', sort_order: 8 },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)', sort_order: 9 },
  { code: 'pa-IN', label: 'Punjabi (ਪੰਜਾਬੀ)', sort_order: 10 },
  { code: 'ur-IN', label: 'Urdu (اردو)', sort_order: 11 },
  { code: 'or-IN', label: 'Odia (ଓଡ଼ିଆ)', sort_order: 12 },
  { code: 'as-IN', label: 'Assamese (অসমীয়া)', sort_order: 13 },
  // Global Languages
  { code: 'en-US', label: 'English (US)', sort_order: 20 },
  { code: 'en-GB', label: 'English (UK)', sort_order: 21 },
  { code: 'es-ES', label: 'Spanish (Español)', sort_order: 22 },
  { code: 'fr-FR', label: 'French (Français)', sort_order: 23 },
  { code: 'de-DE', label: 'German (Deutsch)', sort_order: 24 },
  { code: 'ar-XA', label: 'Arabic (العربية)', sort_order: 25 },
  { code: 'ja-JP', label: 'Japanese (日本語)', sort_order: 26 },
];

export const FALLBACK_VOICES: VoiceRow[] = [
  // Hindi (hi-IN)
  { id: 'hi-IN-Wavenet-A', language_code: 'hi-IN', display_name: 'Aditi (अदिति)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 1 },
  { id: 'hi-IN-Wavenet-B', language_code: 'hi-IN', display_name: 'Arjun (अर्जुन)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 2 },
  { id: 'hi-IN-Wavenet-C', language_code: 'hi-IN', display_name: 'Priya (प्रिया)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 3 },
  { id: 'hi-IN-Wavenet-D', language_code: 'hi-IN', display_name: 'Rohit (रोहित)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 4 },
  { id: 'hi-IN-Neural2-A', language_code: 'hi-IN', display_name: 'Ananya Studio (अनन्या)', gender: 'female', provider: 'google', tier: 'paid', cost_per_millchar: 16, cost_currency: 'USD', preview_url: null, sort_order: 5 },
  { id: 'hi-IN-Neural2-B', language_code: 'hi-IN', display_name: 'Kabir Studio (कबीर)', gender: 'male', provider: 'google', tier: 'paid', cost_per_millchar: 16, cost_currency: 'USD', preview_url: null, sort_order: 6 },

  // Indian English (en-IN)
  { id: 'en-IN-Wavenet-A', language_code: 'en-IN', display_name: 'Isha (Natural & Smooth)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 10 },
  { id: 'en-IN-Wavenet-B', language_code: 'en-IN', display_name: 'Dev (Corporate & News)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 11 },
  { id: 'en-IN-Wavenet-C', language_code: 'en-IN', display_name: 'Meera (Youthful Voice)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 12 },
  { id: 'en-IN-Wavenet-D', language_code: 'en-IN', display_name: 'Rohan (Friendly & Tech)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 13 },
  { id: 'en-IN-Neural2-A', language_code: 'en-IN', display_name: 'Aarav Ultra (Pro Voiceover)', gender: 'male', provider: 'google', tier: 'paid', cost_per_millchar: 16, cost_currency: 'USD', preview_url: null, sort_order: 14 },

  // Tamil (ta-IN)
  { id: 'ta-IN-Wavenet-A', language_code: 'ta-IN', display_name: 'Vani (வாணி)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 20 },
  { id: 'ta-IN-Wavenet-B', language_code: 'ta-IN', display_name: 'Karthik (கார்த்திக்)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 21 },
  { id: 'ta-IN-Wavenet-C', language_code: 'ta-IN', display_name: 'Deepa (தீபா)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 22 },

  // Telugu (te-IN)
  { id: 'te-IN-Standard-A', language_code: 'te-IN', display_name: 'Lakshmi (లక్ష్మి)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 30 },
  { id: 'te-IN-Standard-B', language_code: 'te-IN', display_name: 'Suresh (సురేష్)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 31 },

  // Marathi (mr-IN)
  { id: 'mr-IN-Wavenet-A', language_code: 'mr-IN', display_name: 'Sai (साई)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 40 },
  { id: 'mr-IN-Wavenet-B', language_code: 'mr-IN', display_name: 'Aniket (अनिकेत)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 41 },
  { id: 'mr-IN-Wavenet-C', language_code: 'mr-IN', display_name: 'Tanvi (तन्वी)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 42 },

  // Bengali (bn-IN)
  { id: 'bn-IN-Wavenet-A', language_code: 'bn-IN', display_name: 'Tithi (তিথি)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 50 },
  { id: 'bn-IN-Wavenet-B', language_code: 'bn-IN', display_name: 'Subir (সুবীর)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 51 },

  // Gujarati (gu-IN)
  { id: 'gu-IN-Wavenet-A', language_code: 'gu-IN', display_name: 'Dhara (ધારા)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 60 },
  { id: 'gu-IN-Wavenet-B', language_code: 'gu-IN', display_name: 'Harish (હરીશ)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 61 },

  // Kannada (kn-IN)
  { id: 'kn-IN-Wavenet-A', language_code: 'kn-IN', display_name: 'Sharada (ಶಾರದಾ)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 70 },
  { id: 'kn-IN-Wavenet-B', language_code: 'kn-IN', display_name: 'Chetan (ಚೇತನ್)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 71 },

  // Malayalam (ml-IN)
  { id: 'ml-IN-Wavenet-A', language_code: 'ml-IN', display_name: 'Anjali (അഞ്ജലി)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 80 },
  { id: 'ml-IN-Wavenet-B', language_code: 'ml-IN', display_name: 'Vishnu (വിഷ്ണു)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 81 },

  // Punjabi (pa-IN)
  { id: 'pa-IN-Wavenet-A', language_code: 'pa-IN', display_name: 'Simran (ਸਿਮਰਨ)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 90 },
  { id: 'pa-IN-Wavenet-B', language_code: 'pa-IN', display_name: 'Harpreet (ਹਰਪ੍ਰੀਤ)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 91 },

  // Urdu (ur-IN)
  { id: 'ur-IN-Wavenet-A', language_code: 'ur-IN', display_name: 'Zoya (زویا)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 100 },
  { id: 'ur-IN-Wavenet-B', language_code: 'ur-IN', display_name: 'Tariq (طارق)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 101 },

  // Odia (or-IN)
  { id: 'or-IN-Standard-A', language_code: 'or-IN', display_name: 'Rashmi (ରଶ୍ମି)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 110 },
  { id: 'or-IN-Standard-B', language_code: 'or-IN', display_name: 'Bikram (ବିକ୍ରମ)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 111 },

  // Assamese (as-IN)
  { id: 'as-IN-Standard-A', language_code: 'as-IN', display_name: 'Parineeti (পৰিনীতি)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 120 },
  { id: 'as-IN-Standard-B', language_code: 'as-IN', display_name: 'Bhupen (ভূপেন)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 121 },

  // English (US)
  { id: 'en-US-Journey-F', language_code: 'en-US', display_name: 'Jenny (US Studio Story)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 130 },
  { id: 'en-US-Journey-D', language_code: 'en-US', display_name: 'Guy (US Radio Host)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 131 },

  // English (UK)
  { id: 'en-GB-Wavenet-A', language_code: 'en-GB', display_name: 'Sonia (British Classical)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 140 },
  { id: 'en-GB-Wavenet-B', language_code: 'en-GB', display_name: 'Ryan (British Narrator)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 141 },

  // Spanish (es-ES)
  { id: 'es-ES-Wavenet-B', language_code: 'es-ES', display_name: 'Lucia (Español Claro)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 150 },
  { id: 'es-ES-Wavenet-C', language_code: 'es-ES', display_name: 'Alvaro (Español Dinámico)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 151 },

  // French (fr-FR)
  { id: 'fr-FR-Wavenet-A', language_code: 'fr-FR', display_name: 'Celine (Français Doux)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 160 },
  { id: 'fr-FR-Wavenet-B', language_code: 'fr-FR', display_name: 'Henri (Français Élégant)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 161 },

  // German (de-DE)
  { id: 'de-DE-Wavenet-A', language_code: 'de-DE', display_name: 'Marlene (Deutsch Klar)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 170 },
  { id: 'de-DE-Wavenet-B', language_code: 'de-DE', display_name: 'Klaus (Deutsch Markant)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 171 },

  // Arabic (ar-XA)
  { id: 'ar-XA-Wavenet-A', language_code: 'ar-XA', display_name: 'Fatima (فاطمة - فصيح)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 180 },
  { id: 'ar-XA-Wavenet-B', language_code: 'ar-XA', display_name: 'Omar (عمر - صوت عميق)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 181 },

  // Japanese (ja-JP)
  { id: 'ja-JP-Wavenet-A', language_code: 'ja-JP', display_name: 'Nanami (七海 - 明るい声)', gender: 'female', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 190 },
  { id: 'ja-JP-Wavenet-C', language_code: 'ja-JP', display_name: 'Keita (健太 - 自然な声)', gender: 'male', provider: 'google', tier: 'free', cost_per_millchar: 4, cost_currency: 'USD', preview_url: null, sort_order: 191 },
];
