import { FileText, FileX2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { probeSticker } from "@/lib/stickers/probe";
import { stickerAvailability } from "@/lib/stickers/registry";
import type { DecodedVehicle } from "@/lib/types";

function Shell({
  found,
  children,
}: {
  found: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-4 px-4 sm:flex-row sm:items-center">
        <div
          className={
            "flex size-11 shrink-0 items-center justify-center rounded-lg " +
            (found ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
          }
        >
          {found ? <FileText className="size-5" /> : <FileX2 className="size-5" />}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

export async function StickerCard({ vehicle }: { vehicle: DecodedVehicle }) {
  const availability = stickerAvailability(vehicle.make, vehicle.year);

  if (availability.kind === "unsupported" || availability.kind === "too_old") {
    return (
      <Shell found={false}>
        <div>
          <p className="font-medium">Window sticker not available</p>
          <p className="text-muted-foreground mt-0.5 text-sm">{availability.message}</p>
        </div>
      </Shell>
    );
  }

  const probe = await probeSticker(vehicle.vin, vehicle.make, vehicle.year);
  const stickerUrl = `/api/sticker/${vehicle.vin}`;

  if (probe === "found") {
    return (
      <Shell found>
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
      </Shell>
    );
  }

  if (probe === "not_found") {
    return (
      <Shell found={false}>
        <div>
          <p className="font-medium">No window sticker on file</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            {availability.provider.label} serves stickers by VIN, but returned nothing
            for this one — common for older vehicles.
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell found={false}>
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
    </Shell>
  );
}
