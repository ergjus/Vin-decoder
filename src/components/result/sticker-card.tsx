import { FileText } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { findBuildDataProvider } from "@/lib/build-data/registry";
import { probeSticker } from "@/lib/stickers/probe";
import { buildSheetLinks, stickerAvailability } from "@/lib/stickers/registry";
import type { DecodedVehicle } from "@/lib/types";
import { BuildDataCard } from "./build-data-card";
import { BuildSheetLinksCard, StickerShell } from "./build-sheet-links-card";

export async function StickerCard({ vehicle }: { vehicle: DecodedVehicle }) {
  const availability = stickerAvailability(vehicle.make, vehicle.year);

  if (availability.kind === "unsupported" || availability.kind === "too_old") {
    if (availability.kind === "unsupported") {
      // Brands with a native build-data source (BMW/MINI via RealOEM) get the
      // full factory options inline; the links card is its automatic fallback.
      const provider = findBuildDataProvider(vehicle.make);
      if (provider) return <BuildDataCard vehicle={vehicle} provider={provider} />;
      if (buildSheetLinks(vehicle.make).length) {
        return <BuildSheetLinksCard vehicle={vehicle} />;
      }
    }

    return (
      <StickerShell found={false}>
        <div>
          <p className="font-medium">Window sticker not available</p>
          <p className="text-muted-foreground mt-0.5 text-sm">{availability.message}</p>
        </div>
      </StickerShell>
    );
  }

  const probe = await probeSticker(vehicle.vin, vehicle.make, vehicle.year);
  const stickerUrl = `/api/sticker/${vehicle.vin}`;

  if (probe === "found") {
    return (
      <StickerShell found>
        <div>
          <p className="flex items-center gap-2 font-medium">
            Original window sticker
            {availability.provider.experimental ? (
              <Badge variant="outline">beta</Badge>
            ) : null}
          </p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            The factory Monroney label — MSRP, options, and packages as built.
          </p>
        </div>
        <Button asChild className="print-hidden shrink-0">
          <a href={stickerUrl} target="_blank" rel="noopener">
            <FileText className="size-4" />
            View sticker (PDF)
          </a>
        </Button>
      </StickerShell>
    );
  }

  if (probe === "not_found") {
    return (
      <StickerShell found={false}>
        <div>
          <p className="font-medium">No window sticker on file</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {availability.provider.label} serves stickers by VIN, but returned nothing
            for this one — common for older vehicles.
          </p>
        </div>
      </StickerShell>
    );
  }

  return (
    <StickerShell found={false}>
      <div>
        <p className="font-medium">Window sticker service unavailable</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          The {availability.provider.label} sticker service didn&apos;t respond. It may
          be temporarily down.
        </p>
      </div>
      <Button asChild variant="outline" className="print-hidden shrink-0">
        <a href={stickerUrl} target="_blank" rel="noopener">
          Try anyway
        </a>
      </Button>
    </StickerShell>
  );
}
