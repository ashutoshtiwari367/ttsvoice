import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { getStorage } from "@/lib/storage";
import { audioObjectKey } from "@/lib/storage/keys";
import { getSubject, respond } from "@/lib/http";
import { PAID_FEATURES_CONTROL } from "@/config/control";
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

async function loadExcerptMap(headerIds: number[]): Promise<Record<number, string>> {
  const uniqueIds = Array.from(new Set(headerIds.filter((id) => Number.isFinite(id) && id > 0)));
  if (uniqueIds.length === 0) return {};

  const map: Record<number, string> = {};
  try {
    const [headersRes, itemsRes] = await Promise.all([
      admin.from("tts_input_header").select("*").in("id", uniqueIds),
      admin
        .from("tts_input_item")
        .select("header_id, content")
        .in("header_id", uniqueIds),
    ]);

    for (const item of itemsRes.data || []) {
      const hid = Number(item.header_id);
      if (hid && item.content) {
        map[hid] = String(item.content).slice(0, 180);
      }
    }

    for (const h of headersRes.data || []) {
      const hid = Number(h.id);
      const text = h.content_excerpt || h.excerpt || map[hid];
      if (hid && text) {
        map[hid] = String(text).slice(0, 180);
      }
    }
  } catch {
    // ignore excerpt lookup errors
  }

  return map;
}

export async function GET(req: NextRequest) {
  triggerBackgroundCleanup();

  const subject = getSubject(req);

  try {
    const [supabase, storage] = await Promise.all([
      createClient(),
      getStorage().catch(() => null),
    ]);

    const { data: sessionData } = await supabase.auth.getSession();
    let user = sessionData.session?.user ?? null;
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data.user ?? null;
    }

    const now = Date.now();

    // ── 1. LOGGED-IN USERS (Free = 24h retention, Premium = 30d retention) ──
    if (user) {
      const [balanceRes, rowsRes, headerFallbackRes] = await Promise.all([
        admin
          .from("credit_balances")
          .select("balance")
          .eq("customer_id", user.id)
          .maybeSingle(),
        // Use select("*") so missing optional columns (like expires_at) never cause 42703 SQL error
        admin
          .from("tts_generations")
          .select("*")
          .eq("customer_id", user.id)
          .not("audio_object_key", "is", null)
          .order("created_at", { ascending: false })
          .limit(60),
        admin
          .from("tts_input_header")
          .select("*")
          .eq("customer_id", user.id)
          .eq("status", "generated")
          .order("created_at", { ascending: false })
          .limit(60),
      ]);

      const balanceRow = balanceRes.data;
      const genRows = rowsRes.data || [];
      const headerRows = headerFallbackRes.data || [];

      const isPaid =
        PAID_FEATURES_CONTROL.enabled && Number(balanceRow?.balance ?? 0) > 0;
      const retentionMs = isPaid ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      const retentionDurationMinutes = isPaid ? 30 * 24 * 60 : 24 * 60;
      const retentionNotice = isPaid
        ? "Premium Cloud Archive: Your conversions are securely stored in high quality."
        : "Your conversion history is automatically deleted after 24 hours from creation.";

      const recordedInputIds = new Set<number>();
      const recordedHashes = new Set<string>();
      for (const r of genRows) {
        if (r.input_id != null) recordedInputIds.add(Number(r.input_id));
        if (r.content_hash) recordedHashes.add(`${r.content_hash}:${String(r.created_at).slice(0, 16)}`);
      }

      // Synthesize unified rows (tts_generations + any recovered tts_input_header conversions)
      const unifiedRows: Array<{
        id: number;
        createdAt: string;
        expiresAtRaw: string | null;
        lang: string;
        voice: string;
        speed: number;
        chars: number;
        inputId: number | null;
        inlineExcerpt: string | null;
        status: string;
        objectKey: string | null;
        isRecoveredHeader: boolean;
      }> = genRows.map((r: any) => ({
        id: Number(r.id),
        createdAt: r.created_at,
        expiresAtRaw: r.expires_at ?? null,
        lang: r.language_code || "hi-IN",
        voice: r.voice_id || "Standard",
        speed: Number(r.speaking_rate) || 1.0,
        chars: Number(r.char_count) || 0,
        inputId: r.input_id ? Number(r.input_id) : null,
        inlineExcerpt: null,
        status: r.status || "success",
        objectKey: r.audio_object_key || null,
        isRecoveredHeader: false,
      }));

      for (const h of headerRows) {
        const hid = Number(h.id);
        const hashTimeKey = `${h.content_hash}:${String(h.created_at).slice(0, 16)}`;
        if (recordedInputIds.has(hid) || recordedHashes.has(hashTimeKey)) continue;
        if (!h.content_hash) continue;

        const reconstructedKey = audioObjectKey(
          isPaid ? "paid" : "free",
          h.content_hash,
          new Date(h.created_at)
        );

        unifiedRows.push({
          id: -hid,
          createdAt: h.created_at,
          expiresAtRaw: h.expires_at ?? null,
          lang: h.language_code || "hi-IN",
          voice: h.voice_code || "Standard",
          speed: Number(h.speed) || 1.0,
          chars: Number(h.char_count) || 0,
          inputId: hid,
          inlineExcerpt: h.content_excerpt || h.excerpt || null,
          status: "success",
          objectKey: reconstructedKey,
          isRecoveredHeader: true,
        });
      }

      unifiedRows.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      const excerptMap = await loadExcerptMap(
        unifiedRows.map((u) => u.inputId || 0).filter((id) => id > 0)
      );

      const expiredGenIds: Array<{ id: number; key: string | null }> = [];
      const expiredHeaderIds: Array<{ id: number; key: string | null }> = [];

      const items: HistoryItem[] = await Promise.all(
        unifiedRows.slice(0, 60).map(async (r) => {
          const createdAtMs = new Date(r.createdAt).getTime();
          const expiresAtDate = r.expiresAtRaw
            ? new Date(r.expiresAtRaw)
            : new Date(createdAtMs + retentionMs);

          const isExpired = now >= expiresAtDate.getTime();
          if (isExpired) {
            if (r.isRecoveredHeader) {
              expiredHeaderIds.push({ id: Math.abs(r.id), key: r.objectKey });
            } else {
              expiredGenIds.push({ id: r.id, key: r.objectKey });
            }
          }

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

          let audioUrl: string | null = null;
          if (!isExpired && r.objectKey && storage) {
            try {
              audioUrl = await storage.url(r.objectKey, 3600);
            } catch {
              audioUrl = null;
            }
          }

          const excerpt =
            r.inlineExcerpt ||
            (r.inputId && excerptMap[r.inputId]) ||
            "Generated voice preview";

          return {
            id: r.id,
            createdAt: r.createdAt,
            expiresAt: expiresAtDate.toISOString(),
            lang: r.lang,
            voice: r.voice,
            speed: r.speed,
            chars: r.chars,
            excerpt,
            status: r.status,
            isExpired,
            retentionLabel,
            remainingSeconds,
            audioUrl,
            tier: isPaid ? "paid" : "free",
          };
        })
      );

      // Background cleanup of expired audio files (preserves usage accounting)
      if (expiredGenIds.length > 0 || expiredHeaderIds.length > 0) {
        Promise.allSettled([
          ...expiredGenIds.map(async (exp) => {
            if (exp.key && storage) await storage.delete(exp.key).catch(() => {});
            await admin
              .from("tts_generations")
              .update({ audio_object_key: null })
              .eq("id", exp.id);
          }),
          ...expiredHeaderIds.map(async (exp) => {
            if (exp.key && storage) await storage.delete(exp.key).catch(() => {});
            await admin
              .from("tts_input_header")
              .update({ status: "purged" })
              .eq("id", exp.id);
          }),
        ]).catch(() => {});
      }

      const activeItems = items.filter((item) => !item.isExpired && !!item.audioUrl);

      return respond(
        {
          userType: isPaid ? "premium" : "free",
          retentionNotice,
          retentionDurationMinutes,
          history: activeItems,
        } satisfies HistoryResponse,
        200,
        subject
      );
    }

    // ── 2. GUEST USERS (Without Login: 30 minutes retention) ──
    const guestRetentionMs = 30 * 60 * 1000;
    const guestRetentionDurationMinutes = 30;
    const guestRetentionNotice =
      "Guest history is temporary and automatically deleted after 30 minutes.";

    const [guestRowsRes, guestHeaderRes] = await Promise.all([
      admin
        .from("tts_generations")
        .select("*")
        .eq("anon_subject_id", subject.sid)
        .is("customer_id", null)
        .eq("status", "success")
        .not("audio_object_key", "is", null)
        .order("created_at", { ascending: false })
        .limit(30),
      admin
        .from("tts_input_header")
        .select("*")
        .eq("anon_subject_id", subject.sid)
        .is("customer_id", null)
        .eq("status", "generated")
        .order("created_at", { ascending: false })
        .limit(30),
    ]);

    const guestGenRows = guestRowsRes.data || [];
    const guestHeaderRows = guestHeaderRes.data || [];

    const recordedGuestInputs = new Set<number>();
    const recordedGuestHashes = new Set<string>();
    for (const r of guestGenRows) {
      if (r.input_id != null) recordedGuestInputs.add(Number(r.input_id));
      if (r.content_hash) recordedGuestHashes.add(`${r.content_hash}:${String(r.created_at).slice(0, 16)}`);
    }

    const unifiedGuestRows = guestGenRows.map((r: any) => ({
      id: Number(r.id),
      createdAt: r.created_at,
      expiresAtRaw: r.expires_at ?? null,
      lang: r.language_code || "hi-IN",
      voice: r.voice_id || "Standard",
      speed: Number(r.speaking_rate) || 1.0,
      chars: Number(r.char_count) || 0,
      inputId: r.input_id ? Number(r.input_id) : null,
      inlineExcerpt: null as string | null,
      status: r.status || "success",
      objectKey: r.audio_object_key || null,
      isRecoveredHeader: false,
    }));

    for (const h of guestHeaderRows) {
      const hid = Number(h.id);
      const hashTimeKey = `${h.content_hash}:${String(h.created_at).slice(0, 16)}`;
      if (recordedGuestInputs.has(hid) || recordedGuestHashes.has(hashTimeKey)) continue;
      if (!h.content_hash) continue;

      const reconstructedKey = audioObjectKey("free", h.content_hash, new Date(h.created_at));
      unifiedGuestRows.push({
        id: -hid,
        createdAt: h.created_at,
        expiresAtRaw: h.expires_at ?? null,
        lang: h.language_code || "hi-IN",
        voice: h.voice_code || "Standard",
        speed: Number(h.speed) || 1.0,
        chars: Number(h.char_count) || 0,
        inputId: hid,
        inlineExcerpt: h.content_excerpt || h.excerpt || null,
        status: "success",
        objectKey: reconstructedKey,
        isRecoveredHeader: true,
      });
    }

    unifiedGuestRows.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const guestExcerptMap = await loadExcerptMap(
      unifiedGuestRows.map((u) => u.inputId || 0).filter((id) => id > 0)
    );

    const expiredGuestGenIds: Array<{ id: number; key: string | null }> = [];
    const expiredGuestHeaderIds: Array<{ id: number; key: string | null }> = [];

    const guestItems: HistoryItem[] = await Promise.all(
      unifiedGuestRows.slice(0, 30).map(async (r) => {
        const createdAtMs = new Date(r.createdAt).getTime();
        const expiresAtDate = r.expiresAtRaw
          ? new Date(r.expiresAtRaw)
          : new Date(createdAtMs + guestRetentionMs);

        const isExpired = now >= expiresAtDate.getTime();
        if (isExpired) {
          if (r.isRecoveredHeader) {
            expiredGuestHeaderIds.push({ id: Math.abs(r.id), key: r.objectKey });
          } else {
            expiredGuestGenIds.push({ id: r.id, key: r.objectKey });
          }
        }

        const remainingSeconds = isExpired
          ? 0
          : Math.max(0, Math.floor((expiresAtDate.getTime() - now) / 1000));

        let retentionLabel = "Audio Expired (30m reached)";
        if (!isExpired) {
          const mins = Math.floor(remainingSeconds / 60);
          const secs = remainingSeconds % 60;
          retentionLabel = `${mins}m ${secs}s remaining`;
        }

        let audioUrl: string | null = null;
        if (!isExpired && r.objectKey && storage) {
          try {
            audioUrl = await storage.url(r.objectKey, 1800);
          } catch {
            audioUrl = null;
          }
        }

        const excerpt =
          r.inlineExcerpt ||
          (r.inputId && guestExcerptMap[r.inputId]) ||
          "Generated speech preview";

        return {
          id: r.id,
          createdAt: r.createdAt,
          expiresAt: expiresAtDate.toISOString(),
          lang: r.lang,
          voice: r.voice,
          speed: r.speed,
          chars: r.chars,
          excerpt,
          status: r.status,
          isExpired,
          retentionLabel,
          remainingSeconds,
          audioUrl,
          tier: "anon",
        };
      })
    );

    if (expiredGuestGenIds.length > 0 || expiredGuestHeaderIds.length > 0) {
      Promise.allSettled([
        ...expiredGuestGenIds.map(async (exp) => {
          if (exp.key && storage) await storage.delete(exp.key).catch(() => {});
          await admin
            .from("tts_generations")
            .update({ audio_object_key: null })
            .eq("id", exp.id);
        }),
        ...expiredGuestHeaderIds.map(async (exp) => {
          if (exp.key && storage) await storage.delete(exp.key).catch(() => {});
          await admin
            .from("tts_input_header")
            .update({ status: "purged" })
            .eq("id", exp.id);
        }),
      ]).catch(() => {});
    }

    const activeGuestItems = guestItems.filter((item) => !item.isExpired && !!item.audioUrl);

    return respond(
      {
        userType: "guest",
        retentionNotice: guestRetentionNotice,
        retentionDurationMinutes: guestRetentionDurationMinutes,
        history: activeGuestItems,
      } satisfies HistoryResponse,
      200,
      subject
    );
  } catch (err) {
    console.error("history_route_error", err);
    return NextResponse.json(
      { error: "Failed to fetch conversion history." },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/history?id=<id>  or  DELETE /api/history?clear=all
 * Purges the stored audio object and detaches `audio_object_key` while
 * preserving `status = 'success'` / `'purged'` and `char_count` so character
 * allowance tracking remains 100% accurate.
 */
export async function DELETE(req: NextRequest) {
  const subject = getSubject(req);
  const idParam = req.nextUrl.searchParams.get("id");
  const clearAll = req.nextUrl.searchParams.get("clear") === "all";

  if (!idParam && !clearAll) {
    return NextResponse.json(
      { error: "Missing history item ID." },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();
    const [{ data: authData }, storage] = await Promise.all([
      supabase.auth.getUser(),
      getStorage().catch(() => null),
    ]);
    const user = authData.user ?? null;

    let deletedCount = 0;

    // Case A: Single recovered header item (negative ID)
    if (!clearAll && idParam && Number(idParam) < 0) {
      const headerId = Math.abs(Number(idParam));
      let hQuery = admin
        .from("tts_input_header")
        .select("id, content_hash, created_at")
        .eq("id", headerId)
        .eq("status", "generated");

      if (user) {
        hQuery = hQuery.eq("customer_id", user.id);
      } else {
        hQuery = hQuery.eq("anon_subject_id", subject.sid).is("customer_id", null);
      }

      const { data: hRows } = await hQuery;
      if (hRows && hRows.length > 0) {
        for (const h of hRows) {
          if (h.content_hash && storage) {
            const key = audioObjectKey("free", h.content_hash, new Date(h.created_at));
            await storage.delete(key).catch(() => {});
          }
        }
        await admin
          .from("tts_input_header")
          .update({ status: "purged" })
          .in("id", hRows.map((h) => h.id));
        deletedCount += hRows.length;
      }

      return NextResponse.json({ success: true, deletedCount });
    }

    // Case B: Standard tts_generations items (or clearAll across both tables)
    let genQuery = admin
      .from("tts_generations")
      .select("id, input_id, audio_object_key")
      .not("audio_object_key", "is", null);

    if (user) {
      genQuery = genQuery.eq("customer_id", user.id);
    } else {
      genQuery = genQuery.eq("anon_subject_id", subject.sid).is("customer_id", null);
    }

    if (!clearAll && idParam) {
      const numericId = Number(idParam);
      if (!Number.isFinite(numericId)) {
        return NextResponse.json({ error: "Invalid history ID." }, { status: 400 });
      }
      genQuery = genQuery.eq("id", numericId);
    }

    const { data: genTargets } = await genQuery.limit(100);
    if (genTargets && genTargets.length > 0) {
      await Promise.allSettled(
        genTargets.map(async (row) => {
          if (row.audio_object_key && storage) {
            await storage.delete(row.audio_object_key).catch(() => {});
          }
        })
      );

      await admin
        .from("tts_generations")
        .update({ audio_object_key: null })
        .in("id", genTargets.map((t) => t.id));

      const linkedHeaderIds = genTargets
        .map((t) => Number(t.input_id))
        .filter((id) => Number.isFinite(id) && id > 0);
      if (linkedHeaderIds.length > 0) {
        await admin
          .from("tts_input_header")
          .update({ status: "purged" })
          .in("id", linkedHeaderIds);
      }

      deletedCount += genTargets.length;
    }

    if (clearAll) {
      let hClearQuery = admin
        .from("tts_input_header")
        .select("id, content_hash, created_at")
        .eq("status", "generated");

      if (user) {
        hClearQuery = hClearQuery.eq("customer_id", user.id);
      } else {
        hClearQuery = hClearQuery.eq("anon_subject_id", subject.sid).is("customer_id", null);
      }

      const { data: hTargets } = await hClearQuery.limit(100);
      if (hTargets && hTargets.length > 0) {
        await Promise.allSettled(
          hTargets.map(async (h) => {
            if (h.content_hash && storage) {
              const key = audioObjectKey("free", h.content_hash, new Date(h.created_at));
              await storage.delete(key).catch(() => {});
            }
          })
        );
        await admin
          .from("tts_input_header")
          .update({ status: "purged" })
          .in("id", hTargets.map((h) => h.id));
        deletedCount += hTargets.length;
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
    });
  } catch (err) {
    console.error("history_delete_error", err);
    return NextResponse.json(
      { error: "Failed to remove history item." },
      { status: 500 }
    );
  }
}
