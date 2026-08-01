import { unstable_cache } from "next/cache";

import { WEEK } from "../sources/http";
import { stickerAvailability } from "./registry";

export type StickerProbeStatus = "found" | "not_found";

// Only definitive outcomes cache (a week — sticker existence is stable).
// Transient endpoint failures throw instead, so an OEM outage never sticks.
const cachedProbe = unstable_cache(
  async (vin: string, make: string, year: number | null): Promise<StickerProbeStatus> => {
    const availability = stickerAvailability(make, year);
    if (availability.kind !== "provider") return "not_found";
    const result = await availability.provider.fetchSticker(vin);
    if (result.status === "error") throw new Error(result.reason);
    return result.status;
  },
  ["sticker-probe"],
  { revalidate: WEEK }
);

export async function probeSticker(
  vin: string,
  make: string,
  year: number | null
): Promise<StickerProbeStatus | "error"> {
  try {
    return await cachedProbe(vin, make, year);
  } catch {
    return "error";
  }
}
