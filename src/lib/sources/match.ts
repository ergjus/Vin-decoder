// Model-name reconciliation between vPIC and the EPA/NCAP catalogs, which
// name the same vehicle differently ("F-150" vs "F150 Pickup 4WD").

const NOISE_TOKENS = new Set([
  "PICKUP", "TRUCK", "WAGON", "VAN", "SUV", "CAB", "CHASSIS",
  "2WD", "4WD", "AWD", "RWD", "FWD", "4X2", "4X4",
  "2DR", "4DR", "FFV", "HEV", "PHEV",
]);

export function tokenize(s: string): string[] {
  return s
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean);
}

/** Comparison key: uppercase, alphanumeric only, noise tokens dropped. */
export function normalizeModel(s: string): string {
  const tokens = tokenize(s).filter((t) => !NOISE_TOKENS.has(t));
  return (tokens.length ? tokens : tokenize(s)).join("");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  const prev = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let diagonal = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const insertOrDelete = Math.min(prev[j], prev[j - 1]) + 1;
      const substitute = diagonal + (a[i - 1] === b[j - 1] ? 0 : 1);
      diagonal = prev[j];
      prev[j] = Math.min(insertOrDelete, substitute);
    }
  }
  return prev[b.length];
}

export interface Match {
  value: string;
  confidence: "exact" | "high" | "low";
}

/**
 * Pick the candidate that best matches `target`, or null if nothing is close.
 * Scoring ladder: exact normalized equality → prefix containment → token
 * subset → small edit distance.
 */
export function pickBestMatch(target: string, candidates: string[]): Match | null {
  const t = normalizeModel(target);
  if (!t) return null;

  const normalized = candidates.map((c) => ({ value: c, key: normalizeModel(c) }));

  const exact = normalized.filter((c) => c.key === t);
  if (exact.length) return { value: exact[0].value, confidence: "exact" };

  const prefixed = normalized
    .filter((c) => c.key.startsWith(t) || t.startsWith(c.key))
    .sort((a, b) => a.key.length - b.key.length);
  if (prefixed.length) return { value: prefixed[0].value, confidence: "high" };

  const targetTokens = tokenize(target).filter((tok) => !NOISE_TOKENS.has(tok));
  if (targetTokens.length) {
    const subset = normalized.filter((c) => {
      const candidateTokens = new Set(tokenize(c.value));
      return targetTokens.every((tok) => candidateTokens.has(tok));
    });
    if (subset.length) return { value: subset[0].value, confidence: "high" };
  }

  let best: { value: string; distance: number } | null = null;
  for (const c of normalized) {
    const distance = levenshtein(t, c.key);
    if (distance <= 2 && distance < Math.max(t.length, c.key.length) / 2) {
      if (!best || distance < best.distance) best = { value: c.value, distance };
    }
  }
  return best ? { value: best.value, confidence: "low" } : null;
}

/**
 * Score how well a variant description (e.g. NCAP's "2013 Ford F-150 SuperCrew
 * 4WD" or an EPA option string) matches known vehicle attributes.
 */
export function scoreVariant(description: string, hints: string[]): number {
  const descTokens = new Set(tokenize(description));
  let score = 0;
  for (const hint of hints) {
    for (const token of tokenize(hint)) {
      if (descTokens.has(token)) score++;
    }
  }
  return score;
}
