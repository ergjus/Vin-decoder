import type { BuildData, BuildDataProvider, BuildDataResult } from "../types";
import { extractCells, valueAfterLabel } from "../parse";

// RealOEM front-ends BMW's ETK parts catalog: production date, paint,
// upholstery, and the full factory option (SA code) list, keyed by the last
// 7 characters of the VIN. No login, and the page layout has been stable
// for many years — which is why every "free BMW decoder" site uses this data.

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

const LABELS = {
  model: /^model$/i,
  series: /^series$/i,
  prodDate: /^prod\.?\s*date$/i,
  paint: /^(paint|colou?r)$/i,
  upholstery: /^(upholstery|interior)$/i,
};

// SA option codes look like "205", "0403", "S205A", "P7LGA".
const OPTION_CODE = /^[A-Z]?\d{3,4}[A-Z]{0,3}$/;

export function parseRealOemHtml(html: string, sourceUrl: string): BuildDataResult {
  if (/no vehicles? (was |were )?found|could not be (found|identified)|invalid/i.test(html)) {
    return { status: "not_found", reason: "VIN not in the RealOEM catalog" };
  }

  const cells = extractCells(html);
  const model = valueAfterLabel(cells, LABELS.model);
  const series = valueAfterLabel(cells, LABELS.series);
  const productionDate = valueAfterLabel(cells, LABELS.prodDate);
  const paint = valueAfterLabel(cells, LABELS.paint);
  const upholstery = valueAfterLabel(cells, LABELS.upholstery);

  // Option rows: a code-shaped cell immediately followed by a descriptive
  // text cell. Label cells and dates never match the code shape.
  const options: BuildData["options"] = [];
  const seen = new Set<string>();
  for (let i = 0; i < cells.length - 1; i++) {
    const code = cells[i];
    const name = cells[i + 1];
    if (!OPTION_CODE.test(code)) continue;
    if (!name || name.length < 3 || !/[a-z]/i.test(name)) continue;
    if (OPTION_CODE.test(name)) continue;
    if (seen.has(code)) continue;
    seen.add(code);
    options.push({ code, name });
  }

  const foundSummary = Boolean(productionDate || paint || upholstery);
  if (!foundSummary && options.length < 3) {
    return {
      status: "error",
      reason: `RealOEM page layout not recognized (${cells.length} cells, ${options.length} option-like rows)`,
    };
  }

  return {
    status: "ok",
    data: {
      source: "RealOEM (BMW parts catalog)",
      sourceUrl,
      model: model && series ? `${model} (${series})` : (model ?? series),
      productionDate,
      paint,
      upholstery,
      options,
    },
  };
}

function demoBuildData(sourceUrl: string): BuildDataResult {
  return {
    status: "ok",
    data: {
      source: "RealOEM (BMW parts catalog)",
      sourceUrl,
      model: "335i (E92)",
      productionDate: "2011-03",
      paint: "Alpinweiss 3 (300)",
      upholstery: "Schwarz (LKSW)",
      options: [
        { code: "S205A", name: "Automatic transmission" },
        { code: "S403A", name: "Glass roof, electrical" },
        { code: "S431A", name: "Interior mirror with automatic-dip" },
        { code: "S459A", name: "Seat adjustment, electric, with memory" },
        { code: "S494A", name: "Seat heating driver/passenger" },
        { code: "S508A", name: "Park Distance Control (PDC)" },
        { code: "S609A", name: "Navigation system Professional" },
        { code: "S676A", name: "HiFi speaker system" },
      ],
    },
  };
}

export const realoem: BuildDataProvider = {
  id: "realoem",
  label: "RealOEM",
  brands: ["BMW", "MINI"],
  async fetchBuildData(vin) {
    const serial = vin.slice(-7);
    const url = `https://www.realoem.com/bmw/enUS/select?vin=${encodeURIComponent(serial)}`;

    if (process.env.USE_FIXTURES === "1") return demoBuildData(url);

    try {
      const res = await fetch(url, {
        headers: { "user-agent": BROWSER_UA, accept: "text/html,*/*" },
        signal: AbortSignal.timeout(8_000),
        // A vehicle's build sheet is immutable — cache the page for 30 days.
        next: { revalidate: 2_592_000 },
      });
      if (!res.ok) return { status: "error", reason: `HTTP ${res.status}` };
      return parseRealOemHtml(await res.text(), url);
    } catch (err) {
      return { status: "error", reason: err instanceof Error ? err.message : String(err) };
    }
  },
};
