import { admin } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { PAID_FEATURES_CONTROL } from "@/config/control";

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
export const LOGGED_IN_FREE_ALLOWANCE_CHARS = 1000;
export const GUEST_RETENTION_MINUTES = 30;
export const FREE_RETENTION_HOURS = 24;

/**
 * Calculates current allowance, used characters, and remaining limit for a user or guest.
 * - Guest (No login): 500 chars total, 30m retention.
 * - Logged-in Free: 1,000 chars total, 24h retention.
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
      // Fetch customer, balance, payments, and completed generations in ONE single parallel batch
      const [customerRes, balanceRes, paymentsRes, genRowsRes, headerRowsRes] = await Promise.all([
        admin.from("customers").select("customer_no").eq("id", customerId).maybeSingle(),
        admin.from("credit_balances").select("balance").eq("customer_id", customerId).maybeSingle(),
        admin
          .from("payments")
          .select("id, pack_id, status")
          .eq("customer_id", customerId)
          .eq("status", "paid")
          .limit(1),
        admin
          .from("tts_generations")
          .select("input_id, char_count")
          .eq("customer_id", customerId)
          .in("status", ["success", "expired"]),
        admin
          .from("tts_input_header")
          .select("id, char_count")
          .eq("customer_id", customerId)
          .in("status", ["generated", "purged"]),
      ]);

      const customerNo = customerRes.data?.customer_no ?? null;
      const balance = Number(balanceRes.data?.balance ?? 0);
      const payments = paymentsRes.data;
      const hasPaidPlan =
        PAID_FEATURES_CONTROL.enabled &&
        ((payments && payments.length > 0) || balance > 0);

      if (hasPaidPlan && balance > 0) {
        // PREMIUM USER (Only active when PAID_FEATURES_CONTROL.enabled === true)
        return {
          isAuthenticated: true,
          userType: "premium",
          tier: "paid",
          isPremium: true,
          totalAllowance: balance,
          usedChars: 0,
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
      // Deduplicate by input_id so even generations logged in tts_input_header are accurately counted
      const recordedInputIds = new Set<number>();
      let usedChars = 0;

      for (const r of genRowsRes.data || []) {
        if (r.input_id != null) recordedInputIds.add(Number(r.input_id));
        usedChars += Number(r.char_count) || 0;
      }

      for (const h of headerRowsRes.data || []) {
        if (!recordedInputIds.has(Number(h.id))) {
          usedChars += Number(h.char_count) || 0;
        }
      }

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
      const [anonGenRes, anonHeaderRes] = await Promise.all([
        admin
          .from("tts_generations")
          .select("input_id, char_count")
          .eq("anon_subject_id", subjectId)
          .is("customer_id", null)
          .in("status", ["success", "expired"]),
        admin
          .from("tts_input_header")
          .select("id, char_count")
          .eq("anon_subject_id", subjectId)
          .is("customer_id", null)
          .in("status", ["generated", "purged"]),
      ]);

      const recordedInputIds = new Set<number>();
      for (const r of anonGenRes.data || []) {
        if (r.input_id != null) recordedInputIds.add(Number(r.input_id));
        usedChars += Number(r.char_count) || 0;
      }
      for (const h of anonHeaderRes.data || []) {
        if (!recordedInputIds.has(Number(h.id))) {
          usedChars += Number(h.char_count) || 0;
        }
      }
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

  // Check single conversion cap (500 chars for guest, 1000 chars for free logged in)
  if (allowance.userType === "guest" && params.charCount > GUEST_ALLOWANCE_CHARS) {
    return {
      valid: false,
      code: "text_too_long",
      error: `Guest conversions are limited to ${GUEST_ALLOWANCE_CHARS} characters. Sign in to unlock 1,000 characters.`,
      allowance,
    };
  }

  if (allowance.userType === "free" && params.charCount > LOGGED_IN_FREE_ALLOWANCE_CHARS) {
    return {
      valid: false,
      code: "text_too_long",
      error: `Free conversions are limited to ${LOGGED_IN_FREE_ALLOWANCE_CHARS} characters per request. Please shorten your script.`,
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
        ? `You have ${allowance.remainingChars} characters remaining from your 500-character guest allowance. Sign in to unlock 1,000 characters!`
        : `You have ${allowance.remainingChars} characters remaining from your 1,000-character free allowance.`,
      allowance,
    };
  }

  return { valid: true, allowance };
}
