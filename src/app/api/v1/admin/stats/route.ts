import { handler, jsonOk } from "@/lib/api";
import { requireAdmin } from "@/services/auth/session";
import { getAdminStats } from "@/services/analytics.service";

export const GET = handler(async () => {
  await requireAdmin();
  const stats = await getAdminStats();
  return jsonOk(stats);
});
