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
import { getUserCreditsAndTier } from "@/lib/credits";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const subject = getSubject(req);
  const ip = getClientIp(req);
  const country = getCountry(req);
  const meta = getRequestMeta(req);

  let body: { text?: string; lang?: string; voice?: string; speed?: number; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return errorResponse("invalid_request", subject);
  }

  const { text, lang, voice, speed, turnstileToken } = body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return errorResponse("invalid_request", subject);
  }

  // Check if authenticated user is logged in
  let customerId: string | null = null;
  let userTier: "free" | "paid" = "free";
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      customerId = user.id;
      const creditInfo = await getUserCreditsAndTier(user.id);
      userTier = creditInfo.tier === "paid" ? "paid" : "free";
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
