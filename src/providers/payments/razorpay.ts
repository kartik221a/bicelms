import crypto from "node:crypto";
import { env, flags } from "@/config/env";

/**
 * Razorpay server SDK wrapper. Secret keys never leave the server; the client
 * only ever receives the public key id + order id.
 */

export interface RazorpayOrder {
  id: string;
  amount: number;
  currency: string;
  receipt?: string;
  status: string;
}

export async function getRazorpayClient() {
  if (!flags.razorpayConfigured) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing)");
  }
  const Razorpay = (await import("razorpay")).default;
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export async function createRazorpayOrder(input: {
  amount: number; // paise
  receipt: string;
  notes?: Record<string, string>;
}): Promise<RazorpayOrder> {
  const client = getRazorpayClient();
  return client.orders.create({
    amount: input.amount,
    currency: "INR",
    receipt: input.receipt,
    notes: input.notes ?? {},
  });
}

/** Checkout callback verification: HMAC-SHA256(order_id + "|" + payment_id). */
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!flags.razorpayConfigured) return false;
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET!)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Webhook verification: HMAC-SHA256 of the RAW request body. */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
