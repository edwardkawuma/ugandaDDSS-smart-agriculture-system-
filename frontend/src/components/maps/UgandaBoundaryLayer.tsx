import { useEffect, useState } from 'react';
import { GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject } from 'geojson';
import type { PathOptions } from 'leaflet';
import { GEOJSON_PATHS } from '@/lib/geospatial/constants';

const boundaryStyle: PathOptions = {
  color: 'hsl(25 95% 50%)',
  weight: 2,
  fillColor: 'hsl(25 95% 50%)',
  fillOpacity: 0.06,
  dashArray: '4 4',
};

interface UgandaBoundaryLayerProps {
  fitBounds?: boolean;
}

export function UgandaBoundaryLayer({ fitBounds = true }: UgandaBoundaryLayerProps) {
  const map = useMap();
  const [data, setData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch(GEOJSON_PATHS.boundary)
      .then((r) => r.json())
      .then((json: GeoJsonObject) => {
        setData(json);
        if (fitBounds) {
          const layer = L.geoJSON(json);
          map.fitBounds(layer.getBounds(), { padding: [24, 24] });
        }
      })
      .catch(console.error);
  }, [map, fitBounds]);

  if (!data) return null;
  return <GeoJSON data={data} style={() => boundaryStyle} />;
}
