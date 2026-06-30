import apiService from './apiService';
import { Endpoint } from './endpoints';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SensorReading = {
  id: string;
  farm_id: string;
  district: string;
  crop: string;
  timestamp: string;
  soil_moisture: number;       // %
  soil_ph: number;
  soil_temperature: number;    // °C
  air_temperature: number;     // °C
  humidity: number;            // %
  rainfall: number;            // mm
  solar_radiation: number;     // W/m²
  sensor_status: 'online' | 'offline' | 'warning';
};

export type NdviDataPoint = {
  date: string;
  ndvi: number;
  evi: number;
  source: 'Sentinel-2' | 'Landsat-8' | 'Landsat-9' | 'MODIS';
  cloud_cover: number;
};

export type UavScan = {
  id: string;
  farm_id: string;
  district: string;
  crop: string;
  scan_date: string;
  altitude_m: number;
  resolution_cm: number;
  canopy_cover: number;         // %
  disease_detected: boolean;
  disease_type: string | null;
  disease_confidence: number;   // 0–1
  plant_count: number;
  stressed_plants: number;
  ndvi_mean: number;
  thumbnail_url: string;
  status: 'processing' | 'complete' | 'failed';
};

export type TimeSeriesAlert = {
  id: string;
  type: 'drought' | 'flood' | 'pest_outbreak' | 'disease' | 'anomaly';
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  crop: string;
  district: string;
  detected_at: string;
  description: string;
  changepoint_index: number;
  recommended_action: string;
};

export type CropHealthSummary = {
  crop: string;
  district: string;
  health_score: number;         // 0–100
  ndvi_current: number;
  ndvi_trend: 'improving' | 'stable' | 'declining';
  stress_index: number;         // 0–1
  phenology_stage: string;
  days_to_harvest: number | null;
  active_alerts: number;
  last_updated: string;
};

export type SensorsListResponse = { data: SensorReading[]; total: number };
export type NdviSeriesResponse  = { data: NdviDataPoint[]; crop: string; district: string };
export type UavScansResponse    = { data: UavScan[]; total: number };
export type AlertsTimeSeriesResponse = { data: TimeSeriesAlert[]; total: number };
export type HealthSummaryResponse    = { data: CropHealthSummary[] };

// ── Service ───────────────────────────────────────────────────────────────────

export const cropMonitoringService = {
  sensors: (params: { district?: string; crop?: string; page?: number; limit?: number } = {}) =>
    apiService.get<SensorsListResponse>({ endpoint: Endpoint.CROP_MONITORING.SENSORS, params }),

  ndviSeries: (params: { crop: string; district: string; from?: string; to?: string; source?: string }) =>
    apiService.get<NdviSeriesResponse>({ endpoint: Endpoint.CROP_MONITORING.NDVI_SERIES, params }),

  uavScans: (params: { district?: string; crop?: string; page?: number; limit?: number } = {}) =>
    apiService.get<UavScansResponse>({ endpoint: Endpoint.CROP_MONITORING.UAV_SCANS, params }),

  timeseries_alerts: (params: { district?: string; crop?: string; severity?: string; page?: number; limit?: number } = {}) =>
    apiService.get<AlertsTimeSeriesResponse>({ endpoint: Endpoint.CROP_MONITORING.TIMESERIES_ALERTS, params }),

  healthSummary: (params: { district?: string } = {}) =>
    apiService.get<HealthSummaryResponse>({ endpoint: Endpoint.CROP_MONITORING.HEALTH_SUMMARY, params }),
};
