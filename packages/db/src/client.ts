import { PrismaClient } from "@prisma/client";

// ============================================================
// Prisma Client Singleton
// ============================================================
// Using a singleton pattern prevents the creation of too many
// database connections during development (hot-reloads create
// new module instances, each with its own pool).
// ============================================================

declare global {
  // Allow `prisma` on the NodeJS global type in development
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["warn", "error"],
    errorFormat: process.env.NODE_ENV === "production" ? "minimal" : "pretty",
  });
}

/**
 * Prisma client singleton.
 *
 * In production a new client is always created (the module is
 * loaded once per process).  In development the client is stored
 * on the Node.js global object so hot-reloads don't exhaust the
 * connection pool.
 */
export const prisma: PrismaClient =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient()));

// Graceful shutdown: close the pool when the process exits so
// PostgreSQL doesn't keep idle connections open.
if (process.env.NODE_ENV !== "test") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
