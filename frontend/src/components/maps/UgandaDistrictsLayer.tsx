import { useEffect, useState } from 'react';
import { GeoJSON } from 'react-leaflet';
import type { GeoJsonObject } from 'geojson';
import type { PathOptions } from 'leaflet';
import { GEOJSON_PATHS } from '@/lib/geospatial/constants';

const districtStyle: PathOptions = {
  color: '#ffffff',
  weight: 1,
  fillColor: 'hsl(142 76% 36%)',
  fillOpacity: 0.15,
};

interface UgandaDistrictsLayerProps {
  visible: boolean;
  opacity?: number;
}

/** Optional district boundaries overlay (toggleable). National boundary is separate. */
export function UgandaDistrictsLayer({ visible, opacity = 0.15 }: UgandaDistrictsLayerProps) {
  const [data, setData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch(GEOJSON_PATHS.districts)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data || !visible) return null;

  return (
    <GeoJSON
      data={data}
      style={() => ({
        ...districtStyle,
        fillOpacity: opacity,
      })}
    />
  );
}
