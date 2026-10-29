import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = String(body.type || "contact").trim();
    const subject = String(body.subject || "").trim();
    const message = String(body.message || "").trim();
    const category = String(body.category || "general").trim();
    const rating = body.rating ? Number(body.rating) : null;

    if (!message || message.length < 5) {
      return NextResponse.json(
        { error: "Please enter a brief description (at least 5 characters)." },
        { status: 400 }
      );
    }

    let userEmail: string | null = body.email ? String(body.email).trim() : null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) {
        userEmail = user.email;
      }
    } catch {
      // Guest submission allowed
    }

    const ticketId = `SUP-${Date.now().toString(36).toUpperCase()}`;

    // Structured server log for observability & support triage
    console.info("tts_support_submission", {
      ticketId,
      type,
      category,
      subject: subject.slice(0, 120),
      rating,
      userEmail,
      submittedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      ticketId,
      submittedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("support_route_error", err);
    return NextResponse.json(
      { error: "Unable to submit request right now. Please email support directly." },
      { status: 500 }
    );
  }
}

