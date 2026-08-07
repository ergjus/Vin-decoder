export type CodeBrand = "bmw" | "vag" | "mercedes";

export interface BrandInfo {
  id: CodeBrand;
  label: string;
  codeName: string;
  /** Where the codes are physically found on the car. */
  stickerHint: string;
  /** External full-database lookup for codes we don't know. */
  lookupUrl: (code: string) => string;
}

export const BRANDS: BrandInfo[] = [
  {
    id: "bmw",
    label: "BMW / MINI",
    codeName: "SA option codes",
    stickerHint:
      "On the sticker in the trunk (spare-wheel well or under the floor panel), on the driver's door pillar, or on any RealOEM/build-sheet printout.",
    lookupUrl: (code) =>
      `https://www.google.com/search?q=${encodeURIComponent(`BMW SA option code ${code}`)}`,
  },
  {
    id: "vag",
    label: "Audi / VW / Porsche",
    codeName: "PR codes",
    stickerHint:
      "On the vehicle data label — in the trunk (usually under the floor carpet near the spare wheel) and duplicated in the service booklet.",
    lookupUrl: (code) =>
      `https://vag-codes.info/search?q=${encodeURIComponent(code)}`,
  },
  {
    id: "mercedes",
    label: "Mercedes-Benz",
    codeName: "option codes",
    stickerHint:
      "On the vehicle datacard — a dealer can print it, and many codes appear on the option sticker inside the service booklet.",
    lookupUrl: (code) =>
      `https://www.google.com/search?q=${encodeURIComponent(`Mercedes option code ${code}`)}`,
  },
];

export interface DecodedCode {
  /** The code as the user typed it. */
  input: string;
  /** Canonical dictionary form, when recognized. */
  code: string;
  name: string | null;
}

/** Split free text (pasted sticker contents) into candidate codes. */
export function parseCodeInput(text: string): string[] {
  const tokens = text
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter((t) => t.length >= 2 && t.length <= 6);
  return [...new Set(tokens)];
}

/**
 * Candidate canonical forms for a typed code, most specific first.
 * BMW lists wrap SA codes as S<code>A ("S205A" → "205"); leading zeros
 * appear on four-digit variants ("0403" → "403").
 */
export function candidateForms(input: string): string[] {
  const c = input.toUpperCase();
  const forms = [c];
  const wrapped = /^[SPL]([0-9A-Z]{3})A$/.exec(c);
  if (wrapped) forms.push(wrapped[1]);
  if (/^0[0-9A-Z]{3}$/.test(c)) forms.push(c.slice(1));
  return forms;
}

export function decodeCodes(
  input: string,
  dictionary: Record<string, string>
): DecodedCode[] {
  return parseCodeInput(input).map((token) => {
    for (const form of candidateForms(token)) {
      const name = dictionary[form];
      if (name) return { input: token, code: form, name };
    }
    return { input: token, code: token, name: null };
  });
}
