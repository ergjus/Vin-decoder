import { decodeVin } from "@/lib/decode";
import { stickerAvailability } from "@/lib/stickers/registry";
import { validateVin } from "@/lib/vin/validate";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin: rawVin } = await params;
  const validation = validateVin(rawVin);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: 400 });
  }
  const vin = validation.vin;

  let make: string;
  let year: number | null;
  try {
    const vehicle = await decodeVin(vin);
    make = vehicle.make;
    year = vehicle.year;
  } catch {
    return Response.json(
      { error: "Couldn't decode this VIN to determine the manufacturer." },
      { status: 502 }
    );
  }

  const availability = stickerAvailability(make, year);
  if (availability.kind !== "provider") {
    return Response.json({ error: availability.message }, { status: 404 });
  }

  const result = await availability.provider.fetchSticker(vin);
  if (result.status === "not_found") {
    return Response.json(
      { error: `No window sticker was found for this VIN (${result.reason}).` },
      { status: 404 }
    );
  }
  if (result.status === "error") {
    return Response.json(
      {
        error:
          "The manufacturer's window sticker service didn't respond — it may be down or may have changed. Try again later.",
      },
      { status: 502 }
    );
  }

  return new Response(result.body, {
    headers: {
      "content-type": result.contentType,
      "content-disposition": `inline; filename="window-sticker-${vin}.pdf"`,
      // Stickers are immutable — let the CDN serve repeat views for 30 days.
      "cache-control": "public, s-maxage=2592000, stale-while-revalidate=86400",
    },
  });
}
