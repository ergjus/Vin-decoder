"use client";

import { useEffect } from "react";

import { saveToHistory } from "@/hooks/use-decode-history";

export function SaveToHistory({ vin, title }: { vin: string; title: string }) {
  useEffect(() => {
    saveToHistory({ vin, title });
  }, [vin, title]);
  return null;
}
