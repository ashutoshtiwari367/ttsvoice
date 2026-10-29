-- ==============================================================================
-- FreeTTSVoice: Seed All 18 Languages & Voices into Supabase Database
-- Run this in your Supabase Dashboard -> SQL Editor
-- ==============================================================================

-- 1. Insert/Update All 18 Languages in tts_languages table
INSERT INTO public.tts_languages (code, label, is_active, sort_order) VALUES
('hi-IN', 'Hindi (हिन्दी)', true, 1),
('en-IN', 'Indian English', true, 2),
('ta-IN', 'Tamil (தமிழ்)', true, 3),
('te-IN', 'Telugu (తెలుగు)', true, 4),
('mr-IN', 'Marathi (मराठी)', true, 5),
('bn-IN', 'Bengali (বাংলা)', true, 6),
('gu-IN', 'Gujarati (ગુજરાતી)', true, 7),
('kn-IN', 'Kannada (ಕನ್ನಡ)', true, 8),
('ml-IN', 'Malayalam (മലയാളം)', true, 9),
('pa-IN', 'Punjabi (ਪੰਜਾਬੀ)', true, 10),
('ur-IN', 'Urdu (اردو)', true, 11),
('en-US', 'English (US)', true, 20),
('en-GB', 'English (UK)', true, 21),
('es-ES', 'Spanish (Español)', true, 22),
('fr-FR', 'French (Français)', true, 23),
('de-DE', 'German (Deutsch)', true, 24),
('ar-XA', 'Arabic (العربية)', true, 25),
('ja-JP', 'Japanese (日本語)', true, 26)
ON CONFLICT (code) DO UPDATE 
SET label = EXCLUDED.label,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;

-- 2. Insert/Update Voices into models_voices table
-- tts_language_id and voice_code are NOT NULL constraints in models_voices:
-- - tts_language_id is resolved by joining with public.tts_languages (l.id)
-- - voice_code is set to the unique voice id (or preserved if already existing)
INSERT INTO public.models_voices (
    id,
    tts_language_id,
    language_code,
    voice_code,
    display_name,
    gender,
    provider,
    tier,
    cost_per_millchar,
    cost_currency,
    is_active,
    sort_order
)
SELECT 
    v.id,
    l.id AS tts_language_id,
    v.language_code,
    v.id AS voice_code,
    v.display_name,
    v.gender,
    v.provider,
    v.tier,
    v.cost_per_millchar,
    v.cost_currency,
    true AS is_active,
    v.sort_order
FROM (VALUES
    -- Hindi
    ('hi-IN-Wavenet-B', 'hi-IN', 'Arjun (अर्जुन)', 'male', 'google', 'free', 4::numeric, 'USD', 1),
    ('hi-IN-Wavenet-A', 'hi-IN', 'Aditi (अदिति)', 'female', 'google', 'free', 4::numeric, 'USD', 2),
    ('hi-IN-Wavenet-C', 'hi-IN', 'Rohit (रोहित)', 'male', 'google', 'free', 4::numeric, 'USD', 3),
    ('hi-IN-Wavenet-D', 'hi-IN', 'Priya (प्रिया)', 'female', 'google', 'free', 4::numeric, 'USD', 4),
    ('hi-IN-Neural2-A', 'hi-IN', 'Ananya Studio', 'female', 'google', 'paid', 16::numeric, 'USD', 5),
    ('hi-IN-Neural2-B', 'hi-IN', 'Kabir Studio', 'male', 'google', 'paid', 16::numeric, 'USD', 6),

    -- Indian English
    ('en-IN-Wavenet-B', 'en-IN', 'Dev (Corporate & News)', 'male', 'google', 'free', 4::numeric, 'USD', 10),
    ('en-IN-Wavenet-A', 'en-IN', 'Isha (Natural & Smooth)', 'female', 'google', 'free', 4::numeric, 'USD', 11),
    ('en-IN-Wavenet-C', 'en-IN', 'Rohan (Friendly & Tech)', 'male', 'google', 'free', 4::numeric, 'USD', 12),
    ('en-IN-Wavenet-D', 'en-IN', 'Meera (Youthful Voice)', 'female', 'google', 'free', 4::numeric, 'USD', 13),
    ('en-IN-Neural2-A', 'en-IN', 'Diya Ultra', 'female', 'google', 'paid', 16::numeric, 'USD', 14),
    ('en-IN-Neural2-B', 'en-IN', 'Aarav Ultra', 'male', 'google', 'paid', 16::numeric, 'USD', 15),

    -- Tamil
    ('ta-IN-Wavenet-D', 'ta-IN', 'Karthik (கார்த்திக்)', 'male', 'google', 'free', 4::numeric, 'USD', 20),
    ('ta-IN-Wavenet-C', 'ta-IN', 'Deepa (தீபா)', 'female', 'google', 'free', 4::numeric, 'USD', 21),
    ('ta-IN-Wavenet-B', 'ta-IN', 'Surya (சூர்யா)', 'male', 'google', 'free', 4::numeric, 'USD', 22),
    ('ta-IN-Wavenet-A', 'ta-IN', 'Vani (வாணி)', 'female', 'google', 'free', 4::numeric, 'USD', 23),

    -- Telugu
    ('te-IN-Standard-B', 'te-IN', 'Suresh (సురేష్)', 'male', 'google', 'free', 4::numeric, 'USD', 30),
    ('te-IN-Standard-A', 'te-IN', 'Lakshmi (లక్ష్మి)', 'female', 'google', 'free', 4::numeric, 'USD', 31),

    -- Marathi
    ('mr-IN-Wavenet-B', 'mr-IN', 'Aniket (अनिकेत)', 'male', 'google', 'free', 4::numeric, 'USD', 40),
    ('mr-IN-Wavenet-A', 'mr-IN', 'Sai (साई)', 'female', 'google', 'free', 4::numeric, 'USD', 41),
    ('mr-IN-Wavenet-C', 'mr-IN', 'Tanvi (तन्वी)', 'female', 'google', 'free', 4::numeric, 'USD', 42),

    -- Bengali
    ('bn-IN-Wavenet-D', 'bn-IN', 'Subir (সুবীর)', 'male', 'google', 'free', 4::numeric, 'USD', 50),
    ('bn-IN-Wavenet-C', 'bn-IN', 'Tithi (তিথি)', 'female', 'google', 'free', 4::numeric, 'USD', 51),

    -- Gujarati
    ('gu-IN-Wavenet-D', 'gu-IN', 'Harish (હરીશ)', 'male', 'google', 'free', 4::numeric, 'USD', 60),
    ('gu-IN-Wavenet-C', 'gu-IN', 'Dhwani (ધ્વનિ)', 'female', 'google', 'free', 4::numeric, 'USD', 61),

    -- Kannada
    ('kn-IN-Wavenet-D', 'kn-IN', 'Praveen (ಪ್ರವೀಣ್)', 'male', 'google', 'free', 4::numeric, 'USD', 70),
    ('kn-IN-Wavenet-C', 'kn-IN', 'Kavya (ಕಾವ್ಯ)', 'female', 'google', 'free', 4::numeric, 'USD', 71),

    -- Malayalam
    ('ml-IN-Wavenet-D', 'ml-IN', 'Madhav (മാധവ്)', 'male', 'google', 'free', 4::numeric, 'USD', 80),
    ('ml-IN-Wavenet-C', 'ml-IN', 'Anju (അഞ്જു)', 'female', 'google', 'free', 4::numeric, 'USD', 81),

    -- Punjabi
    ('pa-IN-Wavenet-B', 'pa-IN', 'Gurpreet (ਗੁਰਪ੍ਰੀਤ)', 'male', 'google', 'free', 4::numeric, 'USD', 90),
    ('pa-IN-Wavenet-A', 'pa-IN', 'Simran (ਸਿਮਰਨ)', 'female', 'google', 'free', 4::numeric, 'USD', 91),

    -- Urdu
    ('ur-IN-Wavenet-B', 'ur-IN', 'Tariq (طارق)', 'male', 'google', 'free', 4::numeric, 'USD', 100),
    ('ur-IN-Wavenet-A', 'ur-IN', 'Zoya (زویا)', 'female', 'google', 'free', 4::numeric, 'USD', 101),

    -- English US
    ('en-US-Wavenet-D', 'en-US', 'David (Commercial)', 'male', 'google', 'free', 4::numeric, 'USD', 110),
    ('en-US-Wavenet-C', 'en-US', 'Emily (Casual & Friendly)', 'female', 'google', 'free', 4::numeric, 'USD', 111),
    ('en-US-Neural2-J', 'en-US', 'Michael (Professional)', 'male', 'google', 'paid', 16::numeric, 'USD', 112),
    ('en-US-Neural2-F', 'en-US', 'Sarah (Warm & Natural)', 'female', 'google', 'paid', 16::numeric, 'USD', 113),

    -- English UK
    ('en-GB-Wavenet-B', 'en-GB', 'Ryan (British Narrator)', 'male', 'google', 'free', 4::numeric, 'USD', 120),
    ('en-GB-Wavenet-A', 'en-GB', 'Sonia (British Classical)', 'female', 'google', 'free', 4::numeric, 'USD', 121),
    ('en-GB-Neural2-B', 'en-GB', 'Oliver (Narrator Pro)', 'male', 'google', 'paid', 16::numeric, 'USD', 122),
    ('en-GB-Neural2-A', 'en-GB', 'Charlotte (BBC Style)', 'female', 'google', 'paid', 16::numeric, 'USD', 123),

    -- Spanish
    ('es-ES-Wavenet-B', 'es-ES', 'Alvaro (Español Dinámico)', 'male', 'google', 'free', 4::numeric, 'USD', 130),
    ('es-ES-Wavenet-C', 'es-ES', 'Lucia (Español Claro)', 'female', 'google', 'free', 4::numeric, 'USD', 131),

    -- French
    ('fr-FR-Wavenet-B', 'fr-FR', 'Henri (Français Élégant)', 'male', 'google', 'free', 4::numeric, 'USD', 140),
    ('fr-FR-Wavenet-A', 'fr-FR', 'Celine (Français Doux)', 'female', 'google', 'free', 4::numeric, 'USD', 141),

    -- German
    ('de-DE-Wavenet-B', 'de-DE', 'Klaus (Deutsch Markant)', 'male', 'google', 'free', 4::numeric, 'USD', 150),
    ('de-DE-Wavenet-A', 'de-DE', 'Marlene (Deutsch Klar)', 'female', 'google', 'free', 4::numeric, 'USD', 151),

    -- Arabic
    ('ar-XA-Wavenet-B', 'ar-XA', 'Omar (عمر)', 'male', 'google', 'free', 4::numeric, 'USD', 160),
    ('ar-XA-Wavenet-A', 'ar-XA', 'Fatima (فاطمة)', 'female', 'google', 'free', 4::numeric, 'USD', 161),

    -- Japanese
    ('ja-JP-Wavenet-C', 'ja-JP', 'Keita (健太)', 'male', 'google', 'free', 4::numeric, 'USD', 170),
    ('ja-JP-Wavenet-A', 'ja-JP', 'Nanami (七海)', 'female', 'google', 'free', 4::numeric, 'USD', 171)
) AS v(id, language_code, display_name, gender, provider, tier, cost_per_millchar, cost_currency, sort_order)
JOIN public.tts_languages l ON l.code = v.language_code
ON CONFLICT (id) DO UPDATE 
SET tts_language_id = EXCLUDED.tts_language_id,
    language_code = EXCLUDED.language_code,
    voice_code = COALESCE(models_voices.voice_code, EXCLUDED.voice_code),
    display_name = EXCLUDED.display_name,
    gender = EXCLUDED.gender,
    provider = EXCLUDED.provider,
    tier = EXCLUDED.tier,
    cost_per_millchar = EXCLUDED.cost_per_millchar,
    cost_currency = EXCLUDED.cost_currency,
    is_active = EXCLUDED.is_active,
    sort_order = EXCLUDED.sort_order;
