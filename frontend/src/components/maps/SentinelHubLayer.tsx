/**
 * SentinelHubLayer — Leaflet WMS tile layer component for Sentinel Hub imagery.
 * Tiles are served through the backend proxy at /api/sentinel/tiles/{z}/{x}/{y}
 * which clips requests to Uganda's bounding box and injects credentials.
 */
import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { SENTINEL_API_BASE, type SentinelLayerId } from '@/lib/geospatial/sentinelHub';

interface SentinelHubLayerProps {
  layerId: SentinelLayerId;
  visible: boolean;
  opacity?: number;
}

export function SentinelHubLayer({ layerId, visible, opacity = 0.85 }: SentinelHubLayerProps) {
  const map = useMap();
  const layerRef = useRef<L.TileLayer.WMS | null>(null);

  useEffect(() => {
    // Build WMS layer through backend proxy
    const wmsUrl = `${SENTINEL_API_BASE}/wms`;

    const layer = L.tileLayer.wms(wmsUrl, {
      layers:      layerId,
      format:      'image/png',
      transparent: true,
      opacity:     visible ? opacity : 0,
      version:     '1.3.0',
      // Clamp to Uganda bbox — proxy enforces this too
      tileSize:    512,
      // Extra params forwarded to proxy → Sentinel Hub
      // @ts-ignore — Leaflet accepts arbitrary WMS params
      MAXCC:       '20',
      attribution: '© <a href="https://www.sentinel-hub.com">Sentinel Hub</a>',
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  // Re-create layer only when layerId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layerId, map]);

  // Update visibility / opacity without re-creating
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.setOpacity(visible ? opacity : 0);
    }
  }, [visible, opacity]);

  return null;
}
