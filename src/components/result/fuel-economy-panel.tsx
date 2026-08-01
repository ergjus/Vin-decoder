import { Fuel } from "lucide-react";

import { getFuelEconomy } from "@/lib/sources/fueleconomy";
import type { DecodedVehicle } from "@/lib/types";
import { Panel, PanelEmpty } from "./panel-shell";

export async function FuelEconomyPanel({ vehicle }: { vehicle: DecodedVehicle }) {
  const result = await getFuelEconomy(vehicle);

  return (
    <Panel
      icon={Fuel}
      title="EPA fuel economy"
      description={result.status === "ok" ? result.data.epaModelName : undefined}
    >
      {result.status === "error" ? (
        <PanelEmpty>fueleconomy.gov didn&apos;t respond — try again later.</PanelEmpty>
      ) : result.status === "empty" ? (
        <PanelEmpty>
          {result.note ?? "No EPA record matched this model — heavy-duty trucks and some configurations aren't rated."}
        </PanelEmpty>
      ) : (
        <div className="space-y-5">
          {result.data.variants.map((variant) => {
            const unit = variant.isElectric ? "MPGe" : "MPG";
            return (
              <div key={variant.label}>
                <p className="text-muted-foreground text-xs">{variant.label}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                  {(
                    [
                      ["Combined", variant.combinedMpg],
                      ["City", variant.cityMpg],
                      ["Highway", variant.highwayMpg],
                    ] as const
                  ).map(([label, value]) => (
                    <div key={label} className="bg-muted rounded-lg py-2">
                      <div className="text-2xl font-semibold tabular-nums">
                        {value || "—"}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        {label} {unit}
                      </div>
                    </div>
                  ))}
                </div>
                {variant.range ? (
                  <p className="text-muted-foreground mt-2 text-xs">
                    EPA range: {variant.range} miles
                  </p>
                ) : null}
              </div>
            );
          })}
          {result.data.approximate ? (
            <p className="text-muted-foreground text-xs">
              Closest EPA match{result.data.variants.length > 1 ? "es" : ""} for this
              engine — the EPA doesn&apos;t index by VIN.
            </p>
          ) : null}
        </div>
      )}
    </Panel>
  );
}
