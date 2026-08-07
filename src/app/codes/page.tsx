import type { Metadata } from "next";

import { CodeDecoder } from "@/components/code-decoder";
import type { CodeBrand } from "@/lib/option-codes/types";

export const metadata: Metadata = {
  title: "Option code decoder — BMW SA, Audi/VW PR & Mercedes codes",
  description:
    "Decode the factory option codes from your car's sticker: BMW SA codes, Audi/VW/Porsche PR codes, and Mercedes-Benz datacard codes — free, instant, offline.",
};

const VALID_BRANDS = new Set(["bmw", "vag", "mercedes"]);

export default async function CodesPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const { brand } = await searchParams;
  const initialBrand = VALID_BRANDS.has(brand ?? "")
    ? (brand as CodeBrand)
    : undefined;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-6">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">Option code decoder</h1>
        <p className="text-muted-foreground mt-3 text-balance">
          Every German car carries a sticker listing its factory options as
          short codes. Find yours, type the codes in, and see what your car
          left the factory with — no VIN needed.
        </p>
      </section>
      <CodeDecoder initialBrand={initialBrand} />
    </div>
  );
}
