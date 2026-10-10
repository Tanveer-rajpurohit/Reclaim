import { config } from "./config/env.ts";
import { disconnect } from "./db/client.ts";
import { createApiServer } from "./http/server.ts";

config();
const port = Number(process.env.BACKEND_PORT || 3002);
const host = process.env.BACKEND_HOST || "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("BACKEND_PORT must be an integer between 1 and 65535.");
const server = createApiServer();
server.listen(port, host, () =>
  console.log(`Reclaim backend listening on http://${host}:${port}`),
);

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  server.close(async () => {
    try {
      await disconnect();
    } finally {
      clearTimeout(deadline);
    }
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
