import { flags } from "@/config/env";
import { DataStore } from "./types";
import { FirestoreStore } from "./firestore.store";

// Re-export the DataStore types so services can import WhereClause/QueryOptions
// from "@/repositories" (services rely on this path).
export * from "./types";

/**
 * Provider factory. Production (Firebase env vars present) uses Firestore;
 * local development with a writable filesystem falls back to SQLite via
 * Prisma; serverless previews without credentials use the seeded in-memory
 * provider so the app always boots (never a 500). Business logic depends
 * only on the DataStore interface, so swapping providers requires no changes
 * to services or UI.
 *
 * Note: PrismaStore is loaded lazily (dynamic import) so the Prisma engine
 * is never even initialized on serverless — no cold-start penalty and no
 * crash if the generated client is missing.
 */

let _store: DataStore | null = null;

async function loadPrismaStore(): Promise<DataStore> {
  const { PrismaStore } = await import("./prisma.store");
  return new PrismaStore();
}

export async function getDataStore(): Promise<DataStore> {
  if (_store) return _store;
  if (flags.firebaseConfigured) {
    _store = new FirestoreStore();
  } else if (flags.sqliteViable) {
    try {
      _store = await loadPrismaStore();
    } catch (err) {
      console.error("[store] SQLite provider unavailable, falling back to memory:", err);
      const { MemoryStore } = await import("./memory.store");
      _store = new MemoryStore();
    }
  } else {
    const { MemoryStore } = await import("./memory.store");
    _store = new MemoryStore();
  }
  return _store;
}

export const store = new Proxy({} as DataStore, {
  get(_t, prop: string) {
    // getDataStore is async on first call; every DataStore method is async so
    // we forward the call onto the resolved provider lazily per access.
    return (...args: unknown[]) =>
      getDataStore().then((s) => {
        const v = (s as unknown as Record<string, unknown>)[prop];
        return typeof v === "function" ? (v as (...a: unknown[]) => unknown).apply(s, args) : v;
      });
  },
}) as DataStore;
