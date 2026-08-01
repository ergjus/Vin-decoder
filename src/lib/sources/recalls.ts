import type { DecodedVehicle, SourceResult } from "../types";
import { DAY, fetchJson } from "./http";
import { pickBestMatch } from "./match";

export interface Recall {
  campaignNumber: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  reportDate: string;
}

interface RecallsResponse {
  Count?: number;
  count?: number;
  results?: Array<Record<string, unknown>>;
  Results?: Array<Record<string, unknown>>;
}

interface ModelsResponse {
  results?: Array<{ model?: string; Model?: string }>;
  Results?: Array<{ model?: string; Model?: string }>;
}

const BASE = "https://api.nhtsa.gov";

function recallsUrl(make: string, model: string, year: number): string {
  return `${BASE}/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
}

function toRecalls(rows: Array<Record<string, unknown>>): Recall[] {
  return rows.map((r) => ({
    campaignNumber: String(r.NHTSACampaignNumber ?? ""),
    component: String(r.Component ?? ""),
    summary: String(r.Summary ?? ""),
    consequence: String(r.Consequence ?? ""),
    remedy: String(r.Remedy ?? ""),
    reportDate: String(r.ReportReceivedDate ?? ""),
  }));
}

/**
 * NHTSA models list for a year/make — used to reconcile model naming when the
 * verbatim vPIC model returns nothing. issueType: "r" recalls, "c" complaints.
 */
async function candidateModels(
  make: string,
  year: number,
  issueType: "r" | "c"
): Promise<string[]> {
  const json = await fetchJson<ModelsResponse>(
    `${BASE}/products/vehicle/models?modelYear=${year}&make=${encodeURIComponent(make)}&issueType=${issueType}`,
    { revalidate: DAY }
  );
  return (json.results ?? json.Results ?? [])
    .map((r) => r.model ?? r.Model ?? "")
    .filter(Boolean);
}

export async function getRecalls(
  vehicle: Pick<DecodedVehicle, "year" | "make" | "model">
): Promise<SourceResult<Recall[]>> {
  const { year, make, model } = vehicle;
  if (!year || !make || !model) {
    return { status: "empty", note: "Not enough decode data to look up recalls." };
  }

  try {
    const direct = await fetchJson<RecallsResponse>(recallsUrl(make, model, year), {
      revalidate: DAY,
    });
    let rows = direct.results ?? direct.Results ?? [];

    if (!rows.length) {
      const models = await candidateModels(make, year, "r");
      const match = pickBestMatch(model, models);
      if (match && match.value.toUpperCase() !== model.toUpperCase()) {
        const retried = await fetchJson<RecallsResponse>(
          recallsUrl(make, match.value, year),
          { revalidate: DAY }
        );
        rows = retried.results ?? retried.Results ?? [];
      }
    }

    if (!rows.length) return { status: "empty" };
    return { status: "ok", data: toRecalls(rows) };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
