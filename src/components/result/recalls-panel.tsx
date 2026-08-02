import { AlertTriangle } from "lucide-react";

import { ExpandableText } from "@/components/expandable-text";
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
                  <span className="line-clamp-2 [overflow-wrap:anywhere]">
                    {recall.component || "Recall"}
                  </span>
                  <span className="text-muted-foreground text-xs font-normal [overflow-wrap:anywhere]">
                    Campaign {recall.campaignNumber}
                    {recall.reportDate ? ` · ${recall.reportDate}` : ""}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4">
                {recall.summary ? (
                  <ExpandableText text={recall.summary} className="text-muted-foreground" />
                ) : null}
                {recall.consequence ? (
                  <div className="min-w-0 space-y-1.5">
                    <Badge variant="destructive">Risk</Badge>
                    <ExpandableText text={recall.consequence} />
                  </div>
                ) : null}
                {recall.remedy ? (
                  <div className="min-w-0 space-y-1.5">
                    <Badge variant="secondary">Fix</Badge>
                    <ExpandableText text={recall.remedy} />
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </Panel>
  );
}
