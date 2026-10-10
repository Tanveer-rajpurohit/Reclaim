import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

export async function runPrisma(args, env = process.env) {
  const cli = fileURLToPath(import.meta.resolve("prisma/build/index.js"));
  const cwd = fileURLToPath(new URL("../", import.meta.url));
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Prisma exited with code ${code}.`)),
    );
  });
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await runPrisma(process.argv.slice(2));
}
