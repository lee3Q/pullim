import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const script = path.join(path.dirname(fileURLToPath(import.meta.url)), "verify-cookie-boundaries.mjs");
const child = spawn(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: "inherit", env: { ...process.env, PULLIM_RUN_POLICY_REGRESSIONS: "1" },
});
child.on("error", (error) => { console.error(error); process.exitCode = 1; });
child.on("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
