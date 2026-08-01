import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  AlertTriangle,
  Fuel,
  MessageSquareWarning,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import { SaveToHistory } from "@/components/save-to-history";
import { VinForm } from "@/components/vin-form";
import { ComplaintsPanel } from "@/components/result/complaints-panel";
import { FuelEconomyPanel } from "@/components/result/fuel-economy-panel";
import { PanelSkeleton } from "@/components/result/panel-shell";
import { QuickStats } from "@/components/result/quick-stats";
import { RecallsPanel } from "@/components/result/recalls-panel";
import { SafetyPanel } from "@/components/result/safety-panel";
import { SpecsGrid } from "@/components/result/specs-grid";
import { StickerCard } from "@/components/result/sticker-card";
import { VehicleSummary } from "@/components/result/vehicle-summary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { decodeVin } from "@/lib/decode";
import { validateVin } from "@/lib/vin/validate";

export const revalidate = 86400;

interface Props {
  params: Promise<{ vin: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { vin: raw } = await params;
  const validation = validateVin(decodeURIComponent(raw));
  if (!validation.ok) return { title: "Invalid VIN" };
  try {
    const vehicle = await decodeVin(validation.vin);
    return {
      title: vehicle.title || `VIN ${validation.vin}`,
      description: `VIN ${validation.vin} — specs, recalls, crash-test ratings, fuel economy, and window sticker.`,
    };
  } catch {
    return { title: `VIN ${validation.vin}` };
  }
}

export default async function VinPage({ params }: Props) {
  const { vin: raw } = await params;
  const input = decodeURIComponent(raw);
  const validation = validateVin(input);

  if (!validation.ok) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-10">
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertTitle>That doesn&apos;t look like a valid VIN</AlertTitle>
          <AlertDescription>{validation.message}</AlertDescription>
        </Alert>
        <VinForm autoFocus />
      </div>
    );
  }

  // Canonical URLs (uppercase, no separators) so caching and sharing behave.
  if (validation.vin !== input) redirect(`/vin/${validation.vin}`);

  const vehicle = await decodeVin(validation.vin);
  const warnings = [validation.warning, vehicle.vpicWarning].filter(
    (w): w is string => Boolean(w)
  );

  return (
    <div className="flex flex-col gap-6">
      <SaveToHistory vin={vehicle.vin} title={vehicle.title} />

      {warnings.map((warning) => (
        <Alert key={warning}>
          <TriangleAlert />
          <AlertTitle>Heads up</AlertTitle>
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}

      <VehicleSummary vehicle={vehicle} />
      <QuickStats vehicle={vehicle} />

      <Suspense fallback={<Skeleton className="h-24 w-full rounded-xl" />}>
        <StickerCard vehicle={vehicle} />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<PanelSkeleton icon={Fuel} title="EPA fuel economy" />}>
          <FuelEconomyPanel vehicle={vehicle} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton icon={ShieldCheck} title="Crash-test ratings" />}>
          <SafetyPanel vehicle={vehicle} />
        </Suspense>
        <Suspense fallback={<PanelSkeleton icon={AlertTriangle} title="Safety recalls" />}>
          <RecallsPanel vehicle={vehicle} />
        </Suspense>
        <Suspense
          fallback={<PanelSkeleton icon={MessageSquareWarning} title="Owner complaints" />}
        >
          <ComplaintsPanel vehicle={vehicle} />
        </Suspense>
      </div>

      <SpecsGrid vehicle={vehicle} />

      <p className="text-muted-foreground text-xs">
        Developers: this decode is also available as JSON at{" "}
        <code className="font-mono">/api/decode/{vehicle.vin}</code>
      </p>
    </div>
  );
}
