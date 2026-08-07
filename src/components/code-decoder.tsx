"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleHelp, ListChecks, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BRANDS,
  decodeCodes,
  type CodeBrand,
  type DecodedCode,
} from "@/lib/option-codes/types";

const DICTIONARIES: Record<CodeBrand, () => Promise<Record<string, string>>> = {
  bmw: () => import("@/lib/option-codes/data/bmw").then((m) => m.bmwCodes),
  vag: () => import("@/lib/option-codes/data/vag").then((m) => m.vagCodes),
  mercedes: () =>
    import("@/lib/option-codes/data/mercedes").then((m) => m.mercedesCodes),
};

export function CodeDecoder({ initialBrand }: { initialBrand?: CodeBrand }) {
  const [brand, setBrand] = useState<CodeBrand>(initialBrand ?? "bmw");
  const [input, setInput] = useState("");
  const [dictionaries, setDictionaries] = useState<
    Partial<Record<CodeBrand, Record<string, string>>>
  >({});

  const brandInfo = BRANDS.find((b) => b.id === brand)!;
  const dictionary = dictionaries[brand] ?? null;

  useEffect(() => {
    if (dictionary) return;
    let cancelled = false;
    DICTIONARIES[brand]().then((dict) => {
      if (!cancelled) setDictionaries((prev) => ({ ...prev, [brand]: dict }));
    });
    return () => {
      cancelled = true;
    };
  }, [brand, dictionary]);

  const decoded: DecodedCode[] = useMemo(
    () => (dictionary ? decodeCodes(input, dictionary) : []),
    [input, dictionary]
  );
  const known = decoded.filter((d) => d.name);
  const unknown = decoded.filter((d) => !d.name);

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={brand} onValueChange={(v) => setBrand(v as CodeBrand)}>
        <TabsList className="w-full sm:w-auto">
          {BRANDS.map((b) => (
            <TabsTrigger key={b.id} value={b.id}>
              {b.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div>
        <label htmlFor="codes-input" className="mb-2 block text-sm font-medium">
          Paste or type {brandInfo.codeName}
        </label>
        <textarea
          id="codes-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder={brand === "bmw" ? "e.g. 205 403 494 ZPP 337" : "e.g. codes from the sticker, separated by spaces"}
          className="border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 w-full rounded-md border bg-transparent px-3 py-2 font-mono text-sm shadow-xs outline-none focus-visible:ring-[3px]"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="text-muted-foreground mt-2 text-xs">
          <Search className="mr-1 inline size-3.5 align-text-bottom" />
          Where to find them: {brandInfo.stickerHint}
        </p>
      </div>

      {known.length ? (
        <Card className="gap-0 py-4">
          <CardContent className="px-4">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ListChecks className="text-muted-foreground size-4" />
              Decoded options ({known.length})
            </h2>
            <ul className="text-sm">
              {known.map((d) => (
                <li key={d.input} className="flex min-w-0 gap-3 border-b py-2 last:border-b-0">
                  <code className="text-muted-foreground w-14 shrink-0 font-mono text-xs leading-5">
                    {d.code}
                  </code>
                  <span className="min-w-0 [overflow-wrap:anywhere]">{d.name}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {unknown.length ? (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-medium">
            <CircleHelp className="text-muted-foreground size-4" />
            Not in our dictionary yet ({unknown.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {unknown.map((d) => (
              <a
                key={d.input}
                href={brandInfo.lookupUrl(d.code)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Badge variant="outline" className="font-mono hover:bg-accent">
                  {d.code} ↗
                </Badge>
              </a>
            ))}
          </div>
          <p className="text-muted-foreground mt-2 text-xs">
            Tap a code to look it up in a community database — some codes are
            model-specific or rare.
          </p>
        </div>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Community-compiled dictionary of common codes — descriptions can vary by
        model and year, so verify anything critical against official sources.
      </p>
    </div>
  );
}
