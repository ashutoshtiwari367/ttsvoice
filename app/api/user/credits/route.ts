import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { config } from "@/lib/config";
import { ensureCustomer } from "@/lib/credits";
import { getPlanLimits } from "@/lib/limits";
import { getUserAllowance } from "@/lib/allowance";
import { getSubject } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const subject = getSubject(req);
  const brandId = config.defaultBrandId;

  try {
    let user = null;

    // 1. Read user from Supabase session cookies (fast local JWT read first, fallback to getUser)
    try {
      const supabase = await createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        user = sessionData.session.user;
      } else {
        const { data } = await supabase.auth.getUser();
        user = data.user ?? null;
      }
    } catch {
      // Cookies not available or expired
    }

    // 2. Fallback: try Bearer token in Authorization header
    if (!user) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data } = await admin.auth.getUser(token);
        user = data.user ?? null;
      }
    }

    if (!user) {
      const [anonLimits, allowance] = await Promise.all([
        getPlanLimits(brandId, "anon"),
        getUserAllowance({
          customerId: null,
          subjectId: subject.sid,
        }),
      ]);

      return NextResponse.json(
        {
          ...allowance,
          userId: null,
          balance: 0,
          dayCap: anonLimits.dayChars,
          weekCap: anonLimits.weekChars,
          allowPremiumVoices: anonLimits.allowPremiumVoices,
          reqCap: allowance.singleReqCap,
          email: null,
        },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Single parallel batch — avoids duplicate customers & credit_balances roundtrips
    const [allowance, freeLimits] = await Promise.all([
      getUserAllowance({
        customerId: user.id,
        subjectId: subject.sid,
      }),
      getPlanLimits(brandId, "free"),
    ]);

    // Lazily ensure customer row exists in background if brand-new user
    if (allowance.customerNo == null) {
      ensureCustomer(user.id).catch(() => {});
    }

    const activeLimits = allowance.isPremium
      ? await getPlanLimits(brandId, "paid")
      : freeLimits;

    return NextResponse.json(
      {
        ...allowance,
        userId: user.id,
        balance: allowance.isPremium ? allowance.remainingChars : 0,
        dayCap: activeLimits.dayChars,
        weekCap: activeLimits.weekChars,
        allowPremiumVoices: activeLimits.allowPremiumVoices,
        reqCap: allowance.isPremium ? activeLimits.reqChars : allowance.singleReqCap,
        email: user.email ?? null,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err) {
    console.error("user_credits_route_error", err);
    const [anonLimits, allowance] = await Promise.all([
      getPlanLimits(brandId, "anon"),
      getUserAllowance({
        customerId: null,
        subjectId: subject.sid,
      }),
    ]);

    return NextResponse.json(
      {
        ...allowance,
        userId: null,
        balance: 0,
        dayCap: anonLimits.dayChars,
        weekCap: anonLimits.weekChars,
        allowPremiumVoices: anonLimits.allowPremiumVoices,
        reqCap: allowance.singleReqCap,
        email: null,
      },
      { headers: NO_CACHE_HEADERS }
    );
  }
}
