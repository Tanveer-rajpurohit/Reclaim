import test from "node:test";
import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import process from "node:process";
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { createTestDatabase } from "../scripts/test-database.mjs";
import { runPrisma } from "../scripts/prisma.mjs";

test(
  "Prisma adopts legacy data, rejects altered history and preserves stock constraints",
  { timeout: 120000 },
  async () => {
    const database = await createTestDatabase({ migrate: false });
    const client = new pg.Client({ connectionString: database.url });
    const prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: database.url }),
    });
    const env = { ...process.env, DATABASE_URL: database.url };
    try {
      await client.connect();
      await client.query(
        "CREATE TABLE schema_migrations(name text PRIMARY KEY,checksum text NOT NULL,applied_at timestamptz NOT NULL DEFAULT now())",
      );
      for (const [legacy, name] of [
        ["001_initial.sql", "20261010000100_initial"],
        ["002_stock_integrity.sql", "20261010000200_stock_integrity"],
      ]) {
        const sql = await readFile(
          new URL(
            `../prisma/migrations/${name}/migration.sql`,
            import.meta.url,
          ),
          "utf8",
        );
        await client.query(sql);
        await client.query(
          "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
          [legacy, createHash("sha256").update(sql).digest("hex")],
        );
      }
      const user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: "preserved@example.com",
          name: "Preserved user",
          password_hash: "test-only",
        },
      });
      const baseline = () =>
        new Promise((resolve, reject) => {
          const child = spawn(
            process.execPath,
            [
              fileURLToPath(
                new URL("../scripts/baseline.mjs", import.meta.url),
              ),
            ],
            { env, stdio: "pipe", windowsHide: true },
          );
          let output = "";
          child.stdout.on("data", (chunk) => {
            output += chunk;
          });
          child.stderr.on("data", (chunk) => {
            output += chunk;
          });
          child.once("error", reject);
          child.once("exit", (code) =>
            code === 0 ? resolve() : reject(new Error(output)),
          );
        });
      await client.query(
        "UPDATE schema_migrations SET checksum='altered' WHERE name='002_stock_integrity.sql'",
      );
      await assert.rejects(baseline, /checksum mismatch/);
      assert.equal(
        (
          await client.query(
            "SELECT to_regclass('public._prisma_migrations') AS history",
          )
        ).rows[0].history,
        null,
      );
      const sql = await readFile(
        new URL(
          "../prisma/migrations/20261010000200_stock_integrity/migration.sql",
          import.meta.url,
        ),
        "utf8",
      );
      await client.query(
        "UPDATE schema_migrations SET checksum=$1 WHERE name='002_stock_integrity.sql'",
        [createHash("sha256").update(sql).digest("hex")],
      );
      await baseline();
      await runPrisma(["migrate", "deploy"], env);
      await runPrisma(
        [
          "migrate",
          "diff",
          "--from-config-datasource",
          "--to-schema",
          "prisma/schema.prisma",
          "--exit-code",
        ],
        env,
      );
      assert.equal(
        (await prisma.user.findUnique({ where: { id: user.id } })).email,
        "preserved@example.com",
      );
      assert.equal(
        (
          await client.query(
            "SELECT count(*)::int AS total FROM _prisma_migrations WHERE finished_at IS NOT NULL",
          )
        ).rows[0].total,
        3,
      );
      const event = await prisma.event.create({
        data: {
          id: randomUUID(),
          owner_id: user.id,
          name: "Legacy event",
          area: "Delhi",
          event_date: new Date("2020-01-01T00:00:00Z"),
          pickup_note: "Gate",
        },
      });
      const item = await prisma.item.create({
        data: {
          id: randomUUID(),
          event_id: event.id,
          name: "Whole batch",
          category: "Wood",
          purpose: "Reuse",
          quantity: 2,
          unit: "pieces",
          condition: "Good",
          price: 0,
          art: "wood",
        },
      });
      const buyer = await prisma.user.create({
        data: {
          id: randomUUID(),
          email: "buyer@example.com",
          name: "Buyer",
          password_hash: "test-only",
        },
      });
      const deal = {
        item_id: item.id,
        buyer_id: buyer.id,
        pickup_at: new Date(),
        accepted_at: new Date(),
      };
      await prisma.deal.create({
        data: {
          ...deal,
          id: randomUUID(),
          status: "Done",
          seller_confirmed: true,
          completed_at: new Date(),
        },
      });
      await assert.rejects(
        prisma.deal.create({
          data: { ...deal, id: randomUUID(), status: "Accepted" },
        }),
        { code: "P2002" },
      );
      await assert.rejects(
        prisma.item.update({ where: { id: item.id }, data: { quantity: 1.5 } }),
      );
    } finally {
      await prisma.$disconnect();
      await client.end();
      await database.stop();
    }
  },
);
