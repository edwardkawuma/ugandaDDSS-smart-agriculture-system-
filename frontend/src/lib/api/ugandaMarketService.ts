/**
 * Uganda DDSS — Market Price Service
 * Connects to the real backend routes that aggregate data from:
 *   - UCDA (Uganda Coffee Development Authority)
 *   - UBOS (Uganda Bureau of Statistics)
 *   - District market monitoring
 *   - Farm-gate price surveys
 *
 * These endpoints are served by backend/market/routes.js
 * and are distinct from the mock-based marketPricesService.
 */

import axios from 'axios';
import { Env } from '@/constants/Env';

const BASE = Env.network.base_url?.replace('/api', '') || 'http://localhost:3001';

export interface UgandaMarketPrice {
  id: string;
  crop: string;
  market_name: string;
  district: string;
  agro_ecological_zone: string;
  farm_gate_price: number;
  market_price: number;
  export_price: number | null;
  unit: string;
  currency: 'UGX';
  recorded_date: string;
  source: string;
  price_trend: 'up' | 'down' | 'stable';
}

export interface MarketPricesListParams {
  crop?: string;
  district?: string;
  market?: string;
  page?: number;
  limit?: number;
}

export interface MarketPricesTrendPoint {
  date: string;
  farm_gate_price: number;
  market_price: number;
  export_price: number | null;
  district: string;
}

export interface TrendsParams {
  crop?: string;
  period_days?: number;
  district?: string;
}

export interface UCDAExportPrice {
  grade: string;
  price_usd_per_tonne: number;
  price_ugx_per_kg: number;
  market: string;
}

export interface UBOSCropStat {
  crop: string;
  farm_gate_ugx_per_kg: number;
  market_ugx_per_kg: number;
  export_ugx_per_kg: number | null;
  unit: string;
  yoy_change_pct: number;
  data_source: string;
}

export const ugandaMarketService = {
  /**
   * Fetch current market prices (UCDA / UBOS / district markets)
   */
  list: async (params: MarketPricesListParams = {}) => {
    const res = await axios.get<{
      data: UgandaMarketPrice[];
      total: number;
      page: number;
      limit: number;
    }>(`${BASE}/api/market-prices`, { params });
    return res.data;
  },

  /**
   * Fetch historical price trends for a specific crop
   */
  trends: async (params: TrendsParams = {}) => {
    const res = await axios.get<{
      crop: string;
      period_days: number;
      district: string;
      data: MarketPricesTrendPoint[];
    }>(`${BASE}/api/market-prices/trends`, { params });
    return res.data;
  },

  /**
   * Fetch UCDA coffee export price bulletin
   */
  ucda: async () => {
    const res = await axios.get<{
      source: string;
      bulletin_date: string;
      export_prices: UCDAExportPrice[];
      farm_gate: Record<string, { price_ugx_per_kg: number; region: string }>;
      exchange_rate: { usd_ugx: number };
    }>(`${BASE}/api/market-prices/ucda`);
    return res.data;
  },

  /**
   * Fetch UBOS national commodity price statistics
   */
  ubos: async () => {
    const res = await axios.get<{
      source: string;
      reference_year: number;
      national_average_prices: UBOSCropStat[];
      regional_breakdown: Array<{
        zone: string;
        crops: Array<{ crop: string; avg_farm_gate_ugx_per_kg: number }>;
      }>;
    }>(`${BASE}/api/market-prices/ubos`);
    return res.data;
  },

  /**
   * Fetch district-level price map data for a crop
   */
  districts: async (crop = 'Maize') => {
    const res = await axios.get<{
      crop: string;
      data: Array<{
        district: string;
        agro_ecological_zone: string;
        crop: string;
        farm_gate_price: number;
        market_price: number;
        unit: string;
        currency: string;
        last_updated: string;
      }>;
    }>(`${BASE}/api/market-prices/districts`, { params: { crop } });
    return res.data;
  },
};

export default ugandaMarketService;
