import { admin } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { getPlanLimits, type LimitTier } from "@/lib/limits";

export interface UserCreditsInfo {
  isAuthenticated: boolean;
  userId: string | null;
  customerNo?: number | null;
  tier: LimitTier;
  balance: number;
  reqCap: number;
  dayCap: number;
  weekCap: number;
  allowPremiumVoices: boolean;
}

/**
 * Ensures a customer record exists in Supabase `customers` table.
 * Supabase Postgres trigger automatically initializes `credit_balances` to 0.
 * Also assigns `customer_no` sequence if not already assigned.
 */
export async function ensureCustomer(userId: string): Promise<number | null> {
  try {
    const { data, error } = await admin
      .from("customers")
      .select("id, customer_no")
      .eq("id", userId)
      .maybeSingle();

    if (!data && !error) {
      const { data: inserted } = await admin
        .from("customers")
        .upsert(
          {
            id: userId,
            brand_id: config.defaultBrandId,
            account_status: "active",
          },
          { onConflict: "id" }
        )
        .select("customer_no")
        .maybeSingle();

      return inserted?.customer_no ?? null;
    }

    return (data as any)?.customer_no ?? null;
  } catch (err) {
    console.error("ensure_customer_failed", err);
    return null;
  }
}

/**
 * Retrieves the current credit balance, tier, customer_no, and limits for a user.
 */
export async function getUserCreditsAndTier(
  userId: string | null
): Promise<UserCreditsInfo> {
  const brandId = config.defaultBrandId;

  // 1. Anonymous / Guest user
  if (!userId) {
    const anonLimits = await getPlanLimits(brandId, "anon");
    return {
      isAuthenticated: false,
      userId: null,
      customerNo: null,
      tier: "anon",
      balance: 0,
      reqCap: anonLimits.reqChars,
      dayCap: anonLimits.dayChars,
      weekCap: anonLimits.weekChars,
      allowPremiumVoices: anonLimits.allowPremiumVoices,
    };
  }

  // 2. Authenticated user: ensure customer row exists & fetch balance
  const customerNo = await ensureCustomer(userId);

  const { data: balanceRow } = await admin
    .from("credit_balances")
    .select("balance")
    .eq("customer_id", userId)
    .maybeSingle();

  const balance = Number(balanceRow?.balance ?? 0);

  // If user has available paid credit balance
  if (balance > 0) {
    const paidLimits = await getPlanLimits(brandId, "paid");
    return {
      isAuthenticated: true,
      userId,
      customerNo,
      tier: "paid",
      balance,
      reqCap: paidLimits.reqChars,
      dayCap: paidLimits.dayChars,
      weekCap: paidLimits.weekChars,
      allowPremiumVoices: paidLimits.allowPremiumVoices,
    };
  }

  // Otherwise, free tier logged in
  const freeLimits = await getPlanLimits(brandId, "free");
  return {
    isAuthenticated: true,
    userId,
    customerNo,
    tier: "free",
    balance: 0,
    reqCap: freeLimits.reqChars,
    dayCap: freeLimits.dayChars,
    weekCap: freeLimits.weekChars,
    allowPremiumVoices: freeLimits.allowPremiumVoices,
  };
}

/**
 * Deducts characters from user balance using atomic Supabase RPC `spend_credits`.
 * Returns boolean indicating whether debit succeeded.
 */
export async function spendUserCredits(
  userId: string,
  chars: number,
  inputId: number
): Promise<{ success: boolean; reason?: string }> {
  try {
    const { data, error } = await admin.rpc("spend_credits", {
      p_customer_id: userId,
      p_brand_id: config.defaultBrandId,
      p_chars: chars,
      p_input_id: inputId,
    });

    if (error) {
      console.error("spend_credits_rpc_error", error);
      return { success: false, reason: error.message };
    }

    if (data === "ok") {
      return { success: true };
    }

    return { success: false, reason: String(data ?? "insufficient") };
  } catch (err) {
    console.error("spend_credits_unexpected_error", err);
    return { success: false, reason: "internal_error" };
  }
}

/**
 * Refunds generation if synthesis or audio upload failed after credits were spent.
 */
export async function refundUserCredits(inputId: number): Promise<boolean> {
  try {
    const { data, error } = await admin.rpc("refund_generation", {
      p_input_id: inputId,
    });
    if (error) {
      console.error("refund_generation_rpc_error", error);
      return false;
    }
    return data === "ok";
  } catch (err) {
    console.error("refund_generation_unexpected_error", err);
    return false;
  }
}
