import type { BuildDataProvider } from "./types";
import { realoem } from "./providers/realoem";

const PROVIDERS: BuildDataProvider[] = [realoem];

export function findBuildDataProvider(make: string): BuildDataProvider | undefined {
  const brand = make.trim().toUpperCase();
  const disabled = new Set(
    (process.env.BUILD_DATA_DISABLED_PROVIDERS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
  return PROVIDERS.find((p) => !disabled.has(p.id) && p.brands.includes(brand));
}
