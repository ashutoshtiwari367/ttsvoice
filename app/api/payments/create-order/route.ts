import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { createRazorpayOrder } from "@/lib/razorpay";
import { getClientIp, getCountry } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in to purchase credits." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { packId } = body;

    if (!packId || typeof packId !== "string") {
      return NextResponse.json(
        { error: "Invalid pack selected." },
        { status: 400 }
      );
    }

    // Look up pack in pack_catalog
    const { data: pack, error: packError } = await admin
      .from("pack_catalog")
      .select("*")
      .eq("id", packId)
      .eq("is_active", true)
      .maybeSingle();

    if (packError || !pack) {
      return NextResponse.json(
        { error: "Pack not found or inactive." },
        { status: 404 }
      );
    }

    if (pack.price <= 0) {
      return NextResponse.json(
        { error: "This is a free tier pack. Free credits refresh automatically." },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const country = getCountry(req) || "IN";
    const userAgent = req.headers.get("user-agent") || "unknown";

    const receipt = `rcpt_${user.id.slice(0, 8)}_${Date.now()}`;

    // Create order with Razorpay
    let razorpayOrder;
    try {
      razorpayOrder = await createRazorpayOrder({
        amountMinor: pack.price_minor,
        currency: pack.currency || "INR",
        receipt,
        notes: {
          customerId: user.id,
          packId: pack.id,
          packName: pack.name,
          chars: String(pack.char_amount),
        },
      });
    } catch (err: any) {
      console.error("razorpay_order_create_failed", err);
      return NextResponse.json(
        {
          error:
            err.message ||
            "Unable to initialize payment gateway. Please ensure Razorpay keys are configured.",
        },
        { status: 500 }
      );
    }

    // Record order in Supabase payments table via create_payment_order RPC
    const { error: rpcError } = await admin.rpc("create_payment_order", {
      p_customer_id: user.id,
      p_pack_id: pack.id,
      p_razorpay_order_id: razorpayOrder.id,
      p_checkout_ip: ip,
      p_checkout_user_agent: userAgent,
      p_checkout_country: country,
      p_checkout_device_type: "browser",
    });

    if (rpcError) {
      console.error("create_payment_order_rpc_failed", rpcError);
    }

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      packName: pack.name,
      charAmount: pack.char_amount,
      userEmail: user.email ?? "",
      userPhone: user.phone ?? "",
    });
  } catch (err: any) {
    console.error("create_order_unexpected_error", err);
    return NextResponse.json(
      { error: "Failed to create payment order." },
      { status: 500 }
    );
  }
}
