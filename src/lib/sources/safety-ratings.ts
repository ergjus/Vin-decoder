import type { DecodedVehicle, SourceResult } from "../types";
import { fetchJson, MONTH } from "./http";
import { pickBestMatch, scoreVariant } from "./match";

export interface SafetyRatings {
  vehicleDescription: string;
  overall: string;
  frontCrash: string;
  sideCrash: string;
  rollover: string;
  sidePole: string;
  picture: string | null;
  /** True when several NCAP variants matched and we picked the closest. */
  approximate: boolean;
}

interface NcapListResponse {
  Results?: Array<{ Model?: string }>;
}

interface NcapVariantsResponse {
  Results?: Array<{ VehicleDescription?: string; VehicleId?: number }>;
}

interface NcapRatingResponse {
  Results?: Array<Record<string, unknown>>;
}

const BASE = "https://api.nhtsa.gov/SafetyRatings";

export async function getSafetyRatings(
  vehicle: Pick<
    DecodedVehicle,
    "year" | "make" | "model" | "bodyClass" | "driveType" | "doors" | "trim"
  >
): Promise<SourceResult<SafetyRatings>> {
  const { year, make, model } = vehicle;
  if (!year || !make || !model) {
    return { status: "empty", note: "Not enough decode data to look up ratings." };
  }

  try {
    // NCAP's model naming can differ from vPIC's — reconcile against its list.
    const modelList = await fetchJson<NcapListResponse>(
      `${BASE}/modelyear/${year}/make/${encodeURIComponent(make)}`,
      { revalidate: MONTH }
    );
    const models = (modelList.Results ?? []).map((r) => r.Model ?? "").filter(Boolean);
    const modelMatch = pickBestMatch(model, models);
    if (!modelMatch) return { status: "empty" };

    const variants = await fetchJson<NcapVariantsResponse>(
      `${BASE}/modelyear/${year}/make/${encodeURIComponent(make)}/model/${encodeURIComponent(modelMatch.value)}`,
      { revalidate: MONTH }
    );
    const candidates = (variants.Results ?? []).filter((r) => r.VehicleId);
    if (!candidates.length) return { status: "empty" };

    // Several NCAP entries per model (cab styles, 2WD/4WD) — score against
    // what the decode tells us about this specific VIN.
    const hints = [
      vehicle.bodyClass ?? "",
      vehicle.driveType ?? "",
      vehicle.doors ? `${vehicle.doors} DR` : "",
      vehicle.trim ?? "",
    ].filter(Boolean);
    const best = candidates
      .map((c) => ({ ...c, score: scoreVariant(c.VehicleDescription ?? "", hints) }))
      .sort((a, b) => b.score - a.score)[0];

    const rating = await fetchJson<NcapRatingResponse>(
      `${BASE}/VehicleId/${best.VehicleId}`,
      { revalidate: MONTH }
    );
    const r = rating.Results?.[0];
    if (!r) return { status: "empty" };

    const str = (key: string) => {
      const v = r[key];
      return v == null || v === "" ? "Not Rated" : String(v);
    };

    return {
      status: "ok",
      data: {
        vehicleDescription: str("VehicleDescription"),
        overall: str("OverallRating"),
        frontCrash: str("OverallFrontCrashRating"),
        sideCrash: str("OverallSideCrashRating"),
        rollover: str("RolloverRating"),
        sidePole: str("SidePoleCrashRating"),
        picture: typeof r.VehiclePicture === "string" && r.VehiclePicture ? r.VehiclePicture : null,
        approximate: candidates.length > 1,
      },
    };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
