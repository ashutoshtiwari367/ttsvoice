import { NextRequest, NextResponse } from "next/server";
//import { SITE } from "../../../config/site";
import { siteConfig as SITE } from "@/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Same-origin download proxy: fetches the audio and returns it with a branded
// filename + attachment header, so the browser downloads directly (no redirect
// to the storage host) and every file carries the brand.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  // only allow fetching from our own storage host (prevents open-proxy abuse)
  if (!url || !/^https:\/\/[a-z0-9.-]+\.supabase\.co\//i.test(url)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(url);
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }
  if (!upstream.ok) {
    return NextResponse.json({ error: "fetch_failed" }, { status: 502 });
  }

  const buf = await upstream.arrayBuffer();

  // branded filename: freetts-in_2026-10-02_a1b2c3.mp3
  const date = new Date().toISOString().slice(0, 10);
  const short = (url.match(/([a-f0-9]{8})[a-f0-9]*\.mp3/i)?.[1] ?? "audio").slice(0, 6);
  const filename = `${SITE.downloadPrefix}_${date}_${short}.mp3`;

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}