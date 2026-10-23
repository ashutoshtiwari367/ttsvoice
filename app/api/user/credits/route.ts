import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserCreditsAndTier } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      const guestInfo = await getUserCreditsAndTier(null);
      return NextResponse.json({
        ...guestInfo,
        email: null,
      });
    }

    const info = await getUserCreditsAndTier(user.id);
    return NextResponse.json({
      ...info,
      email: user.email ?? null,
    });
  } catch (err) {
    console.error("user_credits_route_error", err);
    // Graceful fallback for anonymous guest
    const guestInfo = await getUserCreditsAndTier(null);
    return NextResponse.json({
      ...guestInfo,
      email: null,
    });
  }
}
