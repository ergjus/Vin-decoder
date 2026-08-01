import { findBuildDataProvider } from "@/lib/build-data/registry";
import { decodeVin } from "@/lib/decode";
import { validateVin } from "@/lib/vin/validate";

// JSON view of the factory build sheet — doubles as the debugging surface
// when a scraper needs a post-deploy fix (the error reason says what the
// parser saw).

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ vin: string }> }
) {
  const { vin: rawVin } = await params;
  const validation = validateVin(rawVin);
  if (!validation.ok) {
    return Response.json({ error: validation.message }, { status: 400 });
  }

  let make: string;
  try {
    make = (await decodeVin(validation.vin)).make;
  } catch {
    return Response.json(
      { error: "Couldn't decode this VIN to determine the manufacturer." },
      { status: 502 }
    );
  }

  const provider = findBuildDataProvider(make);
  if (!provider) {
    return Response.json(
      { error: `No build-data source available for ${make}.` },
      { status: 404 }
    );
  }

  const result = await provider.fetchBuildData(validation.vin);
  const status =
    result.status === "ok" ? 200 : result.status === "not_found" ? 404 : 502;
  return Response.json({ provider: provider.id, ...result }, { status });
}
