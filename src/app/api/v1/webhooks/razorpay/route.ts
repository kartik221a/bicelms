import { handler, errors, jsonOk } from "@/lib/api";
import { handleRazorpayWebhook } from "@/services/payment.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

/**
 * Razorpay webhook. Signature verified against the RAW body with the webhook
 * secret; payment status is NEVER taken from frontend payloads (§9).
 */
export const POST = handler(async (req: Request) => {
  const limited = rateLimit(`webhook:${clientIp(req)}`, 120, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);

  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  const result = await handleRazorpayWebhook(raw, signature);
  return jsonOk({ received: true, ...result });
});
