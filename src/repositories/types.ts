/**
 * DataStore — the database abstraction layer (master prompt §2/§13).
 * Business logic only ever talks to this interface; the concrete provider
 * (SQLite via Prisma for local dev, Firestore in production) is chosen at
 * runtime from the environment. All dates are normalized to ISO strings on
 * read; "At"-suffixed ISO strings are converted back to Dates on write.
 */

export type WhereOp = "==" | "!=" | ">" | ">=" | "<" | "<=" | "in" | "contains";

export interface WhereClause {
  field: string;
  op: WhereOp;
  value: unknown;
}

export interface OrderBy {
  field: string;
  direction?: "asc" | "desc";
}

export interface QueryOptions {
  where?: WhereClause[];
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
}

export type StoreName = "local-sqlite" | "firestore";

export const COLLECTIONS = [
  "users",
  "verificationTokens",
  "instructors",
  "categories",
  "courses",
  "sections",
  "lessons",
  "resources",
  "enrollments",
  "lessonProgress",
  "orders",
  "payments",
  "refunds",
  "coupons",
  "couponRedemptions",
  "reviews",
  "notes",
  "announcements",
  "notifications",
  "certificates",
  "videoSessions",
  "auditLogs",
  "platformSettings",
] as const;

export type Collection = (typeof COLLECTIONS)[number];

export interface DataStore {
  readonly name: StoreName;
  get<T>(collection: Collection, id: string): Promise<T | null>;
  /** First document where `field` equals `value` (intended for unique keys). */
  getByField<T>(collection: Collection, field: string, value: unknown): Promise<T | null>;
  list<T>(collection: Collection, options?: QueryOptions): Promise<T[]>;
  count(collection: Collection, where?: WhereClause[]): Promise<number>;
  create<T>(collection: Collection, data: Record<string, unknown>): Promise<T>;
  update<T>(collection: Collection, id: string, data: Record<string, unknown>): Promise<T | null>;
  delete(collection: Collection, id: string): Promise<boolean>;
  deleteWhere(collection: Collection, where: WhereClause[]): Promise<number>;
}

const DATE_FIELD = /At$|^expires$|^startsAt$|^issuedAt$|^publishedAt$|^lastSeenAt$|^readAt$/;

export function normalizeDatesIn(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (v instanceof Date) out[k] = v.toISOString();
    else out[k] = v;
  }
  return out;
}

export function denormalizeDatesIn(data: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (DATE_FIELD.test(k) && typeof v === "string") out[k] = new Date(v);
    else out[k] = v;
  }
  return out;
}
