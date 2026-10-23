/**
 * ==============================================================================
 * site.ts / config/site.ts — MASTER SITE CONFIGURATION
 * ==============================================================================
 * 
 * Aapko poori website me koi bhi main cheez change karni ho (jaise Website Name,
 * Logo Text, Domain URL, Support Email, Phone, Social Media links, etc.), 
 * to sirf IS EK FILE me change karein.
 * 
 * Yeh changes pure project me automatically apply ho jayenge (Header, Footer,
 * SEO Meta tags, Login, Contact, About, Audio Downloads, etc.).
 * ==============================================================================
 */

export const siteConfig = {
  // ── 1. WEBSITE IDENTITY & BRANDING ──────────────────────────────────────────
  /** Full website name displayed across the site and in browser tabs */
  name: "IndianTTS",

  /** Short abbreviation or alternative brand name */
  shortName: "IndianTTS",

  /** Logo first word (e.g. "Indian" in "IndianTTS") */
  namePrefix: "Indian",

  /** Logo highlighted accent text (displayed in orange gradient, e.g. "TTS") */
  nameAccent: "TTS",

  /** Brand ID used in database (must match brands_website table if multi-tenant) */
  brandId: "freetts",

  /** Catchy tagline displayed in headers and Hero sections */
  tagline: "Natural Indian AI Voices, Simply.",

  /** Detailed description for SEO, Google Search previews, and Meta tags */
  description:
    "Convert text into natural-sounding Indian voices and download studio-ready MP3 audio. 100% prepaid with no forced subscriptions.",

  /** Short description used in footers and tooltips */
  shortDescription:
    "Natural Indian & global AI voice synthesis. Turn scripts into studio-ready speech.",

  // ── 2. DOMAIN & WEB ADDRESSES ───────────────────────────────────────────────
  /** Main root domain name without https */
  domain: "localhost:3000",

  /** Full production URL of your website (used in OpenGraph and Canonical links) */
  url: "http://localhost:3000",

  /** Support & contact email address */
  supportEmail: "hello@indiantts.in",

  /** Support phone number or WhatsApp business helpline (optional) */
  supportPhone: "+91 98765 43210",

  /** Physical or registered office address */
  address: "New Delhi, India",

  // ── 3. LEGAL & COMPANY DETAILS ──────────────────────────────────────────────
  /** Registered business or legal entity name */
  legalEntity: "IndianTTS Technologies Pvt. Ltd.",

  /** Country or legal jurisdiction for Terms & Privacy */
  jurisdiction: "India",

  /** Grievance Officer details (as per Indian IT Act requirements) */
  grievance: {
    name: "Grievance Officer",
    email: "grievance@indiantts.in",
    address: "New Delhi, India",
  },

  // ── 4. SOCIAL MEDIA & COMMUNITY LINKS ───────────────────────────────────────
  socials: {
    twitter: "https://twitter.com/indiantts",
    youtube: "https://youtube.com/@indiantts",
    instagram: "https://instagram.com/indiantts",
    linkedin: "https://linkedin.com/company/indiantts",
    github: "https://github.com/indiantts",
    telegram: "https://t.me/indiantts",
  },

  // ── 5. TTS (TEXT-TO-SPEECH) ENGINE DEFAULTS ─────────────────────────────────
  tts: {
    /** Default language pre-selected in studio (e.g. "hi-IN" for Hindi, "en-IN" for Indian English) */
    language: "hi-IN",

    /** Default voice pre-selected in studio */
    voice: "hi-IN-Wavenet-A",

    /** Default speech speed (1.0 = normal) */
    speed: 1.0,
    minSpeed: 0.7,
    maxSpeed: 1.3,
    speedStep: 0.1,

    /** Maximum characters allowed per generation request */
    maxChars: 5000,

    /** Prefix added to downloaded MP3 filenames (e.g. indiantts_20261017.mp3) */
    downloadPrefix: "indiantts",
  },

  // ── 6. BILLING & CURRENCY SETTINGS ──────────────────────────────────────────
  billing: {
    /** Default currency code */
    defaultCurrency: "INR" as "INR" | "USD",

    /** Currency symbol */
    currencySymbol: "₹",

    /** Free plan character allowance per week */
    freeAllowanceWeekly: "1,000",

    /** Standard pack starting characters */
    standardPackChars: "50,000",

    /** Support email for billing issues */
    billingEmail: "billing@indiantts.in",
  },

  // ── 7. NAVIGATION LINKS ─────────────────────────────────────────────────────
  navLinks: [
    { href: "/", label: "Home" },
    { href: "/text-to-speech", label: "Text to Speech" },
    { href: "/blog", label: "Blog" },
    { href: "/tools", label: "More Tools" },
    { href: "/pricing", label: "Pricing" },
    { href: "/faq", label: "FAQ" },
  ],

  // ── 8. FOOTER CUSTOMIZATION ─────────────────────────────────────────────────
  footer: {
    craftedBy: "Crafted with ❤️ for Indian Creators",
    copyrightNotice: `© ${new Date().getFullYear()} IndianTTS. All rights reserved.`,
  },

  /** Backwards compatibility field for legacy download prefix */
  downloadPrefix: "indiantts",
} as const;

export type SiteConfig = typeof siteConfig;
export default siteConfig;