import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const mapsRouter = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISTRICTS_PATH = path.join(__dirname, '..', '..', 'frontend', 'public', 'data', 'uganda-districts.geojson');

function loadDistrictFeatures() {
  try {
    const raw = fs.readFileSync(DISTRICTS_PATH, 'utf8');
    const geo = JSON.parse(raw);
    return Array.isArray(geo.features) ? geo.features : [];
  } catch {
    return [];
  }
}

function demoSearch(query, type) {
  const q = query.toLowerCase();
  const features = loadDistrictFeatures();
  const matches = features
    .filter((f) => {
      const name = (f.properties?.name ?? f.properties?.district_name ?? '').toLowerCase();
      return name.includes(q);
    })
    .slice(0, 8)
    .map((f) => {
      const name = f.properties?.name ?? f.properties?.district_name ?? 'Unknown';
      const coords = f.geometry?.type === 'Polygon' ? f.geometry.coordinates[0] : null;
      let lat = 1.37;
      let lng = 32.29;
      if (coords?.length) {
        const mid = Math.floor(coords.length / 2);
        lng = coords[mid][0];
        lat = coords[mid][1];
      }
      return {
        title: name,
        subtitle: 'District, Uganda',
        type: 'district',
        lat,
        lng,
        source: 'local',
      };
    });

  if (type === 'agricultural_zone') {
    return matches.map((m) => ({
      ...m,
      title: `${m.title} Agricultural Zone`,
      type: 'agricultural_zone',
      subtitle: 'Agro-ecological zone (demo)',
    }));
  }

  if (type === 'town') {
    return matches.slice(0, 5).map((m) => ({
      ...m,
      title: `${m.title} Town`,
      type: 'town',
      subtitle: 'Town centre (demo)',
    }));
  }

  return matches;
}

async function serpApiSearch(query, type) {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return demoSearch(query, type);

  const typeQuery =
    type === 'district'
      ? `${query} district Uganda`
      : type === 'town'
        ? `${query} town Uganda`
        : type === 'agricultural_zone'
          ? `${query} agricultural zone Uganda farming`
          : `${query} Uganda`;

  const params = new URLSearchParams({
    engine: 'google_maps',
    q: typeQuery,
    type: 'search',
    api_key: apiKey,
    hl: 'en',
    gl: 'ug',
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`SerpApi error ${res.status}`);
  const data = await res.json();

  const places = data.local_results ?? data.place_results ?? [];
  const list = Array.isArray(places) ? places : places ? [places] : [];

  return list.slice(0, 10).map((place) => ({
    title: place.title ?? place.name ?? query,
    subtitle: place.address ?? place.type ?? 'Uganda',
    type: type ?? 'location',
    lat: place.gps_coordinates?.latitude ?? place.latitude,
    lng: place.gps_coordinates?.longitude ?? place.longitude,
    rating: place.rating,
    source: 'serpapi',
  })).filter((p) => p.lat != null && p.lng != null);
}

mapsRouter.get('/search', async (req, res) => {
  const query = (req.query.q ?? '').toString().trim();
  const type = (req.query.type ?? 'location').toString();

  if (!query || query.length < 2) {
    return res.status(400).json({ message: 'Query must be at least 2 characters' });
  }

  try {
    const results = await serpApiSearch(query, type);
    return res.json({
      query,
      type,
      count: results.length,
      source: process.env.SERPAPI_KEY ? 'serpapi' : 'local',
      results,
    });
  } catch (err) {
    console.warn('[maps/search]', err.message);
    const fallback = demoSearch(query, type);
    return res.json({
      query,
      type,
      count: fallback.length,
      source: 'local',
      results: fallback,
      warning: 'SerpApi unavailable — using local district data',
    });
  }
});

mapsRouter.get('/zones', (_req, res) => {
  const features = loadDistrictFeatures();
  const zones = features.map((f) => {
    const name = f.properties?.name ?? f.properties?.district_name ?? 'Unknown';
    const crop = f.properties?.dominant_crop ?? f.properties?.crop ?? 'Mixed';
    return {
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name: `${name} Zone`,
      district: name,
      crop,
      type: 'agricultural_zone',
    };
  });
  res.json({ count: zones.length, zones });
});

mapsRouter.get('/suggest', async (req, res) => {
  const query = (req.query.q ?? '').toString().trim();
  if (!query) return res.json({ suggestions: [] });

  const [locations, districts, towns, zones] = await Promise.all([
    serpApiSearch(query, 'location').catch(() => demoSearch(query, 'location')),
    serpApiSearch(query, 'district').catch(() => demoSearch(query, 'district')),
    serpApiSearch(query, 'town').catch(() => demoSearch(query, 'town')),
    serpApiSearch(query, 'agricultural_zone').catch(() => demoSearch(query, 'agricultural_zone')),
  ]);

  res.json({
    query,
    suggestions: [
      ...locations.slice(0, 3),
      ...districts.slice(0, 3),
      ...towns.slice(0, 2),
      ...zones.slice(0, 2),
    ],
  });
});
