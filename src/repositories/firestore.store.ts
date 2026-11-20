import { App, applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { env, flags } from "@/config/env";
import {
  DataStore,
  Collection,
  QueryOptions,
  WhereClause,
  normalizeDatesIn,
  denormalizeDatesIn,
} from "./types";

let _fs: Firestore | null = null;
let _app: App | null = null;

export function getFirebase(): { app: App; firestore: Firestore } {
  if (_app && _fs) return { app: _app, firestore: _fs };
  if (getApps().length) {
    _app = getApps()[0];
  } else if (flags.firebaseConfigured && env.FIREBASE_PRIVATE_KEY) {
    _app = initializeApp({
      credential: cert({
        projectId: env.FIREBASE_PROJECT_ID!,
        clientEmail: env.FIREBASE_CLIENT_EMAIL!,
        privateKey: env.FIREBASE_PRIVATE_KEY,
      }),
    });
  } else {
    _app = initializeApp({ credential: applicationDefault() });
  }
  _fs = getFirestore(_app);
  return { app: _app, firestore: _fs };
}

function buildQuery(fs: Firestore, collection: Collection, options?: QueryOptions) {
  let q: ReturnType<Firestore["collection"]> = fs.collection(collection);
  type Q = typeof q;
  let cur: Q = q;
  for (const w of options?.where ?? []) {
    if (w.op === "contains") {
      // Firestore has no native contains; range-prefix match fallback (documented limitation)
      cur = cur.where(w.field, ">=", w.value).where(w.field, "<=", String(w.value) + "\uf8ff") as Q;
    } else if (w.op === "!=") {
      cur = cur.where(w.field, "!=", w.value) as Q;
    } else {
      cur = cur.where(w.field, w.op as "<", w.value) as Q;
    }
  }
  const firstOrder = options?.orderBy?.[0];
  if (firstOrder) {
    cur = cur.orderBy(firstOrder.field, firstOrder.direction ?? "asc") as Q;
  }
  if (options?.limit) cur = cur.limit(options.limit) as Q;
  if (options?.offset) cur = cur.offset(options.offset) as Q;
  return cur;
}

export class FirestoreStore implements DataStore {
  readonly name = "firestore" as const;

  private fs(): Firestore {
    return getFirebase().firestore;
  }

  async get<T>(collection: Collection, id: string): Promise<T | null> {
    const snap = await this.fs().collection(collection).doc(id).get();
    if (!snap.exists) return null;
    return normalizeDatesIn({ id: snap.id, ...snap.data() }) as T;
  }

  async getByField<T>(collection: Collection, field: string, value: unknown): Promise<T | null> {
    const snap = await this.fs().collection(collection).where(field, "==", value).limit(1).get();
    if (snap.empty) return null;
    const d = snap.docs[0];
    return normalizeDatesIn({ id: d.id, ...d.data() }) as T;
  }

  async list<T>(collection: Collection, options?: QueryOptions): Promise<T[]> {
    const q = buildQuery(this.fs(), collection, options);
    const snap = await q.get();
    return snap.docs.map((d) => normalizeDatesIn({ id: d.id, ...d.data() }) as T);
  }

  async count(collection: Collection, where?: WhereClause[]): Promise<number> {
    const q = buildQuery(this.fs(), collection, { where });
    const snap = await q.count().get();
    return snap.data().count;
  }

  async create<T>(collection: Collection, data: Record<string, unknown>): Promise<T> {
    const fs = this.fs();
    const clean = denormalizeDatesIn(data);
    let doc: ReturnType<ReturnType<Firestore["collection"]>["doc"]>;
    if (clean.id) {
      doc = fs.collection(collection).doc(String(clean.id));
      const exists = await doc.get();
      if (exists.exists) throw new Error(`Document ${collection}/${clean.id} already exists`);
      delete clean.id;
    } else {
      doc = fs.collection(collection).doc();
    }
    const payload = {
      ...clean,
      createdAt: clean.createdAt ?? new Date(),
      updatedAt: clean.updatedAt ?? new Date(),
    };
    await doc.create(payload as never);
    const snap = await doc.get();
    return normalizeDatesIn({ id: snap.id, ...snap.data() }) as T;
  }

  async update<T>(collection: Collection, id: string, data: Record<string, unknown>): Promise<T | null> {
    const doc = this.fs().collection(collection).doc(id);
    const exists = await doc.get();
    if (!exists.exists) return null;
    const clean = denormalizeDatesIn(data);
    delete clean.id;
    await doc.update({ ...clean, updatedAt: new Date() } as never);
    const snap = await doc.get();
    return normalizeDatesIn({ id: snap.id, ...snap.data() }) as T;
  }

  async delete(collection: Collection, id: string): Promise<boolean> {
    await this.fs().collection(collection).doc(id).delete();
    return true;
  }

  async deleteWhere(collection: Collection, where: WhereClause[]): Promise<number> {
    const q = buildQuery(this.fs(), collection, { where });
    const snap = await q.get();
    const batch = this.fs().batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    return snap.size;
  }
}
