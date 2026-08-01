import { describe, expect, it } from "vitest";
import { isValidCheckDigit, normalizeVin, validateVin } from "./validate";

describe("normalizeVin", () => {
  it("uppercases and strips whitespace and hyphens", () => {
    expect(normalizeVin(" 1ftfw1et9dfc10312 ")).toBe("1FTFW1ET9DFC10312");
    expect(normalizeVin("1FTFW1ET9-DFC10312")).toBe("1FTFW1ET9DFC10312");
    expect(normalizeVin("1FTFW1ET9 DFC10312")).toBe("1FTFW1ET9DFC10312");
  });
});

describe("isValidCheckDigit", () => {
  it("accepts known-valid VINs", () => {
    // Published check-digit example: position 9 is X
    expect(isValidCheckDigit("1M8GDM9AXKP042788")).toBe(true);
    // 2013 Ford F-150 pattern (weighted sum 295 % 11 = 9)
    expect(isValidCheckDigit("1FTFW1ET9DFC10312")).toBe(true);
    // BMW 3-series pattern (weighted sum 404 % 11 = 8)
    expect(isValidCheckDigit("WBAPM5C58BE577580")).toBe(true);
  });

  it("rejects a VIN with a corrupted check digit", () => {
    expect(isValidCheckDigit("1M8GDM9A1KP042788")).toBe(false);
    expect(isValidCheckDigit("1FTFW1ET6DFC10312")).toBe(false);
  });
});

describe("validateVin", () => {
  it("accepts a valid VIN, normalized", () => {
    const result = validateVin(" 1ftfw1et9dfc10312");
    expect(result).toEqual({ ok: true, vin: "1FTFW1ET9DFC10312" });
  });

  it("rejects wrong lengths with a length code", () => {
    const result = validateVin("1FTFW1ET5");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("length");
  });

  it("mentions pre-1981 VINs for short inputs", () => {
    const result = validateVin("A123456");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toContain("1981");
  });

  it("rejects I, O, Q with a charset code", () => {
    const result = validateVin("1FTFW1ETODFC10312");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("charset");
  });

  it("treats a failed check digit as a warning, not a failure", () => {
    const result = validateVin("1FTFW1ET6DFC10312");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.warning).toBeTruthy();
  });
});
