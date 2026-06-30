# AgriSmart Uganda DDSS

**Digital Data-Driven Decision Support System (DDSS) for Climate-Smart Agriculture in Uganda**

Developed for the Ministry of Agriculture, Animal Industry and Fisheries (MAAIF) in collaboration with NARO, UNMA, and UBOS.

---

## Color Palette

| Role | Color | Hex |
|------|-------|-----|
| Primary | Forest Green | `#228B22` |
| Secondary | Earth Brown | `#8B4513` |
| Accent | Golden Yellow | `#FFD700` |
| Background | Light Beige | `#F5F5DC` |

---

## Uganda Focus Crops

| Crop | Role | Key Zone | Data Source |
|------|------|----------|-------------|
| Coffee ☕ | Major export | SW Highlands / Mt Elgon | UCDA |
| Maize 🌽 | Food security staple | Northern Savannah / Lake Victoria Crescent | MAAIF / UBOS |
| Beans 🫘 | Nutrition / household income | SW Highlands / Eastern Highlands | MAAIF / UBOS |
| Hass Avocado 🥑 | Emerging export | Western Highlands | MAAIF / UCDA |

---

## System Roles

| Role | Landing Page | Primary Function |
|------|--------------|-----------------|
| Farmer | Weather Alerts | Advisories, market prices, farm management |
| Extension Worker | Farm Management | Farmer directory, field visits, advisory creation |
| Researcher | Data Hub | AI models, statistical analysis, custom queries |
| MAAIF Official | Policy Dashboard | National statistics, production reports, district maps |
| Development Partner | Monitoring Dashboard | Impact assessment, programme KPIs, beneficiary tracking |
| Public Visitor | Public Maps | Agricultural information, seasonal calendars |

---

## Architecture

```
agrismart-uganda/
├── backend/                    Node.js + Express API
│   ├── auth/                   JWT authentication
│   ├── db/                     SQLite (offline) + PostgreSQL (online sync)
│   ├── gee/                    Google Earth Engine (NDVI, rainfall, crop layers)
│   ├── market/                 Uganda market prices (UCDA/UBOS/district)
│   ├── serpapi/                Location search
│   └── server.js
├── frontend/                   React 18 + TypeScript + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── maps/           Leaflet + GEE Uganda layers
│   │   │   └── UgandaPricePanel.tsx  UCDA/UBOS price widget
│   │   ├── constants/
│   │   │   └── Uganda.ts       Crops, districts, agro-zones, palette
│   │   ├── lib/api/
│   │   │   └── ugandaMarketService.ts  Live UCDA/UBOS endpoints
│   │   └── pages/              30+ pages by role
│   └── public/data/            Uganda boundary + districts GeoJSON
```

---

## GIS / Earth Engine Layers

| Layer | Description | Data Source |
|-------|-------------|-------------|
| Crop / Land Cover | ESA WorldCover 2021 | ESA/WorldCover/v200 |
| Soil Texture | USDA classification at 250 m | OpenLandMap |
| Annual Rainfall | CHIRPS 12-month sum | UCSB-CHG/CHIRPS/DAILY |
| Vegetation (NDVI) | Sentinel-2 median NDVI | COPERNICUS/S2_SR_HARMONIZED |
| Coffee Suitability | Robusta + Arabica zones | SRTM + CHIRPS |
| Maize Zones | Rainfall-suitable cropland | ESA WorldCover + CHIRPS |
| Hass Avocado Suitability | Highland areas 1500–2200 m | SRTM + CHIRPS |
| Soil Organic Carbon | Topsoil fertility proxy | SoilGrids / OpenLandMap |

---

## Market Price APIs

| Endpoint | Description |
|----------|-------------|
| `GET /api/market-prices` | Current prices (all sources) |
| `GET /api/market-prices/trends` | 30/60/90-day price history |
| `GET /api/market-prices/ucda` | UCDA coffee export bulletin |
| `GET /api/market-prices/ubos` | UBOS national commodity statistics |
| `GET /api/market-prices/districts` | District-level price map data |

---

## Quick Start

```bash
# Backend
cd backend
cp .env.example .env    # fill in DATABASE_URL, GEE credentials, SERPAPI_KEY
npm install
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

Demo credentials (mock mode): `farmer@demo.com` / `Demo@1234`

---

## Data Sources

- **MAAIF** — Ministry of Agriculture, Animal Industry and Fisheries
- **NARO** — National Agricultural Research Organisation
- **UNMA** — Uganda National Meteorological Authority
- **UBOS** — Uganda Bureau of Statistics
- **UCDA** — Uganda Coffee Development Authority
- **Google Earth Engine** — Satellite imagery and geospatial analysis
