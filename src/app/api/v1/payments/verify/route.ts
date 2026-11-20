import { handler, parseJson, jsonOk } from "@/lib/api";
import { verifyPaymentSchema } from "@/validators";
import { requireUser } from "@/services/auth/session";
import { verifyCheckoutPayment } from "@/services/payment.service";

export const POST = handler(async (req: Request) => {
  const user = await requireUser();
  const input = await parseJson(req, verifyPaymentSchema);
  const order = await verifyCheckoutPayment({ ...input, userId: user.id });
  return jsonOk({ order, enrolled: true });
});
