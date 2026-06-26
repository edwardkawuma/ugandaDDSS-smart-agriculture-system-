# AgriSmart Uganda

AgriSmart Uganda is an agricultural intelligence web platform for Uganda. It combines farmer advisories, district analytics, and **interactive geospatial mapping** powered by **Google Earth Engine (GEE)**, Leaflet, and local GeoJSON boundary data.

## Project description

The platform supports multiple user roles (farmers, extension workers, researchers, MAAIF officials, and development partners) with dashboards for crop recommendations, pest alerts, weather data, production reports, and **public agricultural maps**.

Geospatial features are centered on Uganda's national boundary and district-level agricultural zones:

- **Crop / land cover** — ESA WorldCover clipped to Uganda
- **Soil texture** — OpenLandMap USDA soil classes
- **Rainfall** — CHIRPS 12-month precipitation sum
- **Vegetation health (NDVI)** — Sentinel-2 median NDVI

Maps support **zoom**, **pan**, and **layer toggling**. Without GEE credentials the app runs in **demo mode** using district choropleths from local GeoJSON; with credentials it serves live Earth Engine raster tiles.

## Quick start (no README required to run)

From the project root:

```bash
npm run install:all   # first time only
npm run dev           # starts frontend (8080) + GEE API (3001)
```

Open **http://localhost:8080** in your browser.

| Script | Description |
|--------|-------------|
| `npm run dev` | Frontend + backend concurrently |
| `npm run dev:frontend` | Vite dev server only |
| `npm run dev:backend` | GEE API only |
| `npm run build` | Production frontend build |
| `npm run preview` | Preview production build |

## Setup

### Prerequisites

- **Node.js** 18+ and npm
- (Optional) **Google Cloud project** with Earth Engine enabled and a service account JSON key

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Environment (optional):

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITE_GEE_API_URL` | `/api/gee` (proxied in dev) | GEE REST API base URL |

### Backend (Google Earth Engine API)

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

Configure `.env`:

```env
PORT=3001
GEE_PROJECT_ID=your-google-cloud-project-id
GOOGLE_APPLICATION_CREDENTIALS=./gee-service-account.json
```

**Live GEE mode** requires:

1. Earth Engine access approved for your Google account / project  
2. A service account key with Earth Engine API scope  
3. `GOOGLE_APPLICATION_CREDENTIALS` pointing to that JSON file  

If credentials are missing, the API returns **demo mode** and the frontend renders local district layers.

## Usage guide

### Public agricultural map

1. Start the app with `npm run dev`
2. Visit **http://localhost:8080/public-maps**
3. Use the **Map Layers** panel to toggle Earth Engine layers
4. Zoom and pan the Leaflet map; Uganda's boundary is loaded from `frontend/public/data/uganda-boundary.geojson`

### District maps (authenticated)

1. Log in as a MAAIF official (mock auth is enabled by default)
2. Open **District Maps** from the dashboard
3. Use the **Map View** tab for the full GEE-integrated map

### GEE API endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /health` | Service health check |
| `GET /api/gee/status` | GEE connection status (`gee` or `demo`) |
| `GET /api/gee/layers` | Available agricultural layer catalog |
| `GET /api/gee/tiles/:layerId` | Map ID + token for raster tiles |

## Geospatial architecture

```
frontend/
├── public/data/
│   ├── uganda-boundary.geojson      # National boundary
│   └── uganda-districts.geojson     # Demo district polygons
├── src/components/maps/
│   ├── AgriculturalMap.tsx          # Main interactive map
│   ├── MapLayerControlPanel.tsx     # Layer toggles + legend
│   ├── GeeLayers.tsx                # GEE tiles + demo choropleth
│   └── UgandaBoundaryLayer.tsx      # Boundary overlay
└── src/lib/geospatial/
    ├── constants.ts                 # Map center, bounds, API URL
    ├── types.ts                     # Layer types + demo palettes
    └── earthEngineClient.ts         # GEE REST client

backend/
├── server.js                        # Express entry
└── gee/
    ├── initialize.js                # Earth Engine auth
    ├── layers.js                    # Layer definitions + map IDs
    └── routes.js                    # REST routes
```

### Extending layers

1. Add a layer definition in `backend/gee/layers.js` (`LAYER_CATALOG` + `buildLayerImage`)
2. Extend `GeeLayerId` and demo palette in `frontend/src/lib/geospatial/types.ts`
3. The UI picks up new layers automatically via `GET /api/gee/layers`

## Contribution notes

- Follow existing React + TypeScript + shadcn/ui patterns in `frontend/src`
- Keep geospatial logic in `src/lib/geospatial/` and map UI in `src/components/maps/`
- Run `npm run lint` in `frontend` before submitting changes
- Do **not** commit service account keys or `.env` files with secrets
- For new agricultural datasets, prefer GEE public catalogs and clip to Uganda using `USDOS/LSIB_SIMPLE/2017`

### Mock API

The frontend uses a mock HTTP adapter (`installMockAdapter`) so the app runs without a full backend API. Only the GEE microservice on port **3001** is required for live raster layers.

## License

Private / educational use — see repository owner for terms.
