import { handler, parseJson, jsonOk } from "@/lib/api";
import { progressSchema } from "@/validators";
import { requireUser } from "@/services/auth/session";
import { upsertProgress } from "@/services/progress.service";

/** Upsert lesson progress: position, watch %, completion (auto/manual rules). */
export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = await parseJson(req, progressSchema);
  const progress = await upsertProgress({
    userId: user.id,
    lessonId: input.lessonId,
    positionSeconds: input.positionSeconds,
    watchPercent: input.watchPercent,
    completed: input.completed,
  });
  return jsonOk({ progress });
});
