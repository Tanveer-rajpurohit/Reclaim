import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { loadEnvFile } from "node:process";
import pg from "pg";
import { runPrisma } from "./prisma.mjs";

try {
  loadEnvFile(new URL("../.env", import.meta.url));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const exists = await client.query(
    "SELECT to_regclass('public.schema_migrations') AS legacy",
  );
  if (!exists.rows[0].legacy)
    throw new Error(
      "No legacy migration history found. Use db:migrate for a new database.",
    );
  const history = await client.query(
    "SELECT name,checksum FROM schema_migrations ORDER BY name",
  );
  const migrations = [
    ["001_initial.sql", "20261010000100_initial"],
    ["002_stock_integrity.sql", "20261010000200_stock_integrity"],
  ];
  if (history.rowCount !== migrations.length)
    throw new Error("Unexpected legacy migration history; baseline refused.");
  for (const [legacy, name] of migrations) {
    const sql = await readFile(
      new URL(`../prisma/migrations/${name}/migration.sql`, import.meta.url),
      "utf8",
    );
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (
      !history.rows.some(
        (row) => row.name === legacy && row.checksum === checksum,
      )
    )
      throw new Error(`Legacy migration checksum mismatch: ${legacy}.`);
  }
  for (const [, name] of migrations) {
    const table = await client.query(
      "SELECT to_regclass('public._prisma_migrations') AS current",
    );
    const applied = table.rows[0].current
      ? await client.query(
          "SELECT 1 FROM _prisma_migrations WHERE migration_name=$1 AND finished_at IS NOT NULL AND rolled_back_at IS NULL",
          [name],
        )
      : { rowCount: 0 };
    if (!applied.rowCount)
      await runPrisma(["migrate", "resolve", "--applied", name]);
  }
  await client.query("DROP TABLE schema_migrations");
  console.log(
    "Legacy migration history transferred to Prisma. Product data preserved.",
  );
} finally {
  await client.end();
}
