import { ShieldCheck } from "lucide-react";

import { getSafetyRatings } from "@/lib/sources/safety-ratings";
import type { DecodedVehicle } from "@/lib/types";
import { Panel, PanelEmpty } from "./panel-shell";
import { StarRating } from "./star-rating";

export async function SafetyPanel({ vehicle }: { vehicle: DecodedVehicle }) {
  const result = await getSafetyRatings(vehicle);

  return (
    <Panel
      icon={ShieldCheck}
      title="Crash-test ratings"
      description={
        result.status === "ok" ? result.data.vehicleDescription : undefined
      }
    >
      {result.status === "error" ? (
        <PanelEmpty>NHTSA&apos;s ratings service didn&apos;t respond — try again later.</PanelEmpty>
      ) : result.status === "empty" ? (
        <PanelEmpty>
          {result.note ?? "NHTSA hasn't published crash-test ratings for this vehicle."}
        </PanelEmpty>
      ) : (
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <span className="font-medium">Overall</span>
            <StarRating rating={result.data.overall} />
          </div>
          <dl className="text-muted-foreground space-y-2 text-sm">
            {(
              [
                ["Frontal crash", result.data.frontCrash],
                ["Side crash", result.data.sideCrash],
                ["Side pole", result.data.sidePole],
                ["Rollover", result.data.rollover],
              ] as const
            ).map(([label, rating]) => (
              <div key={label} className="flex items-center justify-between gap-4">
                <dt>{label}</dt>
                <dd>
                  <StarRating rating={rating} />
                </dd>
              </div>
            ))}
          </dl>
          {result.data.approximate ? (
            <p className="text-muted-foreground text-xs">
              Ratings are for the closest-matching NCAP configuration of this model.
            </p>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
