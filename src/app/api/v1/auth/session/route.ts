import { handler, jsonOk, parseJson } from "@/lib/api";
import { z } from "zod";
import { getSession } from "@/services/auth/session";
import { createFirebaseSession } from "@/services/auth/auth.service";
import { flags, dataProviderName } from "@/config/env";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { errors } from "@/lib/api";

export const GET = handler(async () => {
  const session = await getSession();
  return jsonOk({
    user: session,
    setupMode: flags.setupMode,
    dataProvider: dataProviderName,
    integrations: {
      firebase: flags.firebaseConfigured,
      razorpay: flags.razorpayConfigured,
      cloudinary: flags.cloudinaryConfigured,
      email: flags.emailConfigured,
    },
  });
});

const bodySchema = z.object({ idToken: z.string().min(20) });

/** Firebase flow: exchange a Firebase ID token for an HTTP-only session cookie. */
export const POST = handler(async (req: Request) => {
  const limited = rateLimit(`session-exchange:${clientIp(req)}`, 10, 60_000);
  if (!limited.ok) throw errors.rateLimited(limited.retryAfter);
  if (!flags.firebaseConfigured) {
    throw errors.badRequest("Firebase is not configured on the server. Use the local login flow in setup mode.");
  }
  const { idToken } = await parseJson(req, bodySchema);
  const user = await createFirebaseSession(idToken);
  return jsonOk({ user });
});
