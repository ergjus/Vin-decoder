"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 py-10">
      <Alert variant="destructive">
        <TriangleAlert />
        <AlertTitle>Couldn&apos;t decode this VIN right now</AlertTitle>
        <AlertDescription>
          The NHTSA decode service didn&apos;t respond. It&apos;s usually back within a
          minute or two.
        </AlertDescription>
      </Alert>
      <Button onClick={reset} variant="outline">
        <RotateCcw className="size-4" />
        Try again
      </Button>
    </div>
  );
}
