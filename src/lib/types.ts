export type SourceResult<T> =
  | { status: "ok"; data: T }
  | { status: "empty"; note?: string }
  | { status: "error"; reason: string };

export interface SpecItem {
  label: string;
  value: string;
}

export interface SpecGroup {
  title: string;
  items: SpecItem[];
}

/** Curated, typed view of a vPIC decode. `raw` keeps every non-empty field. */
export interface DecodedVehicle {
  vin: string;
  /** e.g. "2013 Ford F-150 XLT" */
  title: string;
  year: number | null;
  /** Raw vPIC make, uppercase — used for downstream API params. e.g. "FORD" */
  make: string;
  /** Display form, e.g. "Ford", "BMW", "Mercedes-Benz" */
  makeDisplay: string;
  model: string;
  trim: string | null;
  series: string | null;
  bodyClass: string | null;
  driveType: string | null;
  doors: string | null;
  fuelTypePrimary: string | null;
  engineCylinders: string | null;
  displacementL: string | null;
  electrificationLevel: string | null;
  /** Grouped label/value pairs ready for display. */
  groups: SpecGroup[];
  /** vPIC ErrorText when ErrorCode != 0 — shown as a warning banner. */
  vpicWarning: string | null;
  raw: Record<string, string>;
}
