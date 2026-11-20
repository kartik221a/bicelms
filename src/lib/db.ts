import type { PrismaClient } from "@prisma/client"

/**
 * Lazy, crash-proof Prisma client accessor.
 *
 * `new PrismaClient()` is cheap (no connection until the first query) but
 * the import itself must not run on serverless platforms, where the SQLite
 * engine cannot work. getDb() is only ever called from the PrismaStore
 * provider, which the provider factory constructs exclusively on writable
 * filesystems.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export async function getDb(): Promise<PrismaClient> {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const { PrismaClient } = await import("@prisma/client");
  const client = new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query"],
  });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
  return client;
}
