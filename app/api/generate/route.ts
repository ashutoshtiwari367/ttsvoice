import { NextRequest } from "next/server";
import { generateTts } from "@/lib/tts/generationService";
import {
  getClientIp,
  getCountry,
  getSubject,
  getRequestMeta,
  respond,
  errorResponse,
  TtsError,
} from "@/lib/http";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { getUserCreditsAndTier } from "@/lib/credits";
import { PAID_FEATURES_CONTROL } from "@/config/control";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const subject = getSubject(req);
  const ip = getClientIp(req);
  const country = getCountry(req);
  const meta = getRequestMeta(req);

  let body: { text?: string; lang?: string; voice?: string; speed?: number; pitch?: number; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid_request", subject);
  }

  const { text, lang, voice, speed, pitch, turnstileToken } = body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return errorResponse("invalid_request", subject);
  }

  // Check if authenticated user is logged in
  let customerId: string | null = null;
  let userTier: "free" | "paid" = "free";
  try {
    let user = null;
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      user = data.user ?? null;
    } catch {
      // Cookies not available or expired
    }

    if (!user) {
      const authHeader = req.headers.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "").trim();
        const { data } = await admin.auth.getUser(token);
        user = data.user ?? null;
      }
    }

    if (user) {
      customerId = user.id;
      if (PAID_FEATURES_CONTROL.enabled) {
        const creditInfo = await getUserCreditsAndTier(user.id);
        userTier = creditInfo.tier === "paid" ? "paid" : "free";
      } else {
        userTier = "free";
      }
    }
  } catch {
    // If auth check fails, treat as guest/anonymous
  }

  try {
    const result = await generateTts({
      text,
      lang: lang || "hi-IN",
      voiceId: voice || "hi-IN-Wavenet-A",
      speed: typeof speed === "number" ? speed : 1.0,
      pitch: typeof pitch === "number" ? pitch : 0,
      subjectId: subject.sid,
      ip,
      country,
      meta,
      isNewSubject: subject.isNew,
      customerId,
      userTier,
      userCategory: "human",
      turnstileToken: turnstileToken ?? null,
    });

    return respond(result, 200, subject);
  } catch (err) {
    if (err instanceof TtsError) {
      return errorResponse(err.code, subject);
    }
    console.error("generate_route_unexpected_error", err);
    return errorResponse("server_error", subject);
  }
}
