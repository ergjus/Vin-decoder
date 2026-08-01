"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { normalizeVin, validateVin } from "@/lib/vin/validate";

/**
 * Camera overlay that scans the VIN barcode on the door jamb or windshield
 * (Code 39, QR, and Data Matrix all appear in the wild — zxing reads them all).
 */
export function VinScanner({
  onScan,
  onClose,
}: {
  onScan: (vin: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let controls: { stop: () => void } | null = null;

    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        if (!videoRef.current) return;
        const reader = new BrowserMultiFormatReader();
        controls = await reader.decodeFromVideoDevice(
          undefined,
          videoRef.current,
          (result) => {
            if (!result || stopped) return;
            let text = normalizeVin(result.getText());
            // Code 39 door-jamb barcodes often carry a leading import character.
            if (text.length === 18 && (text.startsWith("I") || text.startsWith("Q"))) {
              text = text.slice(1);
            }
            const validation = validateVin(text);
            if (validation.ok) {
              stopped = true;
              controls?.stop();
              onScan(validation.vin);
            }
          }
        );
      } catch {
        setError(
          "Couldn't access the camera. Allow camera permission, or type the VIN instead."
        );
      }
    })();

    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [onScan]);

  return (
    <div className="bg-background/95 fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 p-4 backdrop-blur-sm">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={onClose}
        aria-label="Close scanner"
      >
        <X className="size-5" />
      </Button>
      {error ? (
        <p className="max-w-sm text-center text-sm">{error}</p>
      ) : (
        <>
          <video
            ref={videoRef}
            className="w-full max-w-lg rounded-xl border"
            playsInline
            muted
          />
          <p className="text-muted-foreground max-w-sm text-center text-sm">
            Point the camera at the VIN barcode — it&apos;s on the driver&apos;s door
            jamb or the base of the windshield.
          </p>
        </>
      )}
    </div>
  );
}
