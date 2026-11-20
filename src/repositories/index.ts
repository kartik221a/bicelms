import { flags } from "@/config/env";
import { DataStore } from "./types";
import { PrismaStore } from "./prisma.store";
import { FirestoreStore } from "./firestore.store";

/**
 * Provider factory. Production (Firebase env vars present) uses Firestore;
 * local development / preview falls back to SQLite via Prisma. Business logic
 * depends only on the DataStore interface, so swapping providers requires no
 * changes to services or UI.
 */

let _store: DataStore | null = null;

export function getDataStore(): DataStore {
  if (_store) return _store;
  _store = flags.firebaseConfigured ? new FirestoreStore() : new PrismaStore();
  return _store;
}

export const store = new Proxy({} as DataStore, {
  get(_t, prop: string) {
    const s = getDataStore();
    const v = (s as unknown as Record<string, unknown>)[prop];
    return typeof v === "function" ? v.bind(s) : v;
  },
});
