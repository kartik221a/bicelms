import { handler, parseJson, errors, jsonOk } from "@/lib/api";
import { loginSchema } from "@/validators";
import { loginUser } from "@/services/auth/auth.service";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export const POST = handler(async (req: Request) => {
  const limited = rateLimit(`login:${clientIp(req)}`, 8, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);
  const input = await parseJson(req, loginSchema);
  const user = await loginUser(input);
  return jsonOk({ user });
});
