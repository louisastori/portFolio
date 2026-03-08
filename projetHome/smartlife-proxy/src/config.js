const REGION_HOSTS = {
  eu: "https://openapi.tuyaeu.com",
  us: "https://openapi.tuyaus.com",
  cn: "https://openapi.tuyacn.com",
  in: "https://openapi.tuyain.com",
};

const toInt = (value, fallback) => {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseDeviceIds = (raw) =>
  String(raw ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const parseDeviceNames = (raw) => {
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const region = String(process.env.TUYA_REGION ?? "eu").toLowerCase();
const apiHost =
  (process.env.TUYA_API_HOST || "").trim() ||
  REGION_HOSTS[region] ||
  REGION_HOSTS.eu;

const config = {
  port: toInt(process.env.PORT, 8080),
  nodeEnv: process.env.NODE_ENV || "development",
  proxyToken: (process.env.PROXY_TOKEN || "").trim(),

  tuya: {
    clientId: (process.env.TUYA_CLIENT_ID || "").trim(),
    clientSecret: (process.env.TUYA_CLIENT_SECRET || "").trim(),
    region,
    apiHost,
    deviceIds: parseDeviceIds(process.env.TUYA_DEVICE_IDS),
    deviceNames: parseDeviceNames(process.env.TUYA_DEVICE_NAMES),
    requestTimeoutMs: toInt(process.env.REQUEST_TIMEOUT_MS, 10000),
  },

  smartlife: {
    switchCode: (process.env.SMARTLIFE_SWITCH_CODE || "switch_led").trim(),
    brightnessCode: (process.env.SMARTLIFE_BRIGHTNESS_CODE || "bright_value_v2").trim(),
    brightnessMin: toInt(process.env.SMARTLIFE_BRIGHTNESS_MIN, 10),
    brightnessMax: toInt(process.env.SMARTLIFE_BRIGHTNESS_MAX, 1000),
    cacheTtlSeconds: toInt(process.env.CACHE_TTL_SECONDS, 8),
  },
};

const validateConfig = () => {
  const missing = [];

  if (!config.proxyToken) {
    missing.push("PROXY_TOKEN");
  }
  if (!config.tuya.clientId) {
    missing.push("TUYA_CLIENT_ID");
  }
  if (!config.tuya.clientSecret) {
    missing.push("TUYA_CLIENT_SECRET");
  }
  if (!config.tuya.deviceIds.length) {
    missing.push("TUYA_DEVICE_IDS");
  }

  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
};

module.exports = {
  config,
  validateConfig,
};
