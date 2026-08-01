import { AlertTriangle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { getRecalls } from "@/lib/sources/recalls";
import type { DecodedVehicle } from "@/lib/types";
import { Panel, PanelEmpty } from "./panel-shell";

export async function RecallsPanel({ vehicle }: { vehicle: DecodedVehicle }) {
  const result = await getRecalls(vehicle);

  return (
    <Panel
      icon={AlertTriangle}
      title="Safety recalls"
      description={
        result.status === "ok"
          ? `${result.data.length} recall${result.data.length === 1 ? "" : "s"} on file with NHTSA`
          : undefined
      }
    >
      {result.status === "error" ? (
        <PanelEmpty>NHTSA&apos;s recall service didn&apos;t respond — try again later.</PanelEmpty>
      ) : result.status === "empty" ? (
        <PanelEmpty>
          {result.note ?? "No recalls on file for this year, make, and model."}
        </PanelEmpty>
      ) : (
        <Accordion type="single" collapsible className="w-full">
          {result.data.map((recall, i) => (
            <AccordionItem key={recall.campaignNumber || i} value={`recall-${i}`}>
              <AccordionTrigger className="gap-3">
                <span className="flex min-w-0 flex-col gap-1 text-left">
                  <span className="truncate">{recall.component || "Recall"}</span>
                  <span className="text-muted-foreground text-xs font-normal">
                    Campaign {recall.campaignNumber}
                    {recall.reportDate ? ` · ${recall.reportDate}` : ""}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 [overflow-wrap:anywhere]">
                {recall.summary ? <p>{recall.summary}</p> : null}
                {recall.consequence ? (
                  <p>
                    <Badge variant="destructive" className="mr-2">
                      Risk
                    </Badge>
                    {recall.consequence}
                  </p>
                ) : null}
                {recall.remedy ? (
                  <p>
                    <Badge variant="secondary" className="mr-2">
                      Fix
                    </Badge>
                    {recall.remedy}
                  </p>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Panel>
  );
}
