import { describe, expect, it } from "vitest";
import { parseRealOemHtml } from "./realoem";

// Synthetic page mirroring RealOEM's vehicle-details + options structure.
const SAMPLE = `
<html><body>
<table>
  <tr><td>Model</td><td>335i</td></tr>
  <tr><td>Series</td><td>E92</td></tr>
  <tr><td>Type</td><td>KG91</td></tr>
  <tr><td>Prod.Date</td><td>2011-03</td></tr>
  <tr><td>Paint</td><td>Alpinweiss 3 (300)</td></tr>
  <tr><td>Upholstery</td><td>Schwarz (LKSW)</td></tr>
</table>
<table>
  <tr><th>Code</th><th>Description</th><th>Date</th></tr>
  <tr><td><a href="/x">S205A</a></td><td>Automatic transmission</td><td>2011-03</td></tr>
  <tr><td>S403A</td><td>Glass roof, electrical</td><td>2011-03</td></tr>
  <tr><td>S609A</td><td>Navigation system  Professional &amp; more</td><td>2011-03</td></tr>
</table>
</body></html>`;

describe("parseRealOemHtml", () => {
  it("extracts summary fields and options", () => {
    const result = parseRealOemHtml(SAMPLE, "https://example.test");
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.data.model).toBe("335i (E92)");
    expect(result.data.productionDate).toBe("2011-03");
    expect(result.data.paint).toBe("Alpinweiss 3 (300)");
    expect(result.data.upholstery).toBe("Schwarz (LKSW)");
    expect(result.data.options).toEqual([
      { code: "S205A", name: "Automatic transmission" },
      { code: "S403A", name: "Glass roof, electrical" },
      { code: "S609A", name: "Navigation system Professional & more" },
    ]);
  });

  it("reports not_found for the catalog's miss page", () => {
    const result = parseRealOemHtml(
      "<html><body>No vehicles found for this serial</body></html>",
      "https://example.test"
    );
    expect(result.status).toBe("not_found");
  });

  it("reports error on unrecognized layouts", () => {
    const result = parseRealOemHtml("<html><body><p>redesign!</p></body></html>", "u");
    expect(result.status).toBe("error");
  });

  it("survives header-only cells without fabricating options", () => {
    const result = parseRealOemHtml(
      "<table><tr><td>Paint</td><td>Black 668</td></tr><tr><td>2011-03</td><td>2011-04</td></tr></table>",
      "u"
    );
    expect(result.status).toBe("ok");
    if (result.status !== "ok") return;
    expect(result.data.options).toEqual([]);
  });
});
