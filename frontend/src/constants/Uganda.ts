/**
 * Uganda DDSS — Domain Constants
 * Source references:
 *   - MAAIF Agricultural sector strategic plan
 *   - UBOS Statistical Abstract (districts)
 *   - NARO agro-ecological zone classification
 *   - UCDA crop calendars
 */

// ── Focus Crops ───────────────────────────────────────────────────────────────
export const UGANDA_FOCUS_CROPS = ['Coffee', 'Maize', 'Beans', 'Hass Avocado'] as const;
export type UgandaCrop = (typeof UGANDA_FOCUS_CROPS)[number];

export const CROP_METADATA: Record<
  UgandaCrop,
  { emoji: string; description: string; primaryZone: string; season: string; dataSource: string }
> = {
  Coffee: {
    emoji: '☕',
    description: 'Major export crop — Robusta (Central/West) and Arabica (Eastern Highlands)',
    primaryZone: 'Southwest Highlands / Eastern Highlands',
    season: 'Biannual harvest (Oct–Dec main; Apr–Jun fly)',
    dataSource: 'UCDA',
  },
  Maize: {
    emoji: '🌽',
    description: 'Primary food security staple grown across all agro-ecological zones',
    primaryZone: 'Northern Savannah / Lake Victoria Crescent',
    season: 'Season A (Mar–Jun) and Season B (Aug–Nov)',
    dataSource: 'MAAIF / UBOS',
  },
  Beans: {
    emoji: '🫘',
    description: 'Key nutrition crop and household income source',
    primaryZone: 'Southwest Highlands / Eastern Highlands',
    season: 'Season A (Mar–Jun) and Season B (Aug–Nov)',
    dataSource: 'MAAIF / UBOS',
  },
  'Hass Avocado': {
    emoji: '🥑',
    description: 'Emerging export crop with high EU/Gulf market demand',
    primaryZone: 'Western Highlands / Southwest Highlands',
    season: 'Main harvest Jun–Sep',
    dataSource: 'MAAIF / UCDA',
  },
};

// ── Agro-Ecological Zones (NARO classification) ───────────────────────────────
export const AGRO_ECOLOGICAL_ZONES = [
  'Lake Victoria Crescent',
  'Southwest Highlands',
  'Eastern Highlands',
  'Western Highlands',
  'Northern Savannah',
  'Semi-Arid Northeast',
] as const;

// ── Uganda Districts (UBOS 2020 enumeration, representative list) ─────────────
export const UGANDA_DISTRICTS = [
  // Central
  'Kampala', 'Wakiso', 'Mukono', 'Masaka', 'Kalangala', 'Mpigi', 'Buikwe', 'Kayunga',
  // Western / Southwest
  'Mbarara', 'Kabale', 'Kisoro', 'Kanungu', 'Rukungiri', 'Ntungamo', 'Isingiro',
  'Fort Portal', 'Kasese', 'Kamwenge', 'Kyenjojo', 'Kabarole',
  // Eastern / Mt Elgon
  'Mbale', 'Sironko', 'Bulambuli', 'Kapchorwa', 'Bududa', 'Manafwa', 'Jinja',
  'Iganga', 'Tororo', 'Busia', 'Soroti', 'Kumi', 'Pallisa',
  // Northern
  'Gulu', 'Lira', 'Apac', 'Arua', 'Nebbi', 'Adjumani', 'Moyo', 'Kitgum', 'Pader',
  // Northeast (KARAMOJA)
  'Moroto', 'Kotido', 'Abim', 'Nakapiripirit',
] as const;

// ── Agricultural Seasons ──────────────────────────────────────────────────────
export const UGANDA_SEASONS = ['Season A', 'Season B'] as const;

// ── Major Market Centers ──────────────────────────────────────────────────────
export const MAJOR_MARKETS = [
  { name: 'Owino Market', district: 'Kampala', type: 'Urban' },
  { name: 'Nakasero Market', district: 'Kampala', type: 'Urban' },
  { name: 'Kalerwe Market', district: 'Kampala', type: 'Urban' },
  { name: 'Masaka Central Market', district: 'Masaka', type: 'Regional' },
  { name: 'Mbarara Municipal Market', district: 'Mbarara', type: 'Regional' },
  { name: 'Gulu Central Market', district: 'Gulu', type: 'Regional' },
  { name: 'Mbale Central Market', district: 'Mbale', type: 'Regional' },
  { name: 'Arua Market', district: 'Arua', type: 'Regional' },
  { name: 'Fort Portal Market', district: 'Fort Portal', type: 'Regional' },
  { name: 'Kasese Market', district: 'Kasese', type: 'Rural' },
] as const;

// ── Data Source Labels ────────────────────────────────────────────────────────
export const DATA_SOURCES = {
  MAAIF: 'Ministry of Agriculture, Animal Industry and Fisheries (MAAIF)',
  NARO: 'National Agricultural Research Organisation (NARO)',
  UNMA: 'Uganda National Meteorological Authority (UNMA)',
  UBOS: 'Uganda Bureau of Statistics (UBOS)',
  UCDA: 'Uganda Coffee Development Authority (UCDA)',
} as const;

// ── Color Palette (Uganda Agricultural DDSS) ──────────────────────────────────
export const UGANDA_PALETTE = {
  forestGreen: '#228B22',   // primary
  earthBrown: '#8B4513',    // secondary
  goldenYellow: '#FFD700',  // accent
  lightBeige: '#F5F5DC',    // background
  // Derived tints for charts
  greenLight: '#4CAF50',
  greenDark: '#1B5E20',
  brownLight: '#A0522D',
  yellowLight: '#FFF176',
} as const;

// ── Chart Colors for Uganda focus crops ──────────────────────────────────────
export const CROP_CHART_COLORS: Record<UgandaCrop, string> = {
  Coffee: '#4e342e',          // dark brown
  Maize: '#f9a825',           // golden
  Beans: '#558b2f',           // olive green
  'Hass Avocado': '#2e7d32',  // forest green
};

// ── Luganda translations for key terms ───────────────────────────────────────
export const LUGANDA = {
  weather: 'Obudde',
  crop: 'Emboga / Ensigo',
  market: 'Kibazo',
  price: 'Omuwendo',
  farmer: 'Mukulima',
  advisory: 'Okulabirira',
  district: 'Ssaza',
  season: 'Obudde bw\'okulima',
  harvest: 'Okukungula',
  soil: 'Ttaka',
  rainfall: 'Enkuba',
} as const;
