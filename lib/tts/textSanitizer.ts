/**
 * Text Sanitization for Text-to-Speech Providers (R4)
 * 
 * Requirement R4:
 * "Strip emojis/symbols before sending to Google; keep punctuation; store original"
 * 
 * Preserves:
 *  - Native text & scripts (Devanagari, Latin, Tamil, Telugu, Bengali, etc.)
 *  - Standard punctuation: . , ? ! : ; ' " - – — ( ) [ ] / …
 *  - Indian punctuation: । (danda), ॥ (double danda)
 * 
 * Strips:
 *  - Emojis, pictographs, decorative flags, emoticons, variation selectors
 */
export function sanitizeTtsText(text: string): string {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text
    // Strip Unicode Emojis and Extended Pictographs
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D\u200E\u200F]/gu, "")
    // Normalize consecutive spaces created after stripping symbols
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
