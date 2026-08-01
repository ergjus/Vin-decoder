import { decodeVin } from "@/lib/decode";
import { validateVin } from "@/lib/vin/validate";

// Free bonus: a JSON API mirroring the web UI's decode, e.g. /api/decode/1FTFW1ET9DFC10312

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin: rawVin } = await params;
  const validation = validateVin(rawVin);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: 400 });
  }

  try {
    const vehicle = await decodeVin(validation.vin);
    return Response.json(vehicle, {
      headers: { "cache-control": "public, s-maxage=2592000" },
    });
  } catch {
    return Response.json(
      { error: "The NHTSA decode service didn't respond. Try again later." },
      { status: 502 }
    );
  }
}
