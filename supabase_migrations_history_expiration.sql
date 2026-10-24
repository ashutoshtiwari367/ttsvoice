-- ==============================================================================
-- FreeTTSVoice / IndianTTS: Supabase SQL Migrations
-- Phase: Guest Access, Login Benefits, Character Allowance & History Expiration
-- Paste and run this script in: Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Add expires_at column to tts_generations and tts_input_header
ALTER TABLE IF EXISTS public.tts_generations
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE IF EXISTS public.tts_input_header
    ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 2. Indexes for efficient expiration cleanup and per-subject/customer allowance queries
CREATE INDEX IF NOT EXISTS idx_tts_generations_expires_at 
    ON public.tts_generations(expires_at) 
    WHERE expires_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_tts_generations_anon_allowance 
    ON public.tts_generations(anon_subject_id, status) 
    WHERE customer_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_tts_generations_cust_allowance 
    ON public.tts_generations(customer_id, status, tier);

-- 3. Update master view to include expires_at
CREATE OR REPLACE VIEW public.v_request_full AS
SELECT 
    -- Identification (who)
    h.id AS header_id,
    h.created_at,
    h.customer_id,
    h.anon_subject_id,
    h.ip_hash,
    h.is_new_subject,

    -- Geography & Client Info (where)
    h.country_code,
    h.continent_code,
    h.region_code,
    h.city,
    h.postal_code,
    h.timezone,
    h.device_type,
    h.browser_family,
    h.os_family,
    h.browser_lang,
    h.referrer_host,

    -- Speech Request Specification (what)
    h.language_code,
    h.voice_code,
    h.speed,
    h.char_count,
    COALESCE(h.content_excerpt, LEFT(i.content, 200)) AS content_excerpt,
    i.content AS full_content,
    i.retention_code,

    -- Outcome & Diagnostics (outcome)
    h.status AS header_status,
    h.reason_code,
    h.error_message,
    h.request_mode,
    g.id AS generation_id,
    g.status AS generation_status,
    g.audio_object_key,
    g.is_cache_hit,
    g.expires_at,

    -- Cost & Engine Accounting (cost)
    g.provider,
    g.voice_tier,
    g.estimated_cost_inr,
    g.fx_rate_to_inr,
    g.cost_source_currency
FROM public.tts_input_header h
LEFT JOIN public.tts_input_item i ON h.id = i.header_id
LEFT JOIN public.tts_generations g ON h.id = g.input_id;
