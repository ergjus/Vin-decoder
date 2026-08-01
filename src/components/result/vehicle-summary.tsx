import { CopyButton } from "@/components/copy-button";
import { PrintButton } from "@/components/print-button";
import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import type { DecodedVehicle } from "@/lib/types";

export function VehicleSummary({ vehicle }: { vehicle: DecodedVehicle }) {
  const badges = [
    vehicle.bodyClass,
    vehicle.driveType?.split("/")[0],
    vehicle.fuelTypePrimary,
    vehicle.electrificationLevel,
  ].filter((b): b is string => Boolean(b));

  return (
    <section className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          {vehicle.title || "Unknown vehicle"}
        </h1>
        <div className="text-muted-foreground mt-2 flex items-center gap-1 font-mono text-sm">
          <span className="tracking-wider">{vehicle.vin}</span>
          <CopyButton text={vehicle.vin} label="Copy VIN" />
        </div>
        {badges.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge key={badge} variant="secondary">
                {badge}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
      <div className="print-hidden flex shrink-0 gap-2">
        <ShareButton title={vehicle.title} />
        <PrintButton />
      </div>
    </section>
  );
}
