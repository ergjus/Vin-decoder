import type { DecodedVehicle, SourceResult } from "../types";
import { asArray, fetchJson, MONTH } from "./http";
import { normalizeModel, pickBestMatch, scoreVariant } from "./match";

export interface FuelEconomyVariant {
  label: string;
  cityMpg: number;
  highwayMpg: number;
  combinedMpg: number;
  fuelType: string;
  /** Electric range in miles, when the EPA reports one. */
  range: number | null;
  isElectric: boolean;
}

export interface FuelEconomyData {
  epaModelName: string;
  variants: FuelEconomyVariant[];
  /** True when we couldn't narrow to a single engine/drivetrain option. */
  approximate: boolean;
}

interface MenuItem {
  text?: string;
  value?: string;
}

interface MenuResponse {
  menuItem?: MenuItem | MenuItem[];
}

const BASE = "https://www.fueleconomy.gov/ws/rest";
const MAX_VARIANTS = 3;

async function menu(path: string): Promise<MenuItem[]> {
  const json = await fetchJson<MenuResponse>(`${BASE}${path}`, { revalidate: MONTH });
  return asArray(json.menuItem);
}

function toVariant(v: Record<string, unknown>, label: string): FuelEconomyVariant {
  const fuelType = String(v.fuelType1 ?? v.fuelType ?? "");
  const isElectric = /electricity/i.test(fuelType) || v.atvType === "EV";
  const range = Number(v.range ?? 0);
  return {
    label,
    cityMpg: Number(v.city08 ?? 0),
    highwayMpg: Number(v.highway08 ?? 0),
    combinedMpg: Number(v.comb08 ?? 0),
    fuelType,
    range: range > 0 ? range : null,
    isElectric,
  };
}

export async function getFuelEconomy(
  vehicle: Pick<
    DecodedVehicle,
    "year" | "make" | "model" | "displacementL" | "engineCylinders" | "driveType"
  >
): Promise<SourceResult<FuelEconomyData>> {
  const { year, make, model } = vehicle;
  if (!year || !make || !model) {
    return { status: "empty", note: "Not enough decode data to look up fuel economy." };
  }

  try {
    const makes = await menu(`/vehicle/menu/make?year=${year}`);
    const makeMatch = pickBestMatch(
      make,
      makes.map((m) => m.value ?? "").filter(Boolean)
    );
    if (!makeMatch) return { status: "empty" };
    const epaMake = makeMatch.value;

    const models = await menu(
      `/vehicle/menu/model?year=${year}&make=${encodeURIComponent(epaMake)}`
    );
    const modelCandidates = models.map((m) => m.value ?? "").filter(Boolean);
    const modelMatch = pickBestMatch(model, modelCandidates);
    if (!modelMatch) return { status: "empty" };

    // EPA splits one model into drivetrain entries ("F150 Pickup 2WD"/"4WD")
    // that normalize identically — break the tie with the VIN's drive type.
    let epaModel = modelMatch.value;
    let modelAmbiguous = false;
    const siblings = modelCandidates.filter(
      (c) => normalizeModel(c) === normalizeModel(epaModel)
    );
    if (siblings.length > 1) {
      const driveHint = vehicle.driveType ?? "";
      const ranked = siblings
        .map((s) => ({ s, score: driveHint ? scoreVariant(s, [driveHint]) : 0 }))
        .sort((a, b) => b.score - a.score);
      if (ranked[0].score > 0) epaModel = ranked[0].s;
      else modelAmbiguous = true;
    }

    const options = await menu(
      `/vehicle/menu/options?year=${year}&make=${encodeURIComponent(epaMake)}&model=${encodeURIComponent(epaModel)}`
    );
    if (!options.length) return { status: "empty" };

    // Narrow engine/drivetrain options using what the VIN decode tells us.
    const hints = [
      vehicle.displacementL ? `${vehicle.displacementL} L` : "",
      vehicle.engineCylinders ? `${vehicle.engineCylinders} cyl` : "",
      vehicle.driveType ?? "",
    ].filter(Boolean);
    const scored = options
      .map((o) => ({ ...o, score: scoreVariant(o.text ?? "", hints) }))
      .sort((a, b) => b.score - a.score);
    const topScore = scored[0].score;
    const top = scored.filter((o) => o.score === topScore).slice(0, MAX_VARIANTS);

    const variants: FuelEconomyVariant[] = [];
    for (const option of top) {
      if (!option.value) continue;
      const record = await fetchJson<Record<string, unknown>>(
        `${BASE}/vehicle/${option.value}`,
        { revalidate: MONTH }
      );
      variants.push(toVariant(record, option.text ?? modelMatch.value));
    }
    if (!variants.length) return { status: "empty" };

    return {
      status: "ok",
      data: {
        epaModelName: epaModel,
        variants,
        approximate:
          top.length > 1 || modelMatch.confidence !== "exact" || modelAmbiguous,
      },
    };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
