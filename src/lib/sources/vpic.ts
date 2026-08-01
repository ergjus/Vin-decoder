import { fetchJson, MONTH } from "./http";

interface VpicResponse {
  Results?: Array<Record<string, string | number | null>>;
}

/**
 * Decode a VIN via NHTSA vPIC, returning only meaningful fields.
 * A decode is immutable, so it caches for 30 days.
 */
export async function decodeVinRaw(vin: string): Promise<Record<string, string>> {
  const json = await fetchJson<VpicResponse>(
    `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(vin)}?format=json`,
    { revalidate: MONTH, timeoutMs: 8_000 }
  );

  const row = json.Results?.[0] ?? {};
  const cleaned: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (value == null) continue;
    const text = String(value).trim();
    if (!text || text === "Not Applicable") continue;
    cleaned[key] = text;
  }
  return cleaned;
}
