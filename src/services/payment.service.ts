import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { randomId } from "@/lib/crypto";
import { flags, env } from "@/config/env";
import { CourseDoc } from "./course.service";
import { EnrollmentDoc } from "./enrollment.types";
import { couponService } from "./coupon.service";
import { sendTemplatedEmail, emailTemplates } from "./email";
import { formatINR } from "@/lib/money";
import { audit } from "./audit.service";

/**
 * Razorpay payment service (master prompt §9).
 * - Server-side order creation only (price recomputed server-side)
 * - Signature verification for checkout callbacks
 * - Webhook signature verification with idempotency
 * - Enrollment created ONLY after verified payment / trusted webhook
 * - Keys never exposed to the client (only the public key id)
 */

export interface OrderDoc {
  id: string;
  orderNumber: string;
  userId: string;
  courseId?: string | null;
  status: string;
  amount: number;
  discount: number;
  finalAmount: number;
  currency: string;
  couponCode?: string | null;
  razorpayOrderId?: string | null;
  razorpayPaymentId?: string | null;
  createdAt: string;
}

export interface PaymentResult {
  order: OrderDoc;
  razorpay: { keyId: string; orderId: string; amount: number; currency: string } | null;
  setupRequired?: { integration: string; envVars: string[] };
}

export async function createCourseOrder(input: {
  userId: string;
  courseId: string;
  couponCode?: string;
}): Promise<PaymentResult> {
  const course = await store.get<CourseDoc>("courses", input.courseId);
  if (!course || course.status !== "published") throw errors.notFound("Course is not available");

  const already = await store.list<EnrollmentDoc>("enrollments", {
    where: [
      ["userId", "==", input.userId],
      ["courseId", "==", input.courseId],
    ],
    limit: 1,
  });
  if (already.length && already[0].status === "active") {
    throw errors.conflict("You are already enrolled in this course.");
  }

  let discount = 0;
  let couponCode: string | null = null;
  if (input.couponCode) {
    const applied = await couponService.validate(input.couponCode, input.courseId, course.price, input.userId);
    discount = applied.discount;
    couponCode = applied.code;
  }

  const finalAmount = Math.max(0, course.price - discount);
  if (finalAmount === 0) {
    // Free (100% coupon): enroll directly — no payment provider involved.
    const order = await store.create<OrderDoc>("orders", {
      orderNumber: nextOrderNumber(),
      userId: input.userId,
      courseId: course.id,
      status: "paid",
      amount: course.price,
      discount,
      finalAmount: 0,
      currency: "INR",
      couponCode,
    });
    await enrollAfterVerifiedPayment(input.userId, course.id, order.id);
    return { order };
  }

  const order = await store.create<OrderDoc>("orders", {
    orderNumber: nextOrderNumber(),
    userId: input.userId,
    courseId: course.id,
    status: "created",
    amount: course.price,
    discount,
    finalAmount,
    currency: "INR",
    couponCode,
  });

  if (!flags.razorpayConfigured) {
    return {
      order,
      razorpay: null,
      setupRequired: { integration: "Razorpay", envVars: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] },
    };
  }

  const { createRazorpayOrder } = await import("@/providers/payments/razorpay");
  const rzp = await createRazorpayOrder({
    amount: finalAmount,
    receipt: order.orderNumber,
    notes: { courseId: course.id, orderNumber: order.orderNumber },
  });
  await store.update("orders", order.id, { razorpayOrderId: rzp.id });
  return {
    order: { ...order, razorpayOrderId: rzp.id },
    razorpay: { keyId: env.RAZORPAY_KEY_ID!, orderId: rzp.id, amount: finalAmount, currency: "INR" },
  };
}

/** Verify checkout callback signature (HMAC SHA256 of order_id|payment_id). */
export async function verifyCheckoutPayment(input: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  userId: string;
}) {
  const order = await store.getByField<OrderDoc>("orders", "razorpayOrderId", input.razorpay_order_id);
  if (!order) throw errors.notFound("Order not found");
  if (order.userId !== input.userId) throw errors.forbidden("This order belongs to another account.");
  if (order.status === "paid") return order; // idempotent

  const { verifyRazorpaySignature } = await import("@/providers/payments/razorpay");
  const valid = verifyRazorpaySignature(
    input.razorpay_order_id,
    input.razorpay_payment_id,
    input.razorpay_signature
  );
  if (!valid) {
    await store.update("orders", order.id, { status: "failed" });
    await store.create("payments", {
      orderId: order.id,
      provider: "razorpay",
      providerPaymentId: input.razorpay_payment_id,
      status: "failed",
      amount: order.finalAmount,
      rawPayload: JSON.stringify({ reason: "signature_mismatch" }),
    });
    throw errors.badRequest("Payment signature verification failed.");
  }

  return finalizePaidOrder(order.id, input.razorpay_payment_id, null, {
    provider: "razorpay",
    method: "checkout",
  });
}

/** Razorpay webhook handler — independently confirms payment status. */
export async function handleRazorpayWebhook(rawBody: string, signature: string) {
  const { verifyWebhookSignature } = await import("@/providers/payments/razorpay");
  if (!verifyWebhookSignature(rawBody, signature)) {
    throw errors.badRequest("Invalid webhook signature");
  }
  const event = JSON.parse(rawBody) as { event: string; payload?: Record<string, unknown> };
  const payment =
    ((event.payload?.payment as Record<string, unknown> | undefined)?.entity as Record<string, unknown>) ?? {};
  const razorpayOrderId = String(payment.order_id ?? "");
  const razorpayPaymentId = String(payment.id ?? "");

  if (!razorpayOrderId || !razorpayPaymentId) return { handled: false, reason: "missing ids" };
  const order = await store.getByField<OrderDoc>("orders", "razorpayOrderId", razorpayOrderId);
  if (!order) return { handled: false, reason: "unknown order" };

  switch (event.event) {
    case "payment.captured":
    case "order.paid": {
      if (order.status === "paid") return { handled: true, idempotent: true };
      await finalizePaidOrder(order.id, razorpayPaymentId, JSON.stringify(event), { provider: "razorpay", method: "webhook" });
      return { handled: true };
    }
    case "payment.failed": {
      if (order.status === "created") {
        await store.update("orders", order.id, { status: "failed" });
        await store.create("payments", {
          orderId: order.id,
          provider: "razorpay",
          providerPaymentId: razorpayPaymentId,
          status: "failed",
          amount: order.finalAmount,
          rawPayload: JSON.stringify(event),
        });
      }
      return { handled: true };
    }
    case "refund.processed": {
      await store.update("orders", order.id, { status: "refunded" });
      await store.create("refunds", {
        orderId: order.id,
        providerRefundId: String((event.payload?.refund as Record<string, unknown>)?.id ?? ""),
        amount: Number(payment.amount ?? order.finalAmount),
        status: "processed",
      });
      await revokeEnrollmentForOrder(order);
      return { handled: true };
    }
    default:
      return { handled: false, reason: `unhandled event ${event.event}` };
  }
}

/** Single funnel for creating enrollments after money is confirmed. */
export async function finalizePaidOrder(
  orderId: string,
  razorpayPaymentId: string,
  rawPayload: string | null,
  paymentMeta: { provider: string; method: string }
) {
  const order = await store.get<OrderDoc>("orders", orderId);
  if (!order) throw errors.notFound("Order not found");
  if (order.status === "paid") return order;

  await store.update("orders", orderId, {
    status: "paid",
    razorpayPaymentId,
    razorpaySignature: null,
  });
  await store.create("payments", {
    orderId: order.id,
    provider: paymentMeta.provider,
    providerPaymentId: razorpayPaymentId,
    method: paymentMeta.method,
    status: "captured",
    amount: order.finalAmount,
    rawPayload: rawPayload ?? JSON.stringify({ source: paymentMeta.method }),
  });

  if (order.couponCode) {
    await couponService.recordRedemption(order.couponCode, order.userId, order.id);
  }
  if (order.courseId) {
    await enrollAfterVerifiedPayment(order.userId, order.courseId, order.id);
    const course = await store.get<CourseDoc>("courses", order.courseId);
    const user = await store.get<{ id: string; email: string; name: string }>("users", order.userId);
    if (course && user) {
      await sendTemplatedEmail(
        user.email,
        emailTemplates.paymentConfirmation(user.name, course.title, formatINR(order.finalAmount), order.orderNumber)
      );
    }
  }
  await audit({ action: "payment.captured", entity: "order", entityId: order.id, meta: { razorpayPaymentId } });
  return store.get<OrderDoc>("orders", orderId) as Promise<OrderDoc>;
}

export async function enrollAfterVerifiedPayment(userId: string, courseId: string, orderId: string) {
  const existing = await store.list<EnrollmentDoc>("enrollments", {
    where: [
      ["userId", "==", userId],
      ["courseId", "==", courseId],
    ],
    limit: 1,
  });
  if (existing.length) {
    if (existing[0].status === "active") return existing[0];
    return store.update<EnrollmentDoc>("enrollments", existing[0].id, {
      status: "active",
      source: "purchase",
      orderId,
    });
  }
  const enrollment = await store.create<EnrollmentDoc>("enrollments", {
    userId,
    courseId,
    status: "active",
    source: "purchase",
    orderId,
    progressPercent: 0,
  });
  await incrementStudentsCount(courseId);
  return enrollment;
}

async function incrementStudentsCount(courseId: string) {
  const course = await store.get<CourseDoc>("courses", courseId);
  if (!course) return;
  await store.update("courses", courseId, { studentsCount: (course.studentsCount ?? 0) + 1 });
}

async function revokeEnrollmentForOrder(order: OrderDoc) {
  if (!order.courseId) return;
  const list = await store.list<EnrollmentDoc>("enrollments", {
    where: [
      ["userId", "==", order.userId],
      ["courseId", "==", order.courseId],
    ],
    limit: 1,
  });
  if (list.length) await store.update("enrollments", list[0].id, { status: "revoked" });
}

function nextOrderNumber(): string {
  return `ORD-${new Date().getFullYear()}-${randomId(6).toUpperCase()}`;
}

export async function listUserOrders(userId: string) {
  return store.list<OrderDoc>("orders", {
    where: [["userId", "==", userId]],
    orderBy: [{ field: "createdAt", direction: "desc" }],
    limit: 100,
  });
}
