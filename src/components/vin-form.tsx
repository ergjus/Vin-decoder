"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { ScanBarcode, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { normalizeVin, validateVin } from "@/lib/vin/validate";
import { cn } from "@/lib/utils";

const VinScanner = dynamic(
  () => import("@/components/vin-scanner").then((m) => m.VinScanner),
  { ssr: false }
);

const noopSubscribe = () => () => {};
/** Camera support is client-only knowledge — SSR renders without the button. */
function useCanScan(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => Boolean(navigator.mediaDevices?.getUserMedia),
    () => false
  );
}

const EXAMPLE_VIN = "1FTFW1ET9DFC10312";

export function VinForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<{ text: string; blocking: boolean } | null>(null);
  const [navigating, setNavigating] = useState(false);
  const [scanning, setScanning] = useState(false);
  const canScan = useCanScan();

  function submit(raw: string) {
    const validation = validateVin(raw);
    if (!validation.ok) {
      setMessage({ text: validation.message, blocking: true });
      return;
    }
    if (validation.warning) {
      // Check-digit misses still decode — surface the caveat on the result page.
      setMessage(null);
    }
    setNavigating(true);
    router.push(`/vin/${validation.vin}`);
  }

  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        submit(value);
      }}
    >
      <div className="flex w-full gap-2">
        <Input
          value={value}
          onChange={(e) => {
            setValue(e.target.value.toUpperCase());
            setMessage(null);
          }}
          placeholder="Enter a 17-character VIN"
          aria-label="Vehicle identification number"
          aria-invalid={message?.blocking || undefined}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          maxLength={22}
          className="h-12 font-mono text-base tracking-wider md:text-lg"
        />
        {canScan ? (
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 px-3"
            aria-label="Scan VIN barcode with camera"
            onClick={() => setScanning(true)}
          >
            <ScanBarcode className="size-5" />
          </Button>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="h-12"
          disabled={navigating || normalizeVin(value).length === 0}
        >
          <Search className="size-4" />
          {navigating ? "Decoding…" : "Decode"}
        </Button>
      </div>
      {scanning ? (
        <VinScanner
          onScan={(vin) => {
            setScanning(false);
            setValue(vin);
            submit(vin);
          }}
          onClose={() => setScanning(false)}
        />
      ) : null}
      <div className="mt-2 flex min-h-5 items-center justify-between gap-4 text-sm">
        <p className={cn("text-destructive", !message && "invisible")}>
          {message?.text ?? "placeholder"}
        </p>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground shrink-0 underline underline-offset-4"
          onClick={() => {
            setValue(EXAMPLE_VIN);
            setMessage(null);
          }}
        >
          Try an example
        </button>
      </div>
    </form>
  );
}
