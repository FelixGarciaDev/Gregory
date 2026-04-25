const { existsSync, readFileSync, realpathSync } = require("node:fs");
const { dirname, join } = require("node:path");
const { spawn } = require("node:child_process");

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/run-next-canonical.cjs <next args...>");
  process.exit(1);
}

const canonicalCwd = realpathSync.native(process.cwd());

function parseDotEnvLine(line) {
  const trimmed = line.trim();

  if (!trimmed || trimmed.startsWith("#")) {
    return null;
  }

  const separatorIndex = trimmed.indexOf("=");

  if (separatorIndex === -1) {
    return null;
  }

  const key = trimmed.slice(0, separatorIndex).trim();
  let value = trimmed.slice(separatorIndex + 1).trim();

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  return key ? { key, value } : null;
}

function loadDotEnv(filePath, { override }) {
  if (!existsSync(filePath)) {
    return;
  }

  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const entry = parseDotEnvLine(line);

    if (!entry) {
      continue;
    }

    if (override || process.env[entry.key] === undefined) {
      process.env[entry.key] = entry.value;
    }
  }
}

const repoRoot = dirname(dirname(canonicalCwd));
loadDotEnv(join(repoRoot, ".env"), { override: false });
loadDotEnv(join(canonicalCwd, ".env"), { override: true });

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
