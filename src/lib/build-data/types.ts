export interface FactoryOption {
  code: string;
  name: string;
}

export interface BuildData {
  /** Human label for attribution, e.g. "RealOEM (BMW parts catalog)" */
  source: string;
  /** Page a user can open to see the same data. */
  sourceUrl: string;
  model: string | null;
  productionDate: string | null;
  paint: string | null;
  upholstery: string | null;
  options: FactoryOption[];
}

export type BuildDataResult =
  | { status: "ok"; data: BuildData }
  /** Fetched fine but this VIN isn't in the catalog. */
  | { status: "not_found"; reason: string }
  /** Endpoint down/blocked or the page layout changed. */
  | { status: "error"; reason: string };

export interface BuildDataProvider {
  id: string;
  label: string;
  /** vPIC Make values, uppercase. */
  brands: string[];
  fetchBuildData(vin: string): Promise<BuildDataResult>;
}
