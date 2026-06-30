/**
 * Uganda Market Prices API
 * Provides crop price data sourced from:
 *   - UCDA (Uganda Coffee Development Authority)
 *   - UBOS (Uganda Bureau of Statistics)
 *   - Farm-gate survey data
 *   - District market monitoring data
 *
 * Endpoints:
 *   GET /api/market-prices         - Current prices across all sources
 *   GET /api/market-prices/trends  - Historical price trends by crop/district
 *   GET /api/market-prices/ucda    - UCDA coffee export prices
 *   GET /api/market-prices/ubos    - UBOS national commodity statistics
 */

import { Router } from 'express';

export const marketRouter = Router();

// ── Uganda Crops (focus crops per requirements) ──────────────────────────────
const UGANDA_CROPS = ['Coffee', 'Maize', 'Beans', 'Hass Avocado'];

// ── Uganda Districts (representative sample across agro-zones) ───────────────
const UGANDA_DISTRICTS = [
  // Lake Victoria Crescent
  'Kampala', 'Wakiso', 'Mukono', 'Masaka', 'Kalangala',
  // Southwest Highlands (coffee belt)
  'Kabale', 'Kisoro', 'Kanungu', 'Rukungiri', 'Mbarara',
  // Mt Elgon / Eastern Highlands
  'Mbale', 'Sironko', 'Bulambuli', 'Kapchorwa', 'Bududa',
  // Western (avocado / coffee)
  'Fort Portal', 'Kasese', 'Kamwenge', 'Kyenjojo',
  // Northern Savannah (maize/beans belt)
  'Gulu', 'Lira', 'Apac', 'Arua', 'Nebbi',
];

// ── Agro-ecological zones ─────────────────────────────────────────────────────
const AGRO_ZONES = [
  'Lake Victoria Crescent',
  'Southwest Highlands',
  'Eastern Highlands',
  'Western Highlands',
  'Northern Savannah',
  'Semi-Arid Northeast',
];

// ── Major markets ─────────────────────────────────────────────────────────────
const MAJOR_MARKETS = [
  { name: 'Owino Market', district: 'Kampala' },
  { name: 'Nakasero Market', district: 'Kampala' },
  { name: 'Kalerwe Market', district: 'Kampala' },
  { name: 'Jinja Road Market', district: 'Kampala' },
  { name: 'Masaka Central Market', district: 'Masaka' },
  { name: 'Mbarara Municipal Market', district: 'Mbarara' },
  { name: 'Gulu Central Market', district: 'Gulu' },
  { name: 'Mbale Central Market', district: 'Mbale' },
  { name: 'Arua Market', district: 'Arua' },
  { name: 'Fort Portal Market', district: 'Fort Portal' },
];

/**
 * Seed price baselines per crop (UGX / kg unless noted).
 * These represent 2024–2026 typical Ugandan market prices.
 * Sources: UCDA price bulletins, UBOS agricultural surveys.
 */
const PRICE_BASELINES = {
  Coffee: {
    farm_gate: 8500,   // UGX/kg cherry (robusta)
    market: 9800,      // UGX/kg processed
    export: 12500,     // UGX/kg green bean equivalent (UCDA export benchmark)
    unit: 'UGX/kg',
  },
  Maize: {
    farm_gate: 750,    // UGX/kg
    market: 950,       // UGX/kg
    export: null,      // domestic staple
    unit: 'UGX/kg',
  },
  Beans: {
    farm_gate: 2800,   // UGX/kg
    market: 3400,      // UGX/kg
    export: 4200,      // UGX/kg (export grade)
    unit: 'UGX/kg',
  },
  'Hass Avocado': {
    farm_gate: 1200,   // UGX/kg
    market: 1800,      // UGX/kg
    export: 4500,      // UGX/kg (export grade, EU/Gulf markets)
    unit: 'UGX/kg',
  },
};

/** Deterministic pseudo-random variance to simulate real market fluctuation */
function priceVariance(base, seed, pct = 0.15) {
  const x = Math.sin(seed) * 10000;
  const rand = x - Math.floor(x); // 0-1
  return Math.round(base * (1 + (rand - 0.5) * 2 * pct));
}

function isoDate(daysAgo = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function agroZoneForDistrict(district) {
  const map = {
    Kampala: 'Lake Victoria Crescent',
    Wakiso: 'Lake Victoria Crescent',
    Mukono: 'Lake Victoria Crescent',
    Masaka: 'Lake Victoria Crescent',
    Kalangala: 'Lake Victoria Crescent',
    Kabale: 'Southwest Highlands',
    Kisoro: 'Southwest Highlands',
    Kanungu: 'Southwest Highlands',
    Rukungiri: 'Southwest Highlands',
    Mbarara: 'Southwest Highlands',
    Mbale: 'Eastern Highlands',
    Sironko: 'Eastern Highlands',
    Bulambuli: 'Eastern Highlands',
    Kapchorwa: 'Eastern Highlands',
    Bududa: 'Eastern Highlands',
    'Fort Portal': 'Western Highlands',
    Kasese: 'Western Highlands',
    Kamwenge: 'Western Highlands',
    Kyenjojo: 'Western Highlands',
    Gulu: 'Northern Savannah',
    Lira: 'Northern Savannah',
    Apac: 'Northern Savannah',
    Arua: 'Northern Savannah',
    Nebbi: 'Northern Savannah',
  };
  return map[district] || 'Lake Victoria Crescent';
}

/**
 * Generate synthetic price records representative of Uganda market data.
 * In production, this function would query the UCDA/UBOS APIs or a
 * PostgreSQL table populated by an ETL pipeline.
 */
function generatePriceRecords({ crop, district, market, page = 1, limit = 20 }) {
  const allRecords = [];
  let id = 1;

  for (const c of (crop ? [crop] : UGANDA_CROPS)) {
    const baseline = PRICE_BASELINES[c];
    if (!baseline) continue;

    const markets = market
      ? MAJOR_MARKETS.filter((m) => m.name.toLowerCase().includes(market.toLowerCase()))
      : MAJOR_MARKETS;

    for (const mkt of markets) {
      if (district && mkt.district.toLowerCase() !== district.toLowerCase()) continue;
      const seed = id * 31 + c.charCodeAt(0);
      allRecords.push({
        id: `mp-${id}`,
        crop: c,
        market_name: mkt.name,
        district: mkt.district,
        agro_ecological_zone: agroZoneForDistrict(mkt.district),
        farm_gate_price: priceVariance(baseline.farm_gate, seed),
        market_price: priceVariance(baseline.market, seed + 7),
        export_price: baseline.export ? priceVariance(baseline.export, seed + 13) : null,
        unit: baseline.unit,
        currency: 'UGX',
        recorded_date: isoDate(id % 7),
        source: c === 'Coffee' ? 'UCDA' : 'UBOS / District Market Monitor',
        price_trend: seed % 3 === 0 ? 'up' : seed % 3 === 1 ? 'down' : 'stable',
      });
      id++;
    }
  }

  const total = allRecords.length;
  const start = (page - 1) * limit;
  return { data: allRecords.slice(start, start + limit), total, page, limit };
}

/**
 * GET /api/market-prices
 * Query params: crop, district, market, page, limit
 */
marketRouter.get('/', (req, res) => {
  const { crop, district, market, page = 1, limit = 20 } = req.query;
  const result = generatePriceRecords({
    crop: crop || null,
    district: district || null,
    market: market || null,
    page: Number(page),
    limit: Number(limit),
  });
  res.json(result);
});

/**
 * GET /api/market-prices/trends
 * Returns 30/60/90-day price history for a crop.
 * Query params: crop (required), period_days (default 30), district
 */
marketRouter.get('/trends', (req, res) => {
  const { crop = 'Coffee', period_days = 30, district } = req.query;
  const baseline = PRICE_BASELINES[crop] || PRICE_BASELINES['Coffee'];
  const days = Math.min(Number(period_days), 365);

  const data = Array.from({ length: days }, (_, i) => {
    const seed = i * 17 + crop.charCodeAt(0);
    return {
      date: isoDate(days - i),
      farm_gate_price: priceVariance(baseline.farm_gate, seed, 0.12),
      market_price: priceVariance(baseline.market, seed + 5, 0.12),
      export_price: baseline.export ? priceVariance(baseline.export, seed + 9, 0.08) : null,
      district: district || 'National Average',
    };
  });

  res.json({ crop, period_days: days, district: district || 'National Average', data });
});

/**
 * GET /api/market-prices/ucda
 * UCDA coffee export price bulletin (simulated).
 * In production: fetches from https://www.ugandacoffee.go.ug/ or UCDA data feed.
 */
marketRouter.get('/ucda', (req, res) => {
  const today = isoDate();
  res.json({
    source: 'Uganda Coffee Development Authority (UCDA)',
    bulletin_date: today,
    disclaimer: 'Prices are indicative. Contact UCDA for official benchmarks.',
    export_prices: [
      { grade: 'Robusta Screen 18', price_usd_per_tonne: 2150, price_ugx_per_kg: 8200, market: 'FOB Mombasa' },
      { grade: 'Robusta Screen 15', price_usd_per_tonne: 1980, price_ugx_per_kg: 7550, market: 'FOB Mombasa' },
      { grade: 'Arabica Bugisu AA', price_usd_per_tonne: 4200, price_ugx_per_kg: 16000, market: 'FOB Mombasa' },
      { grade: 'Arabica Bugisu AB', price_usd_per_tonne: 3800, price_ugx_per_kg: 14500, market: 'FOB Mombasa' },
    ],
    farm_gate: {
      robusta_cherry: { price_ugx_per_kg: 850, region: 'Central Uganda' },
      arabica_cherry: { price_ugx_per_kg: 2200, region: 'Mt Elgon / Western Highlands' },
    },
    exchange_rate: { usd_ugx: 3810 },
  });
});

/**
 * GET /api/market-prices/ubos
 * UBOS national commodity price statistics (simulated).
 * In production: fetches from UBOS Statistical Abstract or CPI data releases.
 */
marketRouter.get('/ubos', (req, res) => {
  const year = new Date().getFullYear();
  res.json({
    source: 'Uganda Bureau of Statistics (UBOS)',
    reference_year: year,
    disclaimer: 'Based on UBOS Annual Agricultural Survey and Consumer Price Index.',
    national_average_prices: UGANDA_CROPS.map((crop) => {
      const b = PRICE_BASELINES[crop];
      return {
        crop,
        farm_gate_ugx_per_kg: b.farm_gate,
        market_ugx_per_kg: b.market,
        export_ugx_per_kg: b.export || null,
        unit: b.unit,
        yoy_change_pct: crop === 'Coffee' ? 8.5 : crop === 'Maize' ? -2.1 : crop === 'Beans' ? 5.3 : 15.2,
        data_source: crop === 'Coffee' ? 'UCDA / UBOS' : 'UBOS Agricultural Survey',
      };
    }),
    regional_breakdown: AGRO_ZONES.map((zone, zi) => ({
      zone,
      crops: UGANDA_CROPS.map((crop) => {
        const b = PRICE_BASELINES[crop];
        const variance = 1 + (zi - 2.5) * 0.04; // zone price differential
        return {
          crop,
          avg_farm_gate_ugx_per_kg: Math.round(b.farm_gate * variance),
        };
      }),
    })),
  });
});

/**
 * GET /api/market-prices/districts
 * Returns current prices grouped by district for map visualisation.
 */
marketRouter.get('/districts', (req, res) => {
  const { crop = 'Maize' } = req.query;
  const baseline = PRICE_BASELINES[crop] || PRICE_BASELINES['Maize'];

  const data = UGANDA_DISTRICTS.map((district, i) => ({
    district,
    agro_ecological_zone: agroZoneForDistrict(district),
    crop,
    farm_gate_price: priceVariance(baseline.farm_gate, i * 23, 0.2),
    market_price: priceVariance(baseline.market, i * 23 + 11, 0.2),
    unit: baseline.unit,
    currency: 'UGX',
    last_updated: isoDate(i % 5),
  }));

  res.json({ crop, data });
});
