#!/usr/bin/env node
// The live website uses a Convex dev deployment; do not select the project's default prod.
import { spawnSync } from 'node:child_process';
const deployment = 'wandering-bobcat-37';
const cli = './node_modules/.bin/convex';
const dryRun = process.argv.includes('--dry-run');
if (process.argv.slice(2).some(arg => arg !== '--dry-run')) throw new Error('Only --dry-run is supported.');
const run = (args, options = {}) => spawnSync(cli, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, ...options });
if (!dryRun) {
  const secret = run(['env', 'get', 'ADMIN_PASSWORD_HASH', '--deployment', deployment]);
  if (secret.status !== 0 || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(secret.stdout.trim())) {
    throw new Error('Configure the server admin password with configure-admin-secret.mjs before deployment.');
  }
}
const name = `bleuroi-rollout-${Date.now()}`;
const authorization = run(['deployment', 'token', 'create', name, '--deployment', deployment]);
if (authorization.status !== 0) throw new Error('Cannot authorize the verified live backend. Check Convex login.');
const key = authorization.stdout.trim();
try {
  console.log(`${dryRun ? 'Reviewing' : 'Deploying'} the live backend: https://${deployment}.convex.cloud`);
  const result = run(['deploy', ...(dryRun ? ['--dry-run'] : []), '--typecheck', 'enable'], { env: { ...process.env, CONVEX_DEPLOY_KEY: key } });
  process.stdout.write((result.stdout + result.stderr).split(key).join('[REDACTED]'));
  process.exitCode = result.status ?? 1;
} finally {
  const revoke = run(['deployment', 'token', 'delete', name, '--deployment', deployment]);
  if (revoke.status !== 0) {
    console.error(`Revoke temporary deploy key ${name} in the Convex dashboard; automatic revocation failed.`);
    process.exitCode = 1;
  } else console.log('Temporary deployment authorization revoked.');
}
