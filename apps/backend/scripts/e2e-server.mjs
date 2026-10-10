import process from "node:process";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createTestDatabase } from "./test-database.mjs";
const root = fileURLToPath(new URL("../../../.local/e2e/", import.meta.url));
const webRoot = fileURLToPath(new URL("../../web/", import.meta.url));
await mkdir(root, { recursive: true });
const database = await createTestDatabase();
process.env.DATABASE_URL = database.url;
process.env.APP_URL = "http://localhost:3101";
process.env.LOCAL_DATA_DIR = root;
process.env.STORAGE_PROVIDER = "local";
process.env.MAIL_PROVIDER = "file";
process.env.REDIS_PREFIX = `reclaim-e2e:${randomUUID()}`;
const { disconnectOtp } = await import("../src/modules/auth/otp.ts");
const { disconnect } = await import("../src/db/client.ts");
const { processOutbox } = await import("../src/modules/mail/service.ts");
const { createApiServer } = await import("../src/http/server.ts");
const api = createApiServer();
await new Promise((resolve, reject) => {
  api.once("error", reject);
  api.listen(0, "127.0.0.1", resolve);
});
const next = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--port", "3101"],
  {
    stdio: "inherit",
    windowsHide: true,
    cwd: webRoot,
    env: {
      ...process.env,
      NEXT_DIST_DIR: ".next-e2e",
      BACKEND_URL: `http://127.0.0.1:${api.address().port}`,
    },
  },
);
let sending = false;
const timer = setInterval(async () => {
  if (sending) return;
  sending = true;
  try {
    await processOutbox();
  } catch (error) {
    console.error(error);
  } finally {
    sending = false;
  }
}, 250);
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  clearInterval(timer);
  next.kill();
  await new Promise((resolve) => api.close(resolve));
  while (sending) await new Promise((resolve) => setTimeout(resolve, 50));
  await disconnect();
  await disconnectOtp();
  await database.stop();
  process.exit(code);
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
next.on("exit", (code) => stop(code || 0));
next.on("error", (error) => {
  console.error(error);
  void stop(1);
});
