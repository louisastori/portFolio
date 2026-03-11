const DEFAULT_TIMEOUT_MS = 15_000;

export const fetchJson = async <T>(
  url: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<T> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`HTTP ${response.status} - ${body.slice(0, 120)}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const raw = await response.text();
    if (!raw) {
      return undefined as T;
    }

    return JSON.parse(raw) as T;
  } finally {
    clearTimeout(timer);
  }
};
