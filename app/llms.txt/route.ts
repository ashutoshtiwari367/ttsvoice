import { seoConfig } from "@/seo.config";
import { buildLlmsTxt } from "@/lib/seo/llms";

export const revalidate = 3600;

export function GET(): Response {
  return new Response(buildLlmsTxt(seoConfig), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

