"use client";

import Link from "next/link";
import { History, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useDecodeHistory } from "@/hooks/use-decode-history";

export function HistoryList() {
  const { entries, clear } = useDecodeHistory();

  if (!entries.length) return null;

  return (
    <section className="w-full">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-muted-foreground flex items-center gap-2 text-sm font-medium">
          <History className="size-4" />
          Recent decodes
        </h2>
        <Button variant="ghost" size="sm" onClick={clear}>
          <X className="size-3.5" />
          Clear
        </Button>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.vin}>
            <Link
              href={`/vin/${entry.vin}`}
              className="hover:bg-accent block rounded-lg border px-4 py-3 transition-colors"
            >
              <span className="block truncate text-sm font-medium">
                {entry.title || "Unknown vehicle"}
              </span>
              <span className="text-muted-foreground block truncate font-mono text-xs">
                {entry.vin}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
