import { handler, parseJson, jsonOk } from "@/lib/api";
import { resetPasswordSchema } from "@/validators";
import { resetPassword } from "@/services/auth/auth.service";

export const POST = handler(async (req: Request) => {
  const input = await parseJson(req, resetPasswordSchema);
  await resetPassword(input.token, input.password);
  return jsonOk({ message: "Password updated. You can now log in with your new password." });
});
