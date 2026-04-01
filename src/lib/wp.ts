const wpWarnings = new Set<string>();
const wpCache = new Map<string, Promise<unknown>>();

const normalizeEnvUrl = (value?: string) => value?.trim().replace(/^['"]|['"]$/g, '').replace(/\/$/, '') ?? '';

const warnOnce = (message: string, error?: unknown) => {
  if (wpWarnings.has(message)) return;
  wpWarnings.add(message);
  console.warn(message, error ?? '');
};

export const getWpApiUrl = (path = '') => {
  const baseUrl = normalizeEnvUrl(import.meta.env.PUBLIC_WP_URL);
  if (!baseUrl) return null;

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export async function fetchWpJson<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  const url = getWpApiUrl(path);
  if (!url) {
    warnOnce('[wp] PUBLIC_WP_URL is not configured.');
    return fallback;
  }

  try {
    const response = await fetch(url, init);
    if (!response.ok) {
      warnOnce(`[wp] Request failed (${response.status}) for ${url}.`);
      return fallback;
    }

    return (await response.json()) as T;
  } catch (error) {
    warnOnce(`[wp] Request failed for ${url}.`, error);
    return fallback;
  }
}

export function fetchWpJsonCached<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  const cacheKey = `${path}:${JSON.stringify(init ?? {})}`;
  if (!wpCache.has(cacheKey)) {
    wpCache.set(cacheKey, fetchWpJson(path, fallback, init));
  }

  return wpCache.get(cacheKey) as Promise<T>;
}

export const getWpCategories = () => fetchWpJsonCached('/categories?per_page=100', [] as Record<string, unknown>[]);

export const getWpTags = () => fetchWpJsonCached('/tags?per_page=100', [] as Record<string, unknown>[]);
