# FreeTTSVoice: Build & Test Document
> **One place for:** Requirements, Table/Field changes, Test Cases, and Build Order.  
> **Hand to developer, or work through yourself.**  
> **Status:** `[NOW]` • `[SOON]` • `[NEXT=with login]` • `[AFTER login]`

---

## 1. PRE-BUILD CHECK (Completed & Live)

```sql
SELECT 'tts_inputs' AS c, COUNT(*) FROM tts_inputs
UNION ALL 
SELECT 'tts_input_header', COUNT(*) FROM tts_input_header
UNION ALL 
SELECT 'tts_input_item', COUNT(*) FROM tts_input_item;
```

### Verified Live Status:
- **`tts_input_header` (Live count: 20 rows, recent: Oct 17):** Confirmed LIVE input header table.
- **`tts_input_item` (Live count: 20 rows, recent: Oct 17):** Confirmed LIVE raw content table.
- **`tts_inputs` (Count: 31 rows, older: Oct 15):** Legacy inactive table $\to$ parked as `tz_tts_inputs`.

---

## 2. TIER LADDER (Locked)

| Tier | Char / Request | Audio Retention | Voices | Extras |
| :--- | :--- | :--- | :--- | :--- |
| **Anon (no login)** | **1,000** | 30 minutes | Standard only | Generate + download |
| **Free (email login)** | **10,000** | 7 days | Standard + WaveNet | History, saved templates |
| **Pro (credits)** | Higher (5,000+) | 7+ days / longer | + Neural2 / Premium | Credits, long-form |

> **Cost caution:** WaveNet free for logged-in is ~4x Standard. Bound it with the logged-in daily cap (`pricing_plans` free `day_cap` = 20,000) + global `daily_safety_cap`. Standard stays anon; WaveNet is the login reward.

---

## 3. REQUIREMENTS TABLE

| # | Requirement | Priority | Config-driven Source | Status |
| :--- | :--- | :--- | :--- | :---: |
| **R1** | Char counter shows **REAL limit from API**; counter value = backend validation value (same config number) | `NOW` | `pricing_plans.req_cap` | 🟢 **COMPLETED** |
| **R3** | Capture `reason_code` + `error_message` + 200-char `content_excerpt` in input header | `NOW` | Always On | 🟢 **COMPLETED** |
| **R4** | Strip emojis/symbols before sending to Google; keep punctuation; store original | `NOW` | `strip_emojis` | 🟢 **COMPLETED** |
| **R7 / R10** | Consolidate: one input source + one master view (`v_request_full`); park unused objects as `tz_<name>` | `NOW` | `v_request_full` | 🟢 **COMPLETED** |
| **R9** | Cloudflare Turnstile on the **generate action only** (not page load) | `NOW` | `turnstile_enabled` | 🟢 **COMPLETED** |
| **R11** | Email login (Supabase Auth via own `/api/auth/*`, server session) | `NEXT` | Server Session | 🟢 **COMPLETED** |
| **R12** | Logged-in unlocks: `req_cap 10000`, WaveNet voices, 7-day retention, history | `NEXT` | `pricing_plans` + retention | 🟢 **COMPLETED** |
| **R13** | Retention by tier: anon 30 min, free 7 days (`tc_retention_policy` + n8n purge job) | `NEXT` | `tc_retention_policy` | 🟢 **COMPLETED** |
| **R14** | Saved templates: `tt_user_template` (name, voice_code, lang, speed) | `NEXT` | DB Table | 🟢 **COMPLETED** |
| **R16** | `/history` page: user sees own past generations; audio within retention; "kept N days" | `NEXT` | Retention | 🟢 **COMPLETED** |
| **R17** | `customer_no`: pure bigint from 10000000, auto-assigned; UUID stays PK | `NEXT` | PostgreSQL Sequence | 🟢 **COMPLETED** |
| **R5** | "Generate anyway?" popup for blatant junk only; never hard-block | `SOON` | `junk thresholds` | ⏸️ **ON HOLD** *(Skipped)* |
| **R6** | Feedback button $\to$ `tt_feedback` + email; reward bonus chars | `SOON` | `feedback_reward_chars` | ⏸️ **ON HOLD** *(Skipped)* |
| **R8** | Editable site copy at runtime (`tc_site_copy` + CF cache + purge + file fallback) | `SOON` | `tc_site_copy` | ⏸️ **ON HOLD** *(Skipped)* |
| **R15** | Pro/credits (Razorpay) + `credit_multiplier` per voice; "Upgrade to Pro" always visible | `AFTER login` | `pack_catalog`, multipliers | ⏳ **PENDING** |
| **R2** | Longer text = login (anon 1000 / free 10000 / paid higher), all from config | `with R11/R15` | `pricing_plans` | ⏳ **PENDING** |

---

## 4. TABLE / FIELD CHANGES & SEED CONFIG

### 4.1 `tts_input_header` `[NOW]`
Add diagnosis and preview columns:
- `reason_code text` — e.g. `text_too_long`, `daily_limit_reached`, `invalid_voice`, `turnstile_failed`
- `error_message text` — human message shown to user
- `content_excerpt text` — first 200 chars of submitted text (readable preview)

### 4.2 `app_config` (Seeded in Supabase) `[NOW / SOON]`
| Key | Seeded Value | Type | Description | Priority |
| :--- | :--- | :--- | :--- | :--- |
| `strip_emojis` | `true` | bool | Strip emojis before Google TTS, preserve punctuation. Case-insensitive. | `NOW` |
| `turnstile_enabled` | `true` | bool | Enforce Turnstile verification on generate action only. Case-insensitive. | `NOW` |
| `junk_min_letters` | `2` | int | Minimum letters in text before triggering junk check. Case-insensitive. | `SOON` |
| `junk_max_repeat` | `20` | int | Maximum repeated consecutive characters. Case-insensitive. | `SOON` |
| `feedback_reward_chars` | `10000` | int | Reward bonus chars for feedback submission. Case-insensitive. | `SOON` |

### 4.3 `pricing_plans` (Config Edits, No Schema Change) `[NOW / NEXT]`
- `anon.req_cap = 1000` (Updated in DB)
- `free.req_cap = 10000`, `free.day_cap = 20000` (WaveNet cost guard, Updated in DB)
- `paid.req_cap = 5000+` (Credits, unlocked)

### 4.4 Views `[NOW]`
- **`v_request_full`**: Master view uniting `tts_input_header` + `tts_input_item` + `tts_generations` (who/where/what/outcome/cost, one row/attempt).
- **Parked Objects**:
  - `tz_tts_inputs` $\leftarrow$ renamed from `tts_inputs`.
  - `tz_v_request_overview` $\leftarrow$ renamed from legacy `v_request_overview`.

### 4.5 New Tables `[SOON / NEXT]`
- **`tt_feedback` `[SOON]`**: `id`, `created_at`, `email UNIQUE`, `message`, `rating`, `anon_subject_id`, `country`, `device`, `reward_code`, `reward_granted`.
- **`tc_site_copy` `[SOON]`**: `key`, `value`, `brand_id`, `locale`, `updated_at`.
- **`tt_user_template` `[NEXT]`**: `id`, `customer_id UUID`, `name`, `voice_code`, `language_code`, `speed`, `created_at`.
- **`customers` `[NEXT, with login]`**: `customer_no BIGINT UNIQUE` auto-assigned from sequence starting `10000000` (pure number, no prefix/suffix).

*(Full ready-to-run SQL is available in [`supabase_migrations_now.sql`](file:///c:/Users/lenovo/Desktop/mine%20(1)/supabase_migrations_now.sql))*

---

## 5. CODE CHANGES (IMPLEMENTATION DETAILS)

### 5.1 Backend (`lib/`) `[NOW]`
1. **`lib/tts/textSanitizer.ts`:**
   - Strips Unicode emojis & pictographs while preserving alphabets (Devanagari, Latin, Dravidian), punctuation (`. , ! ? - " ' /`), and Devanagari danda (`।`, `॥`).
2. **`lib/tts/generationService.ts`:**
   - Reads `strip_emojis` from `app_config` (case-insensitive); strips before sending to Google; raw text stored in `tts_input_item`.
   - On every path (success, validation failure, quota breach, bot block, busy, provider error), writes `reason_code` + `error_message` + `content_excerpt` via `updateInputStatus`.
   - Cloudflare Turnstile token verified if `turnstile_enabled` is active.
3. **`lib/usage.ts`:**
   - `insertInput` writes to `tts_input_header` and `tts_input_item`.
   - `updateInputStatus` updates terminal header status and reason/error messages.
4. **`lib/appconfig.ts`:**
   - Case-insensitive config lookup (`getConfigBool`, `getConfigInt`, `getConfigValue`).

### 5.2 Frontend (`components/`) `[NOW / SOON]`
1. **`components/tts/ScriptEditor.tsx` & `TTSWorkspace.tsx` `[NOW]`:**
   - Counter dynamically bounds to real API limit `userCredits?.reqCap` (1,000 for anon, 10,000 for free).
   - Generates and sends `turnstileToken` with `/api/generate`.
2. **Junk Check Modal `[SOON]`:**
   - "Generate anyway?" popup on junk thresholds (`junk_min_letters`, `junk_max_repeat`).
3. **Feedback Button `[SOON]`:**
   - Feedback form submitting to `/api/feedback`.

---

## 6. TEST CASES MATRIX

| # | Test Scenario | Input Data | Expected Result |
| :--- | :--- | :--- | :--- |
| **R1** | Set anon `req_cap=1000`, reload | Anonymous user | Counter shows `/ 1,000`; 1001 chars blocked before generate. |
| **R1** | Change `req_cap` to 1500 in DB, wait ~1 min, reload | Anonymous user | Counter shows `/ 1,500` dynamically with no redeploy. |
| **R3** | Submit over-cap text | 1,200 chars as anon | `tts_input_header`: `status=validation_failed`, `reason_code=text_too_long`, `content_excerpt` holds first 200 chars. |
| **R3** | Successful generate | Valid text | `tts_input_header`: `status=generated`, `reason_code=null`, `content_excerpt` present. |
| **R4** | Generate text with emojis | `"🌺🙏 जय माता दी 🚩"` | Audio has no emoji audio glitch; original stored in DB; provider gets cleaned text. |
| **R4** | Punctuation pause check | `"Hello, world! Ready?"` | Punctuation pauses preserved. |
| **R4** | `strip_emojis=off` | Emojis in text | Emojis reach provider (toggle works); set back on. |
| **R9** | Human generate | Click Generate button | Invisible/one-tap Turnstile; succeeds with no intrusive puzzle. |
| **R9** | Direct `/api/generate` with no token | Postman / Script (when enabled) | Rejected with 403 `turnstile_failed`; no Google API cost incurred. |
| **R9** | Page load + crawl | Load `/text-to-speech` | Turnstile executes only on generate action; page loads fast and is fully crawlable. |
| **R9** | `turnstile_enabled=off` | Generate without token | Generate works tokenless (debug mode); set back on. |
| **R7/R10** | Consolidated input flow | Submit generations | Rows created in `tts_input_header` + `tts_input_item`; `tz_tts_inputs` parked. |
| **R7** | Query `v_request_full` | View query | Returns one row per attempt: who, where, what, outcome, cost, excerpt. |
| **R10** | After `tz_` rename | Test application | App works seamlessly; nothing references `tz_*`; legacy data safely preserved. |
| **R5** | Blatant junk test | `"aaaaaaaaaaaaaaaaaaaa"` | Triggers "Generate anyway?" popup. |
| **R5** | Normal Hindi + name + mixed | `"नमस्ते, मेरा नाम राहुल है।"` | No popup; generates smoothly. |
| **R6** | Submit feedback + email | `user@example.com` | `tt_feedback` row created; 2nd submit with same email does not duplicate reward. |
| **R8** | Edit site copy | `tc_site_copy` key | New text updates without redeploy. Fallback works if DB unreachable. |
| **R11** | Signup / Login / Logout | Email Auth | Server session cookie persists; `customers` row created. |
| **R12** | Logged-in user unlocks | Log in with account | Counter shows `/ 10,000`; WaveNet voices selectable; 7-day retention active. |
| **R13** | Retention purge | Post 30 min (anon) / 7 days (free) | Purge job deletes expired audio files from S3/bucket. |
| **R14** | Save + reuse template | Custom preset | `tt_user_template` stores and applies voice, lang, speed. |
| **R16** | `/history` page | Authenticated user | Shows only own generations; audio playable within retention window. |
| **R17** | Customer number generation | New user signup | `customers.customer_no` is pure bigint $\ge 10000000$, unique, UUID PK unchanged. |
| **R15** | Buy Pro pack | Razorpay test payment | Credits added idempotently; premium voices unlock; charge = chars $\times$ multiplier. |

---

## 7. BUILD ORDER & PHASING

```
[NOW] One batch:
  ├── R7/R10 (Consolidate live tables + v_request_full view + tz_ parking)
  ├── R3 (reason_code + error_message + content_excerpt)
  ├── R4 (strip emojis before synth, keep punctuation, store original)
  ├── R1 (Live API counter: anon 1,000, free 10,000)
  └── R9 (Turnstile on generate action only)
  Clean data, better audio quality, and bot protection.

[70%] Traffic & Discovery:
  └── Google Search Console + sitemap.xml + first SEO landing pages.

[SOON] Community & Runtime Controls:
  ├── R5 ("Generate anyway?" junk threshold popup)
  ├── R6 (Feedback button + tt_feedback + bonus credit reward)
  └── R8 (Runtime editable site copy tc_site_copy with CF cache & file fallback)

[NEXT] User Lifecycle & Retention:
  ├── R11 (Supabase Auth email login, own /api/auth/*, server session)
  ├── R17 (Pure bigint customer_no sequence starting 10000000)
  ├── R12 (Logged-in 10K char limit, WaveNet voices unlocked)
  ├── R13 (Retention policy: anon 30 min, free 7 days)
  ├── R16 (/history dashboard for personal generations)
  └── R14 (Saved voice presets tt_user_template)

[AFTER login] Monetization & Pro Packs:
  └── R15 (Razorpay prepaid packs + credit_multiplier per voice + Pro banner)
```

---

## 8. DESIGN DEFAULTS (Engineering Playbook Rules)

1. **Public IDs:** Pure bigint, no prefix/suffix (e.g. `customer_no = 10000042`); internal UUID PK separate.
2. **Config Read:** Always case-insensitive; description states valid values + "case-insensitive".
3. **Table Naming Standard:**
   - `tc_` $\to$ Config tables (`tc_site_copy`, `tc_retention_policy`)
   - `tm_` $\to$ Master data (`tm_voices`, `tm_languages`)
   - `tt_` $\to$ Transactional data (`tt_feedback`, `tt_user_template`)
   - `v_` $\to$ Views (`v_request_full`)
   - `tz_` $\to$ Parked / legacy objects (`tz_tts_inputs`, `tz_v_request_overview`)
4. **Network Isolation:** Browser calls own Next.js API only (`/api/*`); server wrappers call Supabase, Google Cloud TTS, and Razorpay.
5. **Pre-Deploy Rule:** `npm run build` with envs unset must pass; no client initialized at import time; `route.ts` files strictly named.
