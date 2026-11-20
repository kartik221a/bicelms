import { store } from "@/repositories";
import { errors } from "@/lib/api";
import { CouponInput } from "@/validators";

export interface CouponDoc {
  id: string;
  code: string;
  type: string;
  value: number;
  startsAt?: string | null;
  expiresAt?: string | null;
  maxUses?: number | null;
  maxUsesPerUser?: number | null;
  minOrderValue: number;
  applicableCourseIds: string;
  active: boolean;
  usesCount: number;
}

function parseApplicable(c: CouponDoc): string[] {
  try {
    const arr = JSON.parse(c.applicableCourseIds ?? "[]");
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}

export const couponService = {
  async validate(code: string, courseId: string, coursePrice: number, userId: string) {
    const coupon = await store.getByField<CouponDoc>("coupons", "code", code.trim().toUpperCase());
    if (!coupon || !coupon.active) throw errors.badRequest("This coupon code is invalid.");
    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) throw errors.badRequest("This coupon is not active yet.");
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) throw errors.badRequest("This coupon has expired.");
    if (coupon.maxUses && coupon.usesCount >= coupon.maxUses) throw errors.badRequest("This coupon has reached its usage limit.");
    if (coursePrice < coupon.minOrderValue) throw errors.badRequest(`This coupon requires a minimum order of ₹${coupon.minOrderValue / 100}.`);

    const applicable = parseApplicable(coupon);
    if (applicable.length && !applicable.includes(courseId)) {
      throw errors.badRequest("This coupon does not apply to this course.");
    }
    if (coupon.maxUsesPerUser) {
      const redemptions = await store.count("couponRedemptions", [
        { field: "couponId", op: "==", value: coupon.id },
        { field: "userId", op: "==", value: userId },
      ]);
      if (redemptions >= coupon.maxUsesPerUser) {
        throw errors.badRequest("You have already used this coupon the maximum number of times.");
      }
    }
    const discount =
      coupon.type === "percent"
        ? Math.round((coursePrice * Math.min(coupon.value, 100)) / 100)
        : Math.min(coupon.value, coursePrice);
    return { code: coupon.code, discount, couponId: coupon.id };
  },

  async recordRedemption(code: string, userId: string, orderId: string) {
    const coupon = await store.getByField<CouponDoc>("coupons", "code", code);
    if (!coupon) return;
    await store.create("couponRedemptions", { couponId: coupon.id, userId, orderId });
    await store.update("coupons", coupon.id, { usesCount: (coupon.usesCount ?? 0) + 1 });
  },

  async create(input: CouponInput) {
    const existing = await store.getByField("coupons", "code", input.code);
    if (existing) throw errors.conflict("A coupon with this code already exists.");
    return store.create("coupons", {
      ...input,
      applicableCourseIds: JSON.stringify(input.applicableCourseIds ?? []),
    });
  },

  async update(id: string, input: Partial<CouponInput>) {
    const patch: Record<string, unknown> = { ...input };
    if (input.applicableCourseIds) patch.applicableCourseIds = JSON.stringify(input.applicableCourseIds);
    return store.update("coupons", id, patch);
  },

  async list() {
    return store.list<CouponDoc>("coupons", { orderBy: [{ field: "createdAt", direction: "desc" }], limit: 200 });
  },

  async delete(id: string) {
    return store.delete("coupons", id);
  },
};
