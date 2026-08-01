import type { DecodedVehicle, SpecGroup, SpecItem } from "./types";
import { decodeVinRaw } from "./sources/vpic";

const MAKE_ACRONYMS = new Set(["BMW", "GMC", "MINI", "SRT", "AMC"]);

function titleCaseWord(word: string): string {
  if (MAKE_ACRONYMS.has(word)) return word;
  return word.charAt(0) + word.slice(1).toLowerCase();
}

/** "MERCEDES-BENZ" → "Mercedes-Benz", "LAND ROVER" → "Land Rover", "BMW" → "BMW" */
export function displayMake(make: string): string {
  return make
    .trim()
    .split(" ")
    .map((word) => word.split("-").map(titleCaseWord).join("-"))
    .join(" ");
}

interface FieldSpec {
  key: string;
  label: string;
  unit?: string;
}

const GROUP_SPECS: Array<{ title: string; fields: FieldSpec[] }> = [
  {
    title: "Overview",
    fields: [
      { key: "BodyClass", label: "Body style" },
      { key: "VehicleType", label: "Vehicle type" },
      { key: "Doors", label: "Doors" },
      { key: "DriveType", label: "Drive type" },
      { key: "Series", label: "Series" },
      { key: "Trim", label: "Trim" },
      { key: "GVWR", label: "Gross weight rating" },
    ],
  },
  {
    title: "Engine",
    fields: [
      { key: "EngineConfiguration", label: "Configuration" },
      { key: "EngineCylinders", label: "Cylinders" },
      { key: "DisplacementL", label: "Displacement", unit: " L" },
      { key: "EngineHP", label: "Horsepower", unit: " hp" },
      { key: "FuelTypePrimary", label: "Fuel" },
      { key: "FuelTypeSecondary", label: "Secondary fuel" },
      { key: "FuelInjectionType", label: "Fuel injection" },
      { key: "Turbo", label: "Turbocharged" },
      { key: "OtherEngineInfo", label: "Engine notes" },
      { key: "ElectrificationLevel", label: "Electrification" },
      { key: "BatteryKWh", label: "Battery capacity", unit: " kWh" },
      { key: "EVDriveUnit", label: "EV drive unit" },
      { key: "ChargerLevel", label: "Charger level" },
    ],
  },
  {
    title: "Transmission",
    fields: [
      { key: "TransmissionStyle", label: "Type" },
      { key: "TransmissionSpeeds", label: "Speeds" },
    ],
  },
  {
    title: "Manufacturing",
    fields: [
      { key: "Manufacturer", label: "Manufacturer" },
      { key: "PlantCompanyName", label: "Assembly plant" },
      { key: "PlantCity", label: "Plant city" },
      { key: "PlantState", label: "Plant state" },
      { key: "PlantCountry", label: "Plant country" },
    ],
  },
  {
    title: "Safety & driver assistance",
    fields: [
      { key: "ABS", label: "Anti-lock brakes" },
      { key: "ESC", label: "Stability control" },
      { key: "TractionControl", label: "Traction control" },
      { key: "TPMS", label: "Tire pressure monitoring" },
      { key: "AirBagLocFront", label: "Front airbags" },
      { key: "AirBagLocSide", label: "Side airbags" },
      { key: "AirBagLocCurtain", label: "Curtain airbags" },
      { key: "AirBagLocKnee", label: "Knee airbags" },
      { key: "SeatBeltsAll", label: "Seat belts" },
      { key: "AdaptiveCruiseControl", label: "Adaptive cruise control" },
      { key: "ForwardCollisionWarning", label: "Forward collision warning" },
      { key: "CIB", label: "Automatic emergency braking" },
      { key: "BlindSpotMon", label: "Blind spot monitor" },
      { key: "LaneDepartureWarning", label: "Lane departure warning" },
      { key: "LaneKeepSystem", label: "Lane keep assist" },
      { key: "RearVisibilitySystem", label: "Backup camera" },
      { key: "ParkAssist", label: "Park assist" },
      { key: "DaytimeRunningLight", label: "Daytime running lights" },
      { key: "KeylessIgnition", label: "Keyless ignition" },
    ],
  },
];

function buildGroups(raw: Record<string, string>): SpecGroup[] {
  const groups: SpecGroup[] = [];
  for (const spec of GROUP_SPECS) {
    const items: SpecItem[] = [];
    for (const field of spec.fields) {
      const value = raw[field.key];
      if (!value) continue;
      items.push({ label: field.label, value: field.unit ? value + field.unit : value });
    }
    if (items.length) groups.push({ title: spec.title, items });
  }
  return groups;
}

export async function decodeVin(vin: string): Promise<DecodedVehicle> {
  const raw = await decodeVinRaw(vin);

  const make = (raw.Make ?? "").trim();
  const makeDisplay = make ? displayMake(make) : "Unknown make";
  const model = (raw.Model ?? "").trim();
  const year = raw.ModelYear ? Number(raw.ModelYear) : null;
  const trim = raw.Trim ?? null;

  const errorCode = raw.ErrorCode ?? "";
  const vpicWarning =
    errorCode && errorCode !== "0"
      ? (raw.ErrorText ?? `vPIC reported error code ${errorCode}`)
      : null;

  return {
    vin,
    title: [year, makeDisplay, model || null, trim].filter(Boolean).join(" "),
    year: Number.isFinite(year) ? year : null,
    make,
    makeDisplay,
    model,
    trim,
    series: raw.Series ?? null,
    bodyClass: raw.BodyClass ?? null,
    driveType: raw.DriveType ?? null,
    doors: raw.Doors ?? null,
    fuelTypePrimary: raw.FuelTypePrimary ?? null,
    engineCylinders: raw.EngineCylinders ?? null,
    displacementL: raw.DisplacementL ?? null,
    electrificationLevel: raw.ElectrificationLevel ?? null,
    groups: buildGroups(raw),
    vpicWarning,
    raw,
  };
}
