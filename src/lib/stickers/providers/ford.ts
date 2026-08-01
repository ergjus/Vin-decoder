import { fetchStickerPdf } from "../pdf";
import type { StickerProvider } from "../types";

export const ford: StickerProvider = {
  id: "ford",
  label: "Ford / Lincoln",
  brands: ["FORD", "LINCOLN"],
  minYear: 2013,
  fetchSticker(vin) {
    return fetchStickerPdf(
      `https://www.windowsticker.forddirect.com/windowsticker.pdf?vin=${encodeURIComponent(vin)}`
    );
  },
};
