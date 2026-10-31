/**
 * Extracts a clean username from an email address.
 * Example:
 *   "ashutoshtiwari9453@gmail.com" -> "ashutoshtiwari"
 *   "john.doe123@example.com" -> "john.doe"
 *   "rahul_verma@domain.com" -> "rahul_verma"
 */
export function extractUsername(email: string | null | undefined): string {
  if (!email || typeof email !== "string") {
    return "User";
  }

  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return "User";
  }

  // Strip trailing numbers (e.g., ashutoshtiwari9453 -> ashutoshtiwari)
  const stripped = localPart.replace(/\d+$/, "");

  // If stripping left nothing (e.g. email was 12345@gmail.com), fall back to original localPart
  return stripped || localPart;
}

/**
 * Returns a human-friendly display name (properly capitalized Title Case).
 * Converts "ASHU" -> "Ashu", "ashutoshtiwari" -> "Ashutoshtiwari",
 * "ashutosh_tiwari" -> "Ashutosh Tiwari", "JOHN DOE" -> "John Doe".
 */
export function formatDisplayName(username: string | null | undefined): string {
  if (!username || typeof username !== "string") return "User";

  const trimmed = username.trim();
  if (!trimmed) return "User";

  // Split on dots, underscores, hyphens, or spaces if any
  const parts = trimmed.split(/[._\-\s]+/).filter(Boolean);
  if (parts.length > 1) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
