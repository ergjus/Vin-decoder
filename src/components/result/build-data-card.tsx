import { ExternalLink, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { BuildDataProvider } from "@/lib/build-data/types";
import type { DecodedVehicle } from "@/lib/types";
import { BuildSheetLinksCard } from "./build-sheet-links-card";

export async function BuildDataCard({
  vehicle,
  provider,
}: {
  vehicle: DecodedVehicle;
  provider: BuildDataProvider;
}) {
  const result = await provider.fetchBuildData(vehicle.vin);

  // Scraped sources fail sometimes — degrade to the external lookup links.
  if (result.status !== "ok") {
    return <BuildSheetLinksCard vehicle={vehicle} />;
  }

  const { data } = result;
  const summary = [
    { label: "Production date", value: data.productionDate },
    { label: "Paint", value: data.paint },
    { label: "Upholstery / interior", value: data.upholstery },
    { label: "Factory model", value: data.model },
  ].filter((s): s is { label: string; value: string } => Boolean(s.value));

  return (
    <Card className="min-w-0 gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="text-muted-foreground size-4" />
          Factory build sheet
        </CardTitle>
        <CardDescription>
          Paint, interior, and every factory option as built — from {data.source}.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-w-0 space-y-5">
        {summary.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summary.map((s) => (
              <div key={s.label} className="min-w-0 rounded-xl border p-3">
                <div className="text-muted-foreground text-xs">{s.label}</div>
                <div className="mt-1 text-sm font-semibold [overflow-wrap:anywhere]">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {data.options.length ? (
          <div>
            <h3 className="mb-2 text-sm font-medium">
              Factory options ({data.options.length})
            </h3>
            <ul className="gap-x-6 text-sm sm:columns-2">
              {data.options.map((option) => (
                <li
                  key={option.code}
                  className="flex min-w-0 gap-2 break-inside-avoid py-1"
                >
                  <code className="text-muted-foreground shrink-0 font-mono text-xs leading-5">
                    {option.code}
                  </code>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{option.name}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="print-hidden">
          <Button asChild variant="outline" size="sm">
            <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
              View on {provider.label}
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
