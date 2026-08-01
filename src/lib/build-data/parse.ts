// Tolerant HTML scraping helpers: we control neither the markup nor its
// future, so parsing works on text-cell sequences rather than exact DOM
// shapes, and callers treat "couldn't parse" as a soft failure.

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&apos;": "'",
  "&nbsp;": " ",
};

export function decodeEntities(s: string): string {
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;|&#\d+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? " ");
}

function stripTags(s: string): string {
  return decodeEntities(s.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** All <td>/<th> cell texts in document order, scripts/styles removed. */
export function extractCells(html: string): string[] {
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ");
  const cells: string[] = [];
  const re = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(cleaned)) !== null) {
    cells.push(stripTags(match[1]));
  }
  return cells;
}

/**
 * Find the cell after a label cell, matching labels loosely
 * ("Prod. Date", "Prod.Date", "Production date" all hit /prod.*date/i).
 */
export function valueAfterLabel(cells: string[], labelPattern: RegExp): string | null {
  for (let i = 0; i < cells.length - 1; i++) {
    if (labelPattern.test(cells[i]) && cells[i + 1] && !labelPattern.test(cells[i + 1])) {
      return cells[i + 1];
    }
  }
  return null;
}
