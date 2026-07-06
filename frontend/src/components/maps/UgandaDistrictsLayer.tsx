/**
 * UgandaDistrictsLayer — Interactive choropleth district map.
 *
 * Colours each district polygon according to the active Sentinel Hub layer
 * value (NDVI, EVI, Moisture, etc.).  Hover shows a tooltip with district
 * name, region, main crop, and the layer value.  Click highlights the district
 * and fires `onDistrictClick`.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { GeoJSON, useMap }         from 'react-leaflet';
import L, { type LeafletMouseEvent } from 'leaflet';
import type { Feature, GeoJsonObject, Geometry } from 'geojson';
import { GEOJSON_PATHS }           from '@/lib/geospatial/constants';
import {
  DISTRICT_LAYER_VALUES,
  LAYER_COLOUR_RAMPS,
  rampColor,
} from '@/lib/geospatial/districtLayerValues';
import type { SentinelLayerId }    from '@/lib/geospatial/sentinelHub';

export type DistrictFeatureProps = {
  district_id:      string;
  district_name:    string;
  region:           string;
  crop:             string;
  production_index: number;
};

export type SelectedDistrict = {
  id:     string;
  name:   string;
  region: string;
  crop:   string;
  value:  number;
  layer:  string;
};

interface UgandaDistrictsLayerProps {
  /** Which Sentinel layer drives the choropleth colours */
  activeLayerId?: SentinelLayerId | null;
  /** Overall opacity of fills */
  opacity?: number;
  onDistrictClick?: (d: SelectedDistrict) => void;
}

const FALLBACK_LAYER = 'NDVI';
const DEFAULT_FILL   = '#4ade80';
const HIGHLIGHT_STROKE = '#FFD700';
const NORMAL_STROKE    = '#ffffff';

export function UgandaDistrictsLayer({
  activeLayerId,
  opacity = 0.75,
  onDistrictClick,
}: UgandaDistrictsLayerProps) {
  const map     = useMap();
  const [data,  setData]     = useState<GeoJsonObject | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const geoJsonRef = useRef<L.GeoJSON | null>(null);
  const tooltipRef = useRef<L.Tooltip | null>(null);

  // Load GeoJSON once
  useEffect(() => {
    fetch(GEOJSON_PATHS.districts)
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  const layerId = activeLayerId ?? FALLBACK_LAYER;
  const ramp    = LAYER_COLOUR_RAMPS[layerId] ?? LAYER_COLOUR_RAMPS[FALLBACK_LAYER];
  const values  = DISTRICT_LAYER_VALUES[layerId] ?? {};

  // Recolour whenever layer or selected district changes
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer: L.Layer) => {
      const path = layer as L.Path & { feature?: Feature };
      const id   = path.feature?.properties?.district_id as string | undefined;
      if (!id) return;
      const val  = values[id] ?? 0.5;
      const fill = rampColor(val, ramp);
      const isSelected = id === selected;
      const isHovered  = id === hovered;
      (path as L.Path).setStyle({
        fillColor:    fill,
        fillOpacity:  isSelected ? Math.min(opacity + 0.15, 1) : opacity,
        color:        isSelected ? HIGHLIGHT_STROKE : isHovered ? '#fbbf24' : NORMAL_STROKE,
        weight:       isSelected ? 3 : isHovered ? 2 : 1,
      });
    });
  }, [layerId, selected, hovered, opacity, values, ramp]);

  const styleFor = useMemo(() => (feature?: Feature) => {
    const id  = feature?.properties?.district_id as string | undefined;
    const val = id ? (values[id] ?? 0.5) : 0.5;
    return {
      fillColor:   rampColor(val, ramp),
      fillOpacity: opacity,
      color:       NORMAL_STROKE,
      weight:      1,
    };
  }, [layerId, opacity, values, ramp]); // eslint-disable-line react-hooks/exhaustive-deps

  const onEachFeature = useMemo(() => (
    feature: Feature<Geometry, DistrictFeatureProps>,
    layer:   L.Layer,
  ) => {
    const path  = layer as L.Path;
    const props = feature.properties;
    const id    = props.district_id;
    const val   = values[id] ?? 0.5;
    const pct   = (val * 100).toFixed(1);

    // Persistent tooltip
    const tip = L.tooltip({
      permanent:  false,
      direction:  'top',
      className:  'sentinel-district-tooltip',
      opacity:    0.97,
    }).setContent(`
      <div style="min-width:160px;font-family:sans-serif;font-size:12px;">
        <strong style="font-size:13px;">${props.district_name}</strong>
        <div style="color:#888;margin:2px 0 4px;">${props.region} Region</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
          <span>Main crop</span><strong>${props.crop}</strong>
        </div>
        <div style="display:flex;justify-content:space-between;">
          <span>${layerId}</span>
          <strong style="color:${rampColor(val, ramp)};filter:brightness(0.7);">${pct}%</strong>
        </div>
      </div>
    `);
    layer.bindTooltip(tip);

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        setHovered(id);
        L.DomEvent.stopPropagation(e);
      },
      mouseout: () => setHovered(null),
      click: (e: LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        setSelected(prev => prev === id ? null : id);
        onDistrictClick?.({
          id,
          name:   props.district_name,
          region: props.region,
          crop:   props.crop,
          value:  val,
          layer:  layerId,
        });
        // Zoom to district
        const bounds = (path as unknown as L.GeoJSON).getBounds?.();
        if (bounds) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
      },
    });
  }, [layerId, values, ramp, map, onDistrictClick]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return null;

  return (
    <GeoJSON
      key={`districts-${layerId}-${opacity}`}
      data={data}
      style={styleFor}
      onEachFeature={onEachFeature}
      ref={geoJsonRef}
    />
  );
}
