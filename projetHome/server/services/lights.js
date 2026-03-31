const { fetchJson } = require("../http");

const clampBrightness = (brightness) => {
  if (!Number.isFinite(brightness)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(brightness)));
};

const clampByte = (value) => Math.max(0, Math.min(255, Math.round(value)));

const normalizeHexColor = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) {
    return null;
  }

  return `#${trimmed.replace(/^#/, "").toLowerCase()}`;
};

const rgbToHex = (red, green, blue) =>
  `#${[red, green, blue]
    .map((value) => clampByte(value).toString(16).padStart(2, "0"))
    .join("")}`;

const hueSatToHex = (hueValue, satValue) => {
  const hue = (((Number(hueValue) || 0) / 65535) * 360) % 360;
  const saturation = Math.max(0, Math.min(1, (Number(satValue) || 0) / 254));
  const value = 1;
  const chroma = value * saturation;
  const hueSection = hue / 60;
  const secondary = chroma * (1 - Math.abs((hueSection % 2) - 1));
  const match = value - chroma;

  let red = 0;
  let green = 0;
  let blue = 0;

  if (hueSection >= 0 && hueSection < 1) {
    red = chroma;
    green = secondary;
  } else if (hueSection < 2) {
    red = secondary;
    green = chroma;
  } else if (hueSection < 3) {
    green = chroma;
    blue = secondary;
  } else if (hueSection < 4) {
    green = secondary;
    blue = chroma;
  } else if (hueSection < 5) {
    red = secondary;
    blue = chroma;
  } else {
    red = chroma;
    blue = secondary;
  }

  return rgbToHex((red + match) * 255, (green + match) * 255, (blue + match) * 255);
};

const hexToHueSat = (value) => {
  const normalized = normalizeHexColor(value);
  if (!normalized) {
    throw new Error("`color` must be a hex color like #ff8800.");
  }

  const red = parseInt(normalized.slice(1, 3), 16) / 255;
  const green = parseInt(normalized.slice(3, 5), 16) / 255;
  const blue = parseInt(normalized.slice(5, 7), 16) / 255;

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;

  let hue = 0;
  if (delta !== 0) {
    if (max === red) {
      hue = 60 * (((green - blue) / delta) % 6);
    } else if (max === green) {
      hue = 60 * (((blue - red) / delta) + 2);
    } else {
      hue = 60 * (((red - green) / delta) + 4);
    }
  }

  if (hue < 0) {
    hue += 360;
  }

  const saturation = max === 0 ? 0 : delta / max;

  return {
    colorHex: normalized,
    hue: Math.round((hue / 360) * 65535),
    sat: Math.round(saturation * 254),
  };
};

const withAuthHeader = (token) => {
  if (!token) {
    return {};
  }
  return {
    Authorization: `Bearer ${token}`,
  };
};

const createHueClient = (config) => {
  const isConfigured = () => Boolean(config.hue.bridgeIp && config.hue.username);
  const baseUrl = () => `http://${config.hue.bridgeIp}/api/${config.hue.username}`;

  return {
    provider: "hue",
    isConfigured,
    listLights: async () => {
      const payload = await fetchJson(`${baseUrl()}/lights`);

      return Object.entries(payload).map(([lightId, light]) => {
        const brightnessRaw =
          light.state && typeof light.state.bri === "number"
            ? light.state.bri
            : light.state && light.state.on
              ? 254
              : 0;
        const supportsColor = Boolean(
          (light.capabilities && light.capabilities.control && light.capabilities.control.colorgamuttype) ||
          String(light.type || "").toLowerCase().indexOf("color") >= 0
        );

        return {
          id: `hue:${lightId}`,
          provider: "hue",
          providerLightId: String(lightId),
          name: light.name || `Hue ${lightId}`,
          isOn: Boolean(light.state && light.state.on),
          brightness: clampBrightness(Math.round((brightnessRaw / 254) * 100)),
          supportsColor,
          colorHex: supportsColor ? hueSatToHex(light.state && light.state.hue, light.state && light.state.sat) : null,
        };
      });
    },
    toggleLight: async (lightId, on) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ on }),
      });
    },
    setBrightness: async (lightId, brightness) => {
      const clamped = clampBrightness(brightness);
      const hueBrightness = Math.max(1, Math.round((clamped / 100) * 254));

      await fetchJson(`${baseUrl()}/lights/${lightId}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ on: clamped > 0, bri: hueBrightness }),
      });
    },
    setColor: async (lightId, color) => {
      const hueState = hexToHueSat(color);

      await fetchJson(`${baseUrl()}/lights/${lightId}/state`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          on: true,
          hue: hueState.hue,
          sat: hueState.sat,
        }),
      });
    },
  };
};

const createSmartLifeClient = (config) => {
  const isConfigured = () => Boolean(config.smartlife.proxyBaseUrl);
  const baseUrl = () => config.smartlife.proxyBaseUrl;

  return {
    provider: "smartlife",
    isConfigured,
    listLights: async () => {
      const payload = await fetchJson(`${baseUrl()}/lights`, {
        headers: withAuthHeader(config.smartlife.proxyToken),
      });

      const lights = Array.isArray(payload) ? payload : payload.lights || [];
      return lights
        .filter((light) => light && typeof light === "object")
        .map((light, index) => ({
          id: `smartlife:${String(light.id ?? index)}`,
          provider: "smartlife",
          providerLightId: String(light.id ?? index),
          name: String(light.name ?? `SmartLife ${index + 1}`),
          isOn: Boolean(light.isOn ?? light.on),
          brightness: clampBrightness(Number(light.brightness ?? 0)),
          supportsColor: Boolean(light.supportsColor || light.colorHex),
          colorHex: normalizeHexColor(light.colorHex) || null,
        }));
    },
    toggleLight: async (lightId, on) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...withAuthHeader(config.smartlife.proxyToken),
        },
        body: JSON.stringify({ on }),
      });
    },
    setBrightness: async (lightId, brightness) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/brightness`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...withAuthHeader(config.smartlife.proxyToken),
        },
        body: JSON.stringify({ brightness: clampBrightness(brightness) }),
      });
    },
  };
};

const createAramSmartClient = (config) => {
  const isConfigured = () => Boolean(config.aramsmart.baseUrl);
  const baseUrl = () => config.aramsmart.baseUrl;

  return {
    provider: "aramsmart",
    isConfigured,
    listLights: async () => {
      const payload = await fetchJson(`${baseUrl()}/lights`, {
        headers: withAuthHeader(config.aramsmart.token),
      });

      const lights = Array.isArray(payload) ? payload : payload.lights || [];
      return lights
        .filter((light) => light && typeof light === "object")
        .map((light, index) => ({
          id: `aramsmart:${String(light.id ?? index)}`,
          provider: "aramsmart",
          providerLightId: String(light.id ?? index),
          name: String(light.name ?? `AramSMART ${index + 1}`),
          isOn: Boolean(light.isOn ?? light.on),
          brightness: clampBrightness(Number(light.brightness ?? 0)),
          supportsColor: Boolean(light.supportsColor || light.colorHex),
          colorHex: normalizeHexColor(light.colorHex) || null,
        }));
    },
    toggleLight: async (lightId, on) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...withAuthHeader(config.aramsmart.token),
        },
        body: JSON.stringify({ on }),
      });
    },
    setBrightness: async (lightId, brightness) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/brightness`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...withAuthHeader(config.aramsmart.token),
        },
        body: JSON.stringify({ brightness: clampBrightness(brightness) }),
      });
    },
  };
};

const createClients = (config) => [
  createHueClient(config),
  createSmartLifeClient(config),
  createAramSmartClient(config),
];

const resolveClient = (config, provider) => {
  const client = createClients(config).find((item) => item.provider === provider);
  if (!client) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return client;
};

const loadProvider = async (client) => {
  if (!client.isConfigured()) {
    return { lights: [], warnings: [] };
  }

  try {
    const lights = await client.listLights();
    return { lights, warnings: [] };
  } catch (error) {
    return {
      lights: [],
      warnings: [`${client.provider} error: ${error.message}`],
    };
  }
};

const fetchLightsSnapshot = async (config) => {
  const results = await Promise.all(createClients(config).map((client) => loadProvider(client)));
  return {
    lights: results.flatMap((result) => result.lights),
    warnings: results.flatMap((result) => result.warnings),
  };
};

const toggleLightPower = async (config, provider, lightId, on) => {
  const client = resolveClient(config, provider);
  if (!client.isConfigured()) {
    throw new Error(`${provider} is not configured.`);
  }
  await client.toggleLight(lightId, on);
};

const setLightBrightness = async (config, provider, lightId, brightness) => {
  const client = resolveClient(config, provider);
  if (!client.isConfigured()) {
    throw new Error(`${provider} is not configured.`);
  }
  await client.setBrightness(lightId, clampBrightness(brightness));
};

const setLightColor = async (config, provider, lightId, color) => {
  const client = resolveClient(config, provider);
  if (!client.isConfigured()) {
    throw new Error(`${provider} is not configured.`);
  }
  if (typeof client.setColor !== "function") {
    throw new Error(`${provider} does not support color control.`);
  }
  await client.setColor(lightId, color);
};

module.exports = {
  fetchLightsSnapshot,
  setLightBrightness,
  setLightColor,
  toggleLightPower,
};
