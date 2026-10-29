/**
 * ==============================================================================
 * config/control.ts — MASTER VOICE, LANGUAGE & STUDIO CONTROLS CONFIGURATION
 * ==============================================================================
 *
 * Is file me AI Voice Studio ke saare static selection options aur control values
 * ek jagah rakhe gaye hain (Languages, Voices, Speaking Styles, Speed/Pitch/Volume
 * ranges, Audio Formats, Sample Rates, aur Starter Voice Templates).
 *
 * Fayda (Why in-code instead of DB):
 * - Page load, Language selection, Voice preview aur Speech generation me DB query
 *   ka koi network delay nahi hota (0ms instant in-memory read).
 * - Nayi language, nayi voice, ya default slider settings change karni ho to sirf
 *   is ek file me update karein — Frontend UI aur Backend (`lib/tts/catalog.ts`)
 *   dono jagah automatically apply ho jayega.
 * ==============================================================================
 */

export type VoiceGender = "male" | "female";
export type VoiceTier = "free" | "paid";
export type AudioOutputFormat = "mp3" | "wav" | "ogg";

export interface Voice {
  id: string;
  label: string;
  gender: VoiceGender;
  tier?: VoiceTier;
  provider?: string;
  costPerMillchar?: number;
  costCurrency?: string;
  preview_url?: string | null;
}

export interface Language {
  code: string;
  label: string;
  flag: string;
  countryCode?: string;
  isIndian?: boolean;
  voices: Voice[];
}

export interface SpeakingStyleMode {
  id: string;
  label: string;
  /** Emoji icon used in compact VoiceControls card */
  icon: string;
  /** Icon key used in PremiumStudioWorkspace */
  studioIcon: string;
  speed: number;
  pitch: number;
}

export interface GenderFilterOption {
  id: "all" | "male" | "female";
  label: string;
  avatar?: string;
}

export interface VoicePreset {
  id: string;
  name: string;
  lang: string;
  langLabel: string;
  langFlag: string;
  voice: string;
  voiceLabel: string;
  gender: VoiceGender;
  speed: number;
  pitch: number;
  volume: number;
  style: string;
  naturalPauses: boolean;
  outputFormat: AudioOutputFormat;
  isCustom?: boolean;
}

// ── 1. STUDIO LANGUAGES & VERIFIED VOICES CATALOG ───────────────────────────
// Google Cloud TTS verified Male/Female voice IDs (0ms static array — no DB lag)
export const STUDIO_LANGUAGES: Language[] = [
  // ── Indian Languages ──
  {
    code: "hi-IN",
    label: "Hindi (हिन्दी)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "hi-IN-Wavenet-B", label: "Arjun (अर्जुन)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "hi-IN-Wavenet-A", label: "Aditi (अदिति)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "hi-IN-Wavenet-C", label: "Rohit (रोहित)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "hi-IN-Wavenet-D", label: "Priya (प्रिया)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "hi-IN-Neural2-B", label: "Kabir Studio (कबीर)", gender: "male", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
      { id: "hi-IN-Neural2-A", label: "Ananya Studio (अनन्या)", gender: "female", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
    ],
  },
  {
    code: "en-IN",
    label: "Indian English",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "en-IN-Wavenet-B", label: "Dev (Corporate & News)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-IN-Wavenet-A", label: "Isha (Natural & Smooth)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-IN-Wavenet-C", label: "Rohan (Friendly & Tech)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-IN-Wavenet-D", label: "Meera (Youthful Voice)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-IN-Neural2-B", label: "Aarav Ultra (Pro Voiceover)", gender: "male", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
      { id: "en-IN-Neural2-A", label: "Diya Ultra (Studio Voiceover)", gender: "female", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
    ],
  },
  {
    code: "ta-IN",
    label: "Tamil (தமிழ்)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "ta-IN-Wavenet-D", label: "Karthik (கார்த்திக்)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ta-IN-Wavenet-C", label: "Deepa (தீபா)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ta-IN-Wavenet-B", label: "Surya (சூர்யா)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ta-IN-Wavenet-A", label: "Vani (வாணி)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "te-IN",
    label: "Telugu (తెలుగు)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "te-IN-Standard-B", label: "Suresh (సురేష్)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "te-IN-Standard-A", label: "Lakshmi (లక్ష్మి)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "mr-IN",
    label: "Marathi (मराठी)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "mr-IN-Wavenet-B", label: "Aniket (अनिकेत)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "mr-IN-Wavenet-A", label: "Sai (साई)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "mr-IN-Wavenet-C", label: "Tanvi (तन्वी)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "bn-IN",
    label: "Bengali (বাংলা)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "bn-IN-Wavenet-D", label: "Subir (সুবীর)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "bn-IN-Wavenet-C", label: "Tithi (তিথি)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "gu-IN",
    label: "Gujarati (ગુજરાતી)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "gu-IN-Wavenet-D", label: "Harish (હરીશ)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "gu-IN-Wavenet-C", label: "Dhwani (ધ્વનિ)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "kn-IN",
    label: "Kannada (ಕನ್ನಡ)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "kn-IN-Wavenet-D", label: "Praveen (ಪ್ರವೀಣ್)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "kn-IN-Wavenet-C", label: "Kavya (ಕಾವ್ಯ)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "ml-IN",
    label: "Malayalam (മലയാളം)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "ml-IN-Wavenet-D", label: "Madhav (മാധവ്)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ml-IN-Wavenet-C", label: "Anju (അഞ്ജു)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "pa-IN",
    label: "Punjabi (ਪੰਜਾਬੀ)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "pa-IN-Wavenet-B", label: "Gurpreet (ਗੁਰਪ੍ਰੀਤ)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "pa-IN-Wavenet-A", label: "Simran (ਸਿਮਰਨ)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "ur-IN",
    label: "Urdu (اردو)",
    flag: "🇮🇳",
    countryCode: "IN",
    isIndian: true,
    voices: [
      { id: "ur-IN-Wavenet-B", label: "Tariq (طارق)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ur-IN-Wavenet-A", label: "Zoya (زویا)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },

  // ── Global Languages ──
  {
    code: "en-US",
    label: "English (US)",
    flag: "🇺🇸",
    countryCode: "US",
    voices: [
      { id: "en-US-Wavenet-D", label: "David (Commercial)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-US-Wavenet-C", label: "Emily (Casual & Friendly)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-US-Neural2-J", label: "Michael (Professional)", gender: "male", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
      { id: "en-US-Neural2-F", label: "Sarah (Warm & Natural)", gender: "female", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
    ],
  },
  {
    code: "en-GB",
    label: "English (UK)",
    flag: "🇬🇧",
    countryCode: "GB",
    voices: [
      { id: "en-GB-Wavenet-B", label: "Ryan (British Narrator)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-GB-Wavenet-A", label: "Sonia (British Classical)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "en-GB-Neural2-B", label: "Oliver (Narrator Pro)", gender: "male", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
      { id: "en-GB-Neural2-A", label: "Charlotte (BBC Style)", gender: "female", tier: "paid", provider: "google", costPerMillchar: 16, costCurrency: "USD" },
    ],
  },
  {
    code: "es-ES",
    label: "Spanish (Español)",
    flag: "🇪🇸",
    countryCode: "ES",
    voices: [
      { id: "es-ES-Wavenet-B", label: "Alvaro (Español Dinámico)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "es-ES-Wavenet-C", label: "Lucia (Español Claro)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "fr-FR",
    label: "French (Français)",
    flag: "🇫🇷",
    countryCode: "FR",
    voices: [
      { id: "fr-FR-Wavenet-B", label: "Henri (Français Élégant)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "fr-FR-Wavenet-A", label: "Celine (Français Doux)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "de-DE",
    label: "German (Deutsch)",
    flag: "🇩🇪",
    countryCode: "DE",
    voices: [
      { id: "de-DE-Wavenet-B", label: "Klaus (Deutsch Markant)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "de-DE-Wavenet-A", label: "Marlene (Deutsch Klar)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "ar-XA",
    label: "Arabic (العربية)",
    flag: "🇸🇦",
    countryCode: "SA",
    voices: [
      { id: "ar-XA-Wavenet-B", label: "Omar (عمر - صوت عميق)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ar-XA-Wavenet-A", label: "Fatima (فاطمة - فصيح)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
  {
    code: "ja-JP",
    label: "Japanese (日本語)",
    flag: "🇯🇵",
    countryCode: "JP",
    voices: [
      { id: "ja-JP-Wavenet-C", label: "Keita (健太 - 自然な声)", gender: "male", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
      { id: "ja-JP-Wavenet-A", label: "Nanami (七海 - 明るい声)", gender: "female", tier: "free", provider: "google", costPerMillchar: 4, costCurrency: "USD" },
    ],
  },
];

/** Backwards-compatible alias used across studio components */
export const ALL_LANGUAGES_CATALOG: Language[] = STUDIO_LANGUAGES;

// ── 2. GENDER FILTER OPTIONS ────────────────────────────────────────────────
export const GENDER_FILTER_OPTIONS: GenderFilterOption[] = [
  { id: "all", label: "All" },
  { id: "male", label: "Male", avatar: "/images/male-avatar.jpg" },
  { id: "female", label: "Female", avatar: "/images/female-avatar.jpg" },
];

// ── 3. SPEAKING STYLE / DELIVERY MODES ──────────────────────────────────────
/** Speaking styles shown in VoiceControls sidebar */
export const SPEAKING_STYLE_MODES: SpeakingStyleMode[] = [
  { id: "normal", label: "Normal", icon: "📊", studioIcon: "wave", speed: 1.0, pitch: 0 },
  { id: "storytelling", label: "Storytelling", icon: "📖", studioIcon: "book", speed: 0.9, pitch: -1 },
  { id: "news", label: "News", icon: "📰", studioIcon: "newspaper", speed: 1.1, pitch: 1 },
  { id: "youtube", label: "YouTube", icon: "▶️", studioIcon: "youtube", speed: 1.15, pitch: 1 },
  { id: "podcast", label: "Podcast", icon: "🎙️", studioIcon: "podcast", speed: 0.95, pitch: -1 },
  { id: "reels", label: "Reels / Shorts", icon: "🎬", studioIcon: "lightning", speed: 1.2, pitch: 2 },
  { id: "motivational", label: "Motivational", icon: "🔥", studioIcon: "wave", speed: 1.05, pitch: -2 },
  { id: "other", label: "Other", icon: "🎛️", studioIcon: "wave", speed: 1.0, pitch: 0 },
];

/** Extended styles used in PremiumStudioWorkspace */
export const STUDIO_SPEAKING_STYLES: SpeakingStyleMode[] = SPEAKING_STYLE_MODES;

// ── 4. AUDIO CONTROLS, SLIDER RANGES & DEFAULTS ─────────────────────────────
export const AUDIO_CONTROL_SETTINGS = {
  defaultLanguage: "hi-IN",
  defaultVoice: "hi-IN-Wavenet-B",
  defaultGender: "male" as VoiceGender,
  defaultStyle: "normal",
  /** Number of Voice Persons shown by default before clicking Show More */
  defaultVisibleVoices: 3,

  speed: {
    default: 1.0,
    min: 0.5,
    max: 2.0,
    step: 0.1,
  },

  pitch: {
    default: 0,
    min: -5,
    max: 5,
    step: 1,
  },

  volume: {
    default: 100,
    min: 50,
    max: 150,
    step: 5,
  },

  outputFormats: ["mp3", "wav", "ogg"] as const,
  defaultOutputFormat: "mp3" as AudioOutputFormat,

  sampleRates: ["24 kHz", "44.1 kHz", "48 kHz"] as const,
  defaultSampleRate: "44.1 kHz",

  defaultNaturalPauses: true,
  defaultAutoPlay: true,
} as const;

// ── 5. STARTER VOICE TEMPLATES / PRESETS ────────────────────────────────────
export const PRESETS_STORAGE_KEY = "tts_voice_presets_v2";

export const DEFAULT_PRESETS: VoicePreset[] = [
  {
    id: "preset-hindi-story",
    name: "Hindi Story & Audiobook",
    lang: "hi-IN",
    langLabel: "Hindi (हिन्दी)",
    langFlag: "🇮🇳",
    voice: "hi-IN-Wavenet-A",
    voiceLabel: "Aditi (अदिति)",
    gender: "female",
    speed: 0.9,
    pitch: -1,
    volume: 100,
    style: "storytelling",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
  {
    id: "preset-hindi-yt",
    name: "YouTube Tech Explainer",
    lang: "hi-IN",
    langLabel: "Hindi (हिन्दी)",
    langFlag: "🇮🇳",
    voice: "hi-IN-Wavenet-B",
    voiceLabel: "Arjun (अर्जुन)",
    gender: "male",
    speed: 1.2,
    pitch: 0,
    volume: 100,
    style: "youtube",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
  {
    id: "preset-news-anchor",
    name: "Indian English News Anchor",
    lang: "en-IN",
    langLabel: "Indian English",
    langFlag: "🇮🇳",
    voice: "en-IN-Wavenet-B",
    voiceLabel: "Dev (Corporate & News)",
    gender: "male",
    speed: 1.1,
    pitch: 0,
    volume: 100,
    style: "news",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
  {
    id: "preset-calm-female",
    name: "Smooth Dialogue & Podcast",
    lang: "en-IN",
    langLabel: "Indian English",
    langFlag: "🇮🇳",
    voice: "en-IN-Wavenet-A",
    voiceLabel: "Isha (Natural & Smooth)",
    gender: "female",
    speed: 1.0,
    pitch: 0,
    volume: 100,
    style: "normal",
    naturalPauses: true,
    outputFormat: "mp3",
    isCustom: false,
  },
];

// ── 6. CHARACTER LIMIT EXCEEDED & LOGIN PROMPT MESSAGES ─────────────────────
export interface CharLimitControl {
  badgeText: string;
  bannerTitle: string;
  guestBannerMessage: string;
  primaryLoginLabel: string;
  primaryLoginHref: string;
  secondarySignupLabel: string;
  secondarySignupHref: string;
  guestGenerateButtonText: string;
  guestGenerateSubtext: string;
  guestInfoTipText: string;
  guestInfoTipActionLabel: string;
  loggedInInfoTipText: string;
  loggedInBannerMessage: string;
  loggedInGenerateButtonText: string;
  loggedInGenerateSubtext: string;
  apiGuestLimitError: string;
  apiLoggedInLimitError: string;
}

/**
 * Jab user character limit exceed kare to dikhne wale saare messages, buttons aur links
 * yahan se configurable hain. Text ya CTA badalna ho to sirf yahan edit karein.
 */
export const CHAR_LIMIT_CONTROL: CharLimitControl = {
  /** Top badge text inside textarea when over limit */
  badgeText: "Character Limit Exceeded",

  /** Banner heading shown when character limit is exceeded */
  bannerTitle: "Character Limit Exceeded",

  /** Main message shown to Guest (unauthenticated) users — asks them to Login mainly */
  guestBannerMessage:
    "You have exceeded the 500-character guest limit. Please log in to unlock more characters and convert your full script!",

  /** Primary CTA button text & URL (Mainly asks user to Login) */
  primaryLoginLabel: "🔑 Log In Now",
  primaryLoginHref: "/login",

  /** Optional secondary button for new users (set label to "" if you want to hide it) */
  secondarySignupLabel: "Sign Up",
  secondarySignupHref: "/signup",

  /** Big main action button text when guest exceeds character limit */
  guestGenerateButtonText: "Log In to Convert Full Script",

  /** Subtext shown right below the big button when guest is over limit */
  guestGenerateSubtext:
    "Please log in to unlock extra characters and save your generated audio history!",

  /** Info tip bar shown under the script editor */
  guestInfoTipText:
    "Log in to get 500 extra characters and save your history for 24 hours.",
  guestInfoTipActionLabel: "Log In →",
  loggedInInfoTipText:
    "Your free account audio history is saved automatically for 24 hours.",

  /** Message & button text when an already logged-in user exceeds their limit */
  loggedInBannerMessage:
    "Character limit exceeded for a single conversion. Please shorten your script to convert speech.",
  loggedInGenerateButtonText: "Character Limit Exceeded • Shorten Script",
  loggedInGenerateSubtext:
    "Please shorten your script within your character limit to convert speech.",

  /** API error messages when limit is reached */
  apiGuestLimitError:
    "Guest limit is 500 characters. Please log in to unlock 1,000 characters!",
  apiLoggedInLimitError:
    "Character limit reached. Please shorten your script to convert speech.",
};

// ── 7. PAID FEATURES VISIBILITY CONTROL (CURRENTLY HIDDEN) ───────────────────
export interface PaidFeaturesControl {
  /** Master switch: false keeps all paid checkout, Pro plans & purchase UI hidden */
  enabled: boolean;
  /** Show "Billing & Subscription" option inside Profile Dropdown & Account Nav */
  showBillingInMenu: boolean;
  /** Show "Upgrade to Pro" card at the bottom of Profile Dropdown */
  showUpgradeCard: boolean;
}

/**
 * Currently all paid functions are hidden (`false`).
 * Future me paid plans live karne ke liye inhe `true` kar dein.
 */
export const PAID_FEATURES_CONTROL: PaidFeaturesControl = {
  enabled: false,
  showBillingInMenu: false,
  showUpgradeCard: false,
};

// ── 8. UNIFIED CONTROL CONFIG EXPORT ────────────────────────────────────────
export const controlConfig = {
  languages: STUDIO_LANGUAGES,
  genderFilters: GENDER_FILTER_OPTIONS,
  speakingStyles: SPEAKING_STYLE_MODES,
  studioSpeakingStyles: STUDIO_SPEAKING_STYLES,
  audio: AUDIO_CONTROL_SETTINGS,
  presets: DEFAULT_PRESETS,
  presetsStorageKey: PRESETS_STORAGE_KEY,
  charLimit: CHAR_LIMIT_CONTROL,
  paidFeatures: PAID_FEATURES_CONTROL,
} as const;

export type ControlConfig = typeof controlConfig;
export default controlConfig;

