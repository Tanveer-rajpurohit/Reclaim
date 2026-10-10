import { readdir } from "node:fs/promises";
import { prisma, query } from "./client.ts";

export async function assertDatabaseReady() {
  const entries = await readdir(
    new URL("../../prisma/migrations/", import.meta.url),
    { withFileTypes: true },
  );
  const expected = entries
    .filter((entry) => entry.isDirectory() && /^\d{14}_/.test(entry.name))
    .map((entry) => entry.name);
  let applied: Set<string>;
  try {
    const result = await query<{ migration_name: string }>(
      prisma(),
      "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL",
    );
    applied = new Set(result.rows.map((row) => row.migration_name));
  } catch {
    throw new Error(
      "Database schema is unavailable. Start PostgreSQL and run pnpm --filter backend db:migrate before starting the backend.",
    );
  }
  const pending = expected.filter((name) => !applied.has(name));
  if (pending.length)
    throw new Error(
      `Database migrations are pending: ${pending.join(", ")}. Run pnpm --filter backend db:migrate before starting the backend.`,
    );
}
