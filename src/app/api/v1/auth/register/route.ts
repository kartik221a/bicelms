import { handler, parseJson, errors, jsonOk } from "@/lib/api";
import { registerSchema } from "@/validators";
import { registerUser } from "@/services/auth/auth.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const POST = handler(async (req: Request) => {
  const limited = rateLimit(`register:${clientIp(req)}`, 5, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);
  const input = await parseJson(req, registerSchema);
  const user = await registerUser(input);
  return jsonOk({ user }, { status: 201 });
});
