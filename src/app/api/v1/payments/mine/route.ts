import { handler, jsonOk } from "@/lib/api";
import { requireUser } from "@/services/auth/session";
import { listUserOrders } from "@/services/payment.service";

export const GET = handler(async () => {
  const user = await requireUser();
  const orders = await listUserOrders(user.id);
  return jsonOk({ orders });
});
