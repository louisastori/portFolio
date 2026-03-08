const crypto = require("crypto");

const sha256Hex = (payload) =>
  crypto.createHash("sha256").update(payload || "", "utf8").digest("hex");

const hmacSha256Upper = (secret, payload) =>
  crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex").toUpperCase();

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const safeJsonParse = (raw, fallback = {}) => {
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch (_error) {
    return fallback;
  }
};

const toBool = (value) => value === true;

const toInt = (value, fallback = 0) => {
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

module.exports = {
  clamp,
  hmacSha256Upper,
  safeJsonParse,
  sha256Hex,
  toBool,
  toInt,
};
