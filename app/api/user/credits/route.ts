import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserCreditsAndTier } from "@/lib/credits";
import { getUserAllowance } from "@/lib/allowance";
import { getSubject } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const subject = getSubject(req);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const guestInfo = await getUserCreditsAndTier(null);
      const allowance = await getUserAllowance({
        customerId: null,
        subjectId: subject.sid,
      });

      return NextResponse.json({
        ...guestInfo,
        ...allowance,
        reqCap: allowance.singleReqCap,
        email: null,
      });
    }

    const [info, allowance] = await Promise.all([
      getUserCreditsAndTier(user.id),
      getUserAllowance({
        customerId: user.id,
        subjectId: subject.sid,
      }),
    ]);

    return NextResponse.json({
      ...info,
      ...allowance,
      reqCap: allowance.isPremium ? info.reqCap : allowance.singleReqCap,
      email: user.email ?? null,
    });
  } catch (err) {
    console.error("user_credits_route_error", err);
    const guestInfo = await getUserCreditsAndTier(null);
    const allowance = await getUserAllowance({
      customerId: null,
      subjectId: subject.sid,
    });

    return NextResponse.json({
      ...guestInfo,
      ...allowance,
      reqCap: allowance.singleReqCap,
      email: null,
    });
  }
}
