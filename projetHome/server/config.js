const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");
const webDir = path.join(rootDir, "web");

const toNumber = (value, fallback) => {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" && !value.trim()) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toString = (value) => (typeof value === "string" ? value.trim() : "");

const withNoTrailingSlash = (value) => toString(value).replace(/\/+$/, "");

const firstDefined = (...keys) => {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
};

const loadEnvFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const raw = fs.readFileSync(filePath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(path.join(rootDir, ".env"));

const refreshIntervalMs = toNumber(
  firstDefined("DASHBOARD_REFRESH_INTERVAL_MS", "EXPO_PUBLIC_REFRESH_INTERVAL_MS"),
  60_000
);

const config = {
  rootDir,
  webDir,
  port: toNumber(firstDefined("PORT"), 3000),
  app: {
    refreshIntervalMs,
    cacheTtlMs: toNumber(firstDefined("DASHBOARD_CACHE_TTL_MS"), Math.min(refreshIntervalMs, 30_000)),
  },
  fitness: {
    baseUrl: withNoTrailingSlash(firstDefined("FITNESS_API_BASE_URL", "EXPO_PUBLIC_FITNESS_API_BASE_URL")),
    token: firstDefined("FITNESS_API_TOKEN", "EXPO_PUBLIC_FITNESS_API_TOKEN"),
    limit: toNumber(firstDefined("FITNESS_LIMIT", "EXPO_PUBLIC_FITNESS_LIMIT"), 8),
  },
  nutrition: {
    supabaseUrl: withNoTrailingSlash(firstDefined("SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_URL")),
    supabaseAnonKey: firstDefined("SUPABASE_ANON_KEY", "EXPO_PUBLIC_SUPABASE_ANON_KEY"),
    table: firstDefined("SUPABASE_MEALS_TABLE", "EXPO_PUBLIC_SUPABASE_MEALS_TABLE") || "meals",
    limit: toNumber(firstDefined("NUTRITION_LIMIT", "EXPO_PUBLIC_NUTRITION_LIMIT"), 20),
  },
  hue: {
    bridgeIp: firstDefined("HUE_BRIDGE_IP", "EXPO_PUBLIC_HUE_BRIDGE_IP"),
    username: firstDefined("HUE_USERNAME", "EXPO_PUBLIC_HUE_USERNAME"),
  },
  smartlife: {
    proxyBaseUrl: withNoTrailingSlash(
      firstDefined("SMARTLIFE_PROXY_BASE_URL", "EXPO_PUBLIC_SMARTLIFE_PROXY_BASE_URL")
    ),
    proxyToken: firstDefined("SMARTLIFE_PROXY_TOKEN", "EXPO_PUBLIC_SMARTLIFE_PROXY_TOKEN"),
  },
  aramsmart: {
    baseUrl: withNoTrailingSlash(firstDefined("ARAMSMART_BASE_URL", "EXPO_PUBLIC_ARAMSMART_BASE_URL")),
    token: firstDefined("ARAMSMART_TOKEN", "EXPO_PUBLIC_ARAMSMART_TOKEN"),
  },
  ollama: {
    baseUrl: withNoTrailingSlash(firstDefined("OLLAMA_BASE_URL")) || "http://127.0.0.1:11434",
    model: firstDefined("OLLAMA_MODEL"),
    timeoutMs: toNumber(firstDefined("OLLAMA_TIMEOUT_MS"), 45_000),
  },
  aiLab: {
    timeoutMs: toNumber(firstDefined("AI_LAB_TIMEOUT_MS"), 3_500),
    h2oBaseUrl: withNoTrailingSlash(firstDefined("H2O_BASE_URL")) || "http://127.0.0.1:54321",
  },
};

module.exports = {
  config,
};
