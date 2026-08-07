"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

/** Fetches the Markdown rendering of this VIN's decode and copies it to the
 * clipboard — sized and formatted for pasting straight into an LLM chat. */
export function CopyLlmButton({ vin }: { vin: string }) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "error">("idle");

  async function copyForLlm() {
    setState("copying");
    try {
      const res = await fetch(`/api/decode/${vin}/markdown`);
      if (!res.ok) throw new Error(await res.text());
      const markdown = await res.text();
      await navigator.clipboard.writeText(markdown);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2000);
    }
  }

  return (
    <Button onClick={copyForLlm} variant="outline" disabled={state === "copying"}>
      {state === "copied" ? <Check className="size-4" /> : <Sparkles className="size-4" />}
      {state === "copied"
        ? "Copied"
        : state === "copying"
          ? "Copying…"
          : state === "error"
            ? "Copy failed"
            : "Copy for LLM"}
    </Button>
  );
}
