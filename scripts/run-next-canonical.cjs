const { realpathSync } = require("node:fs");
const { spawn } = require("node:child_process");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-next-canonical.cjs <next args...>");
  process.exit(1);
}

const canonicalCwd = realpathSync.native(process.cwd());
const nextBin = require.resolve("next/dist/bin/next", {
  paths: [canonicalCwd]
});

const child = spawn(process.execPath, [nextBin, ...args], {
  cwd: canonicalCwd,
  stdio: "inherit",
  env: process.env
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
