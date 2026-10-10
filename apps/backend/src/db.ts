import { PrismaPg } from "@prisma/adapter-pg";
import type { QueryResultRow } from "pg";
import { PrismaClient, Prisma } from "./generated/prisma/client.ts";
import { config } from "./config.ts";

const holder = globalThis as typeof globalThis & {
  reclaimPrisma?: PrismaClient;
};
export function prisma() {
  if (!holder.reclaimPrisma) {
    const adapter = new PrismaPg(
      {
        connectionString: config().databaseUrl,
        max: 10,
        connectionTimeoutMillis: 5000,
        idleTimeoutMillis: 30000,
      },
      {
        onPoolError: () =>
          console.error(
            "An idle database connection failed; the pool will reconnect.",
          ),
      },
    );
    holder.reclaimPrisma = new PrismaClient({ adapter });
  }
  return holder.reclaimPrisma;
}
export type DB = Prisma.TransactionClient;

// Application-owned SQL for complex reads and locks; values are bound separately.
export async function query<T extends QueryResultRow = QueryResultRow>(
  db: DB,
  sql: string,
  values: unknown[] = [],
) {
  const rows = await db.$queryRawUnsafe<T[]>(sql, ...values);
  return { rows, rowCount: rows.length };
}
export async function transaction<T>(
  work: (db: DB) => Promise<T>,
  isolationLevel?: Prisma.TransactionIsolationLevel,
) {
  return prisma().$transaction(
    async (db) => {
      await db.$executeRaw`SET LOCAL statement_timeout = '15s'`;
      return work(db);
    },
    { maxWait: 5000, timeout: 20000, isolationLevel },
  );
}
export async function disconnect() {
  await holder.reclaimPrisma?.$disconnect();
  delete holder.reclaimPrisma;
}
