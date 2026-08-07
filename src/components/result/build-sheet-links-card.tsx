import Link from "next/link";
import { ExternalLink, FileText, FileX2, ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildSheetLinks } from "@/lib/stickers/registry";
import type { DecodedVehicle } from "@/lib/types";

const CODE_DECODER_BRAND: Record<string, string> = {
  BMW: "bmw",
  MINI: "bmw",
  AUDI: "vag",
  VOLKSWAGEN: "vag",
  PORSCHE: "vag",
  "MERCEDES-BENZ": "mercedes",
};

export function StickerShell({
  found,
  children,
}: {
  found: boolean;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 py-4">
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

export function hasBuildSheetHelp(make: string): boolean {
  return (
    buildSheetLinks(make).length > 0 ||
    Boolean(CODE_DECODER_BRAND[make.trim().toUpperCase()])
  );
}

/** External community build-sheet lookups for brands we can't fetch natively. */
export function BuildSheetLinksCard({ vehicle }: { vehicle: DecodedVehicle }) {
  const links = buildSheetLinks(vehicle.make);
  if (!hasBuildSheetHelp(vehicle.make)) return null;

  return (
    <StickerShell found={false}>
      <div className="min-w-0">
        <p className="font-medium">Paint, interior & factory options</p>
        <p className="text-muted-foreground mt-0.5 text-sm">
          {`${vehicle.makeDisplay} doesn't publish window stickers, but its factory build sheet lists every option — paint and interior colors included. These free community lookups usually retrieve it: copy the VIN above and paste it there. (Third-party sites, not affiliated.)`}
        </p>
      </div>
      <div className="print-hidden flex shrink-0 flex-wrap gap-2">
        {CODE_DECODER_BRAND[vehicle.make.toUpperCase()] ? (
          <Button asChild size="sm">
            <Link href={`/codes?brand=${CODE_DECODER_BRAND[vehicle.make.toUpperCase()]}`}>
              <ListChecks className="size-3.5" />
              Decode option codes
            </Link>
          </Button>
        ) : null}
        {links.map((link) => (
          <Button key={link.url} asChild variant="outline" size="sm">
            <a href={link.url} target="_blank" rel="noopener noreferrer">
              {link.label}
              <ExternalLink className="size-3.5" />
            </a>
          </Button>
        ))}
      </div>
    </StickerShell>
  );
}
