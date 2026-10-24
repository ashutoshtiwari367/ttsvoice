import { admin } from "@/lib/supabase/admin";
import { config } from "@/lib/config";

export interface UserAllowance {
  isAuthenticated: boolean;
  userType: "guest" | "free" | "premium";
  tier: "anon" | "free" | "paid";
  totalAllowance: number;
  usedChars: number;
  remainingChars: number;
  singleReqCap: number;
  historyRetentionMinutes: number;
  historyRetentionLabel: string;
  historyNotice: string;
  email: string | null;
  customerNo: number | null;
  activePlanName: string;
  isPremium: boolean;
}

export const GUEST_ALLOWANCE_CHARS = 500;
export const LOGGED_IN_FREE_ALLOWANCE_CHARS = 500;
export const GUEST_RETENTION_MINUTES = 30;
export const FREE_RETENTION_HOURS = 24;

/**
 * Calculates current allowance, used characters, and remaining limit for a user or guest.
 * - Guest (No login): 500 chars total, 30m retention.
 * - Logged-in Free: Additional 500 chars total, 24h retention.
 * - Premium: Based on paid balance / active plan, configurable retention.
 *
 * NOTE: Characters are counted ONLY from successful conversions (status = 'success').
 * Failed conversions never deduct allowance.
 * Refreshes or logouts never reset the count because usage is read from the database.
 */
export async function getUserAllowance(params: {
  customerId?: string | null;
  subjectId?: string | null;
}): Promise<UserAllowance> {
  const { customerId, subjectId } = params;

  // 1. Authenticated User Path
  if (customerId) {
    try {
      // Fetch customer, balance, and payments concurrently in parallel
      const [customerRes, balanceRes, paymentsRes] = await Promise.all([
        admin.from("customers").select("customer_no").eq("id", customerId).maybeSingle(),
        admin.from("credit_balances").select("balance").eq("customer_id", customerId).maybeSingle(),
        admin.from("payments").select("id, pack_id, status").eq("customer_id", customerId).eq("status", "paid").limit(1),
      ]);

      const customerNo = customerRes.data?.customer_no ?? null;
      const balance = Number(balanceRes.data?.balance ?? 0);
      const payments = paymentsRes.data;
      const hasPaidPlan = (payments && payments.length > 0) || balance > 0;

      if (hasPaidPlan && balance > 0) {
        // PREMIUM USER
        return {
          isAuthenticated: true,
          userType: "premium",
          tier: "paid",
          isPremium: true,
          totalAllowance: balance,
          usedChars: 0, // In credit model, balance reflects unspent characters
          remainingChars: balance,
          singleReqCap: Math.min(balance, config.maxCharsHardCeiling || 10000),
          historyRetentionMinutes: 30 * 24 * 60, // 30 days
          historyRetentionLabel: "30 Days (Extended Cloud Archive)",
          historyNotice: "Premium Cloud Archive: Audio is securely retained according to your Pro plan.",
          email: null,
          customerNo,
          activePlanName: "Pro Subscriber",
        };
      }

      // LOGGED-IN FREE USER
      // Count characters used for successful conversions on user's account
      // Note: customer_id is set only when logged in, so guest conversions are never included!
      const { data: genRows, error: genErr } = await admin
        .from("tts_generations")
        .select("char_count")
        .eq("customer_id", customerId)
        .eq("tier", "free")
        .eq("status", "success");

      const usedChars = (genRows || []).reduce(
        (sum, r) => sum + (Number(r.char_count) || 0),
        0
      );

      const totalAllowance = LOGGED_IN_FREE_ALLOWANCE_CHARS;
      const remainingChars = Math.max(0, totalAllowance - usedChars);

      return {
        isAuthenticated: true,
        userType: "free",
        tier: "free",
        isPremium: false,
        totalAllowance,
        usedChars,
        remainingChars,
        singleReqCap: Math.min(LOGGED_IN_FREE_ALLOWANCE_CHARS, remainingChars),
        historyRetentionMinutes: FREE_RETENTION_HOURS * 60, // 1440 mins = 24h
        historyRetentionLabel: "24 Hours (Account History)",
        historyNotice: "Conversion history is automatically deleted after 24 hours from creation time.",
        email: null,
        customerNo,
        activePlanName: "Logged-In Free Plan",
      };
    } catch (err) {
      console.error("get_user_allowance_auth_error", err);
    }
  }

  // 2. Guest User Path (Without Login)
  // Tracks successful conversions for this guest cookie (anon_subject_id)
  let usedChars = 0;
  if (subjectId) {
    try {
      const { data: anonRows } = await admin
        .from("tts_generations")
        .select("char_count")
        .eq("anon_subject_id", subjectId)
        .is("customer_id", null)
        .eq("status", "success");

      usedChars = (anonRows || []).reduce(
        (sum, r) => sum + (Number(r.char_count) || 0),
        0
      );
    } catch (err) {
      console.error("get_guest_allowance_error", err);
    }
  }

  const totalAllowance = GUEST_ALLOWANCE_CHARS;
  const remainingChars = Math.max(0, totalAllowance - usedChars);

  return {
    isAuthenticated: false,
    userType: "guest",
    tier: "anon",
    isPremium: false,
    totalAllowance,
    usedChars,
    remainingChars,
    singleReqCap: Math.min(GUEST_ALLOWANCE_CHARS, remainingChars),
    historyRetentionMinutes: GUEST_RETENTION_MINUTES,
    historyRetentionLabel: "30 Minutes (Guest History)",
    historyNotice: "Guest history is temporary and automatically deleted after 30 minutes.",
    email: null,
    customerNo: null,
    activePlanName: "Guest (No Login)",
  };
}

/**
 * Validates whether the requested character count is allowed.
 * Returns { valid: boolean, error?: string, code?: string }
 */
export async function validateAllowanceForGeneration(params: {
  charCount: number;
  customerId?: string | null;
  subjectId?: string | null;
}): Promise<{ valid: boolean; error?: string; code?: string; allowance: UserAllowance }> {
  const allowance = await getUserAllowance(params);

  // Check single conversion cap (up to 500 chars for guest / free)
  if (allowance.userType === "guest" && params.charCount > GUEST_ALLOWANCE_CHARS) {
    return {
      valid: false,
      code: "text_too_long",
      error: `Guest conversions are limited to ${GUEST_ALLOWANCE_CHARS} characters. Sign in to get an additional fresh 500 characters.`,
      allowance,
    };
  }

  if (allowance.userType === "free" && params.charCount > LOGGED_IN_FREE_ALLOWANCE_CHARS) {
    return {
      valid: false,
      code: "text_too_long",
      error: `Free conversions are limited to ${LOGGED_IN_FREE_ALLOWANCE_CHARS} characters per request. Upgrade for higher limits.`,
      allowance,
    };
  }

  // Check remaining allowance
  if (params.charCount > allowance.remainingChars) {
    const isGuest = allowance.userType === "guest";
    return {
      valid: false,
      code: "daily_limit_reached",
      error: isGuest
        ? `You have ${allowance.remainingChars} characters remaining from your 500-character guest allowance. Sign in to receive an additional fresh 500 characters!`
        : `You have ${allowance.remainingChars} characters remaining from your 500-character free allowance. Upgrade to continue generating voiceovers.`,
      allowance,
    };
  }

  return { valid: true, allowance };
}
