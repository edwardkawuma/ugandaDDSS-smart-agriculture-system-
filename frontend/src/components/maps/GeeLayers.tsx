import { useEffect, useMemo, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { Feature, GeoJsonObject } from 'geojson';
import type { PathOptions } from 'leaflet';
import { GEOJSON_PATHS } from '@/lib/geospatial/constants';
import { buildGeeTileUrl, fetchGeeTile } from '@/lib/geospatial/earthEngineClient';
import {
  colorForValue,
  DEMO_LAYER_PALETTES,
  type GeeLayerId,
} from '@/lib/geospatial/types';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

interface DemoChoroplethLayerProps {
  layerId: GeeLayerId;
  visible: boolean;
  opacity: number;
}

/** Demo-mode district choropleth when GEE tiles are unavailable. */
export function DemoChoroplethLayer({ layerId, visible, opacity }: DemoChoroplethLayerProps) {
  const [data, setData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch(GEOJSON_PATHS.districts)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const palette = DEMO_LAYER_PALETTES[layerId];

  const style = useMemo(
    () =>
      (feature?: Feature): PathOptions => {
        const props = feature?.properties ?? {};
        const value = Number(props[palette.property] ?? 0.5);
        return {
          color: '#ffffff',
          weight: 1,
          fillColor: colorForValue(value, palette.stops),
          fillOpacity: visible ? opacity : 0,
        };
      },
    [layerId, opacity, palette, visible],
  );

  if (!data || !visible) return null;
  return <GeoJSON key={layerId} data={data} style={style} />;
}

interface GeeRasterLayerProps {
  layerId: GeeLayerId;
  visible: boolean;
  opacity: number;
}

/** Loads Google Earth Engine raster tiles when the backend is authenticated. */
export function GeeRasterLayer({ layerId, visible, opacity }: GeeRasterLayerProps) {
  const map = useMap();
  const [tileLayer, setTileLayer] = useState<L.TileLayer | null>(null);

  useEffect(() => {
    let cancelled = false;
    let layer: L.TileLayer | null = null;

    async function load() {
      const tile = await fetchGeeTile(layerId);
      const url = buildGeeTileUrl(tile);
      if (cancelled || !url) return;

      layer = L.tileLayer(url, {
        opacity,
        maxZoom: 14,
        attribution: 'Google Earth Engine',
      });
      layer.addTo(map);
      setTileLayer(layer);
    }

    if (visible) {
      void load();
    }

    return () => {
      cancelled = true;
      if (layer) map.removeLayer(layer);
      setTileLayer(null);
    };
  }, [layerId, map]);

  useEffect(() => {
    if (tileLayer) {
      tileLayer.setOpacity(visible ? opacity : 0);
    }
  }, [tileLayer, visible, opacity]);

  return null;
}
