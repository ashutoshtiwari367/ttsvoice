import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ── GET /api/templates ───────────────────────────────────────────────────────
// Returns list of saved presets for the logged-in user
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ templates: [] });
    }

    const { data, error } = await admin
      .from("tt_user_template")
      .select("id, name, voice_code, language_code, speed, created_at")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("fetch_templates_error", error);
      return NextResponse.json({ templates: [] });
    }

    return NextResponse.json({ templates: data ?? [] });
  } catch (err) {
    console.error("templates_get_error", err);
    return NextResponse.json({ templates: [] }, { status: 500 });
  }
}

// ── POST /api/templates ──────────────────────────────────────────────────────
// Saves a new voice + language + speed preset
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required to save templates." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { name, voice_code, language_code, speed } = body;

    if (!name || !voice_code || !language_code) {
      return NextResponse.json(
        { error: "Name, voice, and language are required." },
        { status: 400 }
      );
    }

    const templateSpeed = Number(speed) || 1.0;

    const { data, error } = await admin
      .from("tt_user_template")
      .insert({
        customer_id: user.id,
        name: String(name).trim().slice(0, 100),
        voice_code: String(voice_code).trim(),
        language_code: String(language_code).trim(),
        speed: templateSpeed,
      })
      .select("id, name, voice_code, language_code, speed, created_at")
      .single();

    if (error) {
      console.error("save_template_error", error);
      return NextResponse.json(
        { error: "Failed to save template." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, template: data }, { status: 201 });
  } catch (err) {
    console.error("templates_post_error", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

// ── DELETE /api/templates ────────────────────────────────────────────────────
// Deletes a saved preset by ID
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required." },
        { status: 401 }
      );
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing template ID." }, { status: 400 });
    }

    const { error } = await admin
      .from("tt_user_template")
      .delete()
      .eq("id", id)
      .eq("customer_id", user.id);

    if (error) {
      console.error("delete_template_error", error);
      return NextResponse.json(
        { error: "Failed to delete template." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("templates_delete_error", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
