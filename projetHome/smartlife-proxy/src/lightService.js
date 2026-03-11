const { clamp, safeJsonParse, toBool, toInt } = require("./utils");

const SWITCH_FALLBACK_CODES = ["switch_led", "switch_1", "switch"];
const BRIGHTNESS_FALLBACK_CODES = ["bright_value_v2", "bright_value", "brightness"];

const findStatus = (statusList, code) =>
  (Array.isArray(statusList) ? statusList : []).find((item) => item && item.code === code);

const findFirstStatus = (statusList, codes) => {
  for (const code of codes) {
    const found = findStatus(statusList, code);
    if (found) {
      return found;
    }
  }

  return undefined;
};

const resolveRange = (functions, preferredCode, fallbackMin, fallbackMax) => {
  const items = Array.isArray(functions) ? functions : [];
  const target = items.find((item) => item && item.code === preferredCode);
  const rawValues = target && typeof target.values === "string" ? target.values : "";
  const values = safeJsonParse(rawValues, {});
  const min = toInt(values.min, fallbackMin);
  const max = toInt(values.max, fallbackMax);

  if (max <= min) {
    return { min: fallbackMin, max: fallbackMax };
  }

  return { min, max };
};

const chooseSwitchCode = (statusList, preferred) => {
  if (preferred && findStatus(statusList, preferred)) {
    return preferred;
  }

  const found = findFirstStatus(statusList, SWITCH_FALLBACK_CODES);
  if (found) {
    return found.code;
  }

  const anySwitch = (Array.isArray(statusList) ? statusList : []).find(
    (item) => item && typeof item.code === "string" && item.code.startsWith("switch")
  );
  return anySwitch ? anySwitch.code : preferred || "switch_led";
};

const chooseBrightnessCode = (statusList, preferred) => {
  if (preferred && findStatus(statusList, preferred)) {
    return preferred;
  }

  const found = findFirstStatus(statusList, BRIGHTNESS_FALLBACK_CODES);
  if (found) {
    return found.code;
  }

  const anyBrightness = (Array.isArray(statusList) ? statusList : []).find(
    (item) => item && typeof item.code === "string" && item.code.includes("bright")
  );
  return anyBrightness ? anyBrightness.code : preferred || "bright_value_v2";
};

const toPercent = (rawValue, min, max) => {
  if (max <= min) {
    return 0;
  }
  const clampedRaw = clamp(toInt(rawValue, min), min, max);
  const value = ((clampedRaw - min) / (max - min)) * 100;
  return clamp(Math.round(value), 0, 100);
};

const fromPercent = (percent, min, max) => {
  const normalized = clamp(Math.round(percent), 0, 100);
  const mapped = min + ((max - min) * normalized) / 100;
  return clamp(Math.round(mapped), min, max);
};

class LightService {
  constructor(tuyaClient, config) {
    this.tuyaClient = tuyaClient;
    this.config = config;
    this.cache = {
      updatedAt: 0,
      lights: [],
      warnings: [],
    };
    this.functionsCache = new Map();
  }

  async listLights({ forceRefresh = false } = {}) {
    const ttlMs = this.config.smartlife.cacheTtlSeconds * 1000;
    if (!forceRefresh && Date.now() - this.cache.updatedAt < ttlMs) {
      return this.cache;
    }

    const warnings = [];
    const lights = [];

    const results = await Promise.all(
      this.config.tuya.deviceIds.map(async (deviceId, index) => {
        try {
          const [details, status] = await Promise.all([
            this.tuyaClient.getDeviceDetails(deviceId),
            this.tuyaClient.getDeviceStatus(deviceId),
          ]);

          const switchCode = chooseSwitchCode(status, this.config.smartlife.switchCode);
          const brightnessCode = chooseBrightnessCode(
            status,
            this.config.smartlife.brightnessCode
          );

          const switchState = findStatus(status, switchCode);
          const brightnessState = findStatus(status, brightnessCode);

          const range = await this.getBrightnessRange(deviceId, brightnessCode);
          const brightness = brightnessState
            ? toPercent(brightnessState.value, range.min, range.max)
            : switchState && toBool(switchState.value)
            ? 100
            : 0;

          const configuredName = this.config.tuya.deviceNames[deviceId];
          const fallbackName = `SmartLife ${index + 1}`;

          return {
            id: deviceId,
            provider: "smartlife",
            providerLightId: deviceId,
            name: configuredName || details?.name || fallbackName,
            isOn: switchState ? toBool(switchState.value) : brightness > 0,
            brightness,
            metadata: {
              switchCode,
              brightnessCode,
              brightnessRange: range,
            },
          };
        } catch (error) {
          warnings.push(`device ${deviceId}: ${error.message}`);
          return null;
        }
      })
    );

    for (const result of results) {
      if (result) {
        lights.push(result);
      }
    }

    this.cache = {
      updatedAt: Date.now(),
      lights,
      warnings,
    };

    return this.cache;
  }

  async toggleLight(deviceId, on) {
    const status = await this.tuyaClient.getDeviceStatus(deviceId);
    const switchCode = chooseSwitchCode(status, this.config.smartlife.switchCode);
    await this.tuyaClient.sendCommands(deviceId, [{ code: switchCode, value: Boolean(on) }]);
    await this.listLights({ forceRefresh: true });
  }

  async setBrightness(deviceId, brightnessPercent) {
    const normalized = clamp(Math.round(brightnessPercent), 0, 100);
    const status = await this.tuyaClient.getDeviceStatus(deviceId);
    const switchCode = chooseSwitchCode(status, this.config.smartlife.switchCode);
    const brightnessCode = chooseBrightnessCode(status, this.config.smartlife.brightnessCode);
    const range = await this.getBrightnessRange(deviceId, brightnessCode);
    const brightnessRaw = fromPercent(normalized, range.min, range.max);

    const commands = [];
    if (normalized <= 0) {
      commands.push({ code: switchCode, value: false });
    } else {
      commands.push({ code: switchCode, value: true });
      commands.push({ code: brightnessCode, value: brightnessRaw });
    }

    await this.tuyaClient.sendCommands(deviceId, commands);
    await this.listLights({ forceRefresh: true });
  }

  async getBrightnessRange(deviceId, brightnessCode) {
    const cacheKey = `${deviceId}:${brightnessCode}`;
    const cached = this.functionsCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const fallback = {
      min: this.config.smartlife.brightnessMin,
      max: this.config.smartlife.brightnessMax,
    };

    try {
      const functions = await this.tuyaClient.getDeviceFunctions(deviceId);
      const range = resolveRange(functions, brightnessCode, fallback.min, fallback.max);
      this.functionsCache.set(cacheKey, range);
      return range;
    } catch (_error) {
      this.functionsCache.set(cacheKey, fallback);
      return fallback;
    }
  }
}

module.exports = {
  LightService,
};
