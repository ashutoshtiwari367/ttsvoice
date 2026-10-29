import { headers } from "next/headers";
import { siteConfig } from "@/config/site";

/**
 * Resolves the canonical public origin URL for sitemaps, robots.txt, and canonical tags.
 * 1. Explicit env var (`NEXT_PUBLIC_SITE_URL` or `SITE_URL`)
 * 2. `siteConfig.url` if configured to a real production domain (not localhost)
 * 3. Live request `x-forwarded-host` / `host` header (automatically adapts on Vercel/Cloudflare/VPS)
 * 4. Fallback to `siteConfig.url` in local dev
 */
export async function resolveSiteBaseUrl(): Promise<string> {
  const envUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    ""
  )
    .trim()
    .replace(/\/+$/, "");

  if (envUrl && /^https?:\/\//i.test(envUrl) && !/localhost|127\.0\.0\.1/i.test(envUrl)) {
    return envUrl;
  }

  const configuredUrl = (siteConfig.url || "").trim().replace(/\/+$/, "");
  if (
    configuredUrl &&
    /^https?:\/\//i.test(configuredUrl) &&
    !/localhost|127\.0\.0\.1/i.test(configuredUrl)
  ) {
    return configuredUrl;
  }

  try {
    const hdrs = await headers();
    const host = (
      hdrs.get("x-forwarded-host") ||
      hdrs.get("host") ||
      ""
    )
      .split(",")[0]
      .trim();

    if (host) {
      const forwardedProto = (hdrs.get("x-forwarded-proto") || "")
        .split(",")[0]
        .trim();
      const isLocal = /localhost|127\.0\.0\.1/i.test(host);
      const proto = forwardedProto || (isLocal ? "http" : "https");
      return `${proto}://${host}`.replace(/\/+$/, "");
    }
  } catch {
    // headers() unavailable outside request context (e.g. static build step)
  }

  return envUrl || configuredUrl || "http://localhost:3000";
}

