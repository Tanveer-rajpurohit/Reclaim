import test from "node:test";
import assert from "node:assert/strict";
import process from "node:process";
import { createTestDatabase } from "../scripts/test-database.mjs";
import { runPrisma } from "../scripts/prisma.mjs";
import { assertDatabaseReady } from "../src/db/readiness.ts";
import { disconnect, prisma } from "../src/db/client.ts";

test("startup requires the schema and all applied migrations", async () => {
  const previous = { ...process.env };
  const database = await createTestDatabase({ migrate: false });
  try {
    Object.assign(process.env, {
      NODE_ENV: "test",
      DATABASE_URL: database.url,
      STORAGE_PROVIDER: "local",
      MAIL_PROVIDER: "file",
    });
    await assert.rejects(assertDatabaseReady, /db:migrate/);
    await runPrisma(["migrate", "deploy"], process.env);
    await assertDatabaseReady();
    await prisma()
      .$executeRaw`UPDATE _prisma_migrations SET finished_at=NULL WHERE migration_name='20261010000200_stock_integrity'`;
    await assert.rejects(assertDatabaseReady, /migrations are pending/);
  } finally {
    await disconnect();
    await database.stop();
    for (const key of Object.keys(process.env))
      if (!(key in previous)) delete process.env[key];
    Object.assign(process.env, previous);
  }
});
