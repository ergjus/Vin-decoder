import type { DecodedVehicle, SourceResult } from "../types";
import { DAY, fetchJson } from "./http";

export interface Complaint {
  odiNumber: string;
  components: string;
  summary: string;
  dateFiled: string;
  crash: boolean;
  fire: boolean;
}

export interface ComplaintsData {
  total: number;
  complaints: Complaint[];
}

interface ComplaintsResponse {
  count?: number;
  Count?: number;
  results?: Array<Record<string, unknown>>;
  Results?: Array<Record<string, unknown>>;
}

/** Complaints shown are capped — the count is the headline number. */
const MAX_SHOWN = 5;

export async function getComplaints(
  vehicle: Pick<DecodedVehicle, "year" | "make" | "model">
): Promise<SourceResult<ComplaintsData>> {
  const { year, make, model } = vehicle;
  if (!year || !make || !model) {
    return { status: "empty", note: "Not enough decode data to look up complaints." };
  }

  try {
    const json = await fetchJson<ComplaintsResponse>(
      `https://api.nhtsa.gov/complaints/complaintsByVehicle?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`,
      { revalidate: DAY }
    );
    const rows = json.results ?? json.Results ?? [];
    if (!rows.length) return { status: "empty" };

    const complaints = rows.slice(0, MAX_SHOWN).map((r) => ({
      odiNumber: String(r.odiNumber ?? r.ODINumber ?? ""),
      components: String(r.components ?? r.Components ?? ""),
      summary: String(r.summary ?? r.Summary ?? ""),
      dateFiled: String(r.dateComplaintFiled ?? r.DateComplaintFiled ?? ""),
      crash: r.crash === true || r.crash === "Yes",
      fire: r.fire === true || r.fire === "Yes",
    }));

    return {
      status: "ok",
      data: { total: json.count ?? json.Count ?? rows.length, complaints },
    };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}
