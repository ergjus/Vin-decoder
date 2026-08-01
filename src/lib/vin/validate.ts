// ISO 3779 / 49 CFR 565 VIN validation.
// Check digit is mandatory for North-American-market vehicles; some gray-market
// imports fail it, so callers treat `check_digit` as a warning, not a hard stop.

const TRANSLITERATION: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export type VinValidation =
  | { ok: true; vin: string; warning?: string }
  | { ok: false; code: "length" | "charset" | "check_digit"; message: string };

/** Uppercase and strip whitespace/hyphens (door-jamb stickers often include them). */
export function normalizeVin(input: string): string {
  return input.trim().toUpperCase().replace(/[\s-]/g, "");
}

export function isValidCheckDigit(vin: string): boolean {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const c = vin[i];
    const value = c >= "0" && c <= "9" ? Number(c) : TRANSLITERATION[c];
    if (value === undefined) return false;
    sum += value * WEIGHTS[i];
  }
  const remainder = sum % 11;
  const expected = remainder === 10 ? "X" : String(remainder);
  return vin[8] === expected;
}

export function validateVin(input: string): VinValidation {
  const vin = normalizeVin(input);

  if (vin.length !== 17) {
    return {
      ok: false,
      code: "length",
      message:
        vin.length > 0 && vin.length < 11
          ? "VINs are 17 characters. Vehicles made before 1981 used shorter VINs, which aren't supported."
          : `A VIN is exactly 17 characters — got ${vin.length}.`,
    };
  }

  if (/[IOQ]/.test(vin)) {
    return {
      ok: false,
      code: "charset",
      message:
        "VINs never contain the letters I, O, or Q — check for a mixed-up 1, 0, or 9.",
    };
  }

  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return {
      ok: false,
      code: "charset",
      message: "VINs only contain letters (except I, O, Q) and digits.",
    };
  }

  if (!isValidCheckDigit(vin)) {
    return {
      ok: true,
      vin,
      warning:
        "The check digit doesn't validate — this VIN may have a typo, or the vehicle wasn't built for the North American market. Decoding anyway.",
    };
  }

  return { ok: true, vin };
}
