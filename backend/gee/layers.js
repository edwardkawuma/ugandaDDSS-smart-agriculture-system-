import { ee, isGeeReady } from './initialize.js';

/** Uganda boundary from LSIB (US State Dept) — used to clip all raster layers. */
function ugandaGeometry() {
  return ee
    .FeatureCollection('USDOS/LSIB_SIMPLE/2017')
    .filter(ee.Filter.eq('country_na', 'Uganda'))
    .geometry();
}

export const LAYER_CATALOG = [
  {
    id: 'crop-distribution',
    name: 'Crop / Land Cover',
    description: 'ESA WorldCover 2021 land-cover classes clipped to Uganda',
    source: 'ESA/WorldCover/v200',
    legend: [
      { label: 'Tree cover', color: '#006400' },
      { label: 'Shrubland', color: '#ffbb22' },
      { label: 'Grassland', color: '#ffff4c' },
      { label: 'Cropland', color: '#f096ff' },
      { label: 'Built-up', color: '#fa0000' },
      { label: 'Water', color: '#0064c8' },
    ],
  },
  {
    id: 'soil-quality',
    name: 'Soil Texture (USDA)',
    description: 'OpenLandMap soil texture classification at 250 m resolution',
    source: 'OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02_0',
    legend: [
      { label: 'Clay', color: '#8c510a' },
      { label: 'Silty clay', color: '#bf812d' },
      { label: 'Loam', color: '#dfc27d' },
      { label: 'Sandy loam', color: '#f6e8c3' },
      { label: 'Sand', color: '#c7eae5' },
    ],
  },
  {
    id: 'rainfall',
    name: 'Annual Rainfall (CHIRPS)',
    description: 'CHIRPS daily precipitation summed over the last 12 months',
    source: 'UCSB-CHG/CHIRPS/DAILY',
    legend: [
      { label: '< 800 mm', color: '#ffffcc' },
      { label: '800–1200 mm', color: '#a1dab4' },
      { label: '1200–1600 mm', color: '#41b6c4' },
      { label: '> 1600 mm', color: '#225ea8' },
    ],
  },
  {
    id: 'ndvi',
    name: 'Vegetation Health (NDVI)',
    description: 'Sentinel-2 median NDVI — proxy for crop vigour',
    source: 'COPERNICUS/S2_SR_HARMONIZED',
    legend: [
      { label: 'Sparse', color: '#d73027' },
      { label: 'Moderate', color: '#fee08b' },
      { label: 'Healthy', color: '#1a9850' },
    ],
  },
];

function buildLayerImage(layerId) {
  const uganda = ugandaGeometry();

  switch (layerId) {
    case 'crop-distribution': {
      const image = ee.Image('ESA/WorldCover/v200').select('Map').clip(uganda);
      return {
        image,
        vis: {
          min: 10,
          max: 100,
          palette: ['006400', 'ffbb22', 'ffff4c', 'f096ff', 'fa0000', '0064c8'],
        },
      };
    }
    case 'soil-quality': {
      const image = ee
        .Image('OpenLandMap/SOL/SOL_TEXTURE-CLASS_USDA-TT_M/v02_0')
        .select('b0')
        .clip(uganda);
      return {
        image,
        vis: { min: 1, max: 12, palette: ['8c510a', 'bf812d', 'dfc27d', 'f6e8c3', 'c7eae5'] },
      };
    }
    case 'rainfall': {
      const end = ee.Date(Date.now());
      const start = end.advance(-1, 'year');
      const image = ee
        .ImageCollection('UCSB-CHG/CHIRPS/DAILY')
        .filterDate(start, end)
        .select('precipitation')
        .sum()
        .clip(uganda);
      return {
        image,
        vis: { min: 600, max: 1800, palette: ['ffffcc', 'a1dab4', '41b6c4', '225ea8'] },
      };
    }
    case 'ndvi': {
      const end = ee.Date(Date.now());
      const start = end.advance(-6, 'month');
      const collection = ee
        .ImageCollection('COPERNICUS/S2_SR_HARMONIZED')
        .filterBounds(uganda)
        .filterDate(start, end)
        .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20));
      const image = collection
        .median()
        .normalizedDifference(['B8', 'B4'])
        .rename('NDVI')
        .clip(uganda);
      return {
        image,
        vis: { min: 0.1, max: 0.8, palette: ['d73027', 'fee08b', '1a9850'] },
      };
    }
    default:
      throw new Error(`Unknown layer: ${layerId}`);
  }
}

/**
 * Returns a mapId + token for Leaflet tile integration, or null in demo mode.
 */
export function getMapTiles(layerId) {
  if (!isGeeReady()) return null;

  const meta = LAYER_CATALOG.find((l) => l.id === layerId);
  if (!meta) throw new Error(`Unknown layer: ${layerId}`);

  const { image, vis } = buildLayerImage(layerId);
  const mapId = image.getMapId(vis);
  return {
    mapId: mapId.mapid,
    token: mapId.token,
    tileUrl: `https://earthengine.googleapis.com/v1/${mapId.mapid}/tiles/{z}/{x}/{y}`,
  };
}

export function listLayers(mode) {
  return LAYER_CATALOG.map((layer) => ({
    ...layer,
    available: mode === 'gee',
  }));
}
