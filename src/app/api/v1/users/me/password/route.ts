import { z } from "zod";
import { handler, parseJson, jsonOk, errors } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { store } from "@/repositories";
import { hashPassword, verifyPassword } from "@/lib/crypto";
import { flags } from "@/config/env";
import { passwordSchema } from "@/validators";

const schema = z.object({ currentPassword: z.string().min(1), newPassword: passwordSchema });

export const POST = handler(async (req: Request) => {
  const session = await requireUser();
  if (flags.firebaseConfigured) {
    throw errors.badRequest("Password changes are managed by Firebase Authentication when Firebase is configured.");
  }
  const { currentPassword, newPassword } = await parseJson(req, schema);
  const user = await store.get<{ id: string; passwordHash?: string | null }>("users", session.id);
  if (!user) throw errors.notFound("Account not found");
  if (!verifyPassword(currentPassword, user.passwordHash)) {
    throw errors.badRequest("Current password is incorrect");
  }
  await store.update("users", user.id, { passwordHash: hashPassword(newPassword) });
  return jsonOk({ message: "Password updated successfully." });
});
