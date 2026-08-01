import { describe, expect, it } from "vitest";
import { normalizeModel, pickBestMatch, scoreVariant } from "./match";

describe("normalizeModel", () => {
  it("strips punctuation and noise tokens", () => {
    expect(normalizeModel("F-150")).toBe("F150");
    expect(normalizeModel("F150 Pickup 2WD")).toBe("F150");
    expect(normalizeModel("MX-5")).toBe("MX5");
    expect(normalizeModel("Civic 4Dr")).toBe("CIVIC");
  });

  it("keeps all tokens when everything is noise", () => {
    expect(normalizeModel("Pickup")).toBe("PICKUP");
  });
});

describe("pickBestMatch", () => {
  it("matches vPIC F-150 to EPA's F150 Pickup naming", () => {
    const match = pickBestMatch("F-150", ["F150 Pickup 2WD", "F150 Pickup 4WD", "Escape"]);
    expect(match).not.toBeNull();
    expect(match!.value).toContain("F150");
  });

  it("matches exact model names with exact confidence", () => {
    const match = pickBestMatch("Civic", ["Accord", "Civic", "CR-V"]);
    expect(match).toEqual({ value: "Civic", confidence: "exact" });
  });

  it("matches 3 Series style names", () => {
    const match = pickBestMatch("335i", ["328i", "335i", "M3"]);
    expect(match).toEqual({ value: "335i", confidence: "exact" });
  });

  it("returns null when nothing is close", () => {
    expect(pickBestMatch("F-150", ["Camry", "Corolla"])).toBeNull();
  });
});

describe("scoreVariant", () => {
  it("prefers the variant matching drivetrain hints", () => {
    const hints = ["4WD/4-Wheel Drive/4x4", "Pickup"];
    const fourWd = scoreVariant("2013 Ford F-150 SuperCrew 4WD", hints);
    const twoWd = scoreVariant("2013 Ford F-150 SuperCrew 2WD", hints);
    expect(fourWd).toBeGreaterThan(twoWd);
  });
});
