import { FileText, Gauge, ShieldCheck } from "lucide-react";

import { HistoryList } from "@/components/history-list";
import { VinForm } from "@/components/vin-form";

const FEATURES = [
  {
    icon: Gauge,
    title: "Full factory specs",
    text: "Engine, drivetrain, dimensions, assembly plant, and safety equipment straight from the federal vPIC database.",
  },
  {
    icon: ShieldCheck,
    title: "Recalls & safety",
    text: "Open recalls, owner complaints, NHTSA crash-test ratings, and EPA fuel economy for the exact model year.",
  },
  {
    icon: FileText,
    title: "Original window sticker",
    text: "The factory Monroney label with MSRP and options — retrievable for Ford, Lincoln, GM, Jeep, Ram, Dodge, Chrysler, Hyundai, and Genesis.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-14 py-6 sm:py-14">
      <section className="w-full max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
          Decode any VIN
        </h1>
        <p className="text-muted-foreground mt-4 text-lg text-balance">
          Specs, recalls, crash ratings, fuel economy, and the original window
          sticker — free, no ads, no signup.
        </p>
        <div className="mt-8">
          <VinForm autoFocus />
        </div>
      </section>

      <section className="grid w-full gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => (
          <div key={feature.title} className="rounded-xl border p-5 text-left">
            <feature.icon className="text-muted-foreground size-5" />
            <h2 className="mt-3 font-semibold">{feature.title}</h2>
            <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
              {feature.text}
            </p>
          </div>
        ))}
      </section>

      <HistoryList />
    </div>
  );
}
