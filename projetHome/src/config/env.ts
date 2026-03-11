import { LightProvider } from '../types';

const toNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toIds = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }
  return value
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean);
};

export const env = {
  app: {
    refreshIntervalMs: toNumber(process.env.EXPO_PUBLIC_REFRESH_INTERVAL_MS, 60_000),
  },
  fitness: {
    baseUrl: process.env.EXPO_PUBLIC_FITNESS_API_BASE_URL ?? '',
    token: process.env.EXPO_PUBLIC_FITNESS_API_TOKEN ?? '',
    limit: toNumber(process.env.EXPO_PUBLIC_FITNESS_LIMIT, 8),
  },
  nutrition: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    table: process.env.EXPO_PUBLIC_SUPABASE_MEALS_TABLE ?? 'meals',
    limit: toNumber(process.env.EXPO_PUBLIC_NUTRITION_LIMIT, 20),
  },
  hue: {
    bridgeIp: process.env.EXPO_PUBLIC_HUE_BRIDGE_IP ?? '',
    username: process.env.EXPO_PUBLIC_HUE_USERNAME ?? '',
  },
  smartlife: {
    proxyBaseUrl: process.env.EXPO_PUBLIC_SMARTLIFE_PROXY_BASE_URL ?? '',
    proxyToken: process.env.EXPO_PUBLIC_SMARTLIFE_PROXY_TOKEN ?? '',
  },
  aramsmart: {
    baseUrl: process.env.EXPO_PUBLIC_ARAMSMART_BASE_URL ?? '',
    token: process.env.EXPO_PUBLIC_ARAMSMART_TOKEN ?? '',
  },
};

export const getConfiguredProviders = (): LightProvider[] => {
  const providers: LightProvider[] = [];

  if (env.hue.bridgeIp && env.hue.username) {
    providers.push('hue');
  }

  if (env.smartlife.proxyBaseUrl) {
    providers.push('smartlife');
  }

  if (env.aramsmart.baseUrl) {
    providers.push('aramsmart');
  }

  return providers;
};
