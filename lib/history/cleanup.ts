import { admin } from "@/lib/supabase/admin";
import { getStorage } from "@/lib/storage";

let lastCleanupAt = 0;
const CLEANUP_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

export interface CleanupResult {
  checkedCount: number;
  expiredCount: number;
  deletedAudioFilesCount: number;
  durationMs: number;
}

/**
 * Runs cleanup of expired TTS conversions and deletes their audio files from storage.
 * - Guest Conversions: Expire after 30 minutes from created_at
 * - Logged-in Free Conversions: Expire after 24 hours from created_at
 * - Premium Conversions: Expire after 30 days from created_at (or custom)
 */
export async function runHistoryCleanup(force = false): Promise<CleanupResult> {
  const now = Date.now();
  if (!force && now - lastCleanupAt < CLEANUP_THROTTLE_MS) {
    return {
      checkedCount: 0,
      expiredCount: 0,
      deletedAudioFilesCount: 0,
      durationMs: 0,
    };
  }
  lastCleanupAt = now;
  const startTime = Date.now();

  let checkedCount = 0;
  let expiredCount = 0;
  let deletedAudioFilesCount = 0;

  try {
    const storage = await getStorage().catch(() => null);

    // Fetch successful generations with audio keys (use '*' so missing expires_at column never errors)
    const { data: rows, error } = await admin
      .from("tts_generations")
      .select("*")
      .eq("status", "success")
      .not("audio_object_key", "is", null)
      .order("created_at", { ascending: true })
      .limit(200);

    if (error || !rows) {
      return {
        checkedCount,
        expiredCount,
        deletedAudioFilesCount,
        durationMs: Date.now() - startTime,
      };
    }

    checkedCount = rows.length;
    const nowTime = Date.now();

    for (const r of rows) {
      const createdAtMs = new Date(r.created_at).getTime();
      let isExpired = false;

      if (r.expires_at) {
        isExpired = nowTime > new Date(r.expires_at).getTime();
      } else if (!r.customer_id) {
        // Guest: 30 minutes
        isExpired = nowTime - createdAtMs > 30 * 60 * 1000;
      } else if (r.tier === "free") {
        // Logged-in Free: 24 hours
        isExpired = nowTime - createdAtMs > 24 * 60 * 60 * 1000;
      } else if (r.tier === "paid") {
        // Paid: 30 days
        isExpired = nowTime - createdAtMs > 30 * 24 * 60 * 60 * 1000;
      }

      if (isExpired) {
        expiredCount++;

        // Delete audio file from storage bucket
        if (r.audio_object_key && storage) {
          try {
            await storage.delete(r.audio_object_key);
            deletedAudioFilesCount++;
          } catch (delErr) {
            console.warn("cleanup_audio_delete_error", r.audio_object_key, delErr);
          }
        }

        // Update record in Supabase: status = 'expired', clear audio_object_key
        try {
          await admin
            .from("tts_generations")
            .update({
              status: "expired",
              audio_object_key: null,
            })
            .eq("id", r.id);
        } catch (dbErr) {
          console.warn("cleanup_db_update_error", r.id, dbErr);
        }
      }
    }
  } catch (err) {
    console.error("run_history_cleanup_failed", err);
  }

  return {
    checkedCount,
    expiredCount,
    deletedAudioFilesCount,
    durationMs: Date.now() - startTime,
  };
}

/**
 * Non-blocking trigger that runs cleanup lazily in the background.
 */
export function triggerBackgroundCleanup(): void {
  setTimeout(() => {
    runHistoryCleanup(false).catch((err) => {
      console.warn("background_cleanup_error", err);
    });
  }, 100);
}
