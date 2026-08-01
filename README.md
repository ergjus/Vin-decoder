# VIN Decoder

A free, ad-free VIN decoder for US-market vehicles. Enter (or scan) a 17-character
VIN and get:

- **Full factory specs** — engine, drivetrain, body, assembly plant, safety
  equipment (NHTSA vPIC)
- **Safety recalls** and **owner complaints** (NHTSA)
- **Crash-test ratings** (NHTSA NCAP)
- **EPA fuel economy** (fueleconomy.gov)
- **The original window sticker** (Monroney label) for supported brands:
  Ford, Lincoln, Chevrolet, GMC, Buick, Cadillac, Jeep, Ram, Dodge, Chrysler,
  Fiat, Alfa Romeo, Hyundai, Genesis

All vehicle data comes from free, keyless US-government APIs. Window stickers
are fetched on demand from the manufacturers' own public VIN-lookup systems.
Toyota, Lexus, and Kia retired public sticker access in 2026; brands like BMW,
Mercedes-Benz, Audi, and Honda have never offered it — for those the app
explains why and still shows the full decode.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests (VIN check digit, model matching)
```

To develop offline (or in a sandbox without API access):

```bash
USE_FIXTURES=1 npm run dev   # serves bundled 2013 F-150 demo data for any VIN
```

## Deploying

Built for the Vercel Hobby (free) tier: import the repo in Vercel and deploy —
no environment variables required. Decode results cache for a day
(`revalidate = 86400`), immutable data (vPIC/EPA/NCAP) for 30 days, and sticker
PDFs at the CDN for 30 days, so shared links barely touch the upstream APIs.

If an OEM sticker endpoint breaks, disable it from the Vercel dashboard without
a deploy: set `STICKER_DISABLED_PROVIDERS=gm` (ids: `ford`, `stellantis`, `gm`,
`hyundai`). The UI degrades to "sticker not available" for that brand.

## JSON API

Every decode is also available as JSON:

```
GET /api/decode/{vin}     # decoded vehicle
GET /api/sticker/{vin}    # window sticker PDF (404 JSON if unavailable)
```

## How the pieces fit

```
src/lib/vin/validate.ts       ISO 3779 validation + check digit
src/lib/decode.ts             vPIC decode → typed, grouped DecodedVehicle
src/lib/sources/              recalls, complaints, NCAP, EPA + fuzzy model matcher
src/lib/stickers/             per-brand sticker providers + registry + probe
src/app/vin/[vin]/page.tsx    result page — each data panel streams via Suspense
src/app/api/sticker/[vin]/    server-side PDF proxy (CORS/headers/caching)
```

The EPA and NCAP catalogs name models differently from vPIC ("F150 Pickup 4WD"
vs "F-150"), so `src/lib/sources/match.ts` reconciles names with a
normalize-and-score ladder, using the VIN's engine and drivetrain to pick the
right variant — and the UI says "closest match" whenever it had to guess.

## A note on window stickers

Sticker PDFs come from unauthenticated manufacturer endpoints that dealers and
listing sites also use. This app fetches them one VIN at a time on demand,
never in bulk, and caches at the CDN to minimize load. It's a personal,
non-commercial tool; if a manufacturer objects, the provider gets disabled.
