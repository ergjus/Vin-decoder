import { fetchStickerPdf } from "../pdf";
import type { StickerProvider } from "../types";

export const gm: StickerProvider = {
  id: "gm",
  label: "Chevrolet / GMC / Buick / Cadillac",
  brands: ["CHEVROLET", "GMC", "BUICK", "CADILLAC"],
  minYear: 2014,
  experimental: true,
  fetchSticker(vin) {
    return fetchStickerPdf(
      `https://cws.gm.com/vs-cws/vehshop/v2/vehicle/windowsticker?vin=${encodeURIComponent(vin)}`,
      { referer: "https://www.chevrolet.com/" }
    );
  },
};
