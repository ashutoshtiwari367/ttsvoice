import Razorpay from "razorpay";
import crypto from "crypto";

function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export interface CreateOrderParams {
  amountMinor: number; // in paise (e.g. 2900 for ₹29)
  currency: string;    // 'INR'
  receipt: string;
  notes?: Record<string, string>;
}

export async function createRazorpayOrder({
  amountMinor,
  currency = "INR",
  receipt,
  notes,
}: CreateOrderParams) {
  const razorpay = getRazorpayClient();
  if (!razorpay) {
    throw new Error(
      "Razorpay credentials missing. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env.local"
    );
  }

  const order = await razorpay.orders.create({
    amount: amountMinor,
    currency,
    receipt,
    notes,
  });

  return order;
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}
