import { Cog, Factory, Fuel, Settings2 } from "lucide-react";

import type { DecodedVehicle } from "@/lib/types";

function engineLabel(vehicle: DecodedVehicle): string | null {
  const raw = vehicle.raw;
  if (vehicle.electrificationLevel?.includes("BEV")) return "Electric";

  const parts: string[] = [];
  if (vehicle.displacementL) parts.push(`${vehicle.displacementL} L`);
  const cylinders = vehicle.engineCylinders;
  if (cylinders) {
    const config = raw.EngineConfiguration ?? "";
    if (config.startsWith("V")) parts.push(`V${cylinders}`);
    else if (config.toLowerCase().includes("in-line") || config.toLowerCase().includes("inline"))
      parts.push(`I${cylinders}`);
    else parts.push(`${cylinders} cyl`);
  }
  if (raw.Turbo === "Yes") parts.push("Turbo");
  return parts.length ? parts.join(" ") : null;
}

function transmissionLabel(vehicle: DecodedVehicle): string | null {
  const style = vehicle.raw.TransmissionStyle;
  const speeds = vehicle.raw.TransmissionSpeeds;
  if (!style) return null;
  return speeds ? `${speeds}-speed ${style}` : style;
}

function plantLabel(vehicle: DecodedVehicle): string | null {
  const city = vehicle.raw.PlantCity;
  const state = vehicle.raw.PlantState;
  const country = vehicle.raw.PlantCountry;
  const place = city ?? state ?? country;
  if (!place) return null;
  const tail = city && state ? `, ${title(state)}` : "";
  return title(place) + tail;
}

function title(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\(usa\)/i, "(USA)");
}

export function QuickStats({ vehicle }: { vehicle: DecodedVehicle }) {
  const stats = [
    { icon: Cog, label: "Engine", value: engineLabel(vehicle) },
    { icon: Settings2, label: "Transmission", value: transmissionLabel(vehicle) },
    { icon: Fuel, label: "Fuel", value: vehicle.fuelTypePrimary },
    { icon: Factory, label: "Assembled in", value: plantLabel(vehicle) },
  ].filter((s): s is typeof s & { value: string } => Boolean(s.value));

  if (!stats.length) return null;

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border p-4">
          <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <stat.icon className="size-3.5" />
            {stat.label}
          </div>
          <div className="mt-1.5 truncate text-sm font-semibold" title={stat.value}>
            {stat.value}
          </div>
        </div>
      ))}
    </section>
  );
}
