import type { User } from "@supabase/supabase-js";
import { AUDIO_CONTROL_SETTINGS, type AudioOutputFormat } from "@/config/control";

export const USER_PREFS_STORAGE_KEY = "tts_user_preferences_v1";
export const FAVORITE_VOICES_STORAGE_KEY = "tts_favorite_voices_v1";
export const AUTH_USER_CACHE_KEY = "tts_cached_auth_user_v1";
export const ALLOWANCE_CACHE_KEY = "tts_cached_allowance_v1";

export interface NotificationPreferences {
  lowCreditAlerts: boolean;
  expiryReminders: boolean;
  productUpdates: boolean;
}

export interface UserTTSPreferences {
  defaultLanguage: string;
  defaultVoice: string;
  defaultStyle: string;
  defaultSpeed: number;
  defaultPitch: number;
  defaultVolume: number;
  outputFormat: AudioOutputFormat;
  naturalPauses: boolean;
  autoPlay: boolean;
  notifications: NotificationPreferences;
}

export interface FavoriteVoiceItem {
  voiceId: string;
  langCode: string;
  voiceLabel: string;
  langLabel: string;
  langFlag: string;
  gender: "male" | "female";
  addedAt: string;
}

export const DEFAULT_USER_PREFERENCES: UserTTSPreferences = {
  defaultLanguage: AUDIO_CONTROL_SETTINGS.defaultLanguage,
  defaultVoice: AUDIO_CONTROL_SETTINGS.defaultVoice,
  defaultStyle: AUDIO_CONTROL_SETTINGS.defaultStyle,
  defaultSpeed: AUDIO_CONTROL_SETTINGS.speed.default,
  defaultPitch: AUDIO_CONTROL_SETTINGS.pitch.default,
  defaultVolume: AUDIO_CONTROL_SETTINGS.volume.default,
  outputFormat: AUDIO_CONTROL_SETTINGS.defaultOutputFormat,
  naturalPauses: AUDIO_CONTROL_SETTINGS.defaultNaturalPauses,
  autoPlay: AUDIO_CONTROL_SETTINGS.defaultAutoPlay,
  notifications: {
    lowCreditAlerts: true,
    expiryReminders: true,
    productUpdates: false,
  },
};

export function getUserPreferences(): UserTTSPreferences {
  if (typeof window === "undefined") return DEFAULT_USER_PREFERENCES;
  try {
    const raw = localStorage.getItem(USER_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_USER_PREFERENCES,
      ...parsed,
      notifications: {
        ...DEFAULT_USER_PREFERENCES.notifications,
        ...(parsed?.notifications || {}),
      },
    };
  } catch {
    return DEFAULT_USER_PREFERENCES;
  }
}

export function saveUserPreferences(prefs: UserTTSPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new CustomEvent("tts-preferences-updated", { detail: prefs }));
  } catch {
    // ignore storage errors
  }
}

function hasSupabaseAuthCookie(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split(";")
    .some((c) => {
      const name = c.trim().split("=")[0] || "";
      return name.startsWith("sb-") || name.includes("-auth-token");
    });
}

export function getCachedAuthUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    if (!hasSupabaseAuthCookie()) {
      localStorage.removeItem(AUTH_USER_CACHE_KEY);
      return null;
    }
    const raw = localStorage.getItem(AUTH_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed.id === "string" ? (parsed as User) : null;
  } catch {
    return null;
  }
}

export function setCachedAuthUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!user) {
      localStorage.removeItem(AUTH_USER_CACHE_KEY);
    } else {
      localStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user));
    }
  } catch {
    // ignore storage errors
  }
}

export function getCachedAllowance<T>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ALLOWANCE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.isAuthenticated && !hasSupabaseAuthCookie()) {
      localStorage.removeItem(ALLOWANCE_CACHE_KEY);
      return null;
    }
    return parsed as T;
  } catch {
    return null;
  }
}

export function setCachedAllowance<T>(allowance: T | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!allowance) {
      localStorage.removeItem(ALLOWANCE_CACHE_KEY);
    } else {
      localStorage.setItem(ALLOWANCE_CACHE_KEY, JSON.stringify(allowance));
    }
  } catch {
    // ignore storage errors
  }
}

export function clearAccountClientCaches(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(AUTH_USER_CACHE_KEY);
    localStorage.removeItem(ALLOWANCE_CACHE_KEY);
    window.dispatchEvent(new Event("auth-changed"));
  } catch {
    // ignore
  }
}

export function getFavoriteVoices(): FavoriteVoiceItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FAVORITE_VOICES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFavoriteVoices(items: FavoriteVoiceItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(FAVORITE_VOICES_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent("tts-saved-voices-updated", { detail: items }));
  } catch {
    // ignore
  }
}

export function toggleFavoriteVoiceItem(item: Omit<FavoriteVoiceItem, "addedAt">): {
  favorites: FavoriteVoiceItem[];
  isSaved: boolean;
} {
  const current = getFavoriteVoices();
  const exists = current.some((v) => v.voiceId === item.voiceId);
  const next = exists
    ? current.filter((v) => v.voiceId !== item.voiceId)
    : [{ ...item, addedAt: new Date().toISOString() }, ...current];
  saveFavoriteVoices(next);
  return { favorites: next, isSaved: !exists };
}

/**
 * Extracts the uppercase first letter of the logged-in user's email.
 * Example: "ashutosh@gmail.com" -> "A"
 */
export function getEmailAvatarLetter(email?: string | null): string {
  const trimmed = (email || "").trim();
  if (!trimmed) return "U";
  const firstChar = trimmed.charAt(0).toUpperCase();
  return /[A-Z0-9]/i.test(firstChar) ? firstChar : "U";
}

