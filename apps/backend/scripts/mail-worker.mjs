import { processOutbox } from "../src/outbox.ts";
import process from "node:process";
import { disconnect } from "../src/db.ts";
let stopping = false;
process.on("SIGINT", () => {
  stopping = true;
});
process.on("SIGTERM", () => {
  stopping = true;
});
try {
  do {
    const count = await processOutbox();
    if (!process.argv.includes("--watch")) {
      console.log(`Processed ${count} email jobs.`);
      break;
    }
    if (!count) await new Promise((resolve) => setTimeout(resolve, 1000));
  } while (!stopping);
} finally {
  await disconnect();
}
