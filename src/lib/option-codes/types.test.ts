import { describe, expect, it } from "vitest";
import { candidateForms, decodeCodes, parseCodeInput } from "./types";

describe("parseCodeInput", () => {
  it("splits pasted sticker text into unique code tokens", () => {
    expect(parseCodeInput("205, 403 / S494A\n205 zpp")).toEqual([
      "205",
      "403",
      "S494A",
      "ZPP",
    ]);
  });

  it("drops tokens that can't be codes", () => {
    expect(parseCodeInput("a 1234567 -")).toEqual([]);
  });
});

describe("candidateForms", () => {
  it("unwraps BMW S…A list forms", () => {
    expect(candidateForms("S205A")).toContain("205");
    expect(candidateForms("S2VBA")).toContain("2VB");
  });

  it("strips leading zeros from four-character numeric forms", () => {
    expect(candidateForms("0403")).toContain("403");
  });

  it("keeps plain codes as-is", () => {
    expect(candidateForms("ZPP")).toEqual(["ZPP"]);
  });
});

describe("decodeCodes", () => {
  const dict = { "205": "Automatic transmission", ZPP: "Premium package" };

  it("resolves canonical, wrapped, and unknown codes", () => {
    const result = decodeCodes("S205A zpp 999", dict);
    expect(result).toEqual([
      { input: "S205A", code: "205", name: "Automatic transmission" },
      { input: "ZPP", code: "ZPP", name: "Premium package" },
      { input: "999", code: "999", name: null },
    ]);
  });
});
