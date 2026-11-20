import { z } from "zod";
import { handler, parseJson, jsonOk } from "@/lib/api";
import { createOrderSchema } from "@/validators";
import { requireUser } from "@/services/auth/session";
import { createCourseOrder } from "@/services/payment.service";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const { courseId, couponCode } = await parseJson(
    req,
    createOrderSchema.extend({ couponCode: z.string().trim().max(24).optional() })
  );
  const result = await createCourseOrder({ userId: user.id, courseId, couponCode });
  return jsonOk(result);
});
