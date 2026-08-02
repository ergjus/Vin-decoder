"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

/** Text below this length renders plain — no point clamping a sentence. */
const CLAMP_THRESHOLD = 180;

export function ExpandableText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const clampable = text.length > CLAMP_THRESHOLD;

  return (
    <div className={cn("min-w-0", className)}>
      <p
        className={cn(
          "leading-relaxed [overflow-wrap:anywhere]",
          clampable && !expanded && "line-clamp-3"
        )}
      >
        {text}
      </p>
      {clampable ? (
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground mt-1 text-xs font-medium underline underline-offset-4"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "Show more"}
        </button>
      ) : null}
    </div>
  );
}
