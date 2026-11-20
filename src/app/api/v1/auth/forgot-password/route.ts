import { handler, parseJson, jsonOk, errors } from "@/lib/api";
import { forgotPasswordSchema } from "@/validators";
import { forgotPassword } from "@/services/auth/auth.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const POST = handler(async (req: Request) => {
  const limited = rateLimit(`forgot:${clientIp(req)}`, 4, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);
  const { email } = await parseJson(req, forgotPasswordSchema);
  await forgotPassword(email);
  return jsonOk({ message: "If an account exists for this email, a reset link has been sent." });
});
