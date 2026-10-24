import { NextResponse } from "next/server";
import { runHistoryCleanup } from "@/lib/history/cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const result = await runHistoryCleanup(true);
  return NextResponse.json({
    success: true,
    message: "History cleanup executed successfully.",
    ...result,
  });
}

export async function GET() {
  const result = await runHistoryCleanup(true);
  return NextResponse.json({
    success: true,
    message: "History cleanup executed successfully.",
    ...result,
  });
}
