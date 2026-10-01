const wpWarnings = new Set<string>();
const wpCache = new Map<string, Promise<unknown>>();
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;

interface FetchWpOptions {
  required?: boolean;
  retries?: number;
  timeoutMs?: number;
  onResponse?: (response: Response) => void;
}

const normalizeEnvUrl = (value?: string) =>
  value
    ?.trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\/$/, "") ?? "";

const warnOnce = (message: string, error?: unknown) => {
  if (wpWarnings.has(message)) return;
  wpWarnings.add(message);
  console.warn(message, error ?? "");
};

export const getWpApiUrl = (path = "") => {
  const baseUrl = normalizeEnvUrl(import.meta.env.PUBLIC_WP_URL);
  if (!baseUrl) return null;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

const allowRequiredFallback = () =>
  import.meta.env.ALLOW_WP_FALLBACK === "true";

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function fetchWpJson<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
  options: FetchWpOptions = {},
): Promise<T> {
  const url = getWpApiUrl(path);
  if (!url) {
    const message = "[wp] PUBLIC_WP_URL is not configured.";
    if (options.required && !allowRequiredFallback()) throw new Error(message);
    warnOnce(message);
    return fallback;
  }

  const retries = options.retries ?? DEFAULT_RETRIES;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const timeoutSignal = AbortSignal.timeout(timeoutMs);
      const signal = init?.signal
        ? AbortSignal.any([init.signal, timeoutSignal])
        : timeoutSignal;
      const response = await fetch(url, { ...init, signal });
      if (!response.ok) {
        lastError = new Error(`HTTP ${response.status}`);
        if (response.status < 500 && response.status !== 429) break;
      } else {
        options.onResponse?.(response);
        return (await response.json()) as T;
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < retries) await wait(250 * 2 ** attempt);
  }

  const message = `[wp] Request failed for ${url}.`;
  if (options.required && !allowRequiredFallback()) {
    throw new Error(message, { cause: lastError });
  }
  warnOnce(message, lastError);
  return fallback;
}

export function fetchWpJsonCached<T>(
  path: string,
  fallback: T,
  init?: RequestInit,
  options: FetchWpOptions = {},
): Promise<T> {
  // During local development, always re-fetch WordPress content so edits made
  // in the CMS appear on the next page load without restarting Astro.
  if (import.meta.env.DEV) {
    return fetchWpJson(path, fallback, init, options);
  }

  const cacheKey = `${path}:${JSON.stringify(init ?? {})}:${JSON.stringify(options)}`;
  if (!wpCache.has(cacheKey)) {
    wpCache.set(cacheKey, fetchWpJson(path, fallback, init, options));
  }

  return wpCache.get(cacheKey) as Promise<T>;
}

export const fetchWpJsonRequired = <T>(
  path: string,
  fallback: T,
  init?: RequestInit,
) => fetchWpJsonCached(path, fallback, init, { required: true });

// WordPress caps REST collections at 100 items per request. Read the total
// page count so archive links and article routes include the entire collection.
export function fetchWpCollectionRequired<T>(path: string): Promise<T[]> {
  const cacheKey = `collection:${path}`;
  const fetchCollection = async () => {
    const [pathname, query = ""] = path.split("?");
    const params = new URLSearchParams(query);
    params.set("per_page", "100");
    params.set("page", "1");
    let totalPages = 1;
    const firstPage = await fetchWpJson<T[]>(
      `${pathname}?${params}`,
      [],
      undefined,
      {
        required: true,
        onResponse: (response) => {
          totalPages = Number(response.headers.get("X-WP-TotalPages")) || 1;
        },
      },
    );
    const results = [...firstPage];
    for (let page = 2; page <= totalPages; page += 1) {
      params.set("page", String(page));
      results.push(
        ...(await fetchWpJson<T[]>(`${pathname}?${params}`, [], undefined, {
          required: true,
        })),
      );
    }
    return results;
  };

  if (import.meta.env.DEV) return fetchCollection();
  if (!wpCache.has(cacheKey)) wpCache.set(cacheKey, fetchCollection());
  return wpCache.get(cacheKey) as Promise<T[]>;
}

export const getWpCategories = () =>
  fetchWpJsonRequired(
    "/categories?per_page=100",
    [] as Record<string, unknown>[],
  );

export const getWpTags = () =>
  fetchWpJsonRequired("/tags?per_page=100", [] as Record<string, unknown>[]);
