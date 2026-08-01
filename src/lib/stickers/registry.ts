import type { StickerProvider } from "./types";
import { ford } from "./providers/ford";
import { stellantis } from "./providers/stellantis";
import { gm } from "./providers/gm";
import { hyundai } from "./providers/hyundai";

const PROVIDERS: StickerProvider[] = [ford, stellantis, gm, hyundai];

/** Honest per-brand explanations for why no sticker is possible. */
const UNSUPPORTED_REASONS: Record<string, string> = {
  TOYOTA: "Toyota retired public window sticker access in 2026.",
  LEXUS: "Lexus retired public window sticker access in 2026.",
  KIA: "Kia retired public window sticker access in 2026.",
  HONDA: "Honda has never offered public window sticker retrieval.",
  ACURA: "Acura has never offered public window sticker retrieval.",
  BMW: "BMW doesn't offer public window sticker retrieval — a dealer can print one from the VIN.",
  "MERCEDES-BENZ":
    "Mercedes-Benz doesn't offer public window sticker retrieval — a dealer can pull the build sheet (data card) from the VIN.",
  AUDI: "Audi doesn't offer public window sticker retrieval — a dealer can print one from the VIN.",
};

const GENERIC_REASON =
  "This manufacturer doesn't make window stickers publicly retrievable by VIN.";

export type StickerAvailability =
  | { kind: "provider"; provider: StickerProvider }
  | { kind: "too_old"; provider: StickerProvider; message: string }
  | { kind: "unsupported"; message: string };

function disabledProviderIds(): Set<string> {
  return new Set(
    (process.env.STICKER_DISABLED_PROVIDERS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

export function stickerAvailability(make: string, year: number | null): StickerAvailability {
  const brand = make.trim().toUpperCase();
  const disabled = disabledProviderIds();

  const provider = PROVIDERS.find(
    (p) => !disabled.has(p.id) && p.brands.includes(brand)
  );
  if (!provider) {
    return { kind: "unsupported", message: UNSUPPORTED_REASONS[brand] ?? GENERIC_REASON };
  }

  if (provider.minYear && year && year < provider.minYear) {
    return {
      kind: "too_old",
      provider,
      message: `${provider.label} stickers are generally only retrievable for model year ${provider.minYear} and newer.`,
    };
  }

  return { kind: "provider", provider };
}
