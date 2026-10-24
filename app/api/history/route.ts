import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { getStorage } from "@/lib/storage";
import { getSubject } from "@/lib/http";
import { triggerBackgroundCleanup } from "@/lib/history/cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface HistoryItem {
  id: number;
  createdAt: string;
  expiresAt: string;
  lang: string;
  voice: string;
  speed: number;
  chars: number;
  excerpt: string;
  status: string;
  isExpired: boolean;
  retentionLabel: string;
  remainingSeconds: number;
  audioUrl: string | null;
  tier: "anon" | "free" | "paid";
}

export interface HistoryResponse {
  userType: "guest" | "free" | "premium";
  retentionNotice: string;
  retentionDurationMinutes: number;
  history: HistoryItem[];
}

export async function GET(req: NextRequest) {
  // Lazily trigger background cleanup of expired records and storage files
  triggerBackgroundCleanup();

  const subject = getSubject(req);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const storage = await getStorage().catch(() => null);

    // ── 1. LOGGED-IN USERS (Free = 24h retention, Premium = 30d retention) ──
    if (user) {
      // Concurrently query balance and conversion history
      const [balanceRes, rowsRes] = await Promise.all([
        admin
          .from("credit_balances")
          .select("balance")
          .eq("customer_id", user.id)
          .maybeSingle(),
        admin
          .from("tts_generations")
          .select(`
            id,
            created_at,
            expires_at,
            language_code,
            voice_id,
            speaking_rate,
            char_count,
            content_hash,
            status,
            audio_object_key,
            tier,
            input_id
          `)
          .eq("customer_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      const balanceRow = balanceRes.data;
      const rows = rowsRes.data;
      const error = rowsRes.error;

      const isPaid = Number(balanceRow?.balance ?? 0) > 0;
      const retentionMs = isPaid ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const retentionDurationMinutes = isPaid ? 30 * 24 * 60 : 24 * 60;
      const retentionNotice = isPaid
        ? "Premium Cloud Archive: Your conversions are securely stored in high quality."
        : "Your conversion history is automatically deleted after 24 hours from creation.";

      if (error || !rows) {
        return NextResponse.json<HistoryResponse>({
          userType: isPaid ? "premium" : "free",
          retentionNotice,
          retentionDurationMinutes,
          history: [],
        });
      }

      // Fetch excerpts if available from tts_input_header
      const inputIds = rows.map((r) => r.input_id).filter(Boolean);
      let excerptMap: Record<number, string> = {};
      if (inputIds.length > 0) {
        try {
          const { data: headers } = await admin
            .from("tts_input_header")
            .select("id, content_excerpt")
            .in("id", inputIds);

          if (headers) {
            excerptMap = Object.fromEntries(
              headers.map((h) => [h.id, h.content_excerpt || "Generated voice preview"])
            );
          }
        } catch {
          // ignore excerpt fetch error
        }
      }

      const now = Date.now();
      const items: HistoryItem[] = await Promise.all(
        rows.map(async (r) => {
          const createdAt = r.created_at;
          const createdAtMs = new Date(createdAt).getTime();

          const expiresAtDate = r.expires_at
            ? new Date(r.expires_at)
            : new Date(createdAtMs + retentionMs);

          const isExpired = now >= expiresAtDate.getTime();
          const remainingSeconds = isExpired
            ? 0
            : Math.max(0, Math.floor((expiresAtDate.getTime() - now) / 1000));

          let retentionLabel = "Audio Expired (24h reached)";
          if (!isExpired) {
            const hours = Math.floor(remainingSeconds / 3600);
            const mins = Math.floor((remainingSeconds % 3600) / 60);
            retentionLabel =
              hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`;
          }

          // Strictly prevent access to expired audio files!
          let audioUrl: string | null = null;
          if (!isExpired && r.audio_object_key && storage) {
            try {
              audioUrl = await storage.url(r.audio_object_key, 3600);
            } catch {
              audioUrl = null;
            }
          }

          return {
            id: r.id,
            createdAt,
            expiresAt: expiresAtDate.toISOString(),
            lang: r.language_code || "hi-IN",
            voice: r.voice_id || "Standard",
            speed: Number(r.speaking_rate) || 1.0,
            chars: Number(r.char_count) || 0,
            excerpt: (r.input_id && excerptMap[r.input_id]) || "Generated voice preview",
            status: r.status,
            isExpired,
            retentionLabel,
            remainingSeconds,
            audioUrl,
            tier: isPaid ? "paid" : "free",
          };
        })
      );

      return NextResponse.json<HistoryResponse>({
        userType: isPaid ? "premium" : "free",
        retentionNotice,
        retentionDurationMinutes,
        history: items,
      });
    }

    // ── 2. GUEST USERS (Without Login: 30 minutes retention) ──
    const guestRetentionMs = 30 * 60 * 1000;
    const guestRetentionDurationMinutes = 30;
    const guestRetentionNotice =
      "Guest history is temporary and automatically deleted after 30 minutes.";

    const { data: guestRows, error: guestErr } = await admin
      .from("tts_generations")
      .select(`
        id,
        created_at,
        expires_at,
        language_code,
        voice_id,
        speaking_rate,
        char_count,
        content_hash,
        status,
        audio_object_key,
        tier,
        input_id
      `)
      .eq("anon_subject_id", subject.sid)
      .is("customer_id", null)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(30);

    if (guestErr || !guestRows) {
      return NextResponse.json<HistoryResponse>({
        userType: "guest",
        retentionNotice: guestRetentionNotice,
        retentionDurationMinutes: guestRetentionDurationMinutes,
        history: [],
      });
    }

    // Fetch excerpts for guest inputs
    const guestInputIds = guestRows.map((r) => r.input_id).filter(Boolean);
    let guestExcerptMap: Record<number, string> = {};
    if (guestInputIds.length > 0) {
      try {
        const { data: headers } = await admin
          .from("tts_input_header")
          .select("id, content_excerpt")
          .in("id", guestInputIds);

        if (headers) {
          guestExcerptMap = Object.fromEntries(
            headers.map((h) => [h.id, h.content_excerpt || "Generated voice preview"])
          );
        }
      } catch {
        // ignore
      }
    }

    const now = Date.now();
    const guestItems: HistoryItem[] = await Promise.all(
      guestRows.map(async (r) => {
        const createdAt = r.created_at;
        const createdAtMs = new Date(createdAt).getTime();

        const expiresAtDate = r.expires_at
          ? new Date(r.expires_at)
          : new Date(createdAtMs + guestRetentionMs);

        const isExpired = now >= expiresAtDate.getTime();
        const remainingSeconds = isExpired
          ? 0
          : Math.max(0, Math.floor((expiresAtDate.getTime() - now) / 1000));

        let retentionLabel = "Audio Expired (30m reached)";
        if (!isExpired) {
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          retentionLabel = `${mins}m ${secs}s remaining`;
        }

        // Strictly prevent access to expired audio files!
        let audioUrl: string | null = null;
        if (!isExpired && r.audio_object_key && storage) {
          try {
            audioUrl = await storage.url(r.audio_object_key, 1800);
          } catch {
            audioUrl = null;
          }
        }

        return {
          id: r.id,
          createdAt,
          expiresAt: expiresAtDate.toISOString(),
          lang: r.language_code || "hi-IN",
          voice: r.voice_id || "Standard",
          speed: Number(r.speaking_rate) || 1.0,
          chars: Number(r.char_count) || 0,
          excerpt:
            (r.input_id && guestExcerptMap[r.input_id]) || "Generated speech preview",
          status: r.status,
          isExpired,
          retentionLabel,
          remainingSeconds,
          audioUrl,
          tier: "anon",
        };
      })
    );

    return NextResponse.json<HistoryResponse>({
      userType: "guest",
      retentionNotice: guestRetentionNotice,
      retentionDurationMinutes: guestRetentionDurationMinutes,
      history: guestItems,
    });
  } catch (err) {
    console.error("history_route_error", err);
    return NextResponse.json(
      { error: "Failed to fetch conversion history." },
      { status: 500 }
    );
  }
}
