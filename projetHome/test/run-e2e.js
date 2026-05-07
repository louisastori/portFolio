const { spawn } = require("node:child_process");

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";
const healthUrl = new URL("/api/health", baseURL).toString();

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isHealthy = async () => {
  try {
    const response = await fetch(healthUrl);
    return response.ok;
  } catch (_error) {
    return false;
  }
};

const waitForHealth = async (timeoutMs = 30_000) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isHealthy()) {
      return true;
    }
    await sleep(500);
  }
  return false;
};

const run = async () => {
  let server = null;
  const alreadyRunning = await isHealthy();

  if (!alreadyRunning && !process.env.E2E_BASE_URL) {
    server = spawn(process.execPath, ["server/index.js"], {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        PORT: new URL(baseURL).port || "3100",
      },
      windowsHide: true,
    });

    server.stdout.on("data", (chunk) => process.stdout.write(chunk));
    server.stderr.on("data", (chunk) => process.stderr.write(chunk));

    const ready = await waitForHealth();
    if (!ready) {
      server.kill();
      throw new Error(`E2E server did not become healthy at ${healthUrl}`);
    }
  }

  const command = process.platform === "win32" ? "node_modules\\.bin\\playwright.cmd" : "node_modules/.bin/playwright";
  const args = ["test", ...process.argv.slice(2)];
  const runner = spawn(command, args, {
    cwd: process.cwd(),
    stdio: "inherit",
    env: {
      ...process.env,
      E2E_BASE_URL: baseURL,
    },
    shell: process.platform === "win32",
    windowsHide: true,
  });

  const exitCode = await new Promise((resolve) => {
    runner.on("exit", (code) => resolve(code || 0));
  });

  if (server) {
    server.kill();
  }

  process.exit(exitCode);
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
