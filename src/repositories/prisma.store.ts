import { db } from "@/lib/db";
import {
  DataStore,
  Collection,
  QueryOptions,
  WhereClause,
  normalizeDatesIn,
  denormalizeDatesIn,
} from "./types";

const DELEGATES: Record<Collection, keyof typeof db> = {
  users: "user",
  verificationTokens: "verificationToken",
  instructors: "instructor",
  categories: "category",
  courses: "course",
  sections: "section",
  lessons: "lesson",
  resources: "resource",
  enrollments: "enrollment",
  lessonProgress: "lessonProgress",
  orders: "order",
  payments: "payment",
  refunds: "refund",
  coupons: "coupon",
  couponRedemptions: "couponRedemption",
  reviews: "review",
  notes: "note",
  announcements: "announcement",
  notifications: "notification",
  certificates: "certificate",
  videoSessions: "videoSession",
  auditLogs: "auditLog",
  platformSettings: "platformSettings",
};

function buildWhere(where?: WhereClause[]): Record<string, unknown> {
  if (!where?.length) return {};
  const AND = where.map((w) => {
    switch (w.op) {
      case "==":
        return { [w.field]: w.value };
      case "!=":
        return { [w.field]: { not: w.value } };
      case ">":
        return { [w.field]: { gt: w.value } };
      case ">=":
        return { [w.field]: { gte: w.value } };
      case "<":
        return { [w.field]: { lt: w.value } };
      case "<=":
        return { [w.field]: { lte: w.value } };
      case "in":
        return { [w.field]: { in: w.value as unknown[] } };
      case "contains":
        return { [w.field]: { contains: String(w.value) } };
      default:
        return { [w.field]: w.value };
    }
  });
  return AND.length === 1 ? AND[0] : { AND };
}

function buildOrderBy(orderBy?: QueryOptions["orderBy"]): Record<string, string>[] | undefined {
  if (!orderBy?.length) return undefined;
  return orderBy.map((o) => ({ [o.field]: o.direction ?? "asc" }));
}

export class PrismaStore implements DataStore {
  readonly name = "local-sqlite" as const;

  private delegate(collection: Collection) {
    return db[DELEGATES[collection]] as unknown as {
      findUnique: (args: unknown) => Promise<Record<string, unknown> | null>;
      findFirst: (args: unknown) => Promise<Record<string, unknown> | null>;
      findMany: (args: unknown) => Promise<Record<string, unknown>[]>;
      count: (args: unknown) => Promise<number>;
      create: (args: unknown) => Promise<Record<string, unknown>>;
      update: (args: unknown) => Promise<Record<string, unknown>>;
      delete: (args: unknown) => Promise<unknown>;
      deleteMany: (args: unknown) => Promise<{ count: number }>;
    };
  }

  async get<T>(collection: Collection, id: string): Promise<T | null> {
    const row = await this.delegate(collection).findUnique({ where: { id } });
    return row ? (normalizeDatesIn(row) as T) : null;
  }

  async getByField<T>(collection: Collection, field: string, value: unknown): Promise<T | null> {
    const row = await this.delegate(collection).findFirst({ where: { [field]: value } });
    return row ? (normalizeDatesIn(row) as T) : null;
  }

  async list<T>(collection: Collection, options?: QueryOptions): Promise<T[]> {
    const rows = await this.delegate(collection).findMany({
      where: buildWhere(options?.where),
      orderBy: buildOrderBy(options?.orderBy),
      take: options?.limit,
      skip: options?.offset,
    });
    return rows.map((r) => normalizeDatesIn(r) as T);
  }

  async count(collection: Collection, where?: WhereClause[]): Promise<number> {
    return this.delegate(collection).count({ where: buildWhere(where) });
  }

  async create<T>(collection: Collection, data: Record<string, unknown>): Promise<T> {
    const row = await this.delegate(collection).create({ data: denormalizeDatesIn(data) as never });
    return normalizeDatesIn(row) as T;
  }

  async update<T>(collection: Collection, id: string, data: Record<string, unknown>): Promise<T | null> {
    try {
      const row = await this.delegate(collection).update({
        where: { id },
        data: denormalizeDatesIn(data) as never,
      });
      return normalizeDatesIn(row) as T;
    } catch {
      return null;
    }
  }

  async delete(collection: Collection, id: string): Promise<boolean> {
    try {
      await this.delegate(collection).delete({ where: { id } });
      return true;
    } catch {
      return false;
    }
  }

  async deleteWhere(collection: Collection, where: WhereClause[]): Promise<number> {
    const res = await this.delegate(collection).deleteMany({ where: buildWhere(where) });
    return res.count;
  }
}
