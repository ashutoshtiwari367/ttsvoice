export interface LanguageDef {
  id: string;
  name: string;
  nativeName: string;
  countryCode: string;
  flag: string;
  isIndian?: boolean;
}

export const languages: LanguageDef[] = [
  // Row 1: 6 languages
  { id: "hi-IN", name: "Hindi", nativeName: "हिन्दी", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "en-IN", name: "Indian English", nativeName: "Indian English", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "as-IN", name: "Assamese", nativeName: "অসমীয়া", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "bn-IN", name: "Bengali", nativeName: "বাংলা", countryCode: "BD", flag: "🇧🇩", isIndian: true },
  { id: "gu-IN", name: "Gujarati", nativeName: "ગુજરાતી", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "kn-IN", name: "Kannada", nativeName: "ಕನ್ನಡ", countryCode: "IN", flag: "🇮🇳", isIndian: true },

  // Row 2: 6 languages
  { id: "ml-IN", name: "Malayalam", nativeName: "മലയാളം", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "mr-IN", name: "Marathi", nativeName: "मराठी", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "pa-IN", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "ta-IN", name: "Tamil", nativeName: "தமிழ்", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "te-IN", name: "Telugu", nativeName: "తెలుగు", countryCode: "IN", flag: "🇮🇳", isIndian: true },
  { id: "ur-IN", name: "Urdu", nativeName: "اردو", countryCode: "PK", flag: "🇵🇰", isIndian: true },

  // Row 3: 5 languages
  { id: "en-US", name: "English", nativeName: "English (US)", countryCode: "US", flag: "🇺🇸" },
  { id: "af-ZA", name: "Afrikaans", nativeName: "Afrikaans", countryCode: "ZA", flag: "🇿🇦" },
  { id: "ar-XA", name: "Arabic", nativeName: "العربية", countryCode: "SA", flag: "🇸🇦" },
  { id: "hy-AM", name: "Armenian", nativeName: "Հայերեն", countryCode: "AM", flag: "🇦🇲" },
  { id: "az-AZ", name: "Azerbaijani", nativeName: "Azərbaycan", countryCode: "AZ", flag: "🇦🇿" },

  // Row 4: 5 languages
  { id: "be-BY", name: "Belarusian", nativeName: "Беларуская", countryCode: "BY", flag: "🇧🇾" },
  { id: "bs-BA", name: "Bosnian", nativeName: "Bosanski", countryCode: "BA", flag: "🇧🇦" },
  { id: "bg-BG", name: "Bulgarian", nativeName: "Български", countryCode: "BG", flag: "🇧🇬" },
  { id: "de-DE", name: "German", nativeName: "Deutsch", countryCode: "DE", flag: "🇩🇪" },
  { id: "es-ES", name: "Spanish", nativeName: "Español", countryCode: "ES", flag: "🇪🇸" },

  // Row 5: 6 languages
  { id: "fr-FR", name: "French", nativeName: "Français", countryCode: "FR", flag: "🇫🇷" },
  { id: "id-ID", name: "Indonesian", nativeName: "Bahasa Indonesia", countryCode: "ID", flag: "🇮🇩" },
  { id: "it-IT", name: "Italian", nativeName: "Italiano", countryCode: "IT", flag: "🇮🇹" },
  { id: "ja-JP", name: "Japanese", nativeName: "日本語", countryCode: "JP", flag: "🇯🇵" },
  { id: "ko-KR", name: "Korean", nativeName: "한국어", countryCode: "KR", flag: "🇰🇷" },
  { id: "nl-NL", name: "Dutch", nativeName: "Nederlands", countryCode: "NL", flag: "🇳🇱" },

  // Row 6: 6 languages
  { id: "pl-PL", name: "Polish", nativeName: "Polski", countryCode: "PL", flag: "🇵🇱" },
  { id: "pt-PT", name: "Portuguese", nativeName: "Português", countryCode: "PT", flag: "🇵🇹" },
  { id: "ru-RU", name: "Russian", nativeName: "Русский", countryCode: "RU", flag: "🇷🇺" },
  { id: "tr-TR", name: "Turkish", nativeName: "Türkçe", countryCode: "TR", flag: "🇹🇷" },
  { id: "vi-VN", name: "Vietnamese", nativeName: "Tiếng Việt", countryCode: "VN", flag: "🇻🇳" },
  { id: "cmn-CN", name: "Chinese", nativeName: "中文", countryCode: "CN", flag: "🇨🇳" },
];