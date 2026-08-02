import { unstable_cache } from "next/cache";

import type { BuildData, BuildDataProvider, BuildDataResult } from "../types";
import { extractCells, valueAfterLabel } from "../parse";

// RealOEM front-ends BMW's ETK parts catalog: production date, paint,
// upholstery, and the full factory option (SA code) list, keyed by the last
// 7 characters of the VIN. No login, and the page layout has been stable
// for many years — which is why every "free BMW decoder" site uses this data.

// Full browser-shaped header set: RealOEM's WAF 403s bare fetches.
const BROWSER_HEADERS: Record<string, string> = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "accept-language": "en-US,en;q=0.9",
  "sec-ch-ua": '"Chromium";v="126", "Not.A/Brand";v="8", "Google Chrome";v="126"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "none",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
};

const LABELS = {
  model: /^model$/i,
  series: /^series$/i,
  prodDate: /^prod\.?\s*date$/i,
  paint: /^(paint|colou?r)$/i,
  upholstery: /^(upholstery|interior)$/i,
};

// SA option codes look like "205", "0403", "S205A", "P7LGA".
const OPTION_CODE = /^[A-Z]?\d{3,4}[A-Z]{0,3}$/;

export function parseRealOemHtml(html: string, sourceUrl: string): BuildDataResult {
  if (/no vehicles? (was |were )?found|could not be (found|identified)|invalid/i.test(html)) {
    return { status: "not_found", reason: "VIN not in the RealOEM catalog" };
  }

  const cells = extractCells(html);
  const model = valueAfterLabel(cells, LABELS.model);
  const series = valueAfterLabel(cells, LABELS.series);
  const productionDate = valueAfterLabel(cells, LABELS.prodDate);
  const paint = valueAfterLabel(cells, LABELS.paint);
  const upholstery = valueAfterLabel(cells, LABELS.upholstery);

  // Option rows: a code-shaped cell immediately followed by a descriptive
  // text cell. Label cells and dates never match the code shape.
  const options: BuildData["options"] = [];
  const seen = new Set<string>();
  for (let i = 0; i < cells.length - 1; i++) {
    const code = cells[i];
    const name = cells[i + 1];
    if (!OPTION_CODE.test(code)) continue;
    if (!name || name.length < 3 || !/[a-z]/i.test(name)) continue;
    if (OPTION_CODE.test(name)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    options.push({ code, name });
  }

  const foundSummary = Boolean(productionDate || paint || upholstery);
  if (!foundSummary && options.length < 3) {
    return {
      status: "error",
      reason: `RealOEM page layout not recognized (${cells.length} cells, ${options.length} option-like rows)`,
    };
  }

  return {
    status: "ok",
    data: {
      source: "RealOEM (BMW parts catalog)",
      sourceUrl,
      model: model && series ? `${model} (${series})` : (model ?? series),
      productionDate,
      paint,
      upholstery,
      options,
    },
  };
}

function candidateUrls(serial: string): string[] {
  const s = encodeURIComponent(serial);
  return [
    `https://www.realoem.com/bmw/enUS/select?vin=${s}`,
    `https://realoem.com/bmw/select.do?vin=${s}`,
  ];
}

// RealOEM blocks datacenter IPs, so direct fetches from Vercel 403. When
// BUILD_DATA_PROXY_URL is set (http://user:pass@host:port — a residential
// proxy), RealOEM requests route through it; otherwise plain fetch, which
// works from residential connections (local dev) but not from cloud hosts.
interface MinimalResponse {
  ok: boolean;
  status: number;
  text(): Promise<string>;
}

let proxyDispatcher: unknown | null = null;

async function fetchPage(url: string): Promise<MinimalResponse> {
  const proxyUrl = process.env.BUILD_DATA_PROXY_URL;
  const init = {
    headers: BROWSER_HEADERS,
    signal: AbortSignal.timeout(8_000),
  };

  if (proxyUrl) {
    // undici's own fetch: bypasses Next's fetch patching and accepts a
    // dispatcher. Caching stays correct — unstable_cache wraps this layer.
    const { fetch: undiciFetch, ProxyAgent } = await import("undici");
    proxyDispatcher ??= new ProxyAgent(proxyUrl);
    return undiciFetch(url, {
      ...init,
      dispatcher: proxyDispatcher as InstanceType<typeof ProxyAgent>,
    });
  }

  return fetch(url, { ...init, cache: "no-store" });
}

/**
 * Try each RealOEM entry point in order. Successful and not-found outcomes
 * are worth caching; transient failures throw so nothing sticks — the
 * accumulated per-attempt report becomes the debug-endpoint error reason.
 */
async function fetchUncached(serial: string): Promise<BuildDataResult> {
  const attempts: string[] = [];

  const viaProxy = process.env.BUILD_DATA_PROXY_URL ? " (via proxy)" : "";

  for (const url of candidateUrls(serial)) {
    const host = new URL(url).host + viaProxy;
    let res: MinimalResponse;
    try {
      res = await fetchPage(url);
    } catch (err) {
      attempts.push(`${host}: ${err instanceof Error ? err.name : "fetch failed"}`);
      continue;
    }
    if (!res.ok) {
      attempts.push(`${host}: HTTP ${res.status}`);
      continue;
    }

    const parsed = parseRealOemHtml(await res.text(), url);
    if (parsed.status === "error") {
      attempts.push(`${host}: ${parsed.reason}`);
      continue;
    }
    return parsed;
  }

  throw new Error(attempts.join("; ") || "no attempts ran");
}

const cachedFetch = unstable_cache(
  // Only ok/not_found ever get here (errors throw), so a 30-day TTL is safe.
  async (serial: string) => fetchUncached(serial),
  ["build-data-realoem"],
  { revalidate: 2_592_000 }
);

function demoBuildData(sourceUrl: string): BuildDataResult {
  return {
    status: "ok",
    data: {
      source: "RealOEM (BMW parts catalog)",
      sourceUrl,
      model: "335i (E92)",
      productionDate: "2011-03",
      paint: "Alpinweiss 3 (300)",
      upholstery: "Schwarz (LKSW)",
      options: [
        { code: "S205A", name: "Automatic transmission" },
        { code: "S403A", name: "Glass roof, electrical" },
        { code: "S431A", name: "Interior mirror with automatic-dip" },
        { code: "S459A", name: "Seat adjustment, electric, with memory" },
        { code: "S494A", name: "Seat heating driver/passenger" },
        { code: "S508A", name: "Park Distance Control (PDC)" },
        { code: "S609A", name: "Navigation system Professional" },
        { code: "S676A", name: "HiFi speaker system" },
      ],
    },
  };
}

export const realoem: BuildDataProvider = {
  id: "realoem",
  label: "RealOEM",
  brands: ["BMW", "MINI"],
  async fetchBuildData(vin) {
    const serial = vin.slice(-7);
    if (process.env.USE_FIXTURES === "1") {
      return demoBuildData(candidateUrls(serial)[0]);
    }
    try {
      return await cachedFetch(serial);
    } catch (err) {
      return { status: "error", reason: err instanceof Error ? err.message : String(err) };
    }
  },
};
