import { z } from "zod";
import { handler, parseJson, jsonOk } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { store } from "@/repositories";

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  photoUrl: z.string().trim().max(500).optional().nullable(),
});

export const PUT = handler(async (req: Request) => {
  const user = await requireUser();
  const patch = await parseJson(req, patchSchema);
  const updated = await store.update("users", user.id, patch);
  return jsonOk({ user: { id: user.id, name: patch.name ?? user.name, email: user.email } });
});

export const GET = handler(async () => {
  const user = await requireUser();
  const profile = await store.get("users", user.id);
  return jsonOk({ profile });
});
