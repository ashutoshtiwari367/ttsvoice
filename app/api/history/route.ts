import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { getStorage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface HistoryItem {
  id: number;
  createdAt: string;
  lang: string;
  voice: string;
  speed: number;
  chars: number;
  excerpt: string;
  status: string;
  isExpired: boolean;
  retentionDays: number;
  retentionLabel: string;
  audioUrl: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to view history." },
        { status: 401 }
      );
    }

    // Query v_request_full or tts_input_header joined with tts_generations
    const { data: rows, error } = await admin
      .from("v_request_full")
      .select(`
        header_id,
        header_created_at,
        customer_id,
        language_code,
        voice_code,
        speed,
        char_count,
        content_excerpt,
        header_status,
        generation_id,
        generation_status,
        audio_object_key,
        voice_tier
      `)
      .eq("customer_id", user.id)
      .order("header_created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("fetch_history_v_request_full_error", error);
      // Fallback query directly against tts_input_header
      const { data: fallbackRows, error: fallbackError } = await admin
        .from("tts_input_header")
        .select(`
          id,
          created_at,
          customer_id,
          language_code,
          voice_code,
          speed,
          char_count,
          content_excerpt,
          status
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (fallbackError) {
        return NextResponse.json({ history: [] });
      }

      const historyItems: HistoryItem[] = (fallbackRows || []).map((r) => {
        const retentionDays = 7;
        const createdAt = r.created_at;
        const ageMs = Date.now() - new Date(createdAt).getTime();
        const isExpired = ageMs > retentionDays * 24 * 60 * 60 * 1000;

        return {
          id: r.id,
          createdAt,
          lang: r.language_code || "hi-IN",
          voice: r.voice_code || "Standard",
          speed: Number(r.speed) || 1.0,
          chars: r.char_count || 0,
          excerpt: r.content_excerpt || "Generated voice preview",
          status: r.status,
          isExpired,
          retentionDays,
          retentionLabel: isExpired ? "Audio Expired" : "Kept for 7 days",
          audioUrl: null,
        };
      });

      return NextResponse.json({ history: historyItems });
    }

    const storage = await getStorage().catch(() => null);

    const historyItems: HistoryItem[] = await Promise.all(
      (rows || []).map(async (r) => {
        const retentionDays = r.voice_tier === "paid" ? 30 : 7;
        const createdAt = r.header_created_at;
        const ageMs = Date.now() - new Date(createdAt).getTime();
        const isExpired = ageMs > retentionDays * 24 * 60 * 60 * 1000;

        let audioUrl: string | null = null;
        if (!isExpired && r.audio_object_key && storage) {
          try {
            audioUrl = await storage.url(r.audio_object_key, 3600);
          } catch {
            audioUrl = null;
          }
        }

        return {
          id: r.header_id,
          createdAt,
          lang: r.language_code || "hi-IN",
          voice: r.voice_code || "Standard",
          speed: Number(r.speed) || 1.0,
          chars: r.char_count || 0,
          excerpt: r.content_excerpt || "Generated speech preview",
          status: r.generation_status || r.header_status || "generated",
          isExpired,
          retentionDays,
          retentionLabel: isExpired
            ? "Audio Expired"
            : `Kept for ${retentionDays} days`,
          audioUrl,
        };
      })
    );

    return NextResponse.json({ history: historyItems });
  } catch (err) {
    console.error("history_route_error", err);
    return NextResponse.json(
      { error: "Failed to fetch generation history." },
      { status: 500 }
    );
  }
}
