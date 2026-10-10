import { config } from "./config/env.ts";
import { disconnect } from "./db/client.ts";
import { createApiServer } from "./http/server.ts";
import { assertDatabaseReady } from "./db/readiness.ts";
import { disconnectOtp } from "./modules/auth/otp.ts";
import { processOutbox } from "./modules/mail/service.ts";
import { smtpConfig } from "./modules/mail/smtp.ts";

const cfg = config();
if (cfg.mail === "smtp") smtpConfig();
try {
  await assertDatabaseReady();
} catch (error) {
  await disconnect();
  throw error;
}
const port = Number(process.env.BACKEND_PORT || 3002);
const host = process.env.BACKEND_HOST || "127.0.0.1";
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("BACKEND_PORT must be an integer between 1 and 65535.");
const server = createApiServer();
let mailWork: Promise<void> | undefined;
const mailTimer =
  process.env.MAIL_WORKER_ENABLED === "false"
    ? undefined
    : setInterval(() => {
        if (mailWork) return;
        mailWork = processOutbox()
          .then(() => undefined)
          .catch(() =>
            console.error(
              "The mail worker failed. Pending messages will be retried.",
            ),
          )
          .finally(() => {
            mailWork = undefined;
          });
      }, 1000);
server.listen(port, host, () =>
  console.log(`Reclaim backend listening on http://${host}:${port}`),
);

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  clearInterval(mailTimer);
  const deadline = setTimeout(() => process.exit(1), 10000);
  deadline.unref();
  server.close(async () => {
    try {
      await mailWork;
      await disconnectOtp();
      await disconnect();
    } finally {
      clearTimeout(deadline);
    }
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
