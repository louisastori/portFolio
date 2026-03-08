import { env } from '../config/env';
import { fetchJson } from './http';
import { LightDevice, LightProvider } from '../types';

type ProviderClient = {
  provider: LightProvider;
  isConfigured: () => boolean;
  listLights: () => Promise<LightDevice[]>;
  toggleLight: (lightId: string, on: boolean) => Promise<void>;
  setBrightness: (lightId: string, brightness: number) => Promise<void>;
};

type ProviderResult = {
  lights: LightDevice[];
  warnings: string[];
};

const clampBrightness = (brightness: number): number => {
  if (!Number.isFinite(brightness)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(brightness)));
};

const withAuthHeader = (token: string): Record<string, string> => {
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
};

const createHueClient = (): ProviderClient => {
  const isConfigured = () => Boolean(env.hue.bridgeIp && env.hue.username);

  const baseUrl = () => `http://${env.hue.bridgeIp}/api/${env.hue.username}`;

  return {
    provider: 'hue',
    isConfigured,
    listLights: async () => {
      const payload = await fetchJson<Record<string, { name?: string; state?: { on?: boolean; bri?: number } }>>(
        `${baseUrl()}/lights`
      );

      return Object.entries(payload).map(([lightId, light]) => {
        const bri = light.state?.bri ?? (light.state?.on ? 254 : 0);
        const brightness = Math.round((bri / 254) * 100);

        return {
          id: `hue:${lightId}`,
          provider: 'hue',
          providerLightId: lightId,
          name: light.name ?? `Hue ${lightId}`,
          isOn: Boolean(light.state?.on),
          brightness: clampBrightness(brightness),
        };
      });
    },
    toggleLight: async (lightId, on) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ on }),
      });
    },
    setBrightness: async (lightId, brightness) => {
      const clamped = clampBrightness(brightness);
      const hueBri = Math.max(1, Math.round((clamped / 100) * 254));

      await fetchJson(`${baseUrl()}/lights/${lightId}/state`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ on: clamped > 0, bri: hueBri }),
      });
    },
  };
};

const createSmartLifeClient = (): ProviderClient => {
  const isConfigured = () => Boolean(env.smartlife.proxyBaseUrl);

  const baseUrl = () => env.smartlife.proxyBaseUrl.replace(/\/$/, '');

  return {
    provider: 'smartlife',
    isConfigured,
    listLights: async () => {
      const payload = await fetchJson<{ lights?: unknown[] } | unknown[]>(`${baseUrl()}/lights`, {
        headers: withAuthHeader(env.smartlife.proxyToken),
      });

      const lights = Array.isArray(payload) ? payload : payload.lights ?? [];

      return lights
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((light, index) => ({
          id: `smartlife:${String(light.id ?? index)}`,
          provider: 'smartlife' as const,
          providerLightId: String(light.id ?? index),
          name: String(light.name ?? `SmartLife ${index + 1}`),
          isOn: Boolean(light.isOn ?? light.on),
          brightness: clampBrightness(Number(light.brightness ?? 0)),
        }));
    },
    toggleLight: async (lightId, on) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(env.smartlife.proxyToken),
        },
        body: JSON.stringify({ on }),
      });
    },
    setBrightness: async (lightId, brightness) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/brightness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(env.smartlife.proxyToken),
        },
        body: JSON.stringify({ brightness: clampBrightness(brightness) }),
      });
    },
  };
};

const createAramSmartClient = (): ProviderClient => {
  const isConfigured = () => Boolean(env.aramsmart.baseUrl);

  const baseUrl = () => env.aramsmart.baseUrl.replace(/\/$/, '');

  return {
    provider: 'aramsmart',
    isConfigured,
    listLights: async () => {
      const payload = await fetchJson<{ lights?: unknown[] } | unknown[]>(`${baseUrl()}/lights`, {
        headers: withAuthHeader(env.aramsmart.token),
      });

      const lights = Array.isArray(payload) ? payload : payload.lights ?? [];

      return lights
        .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
        .map((light, index) => ({
          id: `aramsmart:${String(light.id ?? index)}`,
          provider: 'aramsmart' as const,
          providerLightId: String(light.id ?? index),
          name: String(light.name ?? `AramSMART ${index + 1}`),
          isOn: Boolean(light.isOn ?? light.on),
          brightness: clampBrightness(Number(light.brightness ?? 0)),
        }));
    },
    toggleLight: async (lightId, on) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(env.aramsmart.token),
        },
        body: JSON.stringify({ on }),
      });
    },
    setBrightness: async (lightId, brightness) => {
      await fetchJson(`${baseUrl()}/lights/${lightId}/brightness`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...withAuthHeader(env.aramsmart.token),
        },
        body: JSON.stringify({ brightness: clampBrightness(brightness) }),
      });
    },
  };
};

const clients: ProviderClient[] = [createHueClient(), createSmartLifeClient(), createAramSmartClient()];

const resolveClient = (provider: LightProvider): ProviderClient => {
  const client = clients.find((item) => item.provider === provider);
  if (!client) {
    throw new Error(`Unsupported provider: ${provider}`);
  }
  return client;
};

const loadProvider = async (client: ProviderClient): Promise<ProviderResult> => {
  if (!client.isConfigured()) {
    return {
      lights: [],
      warnings: [`${client.provider} not configured.`],
    };
  }

  try {
    const lights = await client.listLights();
    return { lights, warnings: [] };
  } catch (error) {
    return {
      lights: [],
      warnings: [`${client.provider} error: ${(error as Error).message}`],
    };
  }
};

export const fetchLightsSnapshot = async (): Promise<ProviderResult> => {
  const results = await Promise.all(clients.map((client) => loadProvider(client)));

  return {
    lights: results.flatMap((result) => result.lights),
    warnings: results.flatMap((result) => result.warnings),
  };
};

export const toggleLightPower = async (light: LightDevice, on: boolean): Promise<void> => {
  const client = resolveClient(light.provider);
  if (!client.isConfigured()) {
    throw new Error(`${light.provider} not configured.`);
  }
  await client.toggleLight(light.providerLightId, on);
};

export const setLightBrightness = async (light: LightDevice, brightness: number): Promise<void> => {
  const client = resolveClient(light.provider);
  if (!client.isConfigured()) {
    throw new Error(`${light.provider} not configured.`);
  }
  await client.setBrightness(light.providerLightId, clampBrightness(brightness));
};
