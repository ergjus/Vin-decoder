import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { DecodedVehicle } from "@/lib/types";

export function SpecsGrid({ vehicle }: { vehicle: DecodedVehicle }) {
  if (!vehicle.groups.length) return null;

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold tracking-tight">Full specifications</h2>
      <div className="grid gap-4 *:min-w-0 md:grid-cols-2">
        {vehicle.groups.map((group) => (
          <Card key={group.title} className="gap-4">
            <CardHeader>
              <CardTitle>{group.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="divide-border divide-y">
                {group.items.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-4 py-2 text-sm first:pt-0 last:pb-0"
                  >
                    <dt className="text-muted-foreground shrink-0">{item.label}</dt>
                    <dd className="min-w-0 text-right font-medium [overflow-wrap:anywhere]">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
