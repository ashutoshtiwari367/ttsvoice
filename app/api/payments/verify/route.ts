import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { admin } from "@/lib/supabase/admin";
import { verifyRazorpaySignature } from "@/lib/razorpay";

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
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { orderId, paymentId, signature, packId } = body;

    if (!orderId || !paymentId || !signature || !packId) {
      return NextResponse.json(
        { error: "Missing required payment verification details." },
        { status: 400 }
      );
    }

    // 1. Verify Razorpay HMAC signature
    const isValid = verifyRazorpaySignature(orderId, paymentId, signature);
    if (!isValid) {
      console.error("razorpay_signature_mismatch", { orderId, paymentId });
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 }
      );
    }

    // 2. Fetch pack details from pack_catalog
    const { data: pack, error: packError } = await admin
      .from("pack_catalog")
      .select("*")
      .eq("id", packId)
      .maybeSingle();

    if (packError || !pack) {
      return NextResponse.json(
        { error: "Pack not found in catalog." },
        { status: 404 }
      );
    }

    // 3. Confirm payment in Supabase (atomically updates payments, credit_balances, and credit_ledger)
    const { data: confirmResult, error: confirmError } = await admin.rpc(
      "confirm_payment",
      {
        p_razorpay_order_id: orderId,
        p_razorpay_payment_id: paymentId,
        p_amount_minor: pack.price_minor,
        p_currency: pack.currency || "INR",
      }
    );

    if (confirmError) {
      console.error("confirm_payment_rpc_failed", confirmError);
      return NextResponse.json(
        { error: "Database confirmation failed: " + confirmError.message },
        { status: 500 }
      );
    }

    // 4. Fetch updated credit balance
    const { data: balanceRow } = await admin
      .from("credit_balances")
      .select("balance")
      .eq("customer_id", user.id)
      .maybeSingle();

    const newBalance = Number(balanceRow?.balance ?? 0);

    return NextResponse.json({
      success: true,
      packName: pack.name,
      creditsAdded: pack.char_amount + (pack.bonus_chars || 0),
      newBalance,
    });
  } catch (err: any) {
    console.error("verify_payment_unexpected_error", err);
    return NextResponse.json(
      { error: "Internal payment processing error." },
      { status: 500 }
    );
  }
}
