import { Router } from 'express';

export const cropMonitoringRouter = Router();

// Static mock data — in production these would query PostGIS + InfluxDB / TimescaleDB

const SENSORS = [
  { id: 'sensor-001', farm_id: 'farm-001', district: 'Mukono',  crop: 'Coffee (Robusta)',   timestamp: new Date().toISOString(), soil_moisture: 62, soil_ph: 6.1, soil_temperature: 22.4, air_temperature: 26.8, humidity: 74, rainfall: 4.2,  solar_radiation: 320, sensor_status: 'online'  },
  { id: 'sensor-002', farm_id: 'farm-002', district: 'Mbarara', crop: 'Maize',              timestamp: new Date().toISOString(), soil_moisture: 48, soil_ph: 5.8, soil_temperature: 24.1, air_temperature: 28.5, humidity: 65, rainfall: 0,    solar_radiation: 480, sensor_status: 'warning' },
  { id: 'sensor-003', farm_id: 'farm-003', district: 'Kabale',  crop: 'Beans',              timestamp: new Date().toISOString(), soil_moisture: 71, soil_ph: 6.4, soil_temperature: 18.9, air_temperature: 21.3, humidity: 82, rainfall: 12.6, solar_radiation: 210, sensor_status: 'online'  },
  { id: 'sensor-004', farm_id: 'farm-004', district: 'Masindi', crop: 'Bananas (Matooke)',  timestamp: new Date().toISOString(), soil_moisture: 78, soil_ph: 6.8, soil_temperature: 23.6, air_temperature: 27.1, humidity: 88, rainfall: 18.3, solar_radiation: 195, sensor_status: 'online'  },
  { id: 'sensor-005', farm_id: 'farm-005', district: 'Gulu',    crop: 'Cassava',            timestamp: new Date().toISOString(), soil_moisture: 34, soil_ph: 5.5, soil_temperature: 29.2, air_temperature: 33.4, humidity: 52, rainfall: 0,    solar_radiation: 620, sensor_status: 'offline' },
];

const UAV_SCANS = [
  { id: 'uav-001', farm_id: 'farm-001', district: 'Mukono',  crop: 'Coffee (Robusta)',  scan_date: '2026-06-25', altitude_m: 80,  resolution_cm: 2, canopy_cover: 84, disease_detected: true,  disease_type: 'Coffee Leaf Rust',        disease_confidence: 0.87, plant_count: 1240, stressed_plants: 186, ndvi_mean: 0.61, status: 'complete' },
  { id: 'uav-002', farm_id: 'farm-002', district: 'Mbarara', crop: 'Maize',             scan_date: '2026-06-24', altitude_m: 100, resolution_cm: 3, canopy_cover: 72, disease_detected: true,  disease_type: 'Fall Armyworm',           disease_confidence: 0.93, plant_count: 3400, stressed_plants: 510, ndvi_mean: 0.54, status: 'complete' },
  { id: 'uav-003', farm_id: 'farm-003', district: 'Kabale',  crop: 'Beans',             scan_date: '2026-06-26', altitude_m: 60,  resolution_cm: 2, canopy_cover: 91, disease_detected: false, disease_type: null,                      disease_confidence: 0,    plant_count: 5200, stressed_plants: 104, ndvi_mean: 0.74, status: 'complete' },
  { id: 'uav-004', farm_id: 'farm-004', district: 'Masindi', crop: 'Bananas (Matooke)', scan_date: '2026-06-27', altitude_m: 70,  resolution_cm: 2, canopy_cover: 96, disease_detected: true,  disease_type: 'Banana Xanthomonas Wilt', disease_confidence: 0.71, plant_count: 680,  stressed_plants: 82,  ndvi_mean: 0.68, status: 'complete' },
  { id: 'uav-005', farm_id: 'farm-005', district: 'Gulu',    crop: 'Cassava',           scan_date: '2026-06-23', altitude_m: 90,  resolution_cm: 3, canopy_cover: 58, disease_detected: true,  disease_type: 'Cassava Brown Streak Virus', disease_confidence: 0.82, plant_count: 2100, stressed_plants: 630, ndvi_mean: 0.43, status: 'complete' },
];

const TS_ALERTS = [
  { id: 'tsa-001', type: 'disease',       severity: 'High',     crop: 'Coffee (Robusta)',  district: 'Mukono',  detected_at: '2026-06-25T10:30:00Z', description: 'NDVI changepoint detected. 15% canopy decline over 3 weeks correlated with Coffee Leaf Rust spread.', changepoint_index: 18, recommended_action: 'Apply copper-based fungicide. Increase UAV monitoring to bi-weekly.' },
  { id: 'tsa-002', type: 'pest_outbreak', severity: 'Critical', crop: 'Maize',             district: 'Mbarara', detected_at: '2026-06-24T07:15:00Z', description: 'Mann-Kendall trend analysis shows statistically significant NDVI decline (p<0.01). Fall Armyworm confirmed.', changepoint_index: 12, recommended_action: 'Deploy pheromone traps. Apply approved insecticide within 48 hours.' },
  { id: 'tsa-003', type: 'drought',       severity: 'Medium',   crop: 'Cassava',           district: 'Gulu',    detected_at: '2026-06-20T14:00:00Z', description: 'Soil moisture below 35% for 9 consecutive days. EVI index declining.', changepoint_index: 8, recommended_action: 'Activate supplemental irrigation. Apply mulching to conserve moisture.' },
  { id: 'tsa-004', type: 'disease',       severity: 'Medium',   crop: 'Bananas (Matooke)', district: 'Masindi', detected_at: '2026-06-27T09:45:00Z', description: 'Xanthomonas Wilt signature in 12% of plantation with upward trend.', changepoint_index: 6, recommended_action: 'Rogue affected mats. Disinfect tools. Notify district agricultural officer.' },
  { id: 'tsa-005', type: 'anomaly',       severity: 'Low',      crop: 'Beans',             district: 'Kabale',  detected_at: '2026-06-26T16:20:00Z', description: 'Minor NDVI deviation — likely cloud cover. No immediate action required.', changepoint_index: 2, recommended_action: 'Re-acquire cloud-free imagery in 5 days.' },
];

const HEALTH_SUMMARY = [
  { id: 'hs-001', crop: 'Coffee (Robusta)',  district: 'Mukono',  health_score: 62, ndvi_current: 0.61, ndvi_trend: 'declining', stress_index: 0.38, phenology_stage: 'Berry Development', days_to_harvest: 68,  active_alerts: 1 },
  { id: 'hs-002', crop: 'Maize',             district: 'Mbarara', health_score: 54, ndvi_current: 0.54, ndvi_trend: 'declining', stress_index: 0.46, phenology_stage: 'Tasseling',         days_to_harvest: 42,  active_alerts: 1 },
  { id: 'hs-003', crop: 'Beans',             district: 'Kabale',  health_score: 88, ndvi_current: 0.74, ndvi_trend: 'stable',    stress_index: 0.12, phenology_stage: 'Pod Filling',        days_to_harvest: 28,  active_alerts: 0 },
  { id: 'hs-004', crop: 'Bananas (Matooke)', district: 'Masindi', health_score: 71, ndvi_current: 0.68, ndvi_trend: 'stable',    stress_index: 0.29, phenology_stage: 'Bunch Filling',      days_to_harvest: 55,  active_alerts: 1 },
  { id: 'hs-005', crop: 'Cassava',           district: 'Gulu',    health_score: 41, ndvi_current: 0.43, ndvi_trend: 'declining', stress_index: 0.59, phenology_stage: 'Tuber Bulking',      days_to_harvest: 180, active_alerts: 1 },
];

cropMonitoringRouter.get('/sensors',           (_req, res) => res.json({ message: 'OK', data: SENSORS,       total: SENSORS.length }));
cropMonitoringRouter.get('/uav-scans',         (_req, res) => res.json({ message: 'OK', data: UAV_SCANS,     total: UAV_SCANS.length }));
cropMonitoringRouter.get('/timeseries-alerts', (_req, res) => res.json({ message: 'OK', data: TS_ALERTS,     total: TS_ALERTS.length }));
cropMonitoringRouter.get('/health-summary',    (_req, res) => res.json({ message: 'OK', data: HEALTH_SUMMARY, total: HEALTH_SUMMARY.length }));
cropMonitoringRouter.get('/ndvi-series',       (req, res)  => {
  const crop = req.query.crop ?? 'Coffee (Robusta)';
  const series = {
    'Coffee (Robusta)': [
      { date: 'Jan', ndvi: 0.72, evi: 0.58, source: 'Sentinel-2' },
      { date: 'Feb', ndvi: 0.74, evi: 0.60, source: 'Sentinel-2' },
      { date: 'Mar', ndvi: 0.71, evi: 0.57, source: 'Landsat-9' },
      { date: 'Apr', ndvi: 0.69, evi: 0.55, source: 'Sentinel-2' },
      { date: 'May', ndvi: 0.67, evi: 0.53, source: 'Sentinel-2' },
      { date: 'Jun', ndvi: 0.61, evi: 0.48, source: 'Sentinel-2' },
    ],
  };
  res.json({ message: 'OK', crop, data: series[crop] ?? series['Coffee (Robusta)'] });
});
