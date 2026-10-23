-- ==============================================================================
-- FreeTTSVoice: Supabase SQL Migrations [NOW / SOON / NEXT]
-- Paste and run this script in: Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- ── 1. tts_input_header [NOW] ────────────────────────────────────────────────
-- Add reason_code, error_message, and content_excerpt to live input header
ALTER TABLE IF EXISTS public.tts_input_header
    ADD COLUMN IF NOT EXISTS reason_code TEXT,
    ADD COLUMN IF NOT EXISTS error_message TEXT,
    ADD COLUMN IF NOT EXISTS content_excerpt TEXT;

-- ── 2. Views & Table Consolidation [NOW] ─────────────────────────────────────
-- Park legacy tts_inputs as tz_tts_inputs (Confirmed header/item is live)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tts_inputs') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tz_tts_inputs') THEN
        ALTER TABLE public.tts_inputs RENAME TO tz_tts_inputs;
    END IF;
END $$;

-- Park old v_request_overview if present
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'v_request_overview') 
       AND NOT EXISTS (SELECT FROM pg_views WHERE schemaname = 'public' AND viewname = 'tz_v_request_overview') THEN
        ALTER VIEW public.v_request_overview RENAME TO tz_v_request_overview;
    END IF;
END $$;

-- Create Master View: v_request_full (who/where/what/outcome/cost, one row/attempt)
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

    -- Cost & Engine Accounting (cost)
    g.provider,
    g.voice_tier,
    g.estimated_cost_inr,
    g.fx_rate_to_inr,
    g.cost_source_currency
FROM public.tts_input_header h
LEFT JOIN public.tts_input_item i ON h.id = i.header_id
LEFT JOIN public.tts_generations g ON h.id = g.input_id;

-- ── 3. New Tables [SOON / NEXT] ──────────────────────────────────────────────
-- User Feedback Table (tt_feedback) [SOON]
CREATE TABLE IF NOT EXISTS public.tt_feedback (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    email TEXT UNIQUE NOT NULL,
    message TEXT NOT NULL,
    rating INT CHECK (rating BETWEEN 1 AND 5),
    anon_subject_id VARCHAR(64),
    country VARCHAR(8),
    device VARCHAR(32),
    reward_code VARCHAR(64),
    reward_granted BOOLEAN DEFAULT false
);

-- Runtime Editable Site Copy (tc_site_copy) [SOON]
CREATE TABLE IF NOT EXISTS public.tc_site_copy (
    key VARCHAR(128) NOT NULL,
    value TEXT NOT NULL,
    brand_id VARCHAR(64) DEFAULT 'freetts',
    locale VARCHAR(16) DEFAULT 'en',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (brand_id, locale, key)
);

-- Saved Templates Table (tt_user_template) [NEXT]
CREATE TABLE IF NOT EXISTS public.tt_user_template (
    id BIGSERIAL PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    name VARCHAR(128) NOT NULL,
    voice_code VARCHAR(64) NOT NULL,
    language_code VARCHAR(16) NOT NULL,
    speed NUMERIC(3, 2) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. customers sequence [NEXT, with login] ──────────────────────────────────
-- Sequence starting from 10000000 (pure number, no prefix/suffix)
CREATE SEQUENCE IF NOT EXISTS public.seq_customer_no START WITH 10000000 INCREMENT BY 1;

ALTER TABLE IF EXISTS public.customers
    ADD COLUMN IF NOT EXISTS customer_no BIGINT DEFAULT nextval('public.seq_customer_no') UNIQUE;
