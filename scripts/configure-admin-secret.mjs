#!/usr/bin/env node
// Run only after verifying the selected Convex deployment. No password/hash is logged or saved.
import { randomBytes, scryptSync } from "node:crypto";
import { spawn } from "node:child_process";

const deployment = process.argv[2];
if (!deployment || !/^[a-z0-9][a-z0-9-]*$/.test(deployment) || !process.stdin.isTTY) {
  console.error("Usage from an interactive terminal: node scripts/configure-admin-secret.mjs VERIFIED_DEPLOYMENT_NAME");
  process.exit(1);
}
function readHidden(label) {
  return new Promise((resolve, reject) => {
    process.stdout.write(label);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    let value = "";
    function cleanup() { process.stdin.off("data", onData); process.stdin.setRawMode(false); process.stdin.pause(); process.stdout.write("\n"); }
    function onData(chunk) {
      for (const character of chunk.toString("utf8")) {
        if (character === "\u0003") { cleanup(); reject(new Error("Cancelled")); return; }
        if (character === "\r" || character === "\n") { cleanup(); resolve(value); return; }
        if (character === "\u007f" || character === "\b") value = value.slice(0, -1);
        else if (character >= " ") value += character;
      }
    }
    process.stdin.on("data", onData);
  });
}
try {
  console.log(`Selected deployment: ${deployment}. This command changes its server-only admin password.`);
  const password = await readHidden("New admin password (minimum 12 characters): ");
  const confirmation = await readHidden("Repeat password: ");
  if (password !== confirmation || password.length < 12 || password.length > 256) throw new Error("Passwords must match and contain 12–256 characters.");
  const salt = randomBytes(16).toString("hex");
  const hash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  const child = spawn("npx", ["convex", "env", "set", "ADMIN_PASSWORD_HASH", "--deployment", deployment], { stdio: ["pipe", "pipe", "pipe"] });
  // Drain output without logging it; credentials must not enter terminal/log artifacts.
  child.stdout.resume(); child.stderr.resume();
  child.stdin.end(hash + "\n");
  child.stdin.on("error", () => {});
  const code = await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", resolve); });
  if (code !== 0) throw new Error("Secret update failed. Check Convex authentication and the selected deployment.");
  console.log("ADMIN_PASSWORD_HASH updated. No password or hash was displayed or written to a file.");
} catch (error) {
  console.error(error instanceof Error ? error.message : "Secret configuration failed");
  process.exitCode = 1;
}
