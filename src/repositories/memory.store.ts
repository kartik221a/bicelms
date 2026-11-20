import crypto from "node:crypto";
import {
  DataStore,
  Collection,
  QueryOptions,
  WhereClause,
  WhereInput,
  asWhereClause,
  normalizeDatesIn,
  denormalizeDatesIn,
} from "./types";
import { buildDemoSeed } from "./demo-seed";

/**
 * MemoryStore — zero-dependency in-memory DataStore used on serverless
 * platforms (Vercel etc.) while real credentials (Firebase / Razorpay /
 * Cloudinary) are not configured yet.
 *
 * Why: the SQLite fallback cannot run on serverless (read-only filesystem,
 * no bundled database file), which previously crashed every request with a
 * 500. MemoryStore keeps the SAME DataStore contract, is seeded with the
 * demo catalog so the public site renders fully in setup mode, and makes
 * no network or filesystem calls at all.
 *
 * Data is ephemeral per server instance — acceptable for setup/preview mode
 * and clearly labelled in the UI; production uses the Firestore provider.
 */

function deepClone<T>(v: T): T {
  return v === undefined ? v : (JSON.parse(JSON.stringify(v)) as T);
}

/** Field lookup supporting dotted paths; missing -> undefined. */
function pick(doc: Record<string, unknown>, field: string): unknown {
  if (Object.prototype.hasOwnProperty.call(doc, field)) return doc[field];
  let cur: unknown = doc;
  for (const part of field.split(".")) {
    if (cur === null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
    if (cur === undefined) return undefined;
  }
  return cur;
}

function toDateSafe(v: unknown): number | null {
  if (v instanceof Date) return v.getTime();
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
    const t = Date.parse(v);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

/** Compare two values; numeric/string/date aware, undefined sorts last. */
function compareValues(a: unknown, b: unknown): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  const da = toDateSafe(a);
  const db = toDateSafe(b);
  if (da !== null && db !== null) return da - db;
  if (typeof a === "number" && typeof b === "number") return a - b;
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function matches(doc: Record<string, unknown>, clause: WhereClause): boolean {
  const actual = pick(doc, clause.field);
  const expected = clause.value;
  switch (clause.op) {
    case "==":
      return actual === expected || String(actual) === String(expected);
    case "!=":
      return !(actual === expected || String(actual) === String(expected));
    case ">":
      return compareValues(actual, expected) > 0;
    case ">=":
      return compareValues(actual, expected) >= 0;
    case "<":
      return compareValues(actual, expected) < 0;
    case "<=":
      return compareValues(actual, expected) <= 0;
    case "in":
      return (
        Array.isArray(expected) &&
        expected.some((v) => actual === v || String(actual) === String(v))
      );
    case "contains": {
      if (actual === undefined || actual === null) return false;
      return String(actual).toLowerCase().includes(String(expected).toLowerCase());
    }
    default:
      return false;
  }
}

export class MemoryStore implements DataStore {
  readonly name = "memory" as const;
  private collections: Map<Collection, Map<string, Record<string, unknown>>>;

  constructor(seed = true) {
    this.collections = new Map();
    if (seed) this.collections = buildDemoSeed();
  }

  private table(collection: Collection) {
    let t = this.collections.get(collection);
    if (!t) {
      t = new Map();
      this.collections.set(collection, t);
    }
    return t;
  }

  private newId(): string {
    return crypto.randomBytes(12).toString("base64url").replace(/[-_]/g, "x");
  }

  async get<T>(collection: Collection, id: string): Promise<T | null> {
    const row = this.table(collection).get(id);
    return row ? (normalizeDatesIn(deepClone(row)) as T) : null;
  }

  async getByField<T>(collection: Collection, field: string, value: unknown): Promise<T | null> {
    for (const row of this.table(collection).values()) {
      if (matches(row, { field, op: "==", value })) {
        return normalizeDatesIn(deepClone(row)) as T;
      }
    }
    return null;
  }

  async list<T>(collection: Collection, options?: QueryOptions): Promise<T[]> {
    let rows = [...this.table(collection).values()];
    if (options?.where?.length) {
      rows = rows.filter((r) => options.where!.map(asWhereClause).every((c) => matches(r, c)));
    }
    if (options?.orderBy?.length) {
      const orders = options.orderBy;
      rows.sort((a, b) => {
        for (const o of orders) {
          const c = compareValues(pick(a, o.field), pick(b, o.field));
          if (c !== 0) return o.direction === "desc" ? -c : c;
        }
        return 0;
      });
    }
    if (options?.offset) rows = rows.slice(options.offset);
    if (options?.limit !== undefined) rows = rows.slice(0, options.limit);
    return rows.map((r) => normalizeDatesIn(deepClone(r)) as T);
  }

  async count(collection: Collection, where?: WhereInput[]): Promise<number> {
    if (!where?.length) return this.table(collection).size;
    const rows = [...this.table(collection).values()].filter((r) =>
      where.map(asWhereClause).every((c) => matches(r, c))
    );
    return rows.length;
  }

  async create<T>(collection: Collection, data: Record<string, unknown>): Promise<T> {
    const table = this.table(collection);
    const row = denormalizeDatesIn(deepClone(data));
    if (!row.id) row.id = this.newId();
    const now = new Date();
    if (!row.createdAt) row.createdAt = now;
    row.updatedAt = now;
    table.set(row.id as string, row);
    return normalizeDatesIn(deepClone(row)) as T;
  }

  async update<T>(collection: Collection, id: string, data: Record<string, unknown>): Promise<T | null> {
    const table = this.table(collection);
    const existing = table.get(id);
    if (!existing) return null;
    const patch = denormalizeDatesIn(deepClone(data));
    delete patch.id;
    delete patch.createdAt;
    const merged = { ...existing, ...patch, updatedAt: new Date() };
    table.set(id, merged);
    return normalizeDatesIn(deepClone(merged)) as T;
  }

  async delete(collection: Collection, id: string): Promise<boolean> {
    return this.table(collection).delete(id);
  }

  async deleteWhere(collection: Collection, where: WhereInput[]): Promise<number> {
    const table = this.table(collection);
    const ids = [...table.values()]
      .filter((r) => where.map(asWhereClause).every((c) => matches(r, c)))
      .map((r) => r.id as string);
    for (const id of ids) table.delete(id);
    return ids.length;
  }
}
