import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { extractUsername, formatDisplayName } from "@/lib/user";
import { getUserAllowance } from "@/lib/allowance";
import { PAID_FEATURES_CONTROL } from "@/config/control";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface FormattedPurchase {
  id: number;
  packId: string;
  packName: string;
  amount: string;
  currency: string;
  charAmount: number;
  status: string;
  date: string;
  expiryDate: string | null;
  validityLabel: string;
  isExpired: boolean;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        isAuthenticated: false,
        email: null,
        username: "Guest",
        displayName: "Guest",
        userId: null,
        activePlan: "Guest Tier",
        activePlanName: "Guest (Free)",
        purchaseDate: null,
        expiryDate: null,
        validityStatus: "Free Trial",
        tier: "anon",
        balance: 0,
        reqCap: 500,
        totalPurchasedChars: 0,
        purchases: [],
      });
    }

    const email = user.email ?? "";
    const username = extractUsername(email);
    const displayName = formatDisplayName(username);

    // 1. Fetch current credit balance
    const { data: balanceRow } = await admin
      .from("credit_balances")
      .select("balance, updated_at")
      .eq("customer_id", user.id)
      .maybeSingle();

    const balance = Number(balanceRow?.balance ?? 0);

    // 2. Fetch purchase history from payments
    const { data: payments } = await admin
      .from("payments")
      .select("id, pack_id, amount_minor, char_amount, bonus_chars, currency, status, paid_at, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const paidPurchases = (payments ?? []).filter((p) => p.status === "paid");
    const totalPurchasedChars = paidPurchases.reduce(
      (sum, p) => sum + (p.char_amount || 0) + (p.bonus_chars || 0),
      0
    );

    // Helper to format pack name
    const resolvePackName = (packId: string | null): string => {
      if (!packId) return "Custom Pack";
      if (packId === "standard") return "Standard Pack";
      if (packId === "micro") return "Micro Pack";
      if (packId === "100k-characters") return "100K Character Booster";
      if (packId === "250k-characters") return "250K Character Booster";
      if (packId === "500k-characters") return "500K Character Booster";
      return packId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Calculate expiry & validity for each purchase
    const formattedPurchases: FormattedPurchase[] = (payments ?? []).map((p) => {
      const purchaseDate = p.paid_at || p.created_at;
      let expiryDate: string | null = null;
      let validityLabel = "Lifetime (Never Expires)";
      let isExpired = false;

      if (p.pack_id === "micro" && purchaseDate) {
        const pDate = new Date(purchaseDate);
        const exp = new Date(pDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        expiryDate = exp.toISOString();
        isExpired = Date.now() > exp.getTime();
        validityLabel = isExpired ? "Expired" : "7 Days Validity";
      } else if (p.pack_id === "standard" || p.pack_id?.includes("character")) {
        validityLabel = "Never Expires";
        expiryDate = null;
        isExpired = false;
      }

      return {
        id: p.id,
        packId: p.pack_id,
        packName: resolvePackName(p.pack_id),
        amount: (p.amount_minor / 100).toFixed(0),
        currency: p.currency || "INR",
        charAmount: (p.char_amount || 0) + (p.bonus_chars || 0),
        status: p.status,
        date: purchaseDate,
        expiryDate,
        validityLabel,
        isExpired,
      };
    });

    // Fetch customer_no and live character allowance in parallel
    const [{ data: customerRow }, allowance] = await Promise.all([
      admin
        .from("customers")
        .select("customer_no")
        .eq("id", user.id)
        .maybeSingle(),
      getUserAllowance({ customerId: user.id }),
    ]);

    const lastPaid = paidPurchases[0];
    let activePlan = "Free Tier";
    let activePlanName = "Free Plan (1,000 Characters)";
    let tier = "free";
    let reqCap = allowance.singleReqCap;
    let purchaseDate: string | null = null;
    let expiryDate: string | null = null;
    let validityStatus = "24h Audio History • 1,000 Chars";

    if (PAID_FEATURES_CONTROL.enabled && balance > 0 && lastPaid) {
      tier = "paid";
      reqCap = 10000;
      purchaseDate = lastPaid.paid_at || lastPaid.created_at;

      if (lastPaid.pack_id === "standard") {
        activePlan = "Standard Pack (Pro)";
        activePlanName = "Standard Pack (50K Characters)";
        validityStatus = "Lifetime (Never Expires)";
        expiryDate = null;
      } else if (lastPaid.pack_id === "micro") {
        activePlan = "Micro Pack";
        activePlanName = "Micro Pack (10K Characters)";
        if (purchaseDate) {
          const pDate = new Date(purchaseDate);
          const exp = new Date(pDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          expiryDate = exp.toISOString();
          const isExp = Date.now() > exp.getTime();
          validityStatus = isExp ? "Expired" : "Valid for 7 Days";
        }
      } else if (lastPaid.pack_id?.includes("character")) {
        activePlan = "Character Booster";
        activePlanName = "Character Booster Pack";
        validityStatus = "Lifetime (Never Expires)";
        expiryDate = null;
      } else {
        activePlan = "Pro Pack";
        activePlanName = "Pro Voice Pack";
        validityStatus = "Active";
      }
    } else if (PAID_FEATURES_CONTROL.enabled && balance > 0) {
      tier = "paid";
      activePlan = "Pro Balance";
      activePlanName = "Prepaid Voice Balance";
      validityStatus = "Active";
    }

    const effectiveBalance =
      tier === "paid" ? balance : allowance.remainingChars;

    return NextResponse.json({
      isAuthenticated: true,
      userId: user.id,
      customerNo: customerRow?.customer_no ?? allowance.customerNo ?? null,
      email: user.email,
      username,
      displayName,
      accountCreatedAt: user.created_at,
      lastSignInAt: user.last_sign_in_at,
      activePlan,
      activePlanName,
      purchaseDate,
      expiryDate,
      validityStatus,
      tier,
      balance: effectiveBalance,
      totalAllowance: allowance.totalAllowance,
      usedChars: allowance.usedChars,
      remainingChars: allowance.remainingChars,
      reqCap,
      totalPurchasedChars,
      purchases: formattedPurchases,
    });
  } catch (err: any) {
    console.error("user_subscription_route_error", err);
    return NextResponse.json(
      { error: "Failed to fetch subscription info." },
      { status: 500 }
    );
  }
}
