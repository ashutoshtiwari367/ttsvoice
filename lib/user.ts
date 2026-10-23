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
 * Returns a human-friendly display name (capitalized).
 */
export function formatDisplayName(username: string): string {
  if (!username) return "User";

  // Split on dots, underscores, or hyphens if any
  const parts = username.split(/[._-]+/).filter(Boolean);
  if (parts.length > 1) {
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
      .join(" ");
  }

  return username.charAt(0).toUpperCase() + username.slice(1);
}
