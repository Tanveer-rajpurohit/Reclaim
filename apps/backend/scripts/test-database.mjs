import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { runPrisma } from "./prisma.mjs";

export async function createTestDatabase({ migrate = true } = {}) {
  if (!process.env.TEST_DATABASE_URL) {
    const compose = fileURLToPath(
      new URL("../../../compose.yaml", import.meta.url),
    );
    await new Promise((resolve, reject) => {
      const child = spawn(
        "docker",
        ["compose", "-f", compose, "up", "-d", "--wait", "postgres"],
        { stdio: "inherit", windowsHide: true },
      );
      child.once("error", reject);
      child.once("exit", (code) =>
        code === 0
          ? resolve()
          : reject(
              new Error(
                "Start Docker Desktop before running integration tests.",
              ),
            ),
      );
    });
  }
  const baseUrl =
    process.env.TEST_DATABASE_URL ||
    "postgresql://reclaim:reclaim-local-only@127.0.0.1:54330/reclaim";
  const name = `reclaim_test_${randomUUID().replaceAll("-", "")}`;
  const admin = new pg.Client({
    connectionString: baseUrl,
    connectionTimeoutMillis: 5000,
  });
  await admin.connect();
  const url = new URL(baseUrl);
  url.pathname = `/${name}`;
  let created = false;
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
    created = true;
    if (migrate)
      await runPrisma(["migrate", "deploy"], {
        ...process.env,
        DATABASE_URL: url.href,
      });
  } catch (error) {
    if (created) await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
    await admin.end();
    throw error;
  }
  return {
    url: url.href,
    async stop() {
      // Only the random database created above is ever removed.
      try {
        await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`);
      } finally {
        await admin.end();
      }
    },
  };
}
