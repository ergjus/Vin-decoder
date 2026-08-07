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

## Deploying (Vercel free tier, ~2 minutes)

1. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
2. Import the **Vin-decoder** repository. Vercel auto-detects Next.js —
   don't change any build settings, and **no environment variables are needed**.
3. Click **Deploy**. Your app goes live at `<project-name>.vercel.app`,
   shareable with anyone.

Optional: for a custom URL, add a domain under Project → Settings → Domains.
Optional: to use a conventionally named branch, rename the default branch to
`main` first in GitHub under Settings → Branches (one click; Vercel follows
the rename automatically).

### After your first deploy — a 5-minute spot check

Live API calls couldn't be exercised in the environment this app was built in,
so verify once against real traffic. Grab VINs from any AutoTrader or
Cars.com listing (VINs are shown on listing pages):

- **A Ford and a Ram/Jeep (2015+):** decode should fill every panel, and the
  window sticker button should open a real Monroney PDF.
- **A Chevrolet and a Hyundai (2018+):** same check — these two sticker
  adapters are marked *beta*. If one consistently fails, disable it (below).
- **A BMW or Mercedes:** all data panels should fill; the sticker card should
  show the "not publicly available" explanation, not an error.
- **Something electric (Tesla, 2020+):** fuel economy panel should show MPGe.

If a sticker adapter misbehaves, disable it without a redeploy: in Vercel →
Project → Settings → Environment Variables, set
`STICKER_DISABLED_PROVIDERS=gm` (ids: `ford`, `stellantis`, `gm`, `hyundai`,
comma-separated). The UI degrades to "sticker not available" for that brand.

### Why it stays free

Decode results cache for a day (`revalidate = 86400`), immutable data
(vPIC/EPA/NCAP) for 30 days, and sticker PDFs at the CDN for 30 days — so a
link shared with 20 friends costs one upstream fetch, not twenty. All data
sources are free, keyless government APIs, and the Vercel Hobby tier's limits
are far beyond a personal tool's traffic.

## Factory build sheets (paint, interior, options)

For BMW and MINI, the app fetches the factory build sheet natively from
RealOEM (a long-stable public front-end for BMW's ETK parts catalog):
production date, paint, upholstery, and the full factory option list. If the
fetch or parse ever fails, the card automatically falls back to external
lookup links — and `GET /api/build-data/{vin}` shows exactly what the parser
saw, which makes fixing a layout change quick. Disable with
`BUILD_DATA_DISABLED_PROVIDERS=realoem`.

**Hosting caveat:** RealOEM blocks datacenter IPs, so this feature 403s when
served from Vercel (or any cloud host) — it works fine in local development
from a home connection. To enable it in production, set
`BUILD_DATA_PROXY_URL=http://user:pass@host:port` to a residential proxy
(any provider; the cheap tiers are ~$5/month) in the Vercel dashboard. Only
RealOEM fetches route through the proxy; without the variable, the card
falls back to the external lookup links.

Mercedes-Benz, Audi, and Porsche have no comparably stable free source, so
they get curated links to community datacard/build-sheet sites instead.

## Option code decoder (`/codes`)

Every German car carries a sticker listing its factory options as short
codes — BMW SA codes (trunk/door pillar), Audi/VW/Porsche PR codes (vehicle
data label in the trunk and service booklet), and Mercedes datacard codes.
The `/codes` page decodes them instantly from bundled community-compiled
dictionaries (`src/lib/option-codes/data/`) — fully offline, no API, no
gatekeeper. Unknown codes link out to community databases. This is the
free-forever complement to the VIN-based build sheet: the codes come off
the car itself.

## JSON API

Every decode is also available as JSON:

```
GET /api/decode/{vin}       # decoded vehicle
GET /api/sticker/{vin}      # window sticker PDF (404 JSON if unavailable)
GET /api/build-data/{vin}   # factory build sheet JSON (BMW/MINI)
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
