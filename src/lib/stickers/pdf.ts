import type { StickerFetchResult } from "./types";

// OEM endpoints answer HTTP 200 with HTML error pages or tiny placeholder
// PDFs when a sticker doesn't exist — magic bytes and a size floor filter
// both out. Real Monroney PDFs run well over 100 KB.
const MIN_PDF_BYTES = 20_000;

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

export async function fetchStickerPdf(
  url: string,
  headers: Record<string, string> = {}
): Promise<StickerFetchResult> {
  if (process.env.USE_FIXTURES === "1") {
    return { status: "found", body: demoPdf(), contentType: "application/pdf" };
  }

  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": BROWSER_UA,
        accept: "application/pdf,*/*",
        ...headers,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    if (res.status === 404) return { status: "not_found", reason: "HTTP 404" };
    if (!res.ok) return { status: "error", reason: `HTTP ${res.status}` };

    const body = await res.arrayBuffer();
    const head = new TextDecoder().decode(body.slice(0, 5));
    if (head !== "%PDF-") return { status: "not_found", reason: "non-PDF response" };
    if (body.byteLength < MIN_PDF_BYTES) {
      return { status: "not_found", reason: "placeholder PDF" };
    }
    return { status: "found", body, contentType: "application/pdf" };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
}

/** Minimal one-page PDF for USE_FIXTURES demo mode. */
function demoPdf(): ArrayBuffer {
  const content = "BT /F1 24 Tf 72 720 Td (Demo window sticker) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return new TextEncoder().encode(pdf).buffer as ArrayBuffer;
}
