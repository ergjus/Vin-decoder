import { MessageSquareWarning } from "lucide-react";

import { getComplaints } from "@/lib/sources/complaints";
import type { DecodedVehicle } from "@/lib/types";
import { Panel, PanelEmpty } from "./panel-shell";

export async function ComplaintsPanel({ vehicle }: { vehicle: DecodedVehicle }) {
  const result = await getComplaints(vehicle);

  return (
    <Panel
      icon={MessageSquareWarning}
      title="Owner complaints"
      description={
        result.status === "ok"
          ? `${result.data.total.toLocaleString()} filed with NHTSA — most recent below`
          : undefined
      }
    >
      {result.status === "error" ? (
        <PanelEmpty>
          NHTSA&apos;s complaint service didn&apos;t respond — try again later.
        </PanelEmpty>
      ) : result.status === "empty" ? (
        <PanelEmpty>
          {result.note ?? "No complaints on file for this year, make, and model."}
        </PanelEmpty>
      ) : (
        <ul className="space-y-4">
          {result.data.complaints.map((complaint) => (
            <li key={complaint.odiNumber} className="text-sm">
              <p className="text-muted-foreground text-xs">
                {complaint.components}
                {complaint.dateFiled ? ` · ${complaint.dateFiled}` : ""}
                {complaint.crash ? " · involved a crash" : ""}
                {complaint.fire ? " · involved a fire" : ""}
              </p>
              <p className="mt-1 line-clamp-3 leading-relaxed">{complaint.summary}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
