import { findBuildDataProvider } from "./build-data/registry";
import { getComplaints } from "./sources/complaints";
import { getFuelEconomy } from "./sources/fueleconomy";
import { getRecalls } from "./sources/recalls";
import { getSafetyRatings } from "./sources/safety-ratings";
import { buildSheetLinks, stickerAvailability } from "./stickers/registry";
import { probeSticker } from "./stickers/probe";
import type { DecodedVehicle } from "./types";

/** Renders a label/value list as Markdown bullets, skipping empty values. */
function bullets(pairs: Array<[string, string | null | undefined]>): string {
  return pairs
    .filter((p): p is [string, string] => Boolean(p[1]))
    .map(([label, value]) => `- **${label}:** ${value}`)
    .join("\n");
}

function heading(level: number, text: string): string {
  return `${"#".repeat(level)} ${text}`;
}

async function fuelEconomySection(vehicle: DecodedVehicle): Promise<string> {
  const result = await getFuelEconomy(vehicle);
  if (result.status === "error") return "Lookup failed — fueleconomy.gov didn't respond.";
  if (result.status === "empty") {
    return result.note ?? "No EPA record matched this model.";
  }
  const lines = result.data.variants.map((v) => {
    const unit = v.isElectric ? "MPGe" : "MPG";
    const stats = `${v.combinedMpg || "—"} combined / ${v.cityMpg || "—"} city / ${v.highwayMpg || "—"} highway ${unit}`;
    const range = v.range ? ` — EPA range ${v.range} mi` : "";
    return `- **${v.label}:** ${stats}${range}`;
  });
  if (result.data.approximate) {
    lines.push("- _Closest EPA match — the EPA doesn't index by VIN._");
  }
  return lines.join("\n");
}

async function safetySection(vehicle: DecodedVehicle): Promise<string> {
  const result = await getSafetyRatings(vehicle);
  if (result.status === "error") return "Lookup failed — NHTSA's ratings service didn't respond.";
  if (result.status === "empty") {
    return result.note ?? "NHTSA hasn't published crash-test ratings for this vehicle.";
  }
  const { data } = result;
  const lines = bullets([
    ["NCAP vehicle", data.vehicleDescription],
    ["Overall", data.overall],
    ["Frontal crash", data.frontCrash],
    ["Side crash", data.sideCrash],
    ["Side pole", data.sidePole],
    ["Rollover", data.rollover],
  ]);
  return data.approximate
    ? `${lines}\n- _Ratings are for the closest-matching NCAP configuration of this model._`
    : lines;
}

async function recallsSection(vehicle: DecodedVehicle): Promise<string> {
  const result = await getRecalls(vehicle);
  if (result.status === "error") return "Lookup failed — NHTSA's recall service didn't respond.";
  if (result.status === "empty") {
    return result.note ?? "No recalls on file for this year, make, and model.";
  }
  return result.data
    .map((r) => {
      const parts = [
        heading(3, r.component || "Recall"),
        `Campaign ${r.campaignNumber}${r.reportDate ? ` — reported ${r.reportDate}` : ""}`,
      ];
      if (r.summary) parts.push(r.summary);
      if (r.consequence) parts.push(`**Risk:** ${r.consequence}`);
      if (r.remedy) parts.push(`**Fix:** ${r.remedy}`);
      return parts.join("\n\n");
    })
    .join("\n\n");
}

async function complaintsSection(vehicle: DecodedVehicle): Promise<string> {
  const result = await getComplaints(vehicle);
  if (result.status === "error")
    return "Lookup failed — NHTSA's complaint service didn't respond.";
  if (result.status === "empty") {
    return result.note ?? "No complaints on file for this year, make, and model.";
  }
  const intro = `${result.data.total.toLocaleString()} complaints filed with NHTSA — most recent ${result.data.complaints.length} below.`;
  const items = result.data.complaints
    .map((c) => {
      const tags = [c.crash ? "crash" : null, c.fire ? "fire" : null].filter(Boolean);
      const meta = [c.components, c.dateFiled, tags.length ? tags.join(", ") : null]
        .filter(Boolean)
        .join(" · ");
      return `- **${meta}**\n  ${c.summary}`;
    })
    .join("\n");
  return `${intro}\n\n${items}`;
}

async function buildDataSection(
  vehicle: DecodedVehicle,
  stickerUrl: string
): Promise<string> {
  const availability = stickerAvailability(vehicle.make, vehicle.year);

  if (availability.kind === "unsupported" || availability.kind === "too_old") {
    if (availability.kind === "unsupported") {
      const provider = findBuildDataProvider(vehicle.make);
      if (provider) {
        const result = await provider.fetchBuildData(vehicle.vin);
        if (result.status === "ok") {
          const { data } = result;
          const summary = bullets([
            ["Production date", data.productionDate],
            ["Paint", data.paint],
            ["Upholstery / interior", data.upholstery],
            ["Factory model", data.model],
          ]);
          const options = data.options.length
            ? `\n\nFactory options (${data.options.length}):\n${data.options
                .map((o) => `- \`${o.code}\` ${o.name}`)
                .join("\n")}`
            : "";
          return `Source: ${data.source} (${data.sourceUrl})\n\n${summary}${options}`;
        }
      }
      const links = buildSheetLinks(vehicle.make);
      if (links.length) {
        return `No window sticker available for ${vehicle.makeDisplay}. Factory build-sheet lookups: ${links
          .map((l) => `${l.label} (${l.url})`)
          .join(", ")}.`;
      }
    }
    return `Window sticker not available. ${availability.message}`;
  }

  const probe = await probeSticker(vehicle.vin, vehicle.make, vehicle.year);
  if (probe === "found") return `Original window sticker (PDF): ${stickerUrl}`;
  if (probe === "not_found")
    return `No window sticker on file with ${availability.provider.label} for this VIN.`;
  return `${availability.provider.label}'s sticker service didn't respond — try again later.`;
}

/**
 * Renders a full VIN decode — specs plus every panel on the result page — as
 * clean Markdown, suitable for pasting into an LLM chat.
 */
export async function buildLlmMarkdown(
  vehicle: DecodedVehicle,
  opts: { pageUrl: string; stickerUrl: string }
): Promise<string> {
  const [fuelEconomy, safety, recalls, complaints, buildData] = await Promise.all([
    fuelEconomySection(vehicle),
    safetySection(vehicle),
    recallsSection(vehicle),
    complaintsSection(vehicle),
    buildDataSection(vehicle, opts.stickerUrl),
  ]);

  const overview = bullets([
    ["Body style", vehicle.bodyClass],
    ["Drive type", vehicle.driveType],
    ["Fuel", vehicle.fuelTypePrimary],
    ["Electrification", vehicle.electrificationLevel],
  ]);

  const specGroups = vehicle.groups
    .map((group) => `${heading(3, group.title)}\n${bullets(group.items.map((i) => [i.label, i.value]))}`)
    .join("\n\n");

  const warning = vehicle.vpicWarning ? `\n> **Note:** ${vehicle.vpicWarning}\n` : "";

  return [
    heading(1, vehicle.title || `VIN ${vehicle.vin}`),
    `VIN: \`${vehicle.vin}\`  \nSource: ${opts.pageUrl}`,
    warning,
    overview ? `${heading(2, "Overview")}\n${overview}` : "",
    specGroups ? `${heading(2, "Full specifications")}\n\n${specGroups}` : "",
    `${heading(2, "EPA fuel economy")}\n${fuelEconomy}`,
    `${heading(2, "Crash-test ratings")}\n${safety}`,
    `${heading(2, "Safety recalls")}\n${recalls}`,
    `${heading(2, "Owner complaints")}\n${complaints}`,
    `${heading(2, "Window sticker / factory build")}\n${buildData}`,
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim() + "\n";
}
