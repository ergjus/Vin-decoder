import { fetchStickerPdf } from "../pdf";
import type { StickerProvider } from "../types";

// One endpoint on the chrysler.com host serves every Stellantis US brand.
export const stellantis: StickerProvider = {
  id: "stellantis",
  label: "Jeep / Ram / Dodge / Chrysler / Fiat / Alfa Romeo",
  brands: ["JEEP", "RAM", "DODGE", "CHRYSLER", "FIAT", "ALFA ROMEO"],
  minYear: 2012,
  fetchSticker(vin) {
    return fetchStickerPdf(
      `https://www.chrysler.com/hostd/windowsticker/getWindowStickerPdf.do?vin=${encodeURIComponent(vin)}`,
      { referer: "https://www.chrysler.com/" }
    );
  },
};
