export type StickerFetchResult =
  | { status: "found"; body: ArrayBuffer; contentType: string }
  /** The endpoint works but has no sticker for this VIN. */
  | { status: "not_found"; reason: string }
  /** The endpoint is down, blocked, or has changed. */
  | { status: "error"; reason: string };

export interface StickerProvider {
  id: string;
  /** Human-readable, e.g. "Ford / Lincoln" */
  label: string;
  /** vPIC Make values this provider serves, uppercase. */
  brands: string[];
  /** OEM systems rarely have stickers before roughly this model year. */
  minYear?: number;
  /** Endpoint not recently verified — expect errors and degrade quietly. */
  experimental?: boolean;
  fetchSticker(vin: string): Promise<StickerFetchResult>;
}
