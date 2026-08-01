import { matchFixture } from "./fixtures";

export const DAY = 86_400;
export const WEEK = 604_800;
export const MONTH = 2_592_000;

export class HttpError extends Error {
  constructor(
    public status: number,
    url: string
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = "HttpError";
  }
}

interface FetchJsonOptions {
  /** Next.js data-cache TTL in seconds. */
  revalidate?: number;
  timeoutMs?: number;
  headers?: Record<string, string>;
}

/**
 * JSON fetch with a Next data-cache TTL, a hard timeout, and one retry on
 * 5xx/network failure. With USE_FIXTURES=1, serves bundled demo data instead
 * of hitting the network (for offline dev and sandboxed environments).
 */
export async function fetchJson<T>(
  url: string,
  { revalidate = DAY, timeoutMs = 5_000, headers }: FetchJsonOptions = {}
): Promise<T> {
  if (process.env.USE_FIXTURES === "1") {
    const fixture = matchFixture(url);
    if (fixture !== undefined) return fixture as T;
    throw new HttpError(404, `no fixture for ${url}`);
  }

  const attempt = async (): Promise<T> => {
    const res = await fetch(url, {
      headers: { accept: "application/json", ...headers },
      signal: AbortSignal.timeout(timeoutMs),
      next: { revalidate },
    });
    if (!res.ok) throw new HttpError(res.status, url);
    return (await res.json()) as T;
  };

  try {
    return await attempt();
  } catch (err) {
    if (err instanceof HttpError && err.status < 500) throw err;
    return attempt();
  }
}

/** NHTSA/EPA responses encode single-item lists as bare objects — normalize. */
export function asArray<T>(value: T | T[] | undefined | null): T[] {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
