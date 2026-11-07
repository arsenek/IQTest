import { PrismaClient, Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export let prisma =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

function isTransientConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // P1017: Server has closed the connection (e.g. DB restarted).
    return err.code === "P1017";
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  const message = err instanceof Error ? err.message : String(err);
  return /closed the connection|Can't reach database|ECONNREFUSED|57P01/i.test(
    message,
  );
}

async function recreatePrismaClient() {
  try {
    await prisma.$disconnect();
  } catch {
    // ignore disconnect errors from a dead engine
  }
  prisma = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
  }
  await prisma.$connect();
}

/** Run a DB op; on transient disconnect after DB restart, recreate client once and retry. */
export async function withPrismaRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (!isTransientConnectionError(err)) throw err;
    await recreatePrismaClient();
    return await fn();
  }
}
