import { fetchStickerPdf } from "../pdf";
import type { StickerProvider } from "../types";

export const hyundai: StickerProvider = {
  id: "hyundai",
  label: "Hyundai / Genesis",
  brands: ["HYUNDAI", "GENESIS"],
  minYear: 2017,
  experimental: true,
  fetchSticker(vin) {
    return fetchStickerPdf(
      `https://www.hyundaiusa.com/var/hyundai/services/inventory/monroneyLabel.pdf?vin=${encodeURIComponent(vin)}`,
      { referer: "https://www.hyundaiusa.com/" }
    );
  },
};
