import { handler, parseJson, jsonOk } from "@/lib/api";
import { verifyEmailSchema } from "@/validators";
import { verifyEmail } from "@/services/auth/auth.service";

export const POST = handler(async (req: Request) => {
  const { token } = await parseJson(req, verifyEmailSchema);
  await verifyEmail(token);
  return jsonOk({ message: "Email verified. You now have full access to your account." });
});
