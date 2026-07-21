import { Router } from 'express';

export const demoDataRouter = Router();

const WEATHER_CURRENT = {
  district: 'Kampala',
  temperature: 26.4,
  rainfall: 8.2,
  humidity: 78,
  wind_speed: 12.1,
  condition: 'Partly Cloudy',
  anomaly_flag: false,
  season_position: 'Long Rains - Mid Season',
  recorded_at: new Date().toISOString(),
};

const WEATHER_FORECAST = [
  { date: '2026-07-22', temperature_min: 18, temperature_max: 27, rainfall: 6.5, humidity: 80, wind_speed: 11.3, condition: 'Light Rain' },
  { date: '2026-07-23', temperature_min: 17, temperature_max: 26, rainfall: 9.1, humidity: 84, wind_speed: 10.2, condition: 'Rain Showers' },
  { date: '2026-07-24', temperature_min: 18, temperature_max: 28, rainfall: 4.4, humidity: 76, wind_speed: 12.9, condition: 'Cloudy' },
  { date: '2026-07-25', temperature_min: 19, temperature_max: 29, rainfall: 2.8, humidity: 72, wind_speed: 13.7, condition: 'Partly Cloudy' },
  { date: '2026-07-26', temperature_min: 18, temperature_max: 27, rainfall: 7.6, humidity: 81, wind_speed: 10.8, condition: 'Light Rain' },
  { date: '2026-07-27', temperature_min: 17, temperature_max: 26, rainfall: 12.3, humidity: 87, wind_speed: 9.5, condition: 'Heavy Rain' },
  { date: '2026-07-28', temperature_min: 18, temperature_max: 27, rainfall: 5.7, humidity: 79, wind_speed: 11.7, condition: 'Cloudy' },
  { date: '2026-07-29', temperature_min: 18, temperature_max: 28, rainfall: 3.9, humidity: 75, wind_speed: 12.2, condition: 'Sunny Intervals' },
  { date: '2026-07-30', temperature_min: 19, temperature_max: 29, rainfall: 1.8, humidity: 70, wind_speed: 14.1, condition: 'Mostly Sunny' },
  { date: '2026-07-31', temperature_min: 18, temperature_max: 27, rainfall: 6.2, humidity: 78, wind_speed: 11.4, condition: 'Light Rain' },
];

const WEATHER_HISTORICAL = [
  { date: '2026-07-01', district: 'Kampala', agro_ecological_zone: 'Lake Victoria Crescent', temperature: 25.7, rainfall: 4.9, humidity: 76, wind_speed: 10.4, season: 'Season B' },
  { date: '2026-07-02', district: 'Mukono', agro_ecological_zone: 'Lake Victoria Crescent', temperature: 24.9, rainfall: 7.3, humidity: 81, wind_speed: 9.8, season: 'Season B' },
  { date: '2026-07-03', district: 'Mbarara', agro_ecological_zone: 'Southwestern Highlands', temperature: 23.4, rainfall: 2.7, humidity: 69, wind_speed: 12.6, season: 'Season B' },
  { date: '2026-07-04', district: 'Gulu', agro_ecological_zone: 'Northern Moist Farmlands', temperature: 27.1, rainfall: 5.4, humidity: 73, wind_speed: 13.1, season: 'Season B' },
  { date: '2026-07-05', district: 'Mbale', agro_ecological_zone: 'Eastern Highlands', temperature: 22.6, rainfall: 8.1, humidity: 83, wind_speed: 8.7, season: 'Season B' },
  { date: '2026-07-06', district: 'Masindi', agro_ecological_zone: 'Western Savannah Grasslands', temperature: 26.3, rainfall: 3.6, humidity: 71, wind_speed: 12.4, season: 'Season B' },
  { date: '2026-07-07', district: 'Kabale', agro_ecological_zone: 'Southwestern Highlands', temperature: 20.8, rainfall: 9.8, humidity: 88, wind_speed: 7.3, season: 'Season B' },
  { date: '2026-07-08', district: 'Jinja', agro_ecological_zone: 'Lake Victoria Crescent', temperature: 25.2, rainfall: 6.7, humidity: 79, wind_speed: 10.9, season: 'Season B' },
  { date: '2026-07-09', district: 'Lira', agro_ecological_zone: 'Northern Moist Farmlands', temperature: 26.7, rainfall: 2.1, humidity: 67, wind_speed: 14.2, season: 'Season B' },
  { date: '2026-07-10', district: 'Wakiso', agro_ecological_zone: 'Lake Victoria Crescent', temperature: 24.7, rainfall: 7.9, humidity: 82, wind_speed: 9.6, season: 'Season B' },
  { date: '2026-07-11', district: 'Kampala', agro_ecological_zone: 'Lake Victoria Crescent', temperature: 25.9, rainfall: 3.2, humidity: 74, wind_speed: 11.8, season: 'Season B' },
  { date: '2026-07-12', district: 'Mukono', agro_ecological_zone: 'Lake Victoria Crescent', temperature: 24.8, rainfall: 5.6, humidity: 77, wind_speed: 10.5, season: 'Season B' },
];

const ALERTS = [
  { id: 'alt-001', type: 'pest_outbreak', alert_level: 'high', title: 'Fall Armyworm risk elevated', description: 'Scouting reports show increased larvae incidence in maize fields.', district: 'Mbarara', agro_ecological_zone: 'Southwestern Highlands', issued_at: '2026-07-18T08:00:00Z', expires_at: '2026-07-24T23:59:59Z', affected_crops: ['Maize'] },
  { id: 'alt-002', type: 'disease', alert_level: 'medium', title: 'Coffee leaf rust pressure rising', description: 'Humidity has remained above threshold for rust spread.', district: 'Mukono', agro_ecological_zone: 'Lake Victoria Crescent', issued_at: '2026-07-19T09:30:00Z', expires_at: '2026-07-26T23:59:59Z', affected_crops: ['Coffee'] },
  { id: 'alt-003', type: 'weather', alert_level: 'high', title: 'Heavy rain expected in highlands', description: 'Forecast models predict high-intensity rainfall in eastern districts.', district: 'Mbale', agro_ecological_zone: 'Eastern Highlands', issued_at: '2026-07-20T05:45:00Z', expires_at: '2026-07-22T23:59:59Z', affected_crops: ['Beans', 'Maize'] },
  { id: 'alt-004', type: 'drought_watch', alert_level: 'low', title: 'Moisture stress watch', description: 'Soil moisture index trending low in selected northern parishes.', district: 'Lira', agro_ecological_zone: 'Northern Moist Farmlands', issued_at: '2026-07-17T10:15:00Z', expires_at: '2026-07-30T23:59:59Z', affected_crops: ['Cassava', 'Sorghum'] },
  { id: 'alt-005', type: 'market_disruption', alert_level: 'medium', title: 'Bean price volatility alert', description: 'Rapid market fluctuations reported in district markets.', district: 'Gulu', agro_ecological_zone: 'Northern Moist Farmlands', issued_at: '2026-07-16T12:00:00Z', expires_at: '2026-07-28T23:59:59Z', affected_crops: ['Beans'] },
];

const PEST_ALERTS = [
  { id: 'pal-001', pest_name: 'Fall Armyworm', type: 'insect', crop: 'Maize', alert_level: 'high', description: 'Egg masses and early instars observed in multiple fields.', scouting_action: 'Inspect whorls twice weekly.', treatment_options: 'Use approved bio-pesticide or selective insecticide.', triggered_by: 'NDVI decline + field reports', district: 'Mbarara', issued_at: '2026-07-18T08:00:00Z', forecast_days_ahead: 7 },
  { id: 'pal-002', pest_name: 'Coffee Berry Borer', type: 'insect', crop: 'Coffee', alert_level: 'medium', description: 'Trap counts exceeded warning threshold.', scouting_action: 'Increase trap density and monitor berry damage.', treatment_options: 'Timely sanitation and targeted control.', triggered_by: 'Humidity and temperature window', district: 'Mukono', issued_at: '2026-07-19T09:30:00Z', forecast_days_ahead: 10 },
  { id: 'pal-003', pest_name: 'Bean Fly', type: 'insect', crop: 'Beans', alert_level: 'low', description: 'Localized activity detected in early planting blocks.', scouting_action: 'Check seedling stems for tunneling.', treatment_options: 'Use resistant seed and rotate fields.', triggered_by: 'Field extension reports', district: 'Mbale', issued_at: '2026-07-20T11:00:00Z', forecast_days_ahead: 5 },
];

const TREATMENTS = [
  { id: 'trt-001', pest_name: 'Fall Armyworm', crop: 'Maize', method: 'Integrated Pest Management', product: 'Bt formulation', dose: '1.2 L/ha', interval_days: 7, notes: 'Apply at early larval stage.' },
  { id: 'trt-002', pest_name: 'Coffee Berry Borer', crop: 'Coffee', method: 'Trap + sanitation', product: 'Alcohol traps', dose: '20 traps/ha', interval_days: 14, notes: 'Collect and destroy infested berries.' },
  { id: 'trt-003', pest_name: 'Bean Fly', crop: 'Beans', method: 'Seed treatment', product: 'Approved seed dressing', dose: 'As label', interval_days: 0, notes: 'Treat before planting.' },
];

const POLICY_DISTRICT_MAP = [
  { district_id: 'UG-KLA', district_name: 'Kampala', production_volume: 12000, active_alerts: 2, farmer_count: 18300, advisory_coverage_rate: 84, agro_ecological_zone: 'Lake Victoria Crescent', geojson: '' },
  { district_id: 'UG-MUK', district_name: 'Mukono', production_volume: 9800, active_alerts: 1, farmer_count: 14120, advisory_coverage_rate: 79, agro_ecological_zone: 'Lake Victoria Crescent', geojson: '' },
  { district_id: 'UG-MBR', district_name: 'Mbarara', production_volume: 15600, active_alerts: 1, farmer_count: 16900, advisory_coverage_rate: 81, agro_ecological_zone: 'Southwestern Highlands', geojson: '' },
  { district_id: 'UG-MBL', district_name: 'Mbale', production_volume: 11300, active_alerts: 1, farmer_count: 15340, advisory_coverage_rate: 76, agro_ecological_zone: 'Eastern Highlands', geojson: '' },
  { district_id: 'UG-GUL', district_name: 'Gulu', production_volume: 8700, active_alerts: 1, farmer_count: 12670, advisory_coverage_rate: 72, agro_ecological_zone: 'Northern Moist Farmlands', geojson: '' },
];

const POLICY_SEASON_TRENDS = [
  { crop: 'Maize', season: 'Season B', current_production_mt: 422000, five_year_avg_mt: 398000, variance_pct: 6.03, year: 2026 },
  { crop: 'Coffee', season: 'Season B', current_production_mt: 371000, five_year_avg_mt: 355000, variance_pct: 4.51, year: 2026 },
  { crop: 'Beans', season: 'Season B', current_production_mt: 289000, five_year_avg_mt: 276000, variance_pct: 4.71, year: 2026 },
  { crop: 'Cassava', season: 'Season B', current_production_mt: 214000, five_year_avg_mt: 220000, variance_pct: -2.73, year: 2026 },
];

const CROPS = [
  { id: 'crop-coffee', name: 'Coffee', description: 'Arabica and Robusta value chains', season: 'Season B', agro_ecological_zones: ['Lake Victoria Crescent', 'Southwestern Highlands'], image_url: '' },
  { id: 'crop-maize', name: 'Maize', description: 'Staple crop for food and feed', season: 'Season B', agro_ecological_zones: ['Eastern Highlands', 'Northern Moist Farmlands'], image_url: '' },
  { id: 'crop-beans', name: 'Beans', description: 'Nutrition and household income', season: 'Season B', agro_ecological_zones: ['Eastern Highlands', 'Lake Victoria Crescent'], image_url: '' },
  { id: 'crop-cassava', name: 'Cassava', description: 'Climate-resilient root crop', season: 'Season B', agro_ecological_zones: ['Northern Moist Farmlands', 'Western Savannah Grasslands'], image_url: '' },
  { id: 'crop-avocado', name: 'Hass Avocado', description: 'High-value export crop', season: 'Season B', agro_ecological_zones: ['Southwestern Highlands'], image_url: '' },
];

const DISTRICTS = [
  { id: 'UG-KLA', name: 'Kampala', region: 'Central', agro_ecological_zone: 'Lake Victoria Crescent' },
  { id: 'UG-WAK', name: 'Wakiso', region: 'Central', agro_ecological_zone: 'Lake Victoria Crescent' },
  { id: 'UG-MUK', name: 'Mukono', region: 'Central', agro_ecological_zone: 'Lake Victoria Crescent' },
  { id: 'UG-MBR', name: 'Mbarara', region: 'Western', agro_ecological_zone: 'Southwestern Highlands' },
  { id: 'UG-MBL', name: 'Mbale', region: 'Eastern', agro_ecological_zone: 'Eastern Highlands' },
  { id: 'UG-GUL', name: 'Gulu', region: 'Northern', agro_ecological_zone: 'Northern Moist Farmlands' },
  { id: 'UG-LIR', name: 'Lira', region: 'Northern', agro_ecological_zone: 'Northern Moist Farmlands' },
  { id: 'UG-MAS', name: 'Masindi', region: 'Western', agro_ecological_zone: 'Western Savannah Grasslands' },
  { id: 'UG-JIN', name: 'Jinja', region: 'Eastern', agro_ecological_zone: 'Lake Victoria Crescent' },
  { id: 'UG-KAB', name: 'Kabale', region: 'Western', agro_ecological_zone: 'Southwestern Highlands' },
];

let ADVISORIES = [
  {
    id: 'adv-001',
    title: 'Early scouting for Fall Armyworm',
    content: 'Scout maize fields twice weekly and intervene at early larval stages.',
    target_crops: ['Maize'],
    target_districts: ['Mbarara', 'Mbale'],
    farmer_segment: 'Smallholder',
    linked_alert_id: 'alt-001',
    status: 'published',
    delivery_status: { sms_sent: 1280, email_sent: 312 },
    created_by: 'Extension Officer',
    published_at: '2026-07-18T11:30:00Z',
    created_at: '2026-07-18T10:00:00Z',
    updated_at: '2026-07-18T11:30:00Z',
  },
  {
    id: 'adv-002',
    title: 'Coffee rust preventive spray window',
    content: 'Apply preventive fungicide where humidity remains high for 3+ days.',
    target_crops: ['Coffee'],
    target_districts: ['Mukono', 'Wakiso'],
    farmer_segment: 'Mixed',
    linked_alert_id: 'alt-002',
    status: 'draft',
    delivery_status: { sms_sent: 0, email_sent: 0 },
    created_by: 'District Agronomist',
    published_at: null,
    created_at: '2026-07-19T10:20:00Z',
    updated_at: '2026-07-20T09:10:00Z',
  },
];

let BENEFICIARIES = [
  {
    id: 'ben-001',
    full_name: 'Nakato Sarah',
    phone_number: '+256700111222',
    district: 'Mukono',
    sub_county: 'Seeta',
    programme_id: 'prog-001',
    enrolment_status: 'active',
    crops: ['Coffee', 'Beans'],
    enrolment_date: '2025-03-12',
    last_outcome_date: '2026-06-20',
    practice_adoption_status: 'adopted',
    farm_registrations: [{ farm_id: 'farm-001', farm_name: 'Seeta Block A', gps_lat: 0.35, gps_lng: 32.78 }],
    inputs_received: [{ input_type: 'Seedlings', quantity: 120, date: '2025-04-01' }],
    training_sessions: [{ title: 'Coffee IPM', date: '2025-05-13', assessment_result: 'Passed' }],
    practice_adoption_evidence: 'Mulching and scouting logs submitted',
    outcome_measurements: [{ season: 'Season B', yield_kg_ha: 1850, income_usd: 1220, recorded_at: '2026-06-20' }],
  },
  {
    id: 'ben-002',
    full_name: 'Okello James',
    phone_number: '+256700333444',
    district: 'Gulu',
    sub_county: 'Bardege',
    programme_id: 'prog-002',
    enrolment_status: 'active',
    crops: ['Cassava', 'Maize'],
    enrolment_date: '2025-06-08',
    last_outcome_date: '2026-06-18',
    practice_adoption_status: 'in_progress',
    farm_registrations: [{ farm_id: 'farm-002', farm_name: 'Bardege Plot 3', gps_lat: 2.77, gps_lng: 32.29 }],
    inputs_received: [{ input_type: 'NPK Fertilizer', quantity: 4, date: '2026-03-11' }],
    training_sessions: [{ title: 'Drought-smart farming', date: '2026-04-02', assessment_result: 'Completed' }],
    practice_adoption_evidence: 'Irrigation trial underway',
    outcome_measurements: [{ season: 'Season B', yield_kg_ha: 1410, income_usd: 910, recorded_at: '2026-06-18' }],
  },
  {
    id: 'ben-003',
    full_name: 'Nambasa Ruth',
    phone_number: '+256700555666',
    district: 'Mbale',
    sub_county: 'Industrial',
    programme_id: 'prog-001',
    enrolment_status: 'disengaged',
    crops: ['Beans'],
    enrolment_date: '2024-11-21',
    last_outcome_date: '2025-12-08',
    practice_adoption_status: 'partial',
    farm_registrations: [{ farm_id: 'farm-003', farm_name: 'Mbale Demo Plot', gps_lat: 1.07, gps_lng: 34.17 }],
    inputs_received: [{ input_type: 'Bean seed', quantity: 15, date: '2025-02-09' }],
    training_sessions: [{ title: 'Bean disease management', date: '2025-03-16', assessment_result: 'Completed' }],
    practice_adoption_evidence: 'Partial adoption due to labor constraints',
    outcome_measurements: [{ season: 'Season A', yield_kg_ha: 990, income_usd: 430, recorded_at: '2025-12-08' }],
  },
];

const MONITORING_PROGRAMMES = [
  { id: 'prog-001', name: 'Climate-Smart Coffee Transition', funder: 'UCSATP', start_date: '2025-01-01', end_date: '2027-12-31', status: 'on-track', farmers_targeted: 25000, farmers_reached: 18840, disbursed_usd: 2100000, committed_usd: 3000000, districts: ['Mukono', 'Wakiso', 'Jinja'], crops: ['Coffee'], milestone_count: 12, milestones_achieved: 8 },
  { id: 'prog-002', name: 'Northern Resilience Maize Initiative', funder: 'World Bank', start_date: '2025-04-01', end_date: '2028-03-31', status: 'watch', farmers_targeted: 18000, farmers_reached: 10420, disbursed_usd: 980000, committed_usd: 2200000, districts: ['Gulu', 'Lira'], crops: ['Maize', 'Cassava'], milestone_count: 10, milestones_achieved: 5 },
  { id: 'prog-003', name: 'Bean Productivity Booster', funder: 'IFAD', start_date: '2024-09-01', end_date: '2026-12-31', status: 'on-track', farmers_targeted: 12000, farmers_reached: 10960, disbursed_usd: 760000, committed_usd: 950000, districts: ['Mbale', 'Kabale'], crops: ['Beans'], milestone_count: 8, milestones_achieved: 7 },
];

const NATIONAL_PRODUCTION = [
  { id: 'nat-001', crop: 'Maize', district: 'Mbarara', agro_ecological_zone: 'Southwestern Highlands', season: 'Season B', year: 2026, production_volume_mt: 84200, area_hectares: 41200, yield_kg_per_ha: 2044, source: 'MAAIF' },
  { id: 'nat-002', crop: 'Coffee', district: 'Mukono', agro_ecological_zone: 'Lake Victoria Crescent', season: 'Season B', year: 2026, production_volume_mt: 51900, area_hectares: 22800, yield_kg_per_ha: 2276, source: 'UCDA' },
  { id: 'nat-003', crop: 'Beans', district: 'Mbale', agro_ecological_zone: 'Eastern Highlands', season: 'Season B', year: 2026, production_volume_mt: 47600, area_hectares: 28700, yield_kg_per_ha: 1659, source: 'MAAIF' },
  { id: 'nat-004', crop: 'Cassava', district: 'Gulu', agro_ecological_zone: 'Northern Moist Farmlands', season: 'Season B', year: 2026, production_volume_mt: 39800, area_hectares: 24400, yield_kg_per_ha: 1631, source: 'NARO' },
  { id: 'nat-005', crop: 'Coffee', district: 'Jinja', agro_ecological_zone: 'Lake Victoria Crescent', season: 'Season B', year: 2026, production_volume_mt: 28500, area_hectares: 12900, yield_kg_per_ha: 2209, source: 'UCDA' },
];

const NATIONAL_TRENDS = [
  { crop: 'Maize', district: 'Mbarara', year: 2022, production_volume_mt: 74100, yield_kg_per_ha: 1840, food_security_target_mt: 77000, target_achievement_pct: 96.2 },
  { crop: 'Maize', district: 'Mbarara', year: 2023, production_volume_mt: 76800, yield_kg_per_ha: 1884, food_security_target_mt: 79000, target_achievement_pct: 97.2 },
  { crop: 'Maize', district: 'Mbarara', year: 2024, production_volume_mt: 80300, yield_kg_per_ha: 1943, food_security_target_mt: 81000, target_achievement_pct: 99.1 },
  { crop: 'Maize', district: 'Mbarara', year: 2025, production_volume_mt: 82100, yield_kg_per_ha: 2001, food_security_target_mt: 83000, target_achievement_pct: 98.9 },
  { crop: 'Maize', district: 'Mbarara', year: 2026, production_volume_mt: 84200, yield_kg_per_ha: 2044, food_security_target_mt: 85000, target_achievement_pct: 99.1 },
  { crop: 'Coffee', district: 'Mukono', year: 2026, production_volume_mt: 51900, yield_kg_per_ha: 2276, food_security_target_mt: 53000, target_achievement_pct: 97.9 },
  { crop: 'Beans', district: 'Mbale', year: 2026, production_volume_mt: 47600, yield_kg_per_ha: 1659, food_security_target_mt: 49000, target_achievement_pct: 97.1 },
];

function toInt(value, fallback) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function paginate(list, pageValue, limitValue) {
  const page = toInt(pageValue, 1);
  const limit = toInt(limitValue, 10);
  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const data = list.slice(start, start + limit);
  return { data, total, page, limit, totalPages };
}

function contains(value, term) {
  if (!term) return true;
  return String(value ?? '').toLowerCase().includes(String(term).toLowerCase());
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

demoDataRouter.get('/crops/list', (req, res) => {
  const list = CROPS.filter((row) => contains(row.name, req.query.search));
  res.json({ message: 'Crops demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/districts/list', (req, res) => {
  const list = DISTRICTS.filter((row) =>
    contains(row.name, req.query.search) || contains(row.region, req.query.search),
  );
  res.json({ message: 'Districts demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/advisories/list', (req, res) => {
  const list = ADVISORIES.filter((row) =>
    contains(row.status, req.query.status) &&
    (contains(row.title, req.query.search) || contains(row.content, req.query.search)) &&
    (contains(row.target_crops?.join(' '), req.query.crop)) &&
    (contains(row.target_districts?.join(' '), req.query.district)),
  );
  res.json({ message: 'Advisories demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/advisories/detail', (req, res) => {
  const item = ADVISORIES.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Advisory detail demo data', data: item });
});

demoDataRouter.post('/advisories/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('adv');
  const now = new Date().toISOString();
  const item = {
    id,
    title: payload.title ?? 'Untitled Advisory',
    content: payload.content ?? '',
    target_crops: Array.isArray(payload.target_crop_ids) ? payload.target_crop_ids : [],
    target_districts: Array.isArray(payload.target_district_ids) ? payload.target_district_ids : [],
    farmer_segment: payload.farmer_segment ?? 'Mixed',
    linked_alert_id: payload.linked_alert_id ?? '',
    status: payload.status ?? 'draft',
    delivery_status: { sms_sent: 0, email_sent: 0 },
    created_by: 'Demo User',
    published_at: payload.status === 'published' ? now : null,
    created_at: now,
    updated_at: now,
  };
  ADVISORIES = [item, ...ADVISORIES];
  res.json({ message: 'Advisory created (demo)', data: { id } });
});

demoDataRouter.put('/advisories/update', (req, res) => {
  const payload = req.body ?? {};
  ADVISORIES = ADVISORIES.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          title: payload.title ?? row.title,
          content: payload.content ?? row.content,
          target_crops: Array.isArray(payload.target_crop_ids) ? payload.target_crop_ids : row.target_crops,
          target_districts: Array.isArray(payload.target_district_ids) ? payload.target_district_ids : row.target_districts,
          farmer_segment: payload.farmer_segment ?? row.farmer_segment,
          linked_alert_id: payload.linked_alert_id ?? row.linked_alert_id,
          status: payload.status ?? row.status,
          updated_at: new Date().toISOString(),
        }
      : row,
  );
  res.json({ message: 'Advisory updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/advisories/delete', (req, res) => {
  const id = req.body?.id;
  ADVISORIES = ADVISORIES.filter((row) => row.id !== id);
  res.json({ message: 'Advisory deleted (demo)', data: { id } });
});

demoDataRouter.post('/advisories/assign', (req, res) => {
  res.json({ message: 'Advisory assigned (demo)', data: { id: makeId('assign') } });
});

demoDataRouter.get('/advisories/coverage', (req, res) => {
  const list = ALERTS.map((alert) => {
    const linked = ADVISORIES.find((adv) => adv.linked_alert_id === alert.id);
    return {
      alert_id: alert.id,
      alert_title: alert.title,
      alert_level: alert.alert_level,
      district: alert.district,
      crop: alert.affected_crops?.[0] ?? 'Mixed',
      has_advisory: Boolean(linked),
      advisory_id: linked?.id,
      advisory_title: linked?.title,
      advisory_status: linked?.status,
      issued_at: alert.issued_at,
    };
  }).filter((row) =>
    contains(row.crop, req.query.search || req.query.crop) &&
    contains(row.alert_title, req.query.search) &&
    contains(row.district, req.query.district),
  );
  res.json({ message: 'Advisory coverage demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/beneficiaries/list', (req, res) => {
  const list = BENEFICIARIES.filter((row) =>
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.programme_id, req.query.programme_id) &&
    contains(row.enrolment_status, req.query.enrolment_status) &&
    contains(row.crops?.join(' '), req.query.crop),
  ).map((row) => ({
    id: row.id,
    full_name: row.full_name,
    district: row.district,
    sub_county: row.sub_county,
    programme_id: row.programme_id,
    enrolment_status: row.enrolment_status,
    crops: row.crops,
    enrolment_date: row.enrolment_date,
    last_outcome_date: row.last_outcome_date,
    practice_adoption_status: row.practice_adoption_status,
  }));
  res.json({ message: 'Beneficiaries demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/beneficiaries/detail', (req, res) => {
  const item = BENEFICIARIES.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Beneficiary detail demo data', data: item });
});

demoDataRouter.get('/beneficiaries/stats', (_req, res) => {
  const total = BENEFICIARIES.length;
  const active = BENEFICIARIES.filter((row) => row.enrolment_status === 'active').length;
  const disengaged = BENEFICIARIES.filter((row) => row.enrolment_status === 'disengaged').length;
  const byDistrictMap = new Map();
  const byProgrammeMap = new Map();
  const byCropMap = new Map();

  BENEFICIARIES.forEach((row) => {
    byDistrictMap.set(row.district, (byDistrictMap.get(row.district) ?? 0) + 1);
    byProgrammeMap.set(row.programme_id, (byProgrammeMap.get(row.programme_id) ?? 0) + 1);
    (row.crops ?? []).forEach((crop) => {
      byCropMap.set(crop, (byCropMap.get(crop) ?? 0) + 1);
    });
  });

  res.json({
    message: 'Beneficiaries stats demo data',
    data: {
      total_beneficiaries: total,
      active,
      disengaged,
      by_district: Array.from(byDistrictMap.entries()).map(([district, count]) => ({ district, count })),
      by_programme: Array.from(byProgrammeMap.entries()).map(([programme, count]) => ({ programme, count })),
      by_crop: Array.from(byCropMap.entries()).map(([crop, count]) => ({ crop, count })),
    },
  });
});

demoDataRouter.post('/beneficiaries/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('ben');
  BENEFICIARIES = [
    {
      id,
      full_name: payload.full_name ?? 'Unnamed Beneficiary',
      phone_number: payload.phone_number ?? '',
      district: payload.district ?? 'Unknown',
      sub_county: payload.sub_county ?? '',
      programme_id: payload.programme_id ?? 'prog-001',
      enrolment_status: 'active',
      crops: Array.isArray(payload.crop_ids) ? payload.crop_ids : [],
      enrolment_date: payload.enrolment_date ?? new Date().toISOString().slice(0, 10),
      last_outcome_date: null,
      practice_adoption_status: 'pending',
      farm_registrations: [],
      inputs_received: [],
      training_sessions: [],
      practice_adoption_evidence: '',
      outcome_measurements: [],
    },
    ...BENEFICIARIES,
  ];
  res.json({ message: 'Beneficiary created (demo)', data: { id } });
});

demoDataRouter.put('/beneficiaries/update', (req, res) => {
  const payload = req.body ?? {};
  BENEFICIARIES = BENEFICIARIES.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          enrolment_status: payload.enrolment_status ?? row.enrolment_status,
          practice_adoption_status: payload.practice_adoption_status ?? row.practice_adoption_status,
          notes: payload.notes ?? row.notes,
          flagged_for_followup: payload.flagged_for_followup ?? row.flagged_for_followup,
        }
      : row,
  );
  res.json({ message: 'Beneficiary updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/beneficiaries/delete', (req, res) => {
  const id = req.body?.id;
  BENEFICIARIES = BENEFICIARIES.filter((row) => row.id !== id);
  res.json({ message: 'Beneficiary deleted (demo)', data: { id } });
});

demoDataRouter.get('/monitoring/programmes/list', (req, res) => {
  const list = MONITORING_PROGRAMMES.filter((row) =>
    contains(row.name, req.query.search) && contains(row.status, req.query.status),
  );
  res.json({ message: 'Monitoring programmes demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/monitoring/stats', (_req, res) => {
  const totalFarmersCovered = MONITORING_PROGRAMMES.reduce((sum, row) => sum + row.farmers_reached, 0);
  const districtsActive = new Set(MONITORING_PROGRAMMES.flatMap((row) => row.districts ?? [])).size;
  const cropsTargeted = new Set(MONITORING_PROGRAMMES.flatMap((row) => row.crops ?? [])).size;
  const totalProgrammes = MONITORING_PROGRAMMES.length;
  const onTrack = MONITORING_PROGRAMMES.filter((row) => row.status === 'on-track').length;
  const behind = totalProgrammes - onTrack;
  const totalDisbursement = MONITORING_PROGRAMMES.reduce((sum, row) => sum + row.disbursed_usd, 0);
  const committedBudget = MONITORING_PROGRAMMES.reduce((sum, row) => sum + row.committed_usd, 0);

  res.json({
    message: 'Monitoring stats demo data',
    data: {
      total_farmers_covered: totalFarmersCovered,
      districts_active: districtsActive,
      crops_targeted: cropsTargeted,
      total_programmes: totalProgrammes,
      programmes_on_track: onTrack,
      programmes_behind_target: behind,
      total_disbursement: totalDisbursement,
      committed_budget: committedBudget,
    },
  });
});

demoDataRouter.get('/national-statistics/production', (req, res) => {
  const list = NATIONAL_PRODUCTION.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.agro_ecological_zone, req.query.agro_ecological_zone) &&
    contains(row.season, req.query.season) &&
    (req.query.year ? Number(row.year) === Number(req.query.year) : true),
  );
  res.json({ message: 'National production demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/national-statistics/trends', (req, res) => {
  const fromYear = req.query.from_year ? Number(req.query.from_year) : null;
  const toYear = req.query.to_year ? Number(req.query.to_year) : null;
  const list = NATIONAL_TRENDS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.district, req.query.district || req.query.search) &&
    (fromYear ? row.year >= fromYear : true) &&
    (toYear ? row.year <= toYear : true),
  );
  res.json({ message: 'National trends demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/weather/current', (req, res) => {
  const district = req.query.district ? String(req.query.district) : WEATHER_CURRENT.district;
  res.json({
    message: 'Weather current demo data',
    data: { ...WEATHER_CURRENT, district, recorded_at: new Date().toISOString() },
  });
});

demoDataRouter.get('/weather/forecast', (req, res) => {
  const list = WEATHER_FORECAST.filter((row) => contains(row.condition, req.query.search));
  res.json({ message: 'Weather forecast demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/weather/historical', (req, res) => {
  const list = WEATHER_HISTORICAL.filter((row) =>
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.agro_ecological_zone, req.query.agro_ecological_zone) &&
    contains(row.season, req.query.season),
  );
  res.json({ message: 'Weather historical demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/weather/export', (_req, res) => {
  res.json({
    message: 'Weather export generated (demo)',
    data: {
      download_url: '/downloads/demo-weather-export.csv',
      file_name: `weather_export_${new Date().toISOString().slice(0, 10)}.csv`,
      record_count: WEATHER_HISTORICAL.length,
      generated_at: new Date().toISOString(),
    },
  });
});

demoDataRouter.post('/weather/export-schedule', (_req, res) => {
  res.json({ message: 'Weather export schedule created (demo)', data: { id: `sched-${Date.now().toString(36)}` } });
});

demoDataRouter.get('/alerts/list', (req, res) => {
  const list = ALERTS.filter((row) =>
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.alert_level, req.query.alert_level) &&
    contains(row.agro_ecological_zone, req.query.agro_ecological_zone),
  );
  res.json({ message: 'Alerts list demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/alerts/active/list', (req, res) => {
  const list = ALERTS.map((row) => ({
    id: row.id,
    type: row.type,
    alert_level: row.alert_level,
    title: row.title,
    crop: row.affected_crops?.[0] ?? 'Mixed',
    district: row.district,
    issued_at: row.issued_at,
  })).filter((row) =>
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.crop, req.query.crop),
  );
  res.json({ message: 'Active alerts demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/pest-alerts/list', (req, res) => {
  const list = PEST_ALERTS.filter((row) =>
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.crop, req.query.crop) &&
    contains(row.alert_level, req.query.alert_level),
  );
  res.json({ message: 'Pest alerts demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/treatments/list', (req, res) => {
  const list = TREATMENTS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) && contains(row.pest_name, req.query.pest_name),
  );
  res.json({ message: 'Treatment list demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/reports/alerts-history', (req, res) => {
  res.json({
    message: 'Alerts history report demo data',
    data: {
      district: String(req.query.district ?? 'National'),
      season: String(req.query.season ?? 'Season B'),
      total_alerts: 128,
      alerts_with_advisory: 114,
      advisory_coverage_rate: 89.1,
      farmer_compliance_rate: 72.4,
      alert_breakdown: [
        { alert_type: 'pest_outbreak', count: 52, crop: 'Maize' },
        { alert_type: 'disease', count: 39, crop: 'Coffee' },
        { alert_type: 'weather', count: 37, crop: 'Mixed' },
      ],
    },
  });
});

demoDataRouter.get('/policy/stats', (_req, res) => {
  res.json({
    message: 'Policy stats demo data',
    data: {
      total_national_production_mt: 1296000,
      active_pest_alerts: 23,
      extension_advisory_coverage_rate: 81.5,
      districts_with_alerts: 34,
      season: 'Season B',
      benchmark_achievement_pct: 87.2,
    },
  });
});

demoDataRouter.get('/policy/alerts-summary', (_req, res) => {
  res.json({
    message: 'Policy alerts summary demo data',
    data: {
      total_active_alerts: 23,
      emergency: 3,
      warning: 9,
      watch: 11,
      by_crop: [
        { crop: 'Maize', count: 9 },
        { crop: 'Coffee', count: 7 },
        { crop: 'Beans', count: 4 },
        { crop: 'Cassava', count: 3 },
      ],
      by_district: [
        { district: 'Mbarara', count: 4, highest_severity: 'high' },
        { district: 'Mukono', count: 3, highest_severity: 'medium' },
        { district: 'Mbale', count: 3, highest_severity: 'high' },
      ],
    },
  });
});

demoDataRouter.get('/policy/district-map', (req, res) => {
  res.json({ message: 'Policy district map demo data', ...paginate(POLICY_DISTRICT_MAP, req.query.page, req.query.limit) });
});

demoDataRouter.get('/policy/season-trends', (req, res) => {
  const list = POLICY_SEASON_TRENDS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) && contains(row.season, req.query.season),
  );
  res.json({ message: 'Policy season trends demo data', ...paginate(list, req.query.page, req.query.limit) });
});

const AI_MODELS = [
  { id: 'mdl-001', name: 'Yield Predictor v2', model_type: 'forecast', description: 'Predicts district-level yield outcomes', version: '2.1.0', input_parameters: { rainfall: 'number', ndvi: 'number', soil_moisture: 'number' }, output_description: 'Projected yield (kg/ha)', supported_crops: ['Maize', 'Beans'], last_updated: '2026-06-20', version_history: [{ version: '2.1.0', released_at: '2026-06-20', changes: 'Improved regional calibration' }] },
  { id: 'mdl-002', name: 'Pest Risk Classifier', model_type: 'classification', description: 'Scores outbreak probability for major pests', version: '1.4.3', input_parameters: { humidity: 'number', temperature: 'number', crop: 'string' }, output_description: 'Risk class + confidence', supported_crops: ['Coffee', 'Maize'], last_updated: '2026-05-11', version_history: [{ version: '1.4.3', released_at: '2026-05-11', changes: 'New CBB features' }] },
];

let CUSTOM_QUERIES = [
  { id: 'cq-001', name: 'District NDVI vs Rainfall', description: 'Compare NDVI and rainfall by district', datasets_used: ['weather_monthly', 'ndvi_district'], filter_config: { season: 'Season B' }, aggregation_config: { groupBy: ['district'] }, created_by: 'Research Team', shared: true, created_at: '2026-06-02', updated_at: '2026-06-15' },
  { id: 'cq-002', name: 'Alert coverage by crop', description: 'Coverage of advisories for active alerts', datasets_used: ['alerts', 'advisories'], filter_config: { alert_level: 'high' }, aggregation_config: { groupBy: ['crop'] }, created_by: 'MAAIF Analyst', shared: false, created_at: '2026-06-10', updated_at: '2026-06-18' },
];

const HUB_DATASETS = [
  { id: 'ds-001', name: 'District Weather Daily', category: 'Weather', description: 'Daily weather observations by district', source: 'UNMA', frequency: 'Daily', spatial_coverage: 'National', temporal_coverage: '2020-2026', record_count: 254331, last_updated: '2026-07-20', format: 'CSV' },
  { id: 'ds-002', name: 'Sentinel NDVI District Aggregates', category: 'Remote Sensing', description: 'Weekly NDVI district summaries', source: 'Sentinel-2', frequency: 'Weekly', spatial_coverage: 'National', temporal_coverage: '2021-2026', record_count: 98220, last_updated: '2026-07-19', format: 'Parquet' },
  { id: 'ds-003', name: 'Market Price Panel', category: 'Market', description: 'Commodity prices across district markets', source: 'UBOS/UCDA', frequency: 'Weekly', spatial_coverage: 'National', temporal_coverage: '2022-2026', record_count: 43211, last_updated: '2026-07-18', format: 'CSV' },
];

let FARMERS = [
  { id: 'far-001', full_name: 'Nakato Sarah', phone_number: '+256700111222', email: 'nakato@example.com', district: 'Mukono', sub_county: 'Seeta', crops: ['Coffee', 'Beans'], active_alert_status: 'warning', last_visit_date: '2026-07-11', advisory_compliance_rate: 86, registered_at: '2025-02-12', sms_enabled: true, email_enabled: false },
  { id: 'far-002', full_name: 'Okello James', phone_number: '+256700333444', email: 'okello@example.com', district: 'Gulu', sub_county: 'Bardege', crops: ['Maize', 'Cassava'], active_alert_status: 'critical', last_visit_date: '2026-07-09', advisory_compliance_rate: 71, registered_at: '2025-05-06', sms_enabled: true, email_enabled: true },
  { id: 'far-003', full_name: 'Nambasa Ruth', phone_number: '+256700555666', email: 'nambasa@example.com', district: 'Mbale', sub_county: 'Industrial', crops: ['Beans'], active_alert_status: 'normal', last_visit_date: '2026-06-28', advisory_compliance_rate: 79, registered_at: '2024-11-21', sms_enabled: false, email_enabled: true },
];

let FARMS = [
  { id: 'farm-001', farm_name: 'Seeta Block A', district: 'Mukono', agro_ecological_zone: 'Lake Victoria Crescent', area_hectares: 2.4, soil_type: 'Loam', gps_boundary: 'POLYGON(...)', crops: ['Coffee', 'Beans'], active_alerts: 1, last_activity_date: '2026-07-10', created_at: '2025-02-13' },
  { id: 'farm-002', farm_name: 'Bardege Plot 3', district: 'Gulu', agro_ecological_zone: 'Northern Moist Farmlands', area_hectares: 3.1, soil_type: 'Sandy Loam', gps_boundary: 'POLYGON(...)', crops: ['Maize', 'Cassava'], active_alerts: 2, last_activity_date: '2026-07-09', created_at: '2025-05-08' },
  { id: 'farm-003', farm_name: 'Mbale Demo Plot', district: 'Mbale', agro_ecological_zone: 'Eastern Highlands', area_hectares: 1.8, soil_type: 'Clay Loam', gps_boundary: 'POLYGON(...)', crops: ['Beans'], active_alerts: 0, last_activity_date: '2026-06-30', created_at: '2024-11-22' },
];

let FARM_ACTIVITIES = [
  { id: 'act-001', farm_id: 'farm-001', activity_date: '2026-07-08', activity_type: 'spraying', description: 'Rust preventive spray', observations: 'Good canopy coverage', inputs_used: 'Copper fungicide', quantity: 2, notes: 'Repeat in 14 days', created_at: '2026-07-08' },
  { id: 'act-002', farm_id: 'farm-002', activity_date: '2026-07-07', activity_type: 'scouting', description: 'Armyworm scouting', observations: 'Larvae present in 2/10 samples', inputs_used: 'N/A', quantity: 0, notes: 'Escalate advisory', created_at: '2026-07-07' },
];

let FIELD_VISITS = [
  { id: 'fv-001', farmer_id: 'far-001', farmer_name: 'Nakato Sarah', farm_id: 'farm-001', visit_date: '2026-07-11', observations: 'Healthy stand, mild rust pressure', pest_sightings: 'Minor rust spots', crop_condition: 'Good', soil_observations: 'Adequate moisture', advisories_given: 'Continue preventive spray and mulching', follow_up_actions: 'Photo verification in 2 weeks', follow_up_due_date: '2026-07-25', status: 'closed', created_at: '2026-07-11' },
  { id: 'fv-002', farmer_id: 'far-002', farmer_name: 'Okello James', farm_id: 'farm-002', visit_date: '2026-07-09', observations: 'Localized pest hotspots', pest_sightings: 'Fall Armyworm', crop_condition: 'At risk', soil_observations: 'Dry upper layer', advisories_given: 'Immediate targeted control', follow_up_actions: 'Revisit in 7 days', follow_up_due_date: '2026-07-16', status: 'follow-up', created_at: '2026-07-09' },
];

let PEST_SIGHTINGS = [
  { id: 'ps-001', farm_id: 'farm-002', pest_name: 'Fall Armyworm', crop_affected: 'Maize', sighting_date: '2026-07-08', severity_estimate: 'high', area_affected_hectares: 0.7, notes: 'Whorl damage visible', gps_lat: 2.774, gps_lng: 32.298, created_at: '2026-07-08' },
  { id: 'ps-002', farm_id: 'farm-001', pest_name: 'Coffee Berry Borer', crop_affected: 'Coffee', sighting_date: '2026-07-10', severity_estimate: 'medium', area_affected_hectares: 0.4, notes: 'Trap catches rising', gps_lat: 0.354, gps_lng: 32.781, created_at: '2026-07-10' },
];

const PESTS = [
  { id: 'p-001', name: 'Fall Armyworm', type: 'insect', affected_crops: ['Maize'], climate_trigger: 'Warm and humid', severity: 'high', description: 'Major foliar pest in maize', recommended_actions: 'Early scouting and selective control' },
  { id: 'p-002', name: 'Coffee Berry Borer', type: 'insect', affected_crops: ['Coffee'], climate_trigger: 'High humidity', severity: 'medium', description: 'Damages coffee berries', recommended_actions: 'Trap management and sanitation' },
  { id: 'p-003', name: 'Bean Fly', type: 'insect', affected_crops: ['Beans'], climate_trigger: 'Early growth stage stress', severity: 'low', description: 'Affects seedling vigor', recommended_actions: 'Seed treatment and rotation' },
];

const PEST_REPORTS = [
  { id: 'pr-001', pest_name: 'Fall Armyworm', crop: 'Maize', district: 'Mbarara', alert_level: 'high', outbreak_date: '2026-07-18', response_status: 'active-response', coverage_gap: false, season: 'Season B', created_at: '2026-07-18' },
  { id: 'pr-002', pest_name: 'Coffee Berry Borer', crop: 'Coffee', district: 'Mukono', alert_level: 'medium', outbreak_date: '2026-07-19', response_status: 'monitoring', coverage_gap: false, season: 'Season B', created_at: '2026-07-19' },
];

const PEST_REPORT_TRENDS = [
  { season: 'Season A 2025', crop: 'Maize', pest_name: 'Fall Armyworm', outbreak_count: 21, districts_affected: 8, response_rate: 78, avg_response_days: 3.2 },
  { season: 'Season B 2025', crop: 'Maize', pest_name: 'Fall Armyworm', outbreak_count: 18, districts_affected: 7, response_rate: 82, avg_response_days: 2.9 },
  { season: 'Season A 2026', crop: 'Coffee', pest_name: 'Coffee Berry Borer', outbreak_count: 14, districts_affected: 6, response_rate: 85, avg_response_days: 3.1 },
];

let PRICE_ALERTS = [
  { id: 'pa-001', crop: 'Coffee', target_price: 10500, market: 'Kampala', current_price: 9900, sms_enabled: true, email_enabled: true, triggered: false, created_at: '2026-07-01', updated_at: '2026-07-20' },
  { id: 'pa-002', crop: 'Beans', target_price: 4200, market: 'Mbale', current_price: 4380, sms_enabled: true, email_enabled: false, triggered: true, created_at: '2026-06-26', updated_at: '2026-07-19' },
];

const PRODUCTION_REPORTS = [
  { id: 'rpt-001', name: 'National Production Snapshot - Season B', report_type: 'snapshot', parameters: { season: 'Season B' }, output_format: 'pdf', download_url: '/downloads/report-001.pdf', generated_at: '2026-07-18', generated_by: 'Policy Analyst' },
  { id: 'rpt-002', name: 'District Yield Comparison', report_type: 'comparison', parameters: { from: '2025', to: '2026' }, output_format: 'csv', download_url: '/downloads/report-002.csv', generated_at: '2026-07-15', generated_by: 'Research Team' },
];

const PRODUCTION_REPORT_TEMPLATES = [
  { id: 'tpl-001', name: 'District Yield Report', description: 'Yield by crop and district', report_type: 'yield', parameters: ['crop_ids', 'district_ids', 'season'], output_formats: ['pdf', 'csv'] },
  { id: 'tpl-002', name: 'Market-linked Production Report', description: 'Production and market movement', report_type: 'market', parameters: ['crop_ids', 'from_date', 'to_date'], output_formats: ['pdf', 'xlsx'] },
];

let PROGRAMME_KPIS = [
  { id: 'kpi-001', programme_id: 'prog-001', kpi_name: 'Advisory Coverage Rate', kpi_category: 'coverage', target_value: 90, current_value: 84, unit: '%', achievement_pct: 93.3, threshold_alert: 75, email_alert_enabled: true, status: 'on-track', history: [{ date: '2026-06-30', value: 82 }, { date: '2026-07-15', value: 84 }], last_updated: '2026-07-15' },
  { id: 'kpi-002', programme_id: 'prog-002', kpi_name: 'Farmer Adoption Rate', kpi_category: 'adoption', target_value: 70, current_value: 61, unit: '%', achievement_pct: 87.1, threshold_alert: 55, email_alert_enabled: true, status: 'watch', history: [{ date: '2026-06-30', value: 58 }, { date: '2026-07-15', value: 61 }], last_updated: '2026-07-15' },
];

const PUBLIC_REPORTS = [
  { id: 'pub-001', title: 'Coffee Outlook Bulletin Q3', category: 'Market', crop: ['Coffee'], season: 'Season B', publisher: 'UCDA', published_date: '2026-07-05', description: 'Quarterly outlook for coffee production and exports', download_url: '/downloads/public-coffee-q3.pdf', file_size_kb: 842 },
  { id: 'pub-002', title: 'National Rainfall Advisory', category: 'Weather', crop: ['Maize', 'Beans'], season: 'Season B', publisher: 'UNMA', published_date: '2026-07-03', description: 'Rainfall expectation and risk windows', download_url: '/downloads/public-rainfall.pdf', file_size_kb: 624 },
];

const RECOMMENDATIONS = [
  { id: 'rec-001', crop: 'Maize', recommendation_type: 'nutrient', title: 'Top-dress before tasseling', description: 'Apply nitrogen top-dressing before tasseling stage.', confidence_score: 0.88, triggering_conditions: 'Low nitrogen signal + rainfall window', guideline_reference: 'MAAIF-GDL-12', valid_from: '2026-07-20', valid_until: '2026-08-05', created_at: '2026-07-20' },
  { id: 'rec-002', crop: 'Coffee', recommendation_type: 'pest', title: 'Increase CBB trap frequency', description: 'Increase trap checks to twice weekly.', confidence_score: 0.83, triggering_conditions: 'Humidity trend + trap counts', guideline_reference: 'UCDA-IPM-04', valid_from: '2026-07-19', valid_until: '2026-08-10', created_at: '2026-07-19' },
];

const EARLY_WARNINGS = [
  { id: 'ew-001', crop: 'Maize', warning_type: 'pest_outbreak', title: 'Armyworm outbreak probability elevated', description: 'Potential outbreak within 5-7 days.', forecast_date: '2026-07-26', confidence_score: 0.84, triggering_forecast: 'Warm nights + vegetation stress', recommended_action: 'Begin early scouting and prep controls' },
  { id: 'ew-002', crop: 'Beans', warning_type: 'heavy_rain', title: 'Heavy rain event likely', description: 'Potential lodging and fungal risk.', forecast_date: '2026-07-24', confidence_score: 0.79, triggering_forecast: 'High precipitation model consensus', recommended_action: 'Improve field drainage and delay spraying' },
];

let RESEARCH_OUTPUTS = [
  { id: 'res-001', title: 'NDVI-driven early pest detection in Uganda', authors: ['A. Kato', 'J. Nambi'], abstract: 'A multi-season evaluation of satellite-driven outbreak detection.', crop_focus: ['Maize', 'Coffee'], status: 'published', datasets_used: [{ id: 'ds-002', name: 'Sentinel NDVI District Aggregates' }], models_applied: [{ id: 'mdl-002', name: 'Pest Risk Classifier' }], methodology: 'Time-series anomaly detection', key_findings: 'Improved lead time by 6 days on average.', citation: 'Kato et al. (2026)', file_url: '/downloads/research-001.pdf', version_history: [{ version: 1, updated_at: '2026-05-10', changes: 'Initial publication' }], published_at: '2026-05-10', created_at: '2026-04-22', updated_at: '2026-05-10' },
];

const SEASONAL_CALENDARS = [
  { id: 'sc-001', crop: 'Maize', season: 'Season B', season_months: 'Aug-Dec', planting_start: '2026-08-01', planting_end: '2026-09-10', growing_start: '2026-09-11', growing_end: '2026-11-20', harvest_start: '2026-11-21', harvest_end: '2026-12-31', agro_ecological_zone: 'Eastern Highlands', notes: 'Adjust planting to rainfall onset' },
  { id: 'sc-002', crop: 'Coffee', season: 'Season B', season_months: 'Year-round', planting_start: '2026-03-01', planting_end: '2026-05-30', growing_start: '2026-06-01', growing_end: '2026-10-30', harvest_start: '2026-11-01', harvest_end: '2027-02-28', agro_ecological_zone: 'Lake Victoria Crescent', notes: 'Focus on disease scouting in wet weeks' },
];

const PEST_RISK_WINDOWS = [
  { id: 'prw-001', crop: 'Maize', pest_name: 'Fall Armyworm', risk_start_month: 'September', risk_end_month: 'November', risk_level: 'High', season: 'Season B', agro_ecological_zone: 'Northern Moist Farmlands', trigger_conditions: 'Warm temp + moderate rainfall' },
  { id: 'prw-002', crop: 'Coffee', pest_name: 'Coffee Berry Borer', risk_start_month: 'June', risk_end_month: 'August', risk_level: 'Medium', season: 'Season B', agro_ecological_zone: 'Lake Victoria Crescent', trigger_conditions: 'Sustained humidity > 80%' },
];

const FARMING_PRACTICES = [
  { id: 'fp-001', title: 'Conservation mulching', description: 'Retains moisture and reduces erosion', crop: 'Coffee', practice_type: 'soil-water', source: 'NARO', agro_ecological_zone: 'Lake Victoria Crescent' },
  { id: 'fp-002', title: 'Row-based scouting protocol', description: 'Structured scouting for early pest detection', crop: 'Maize', practice_type: 'ipm', source: 'MAAIF', agro_ecological_zone: 'Northern Moist Farmlands' },
];

const VARIETIES = [
  { id: 'var-001', variety_name: 'Longe 10H', crop: 'Maize', yield_improvement_kg_ha: 520, drought_tolerant: true, pest_resistant: true, maturity_days: 115, developer: 'NARO', description: 'High-yield hybrid for mixed rainfall areas' },
  { id: 'var-002', variety_name: 'NABE 17', crop: 'Beans', yield_improvement_kg_ha: 340, drought_tolerant: true, pest_resistant: false, maturity_days: 82, developer: 'NARO', description: 'Early maturing bean variety' },
];

const IMPACT_ASSESSMENTS = [
  { id: 'imp-001', programme_id: 'prog-001', programme_name: 'Climate-Smart Coffee Transition', methodology: 'Difference-in-differences', status: 'completed', completed_at: '2026-07-10' },
  { id: 'imp-002', programme_id: 'prog-002', programme_name: 'Northern Resilience Maize Initiative', methodology: 'Propensity score matching', status: 'running', completed_at: null },
];

const IMPACT_BASELINES = [
  { id: 'base-001', name: 'Coffee baseline 2024', description: 'Pre-intervention coffee baseline', crop: 'Coffee', district: 'Mukono', year: 2024, avg_yield_kg_ha: 1480, avg_income_usd: 910, source: 'Programme survey' },
  { id: 'base-002', name: 'Maize baseline 2024', description: 'Pre-intervention maize baseline', crop: 'Maize', district: 'Gulu', year: 2024, avg_yield_kg_ha: 1720, avg_income_usd: 760, source: 'Programme survey' },
];

let INTEGRATIONS = [
  { id: 'int-001', service_name: 'Twilio', api_key_masked: 'twil**********9a', status: 'connected', last_verified: '2026-07-20T08:10:00Z', configured_by: 'Admin' },
  { id: 'int-002', service_name: 'SendGrid', api_key_masked: 'send**********4f', status: 'connected', last_verified: '2026-07-20T08:12:00Z', configured_by: 'Admin' },
  { id: 'int-003', service_name: 'SerpApi', api_key_masked: 'serp**********1c', status: 'warning', last_verified: '2026-07-19T19:22:00Z', configured_by: 'Admin' },
];

let USER_PROFILE = {
  id: 'user-demo-001',
  full_name: 'Demo Extension Worker',
  email: 'extension.demo@agri.ug',
  phone_number: '+256700000111',
  role: 'Extension Worker',
  district: 'Mukono',
  sub_county: 'Seeta',
  sms_enabled: true,
  email_notifications_enabled: true,
  in_app_enabled: true,
  created_at: '2025-01-10',
  updated_at: '2026-07-20',
};

demoDataRouter.get('/ai-models/list', (req, res) => {
  const list = AI_MODELS.filter((row) => contains(row.name, req.query.search) && contains(row.model_type, req.query.model_type));
  res.json({ message: 'AI models demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.post('/ai-models/run', (_req, res) => {
  res.json({ message: 'Model run started (demo)', data: { job_id: makeId('job'), status: 'queued', estimated_completion: '2026-07-21T15:00:00Z' } });
});

demoDataRouter.get('/ai-models/results', (req, res) => {
  const jobId = String(req.query.job_id ?? 'job-demo-001');
  res.json({
    message: 'AI model results demo data',
    data: {
      job_id: jobId,
      model_name: 'Yield Predictor v2',
      status: 'completed',
      predictions: [
        { district: 'Mukono', crop: 'Coffee', predicted_value: 2210, confidence: 0.83, metric: 'yield_kg_ha', date: '2026-08-01' },
        { district: 'Mbarara', crop: 'Maize', predicted_value: 2475, confidence: 0.81, metric: 'yield_kg_ha', date: '2026-08-01' },
      ],
      chart_data: { labels: ['Mukono', 'Mbarara'], values: [2210, 2475] },
      download_url: '/downloads/ai-results.csv',
      completed_at: new Date().toISOString(),
    },
  });
});

demoDataRouter.get('/custom-queries/list', (req, res) => {
  const list = CUSTOM_QUERIES.filter((row) => contains(row.name, req.query.search) || contains(row.description, req.query.search));
  res.json({ message: 'Custom queries demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/custom-queries/detail', (req, res) => {
  const item = CUSTOM_QUERIES.find((row) => row.id === req.query.id);
  if (!item) {
    return res.status(404).json({ message: 'Custom query not found', data: null });
  }
  return res.json({
    message: 'Custom query detail demo data',
    data: {
      id: item.id,
      name: item.name,
      description: item.description,
      dataset_ids: item.datasets_used,
      filters: item.filter_config,
      aggregations: item.aggregation_config,
      joins: {},
      shared: item.shared,
      created_by: item.created_by,
      created_at: item.created_at,
      updated_at: item.updated_at,
    },
  });
});

demoDataRouter.post('/custom-queries/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('cq');
  const now = new Date().toISOString();
  CUSTOM_QUERIES = [
    {
      id,
      name: payload.name ?? 'Untitled Query',
      description: payload.description ?? '',
      datasets_used: payload.dataset_ids ?? [],
      filter_config: payload.filters ?? {},
      aggregation_config: payload.aggregations ?? {},
      created_by: 'Demo User',
      shared: Boolean(payload.shared),
      created_at: now,
      updated_at: now,
    },
    ...CUSTOM_QUERIES,
  ];
  res.json({ message: 'Custom query created (demo)', data: { id } });
});

demoDataRouter.put('/custom-queries/update', (req, res) => {
  const payload = req.body ?? {};
  CUSTOM_QUERIES = CUSTOM_QUERIES.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          name: payload.name ?? row.name,
          description: payload.description ?? row.description,
          datasets_used: payload.dataset_ids ?? row.datasets_used,
          filter_config: payload.filters ?? row.filter_config,
          aggregation_config: payload.aggregations ?? row.aggregation_config,
          shared: payload.shared ?? row.shared,
          updated_at: new Date().toISOString(),
        }
      : row,
  );
  res.json({ message: 'Custom query updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/custom-queries/delete', (req, res) => {
  const id = req.body?.id;
  CUSTOM_QUERIES = CUSTOM_QUERIES.filter((row) => row.id !== id);
  res.json({ message: 'Custom query deleted (demo)', data: { id } });
});

demoDataRouter.post('/custom-queries/execute', (req, res) => {
  const page = toInt(req.body?.page, 1);
  const limit = toInt(req.body?.limit, 10);
  const rows = [
    { district: 'Mukono', crop: 'Coffee', avg_ndvi: 0.67, rainfall_mm: 142 },
    { district: 'Mbarara', crop: 'Maize', avg_ndvi: 0.61, rainfall_mm: 129 },
    { district: 'Mbale', crop: 'Beans', avg_ndvi: 0.69, rainfall_mm: 154 },
  ];
  const sliced = paginate(rows, page, limit);
  res.json({
    message: 'Custom query executed (demo)',
    data: {
      columns: [
        { name: 'district', type: 'string' },
        { name: 'crop', type: 'string' },
        { name: 'avg_ndvi', type: 'number' },
        { name: 'rainfall_mm', type: 'number' },
      ],
      rows: sliced.data,
      total: sliced.total,
      page: sliced.page,
      limit: sliced.limit,
      totalPages: sliced.totalPages,
    },
  });
});

demoDataRouter.get('/data-hub/datasets', (req, res) => {
  const list = HUB_DATASETS.filter((row) => contains(row.category, req.query.category) && contains(row.name, req.query.search));
  res.json({ message: 'Data hub datasets demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/data-hub/preview', (req, res) => {
  const id = String(req.query.dataset_id ?? HUB_DATASETS[0].id);
  const ds = HUB_DATASETS.find((row) => row.id === id) ?? HUB_DATASETS[0];
  res.json({
    message: 'Data hub preview demo data',
    data: {
      dataset_id: ds.id,
      dataset_name: ds.name,
      columns: [
        { name: 'district', type: 'string', description: 'District name' },
        { name: 'date', type: 'date', description: 'Observation date' },
        { name: 'value', type: 'number', description: 'Observed value' },
      ],
      sample_records: [
        { district: 'Mukono', date: '2026-07-01', value: 142 },
        { district: 'Mbarara', date: '2026-07-01', value: 129 },
      ],
      total_records: ds.record_count,
    },
  });
});

demoDataRouter.get('/farm-management/stats', (_req, res) => {
  const pendingVisits = FIELD_VISITS.filter((row) => row.status !== 'closed').length;
  const activeAlerts = FARMERS.filter((row) => row.active_alert_status !== 'normal').length;
  const avgCompliance = FARMERS.reduce((sum, row) => sum + (row.advisory_compliance_rate ?? 0), 0) / Math.max(FARMERS.length, 1);
  res.json({
    message: 'Farm management stats demo data',
    data: {
      total_farmers: FARMERS.length,
      pending_visits: pendingVisits,
      active_alerts: activeAlerts,
      outstanding_advisories: ALERTS.length,
      recent_alert_count: ALERTS.length,
      advisory_compliance_rate: Number(avgCompliance.toFixed(1)),
    },
  });
});

demoDataRouter.get('/farmers/list', (req, res) => {
  const list = FARMERS.filter((row) =>
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.active_alert_status, req.query.alert_status) &&
    contains(row.crops?.join(' '), req.query.crop),
  );
  res.json({ message: 'Farmers demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/farmers/detail', (req, res) => {
  const row = FARMERS.find((item) => item.id === req.query.id);
  if (!row) return res.status(404).json({ message: 'Farmer not found', data: null });
  const farms = FARMS.filter((farm) => contains(farm.district, row.district)).map((farm) => ({ id: farm.id, farm_name: farm.farm_name, area_hectares: farm.area_hectares }));
  const fieldLogs = FIELD_VISITS.filter((visit) => visit.farmer_id === row.id).map((visit) => ({ visit_id: visit.id, visit_date: visit.visit_date, extension_worker: 'Demo Officer', summary: visit.observations }));
  res.json({
    message: 'Farmer detail demo data',
    data: {
      ...row,
      farms,
      advisory_history: ADVISORIES.map((adv) => ({ advisory_id: adv.id, title: adv.title, received_at: adv.published_at ?? adv.created_at, compliance_status: 'followed' })),
      field_visit_logs: fieldLogs,
    },
  });
});

demoDataRouter.post('/farmers/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('far');
  FARMERS = [
    {
      id,
      full_name: payload.full_name ?? 'Unnamed Farmer',
      phone_number: payload.phone_number ?? '',
      email: payload.email ?? '',
      district: payload.district ?? 'Unknown',
      sub_county: payload.sub_county ?? '',
      crops: payload.crop_ids ?? [],
      active_alert_status: 'normal',
      last_visit_date: null,
      advisory_compliance_rate: 0,
      registered_at: new Date().toISOString().slice(0, 10),
      sms_enabled: Boolean(payload.sms_enabled),
      email_enabled: Boolean(payload.email_enabled),
    },
    ...FARMERS,
  ];
  res.json({ message: 'Farmer created (demo)', data: { id } });
});

demoDataRouter.put('/farmers/update', (req, res) => {
  const payload = req.body ?? {};
  FARMERS = FARMERS.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          full_name: payload.full_name ?? row.full_name,
          phone_number: payload.phone_number ?? row.phone_number,
          email: payload.email ?? row.email,
          district: payload.district ?? row.district,
          sub_county: payload.sub_county ?? row.sub_county,
          sms_enabled: payload.sms_enabled ?? row.sms_enabled,
          email_enabled: payload.email_enabled ?? row.email_enabled,
        }
      : row,
  );
  res.json({ message: 'Farmer updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/farmers/delete', (req, res) => {
  const id = req.body?.id;
  FARMERS = FARMERS.filter((row) => row.id !== id);
  res.json({ message: 'Farmer deleted (demo)', data: { id } });
});

demoDataRouter.get('/farms/list', (req, res) => {
  const list = FARMS.filter((row) => contains(row.farm_name, req.query.search) && contains(row.crops?.join(' '), req.query.crop));
  res.json({ message: 'Farms demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/farms/detail', (req, res) => {
  const row = FARMS.find((item) => item.id === req.query.id);
  if (!row) return res.status(404).json({ message: 'Farm not found', data: null });
  res.json({
    message: 'Farm detail demo data',
    data: {
      ...row,
      crops: (row.crops ?? []).map((name, index) => ({ id: `crop-ref-${index + 1}`, name, growth_stage: 'vegetative', planting_date: '2026-03-01' })),
      soil_analysis: { ph: 6.2, organic_matter_pct: 2.8, nitrogen: 'medium' },
      created_at: row.created_at,
      updated_at: new Date().toISOString(),
    },
  });
});

demoDataRouter.post('/farms/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('farm');
  FARMS = [
    {
      id,
      farm_name: payload.farm_name ?? 'Unnamed Farm',
      district: payload.district ?? 'Unknown',
      agro_ecological_zone: payload.agro_ecological_zone ?? 'Unknown Zone',
      area_hectares: Number(payload.area_hectares ?? 0),
      soil_type: payload.soil_type ?? 'Unknown',
      gps_boundary: payload.gps_boundary ?? '',
      crops: payload.crop_ids ?? [],
      active_alerts: 0,
      last_activity_date: null,
      created_at: new Date().toISOString().slice(0, 10),
    },
    ...FARMS,
  ];
  res.json({ message: 'Farm created (demo)', data: { id } });
});

demoDataRouter.put('/farms/update', (req, res) => {
  const payload = req.body ?? {};
  FARMS = FARMS.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          farm_name: payload.farm_name ?? row.farm_name,
          area_hectares: Number(payload.area_hectares ?? row.area_hectares),
          soil_type: payload.soil_type ?? row.soil_type,
          gps_boundary: payload.gps_boundary ?? row.gps_boundary,
          crops: payload.crop_ids ?? row.crops,
        }
      : row,
  );
  res.json({ message: 'Farm updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/farms/delete', (req, res) => {
  const id = req.body?.id;
  FARMS = FARMS.filter((row) => row.id !== id);
  res.json({ message: 'Farm deleted (demo)', data: { id } });
});

demoDataRouter.get('/farm-activities/list', (req, res) => {
  const list = FARM_ACTIVITIES.filter((row) => contains(row.farm_id, req.query.farm_id) && contains(row.description, req.query.search));
  res.json({ message: 'Farm activities demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/farm-activities/detail', (req, res) => {
  const item = FARM_ACTIVITIES.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Farm activity detail demo data', data: item });
});

demoDataRouter.post('/farm-activities/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('act');
  const now = new Date().toISOString();
  FARM_ACTIVITIES = [{ id, ...payload, created_at: now, updated_at: now }, ...FARM_ACTIVITIES];
  res.json({ message: 'Farm activity created (demo)', data: { id } });
});

demoDataRouter.put('/farm-activities/update', (req, res) => {
  const payload = req.body ?? {};
  FARM_ACTIVITIES = FARM_ACTIVITIES.map((row) => (row.id === payload.id ? { ...row, ...payload, updated_at: new Date().toISOString() } : row));
  res.json({ message: 'Farm activity updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/farm-activities/delete', (req, res) => {
  const id = req.body?.id;
  FARM_ACTIVITIES = FARM_ACTIVITIES.filter((row) => row.id !== id);
  res.json({ message: 'Farm activity deleted (demo)', data: { id } });
});

demoDataRouter.get('/field-visits/list', (req, res) => {
  const list = FIELD_VISITS.filter((row) =>
    contains(row.farmer_id, req.query.farmer_id) &&
    contains(row.status, req.query.status) &&
    (contains(row.farmer_name, req.query.search) || contains(row.observations, req.query.search)),
  );
  res.json({ message: 'Field visits demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/field-visits/detail', (req, res) => {
  const item = FIELD_VISITS.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Field visit detail demo data', data: item });
});

demoDataRouter.get('/field-visits/export', (_req, res) => {
  res.json({ message: 'Field visits export generated (demo)', data: { download_url: '/downloads/field-visits.csv', file_name: 'field-visits.csv', generated_at: new Date().toISOString() } });
});

demoDataRouter.post('/field-visits/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('fv');
  FIELD_VISITS = [{ id, ...payload, farmer_name: 'Demo Farmer', status: 'open', created_at: new Date().toISOString() }, ...FIELD_VISITS];
  res.json({ message: 'Field visit created (demo)', data: { id } });
});

demoDataRouter.put('/field-visits/update', (req, res) => {
  const payload = req.body ?? {};
  FIELD_VISITS = FIELD_VISITS.map((row) => (row.id === payload.id ? { ...row, ...payload, updated_at: new Date().toISOString() } : row));
  res.json({ message: 'Field visit updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/field-visits/delete', (req, res) => {
  const id = req.body?.id;
  FIELD_VISITS = FIELD_VISITS.filter((row) => row.id !== id);
  res.json({ message: 'Field visit deleted (demo)', data: { id } });
});

demoDataRouter.get('/integrations/list', (req, res) => {
  const list = INTEGRATIONS.filter((row) => contains(row.service_name, req.query.search));
  res.json({ message: 'Integrations demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.put('/integrations/update', (req, res) => {
  const payload = req.body ?? {};
  const serviceName = String(payload.service_name ?? 'Unknown');
  let item = INTEGRATIONS.find((row) => row.service_name.toLowerCase() === serviceName.toLowerCase());
  if (!item) {
    item = { id: makeId('int'), service_name: serviceName, api_key_masked: 'new**********', status: 'connected', last_verified: new Date().toISOString(), configured_by: 'Demo User' };
    INTEGRATIONS = [item, ...INTEGRATIONS];
  } else {
    INTEGRATIONS = INTEGRATIONS.map((row) =>
      row.id === item.id
        ? { ...row, api_key_masked: `${serviceName.slice(0, 4).toLowerCase()}**********`, status: 'connected', last_verified: new Date().toISOString() }
        : row,
    );
  }
  res.json({ message: 'Integration updated (demo)', data: { id: item.id } });
});

demoDataRouter.get('/pest-reports/list', (req, res) => {
  const list = PEST_REPORTS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.district, req.query.district || req.query.search) &&
    contains(row.alert_level, req.query.alert_level) &&
    contains(row.season, req.query.season),
  );
  res.json({ message: 'Pest reports demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/pest-reports/trends', (req, res) => {
  const list = PEST_REPORT_TRENDS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.pest_name, req.query.pest_name || req.query.search),
  );
  res.json({ message: 'Pest report trends demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.post('/pest-reports/generate', (_req, res) => {
  res.json({ message: 'Pest report generated (demo)', data: { report_id: makeId('prpt'), download_url: '/downloads/pest-report.pdf', generated_at: new Date().toISOString() } });
});

demoDataRouter.get('/pest-sightings/list', (req, res) => {
  const list = PEST_SIGHTINGS.filter((row) => contains(row.farm_id, req.query.farm_id) && (contains(row.pest_name, req.query.search) || contains(row.notes, req.query.search)));
  res.json({ message: 'Pest sightings demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/pest-sightings/detail', (req, res) => {
  const item = PEST_SIGHTINGS.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Pest sighting detail demo data', data: item });
});

demoDataRouter.post('/pest-sightings/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('ps');
  PEST_SIGHTINGS = [{ id, ...payload, pest_name: payload.pest_id ?? 'Unknown Pest', created_at: new Date().toISOString() }, ...PEST_SIGHTINGS];
  res.json({ message: 'Pest sighting created (demo)', data: { id } });
});

demoDataRouter.put('/pest-sightings/update', (req, res) => {
  const payload = req.body ?? {};
  PEST_SIGHTINGS = PEST_SIGHTINGS.map((row) => (row.id === payload.id ? { ...row, ...payload, updated_at: new Date().toISOString() } : row));
  res.json({ message: 'Pest sighting updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/pest-sightings/delete', (req, res) => {
  const id = req.body?.id;
  PEST_SIGHTINGS = PEST_SIGHTINGS.filter((row) => row.id !== id);
  res.json({ message: 'Pest sighting deleted (demo)', data: { id } });
});

demoDataRouter.get('/pests/list', (req, res) => {
  const list = PESTS.filter((row) => contains(row.name, req.query.search) && contains(row.crop?.join?.(' ') ?? row.affected_crops?.join(' '), req.query.crop) && contains(row.type, req.query.type));
  res.json({ message: 'Pests catalog demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/price-alerts/list', (req, res) => {
  const list = PRICE_ALERTS.filter((row) => contains(row.crop, req.query.search) || contains(row.market, req.query.search));
  res.json({ message: 'Price alerts demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/price-alerts/detail', (req, res) => {
  const item = PRICE_ALERTS.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Price alert detail demo data', data: item });
});

demoDataRouter.post('/price-alerts/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('pa');
  PRICE_ALERTS = [
    {
      id,
      crop: payload.crop_id ?? 'Unknown Crop',
      target_price: Number(payload.target_price ?? 0),
      market: payload.market ?? 'Unknown Market',
      current_price: Number(payload.target_price ?? 0) * 0.95,
      sms_enabled: Boolean(payload.sms_enabled),
      email_enabled: Boolean(payload.email_enabled),
      triggered: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    ...PRICE_ALERTS,
  ];
  res.json({ message: 'Price alert created (demo)', data: { id } });
});

demoDataRouter.put('/price-alerts/update', (req, res) => {
  const payload = req.body ?? {};
  PRICE_ALERTS = PRICE_ALERTS.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          crop: payload.crop_id ?? row.crop,
          target_price: Number(payload.target_price ?? row.target_price),
          market: payload.market ?? row.market,
          sms_enabled: payload.sms_enabled ?? row.sms_enabled,
          email_enabled: payload.email_enabled ?? row.email_enabled,
          updated_at: new Date().toISOString(),
        }
      : row,
  );
  res.json({ message: 'Price alert updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/price-alerts/delete', (req, res) => {
  const id = req.body?.id;
  PRICE_ALERTS = PRICE_ALERTS.filter((row) => row.id !== id);
  res.json({ message: 'Price alert deleted (demo)', data: { id } });
});

demoDataRouter.get('/production-reports/list', (req, res) => {
  const list = PRODUCTION_REPORTS.filter((row) => contains(row.report_type, req.query.report_type) && contains(row.name, req.query.search));
  res.json({ message: 'Production reports demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/production-reports/templates', (req, res) => {
  const list = PRODUCTION_REPORT_TEMPLATES.filter((row) => contains(row.name, req.query.search));
  res.json({ message: 'Production report templates demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.post('/production-reports/generate', (_req, res) => {
  res.json({ message: 'Production report generated (demo)', data: { report_id: makeId('rpt'), status: 'completed', download_url: '/downloads/generated-production-report.pdf', generated_at: new Date().toISOString() } });
});

demoDataRouter.post('/production-reports/schedule', (_req, res) => {
  res.json({ message: 'Production report schedule created (demo)', data: { id: makeId('sch') } });
});

demoDataRouter.get('/programme-kpis/list', (req, res) => {
  const list = PROGRAMME_KPIS.filter((row) =>
    contains(row.programme_id, req.query.programme_id) &&
    contains(row.status, req.query.status) &&
    contains(row.kpi_name, req.query.search),
  );
  res.json({ message: 'Programme KPI demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/programme-kpis/detail', (req, res) => {
  const item = PROGRAMME_KPIS.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Programme KPI detail demo data', data: item });
});

demoDataRouter.post('/programme-kpis/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('kpi');
  PROGRAMME_KPIS = [{ id, ...payload, current_value: 0, achievement_pct: 0, status: 'new', history: [], last_updated: new Date().toISOString() }, ...PROGRAMME_KPIS];
  res.json({ message: 'Programme KPI created (demo)', data: { id } });
});

demoDataRouter.put('/programme-kpis/update', (req, res) => {
  const payload = req.body ?? {};
  PROGRAMME_KPIS = PROGRAMME_KPIS.map((row) =>
    row.id === payload.id ? { ...row, ...payload, last_updated: new Date().toISOString() } : row,
  );
  res.json({ message: 'Programme KPI updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/programme-kpis/delete', (req, res) => {
  const id = req.body?.id;
  PROGRAMME_KPIS = PROGRAMME_KPIS.filter((row) => row.id !== id);
  res.json({ message: 'Programme KPI deleted (demo)', data: { id } });
});

demoDataRouter.get('/public-reports/list', (req, res) => {
  const list = PUBLIC_REPORTS.filter((row) =>
    contains(row.category, req.query.category) &&
    contains(row.season, req.query.season) &&
    (contains(row.title, req.query.search) || contains(row.crop?.join(' '), req.query.crop)),
  );
  res.json({ message: 'Public reports demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/recommendations/list', (req, res) => {
  const list = RECOMMENDATIONS.filter((row) => contains(row.crop, req.query.crop || req.query.search));
  res.json({ message: 'Recommendations demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/recommendations/early-warnings', (req, res) => {
  const list = EARLY_WARNINGS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) && contains(row.warning_type, req.query.search),
  );
  res.json({ message: 'Early warnings demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/research-outputs/list', (req, res) => {
  const list = RESEARCH_OUTPUTS.filter((row) =>
    contains(row.status, req.query.status) &&
    (contains(row.title, req.query.search) || contains(row.authors?.join(' '), req.query.author)) &&
    contains(row.crop_focus?.join(' '), req.query.crop),
  );
  res.json({ message: 'Research outputs demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/research-outputs/detail', (req, res) => {
  const item = RESEARCH_OUTPUTS.find((row) => row.id === req.query.id) ?? null;
  res.json({ message: 'Research output detail demo data', data: item });
});

demoDataRouter.post('/research-outputs/create', (req, res) => {
  const payload = req.body ?? {};
  const id = makeId('res');
  const item = {
    id,
    title: payload.title ?? 'Untitled Research',
    authors: Array.isArray(payload.authors) ? payload.authors : String(payload.authors ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    abstract: payload.abstract ?? '',
    crop_focus: Array.isArray(payload.crop_focus_ids) ? payload.crop_focus_ids : String(payload.crop_focus_ids ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    status: 'draft',
    datasets_used: [],
    models_applied: [],
    methodology: payload.methodology ?? '',
    key_findings: payload.key_findings ?? '',
    citation: '',
    file_url: payload.file ?? '',
    version_history: [{ version: 1, updated_at: new Date().toISOString(), changes: 'Initial draft' }],
    published_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  RESEARCH_OUTPUTS = [item, ...RESEARCH_OUTPUTS];
  res.json({ message: 'Research output created (demo)', data: { id } });
});

demoDataRouter.put('/research-outputs/update', (req, res) => {
  const payload = req.body ?? {};
  RESEARCH_OUTPUTS = RESEARCH_OUTPUTS.map((row) =>
    row.id === payload.id
      ? {
          ...row,
          title: payload.title ?? row.title,
          authors: payload.authors ?? row.authors,
          abstract: payload.abstract ?? row.abstract,
          crop_focus: payload.crop_focus_ids ?? row.crop_focus,
          methodology: payload.methodology ?? row.methodology,
          key_findings: payload.key_findings ?? row.key_findings,
          status: payload.status ?? row.status,
          updated_at: new Date().toISOString(),
        }
      : row,
  );
  res.json({ message: 'Research output updated (demo)', data: { id: payload.id } });
});

demoDataRouter.delete('/research-outputs/delete', (req, res) => {
  const id = req.body?.id;
  RESEARCH_OUTPUTS = RESEARCH_OUTPUTS.filter((row) => row.id !== id);
  res.json({ message: 'Research output deleted (demo)', data: { id } });
});

demoDataRouter.get('/seasonal-calendars/list', (req, res) => {
  const list = SEASONAL_CALENDARS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.season, req.query.season) &&
    contains(row.agro_ecological_zone, req.query.agro_ecological_zone),
  );
  res.json({ message: 'Seasonal calendars demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/seasonal-calendars/pest-risk-windows', (req, res) => {
  const list = PEST_RISK_WINDOWS.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.season, req.query.season) &&
    contains(row.agro_ecological_zone, req.query.agro_ecological_zone),
  );
  res.json({ message: 'Pest risk windows demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/farming-practices/list', (req, res) => {
  const list = FARMING_PRACTICES.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.practice_type, req.query.practice_type) &&
    contains(row.title, req.query.search),
  );
  res.json({ message: 'Farming practices demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/varieties/list', (req, res) => {
  const list = VARIETIES.filter((row) => contains(row.crop, req.query.crop || req.query.search) && contains(row.variety_name, req.query.search));
  res.json({ message: 'Varieties demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.post('/statistical-analysis/run', (_req, res) => {
  res.json({ message: 'Statistical analysis run started (demo)', data: { job_id: makeId('stat'), status: 'running', estimated_completion: '2026-07-21T16:00:00Z' } });
});

demoDataRouter.get('/statistical-analysis/results', (req, res) => {
  const jobId = String(req.query.job_id ?? 'stat-demo-001');
  res.json({
    message: 'Statistical analysis results demo data',
    data: {
      job_id: jobId,
      analysis_method: 'regression',
      status: 'completed',
      summary_statistics: { mean_yield: 2140, std_yield: 190 },
      correlation_matrix: { rainfall_vs_yield: 0.62, ndvi_vs_yield: 0.71 },
      trend_data: { years: [2022, 2023, 2024, 2025, 2026], values: [1800, 1905, 2010, 2090, 2140] },
      charts: [{ title: 'Yield Trend', type: 'line', data: { labels: [2022, 2023, 2024, 2025, 2026], values: [1800, 1905, 2010, 2090, 2140] } }],
      export_url_csv: '/downloads/stat-analysis.csv',
      export_url_pdf: '/downloads/stat-analysis.pdf',
      completed_at: new Date().toISOString(),
    },
  });
});

demoDataRouter.get('/impact/assessment/list', (req, res) => {
  const list = IMPACT_ASSESSMENTS.filter((row) => contains(row.programme_id, req.query.programme_id) && contains(row.programme_name, req.query.search));
  res.json({ message: 'Impact assessment list demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.get('/impact/baseline/list', (req, res) => {
  const list = IMPACT_BASELINES.filter((row) =>
    contains(row.crop, req.query.crop || req.query.search) &&
    contains(row.district, req.query.district || req.query.search),
  );
  res.json({ message: 'Impact baseline list demo data', ...paginate(list, req.query.page, req.query.limit) });
});

demoDataRouter.post('/impact/assessment/run', (_req, res) => {
  res.json({ message: 'Impact assessment run started (demo)', data: { job_id: makeId('impact'), status: 'running', estimated_completion: '2026-07-21T17:00:00Z' } });
});

demoDataRouter.get('/impact/assessment/results', (req, res) => {
  const jobId = String(req.query.job_id ?? 'impact-demo-001');
  res.json({
    message: 'Impact assessment results demo data',
    data: {
      job_id: jobId,
      programme_id: 'prog-001',
      status: 'completed',
      yield_improvement_pct: 14.3,
      income_change_usd: 186,
      adoption_rate_pct: 68.9,
      resilience_score: 74.1,
      beneficiaries_assessed: 1240,
      methodology: 'Difference-in-differences',
      results_detail: { treatment_group: 620, control_group: 620 },
      completed_at: new Date().toISOString(),
    },
  });
});

demoDataRouter.post('/impact/beneficiary/link', (_req, res) => {
  res.json({ message: 'Beneficiary linked to impact assessment (demo)', data: { id: makeId('impact-link') } });
});

demoDataRouter.put('/notifications/preferences', (_req, res) => {
  res.json({ message: 'Notification preferences saved (demo)', data: { id: 'notif-pref-demo' } });
});

demoDataRouter.get('/users/profile', (_req, res) => {
  res.json({ message: 'User profile demo data', data: USER_PROFILE });
});

demoDataRouter.put('/users/profile', (req, res) => {
  const payload = req.body ?? {};
  USER_PROFILE = {
    ...USER_PROFILE,
    full_name: payload.full_name ?? USER_PROFILE.full_name,
    email: payload.email ?? USER_PROFILE.email,
    phone_number: payload.phone_number ?? USER_PROFILE.phone_number,
    district: payload.district_id ?? USER_PROFILE.district,
    sub_county: payload.sub_county ?? USER_PROFILE.sub_county,
    updated_at: new Date().toISOString(),
  };
  res.json({ message: 'User profile updated (demo)', data: { id: USER_PROFILE.id } });
});
