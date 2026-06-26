import { useCallback, useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, MapPin } from 'lucide-react';
import {
  UGANDA_CENTER,
  UGANDA_MAX_ZOOM,
  UGANDA_MIN_ZOOM,
  UGANDA_ZOOM,
  UGANDA_BOUNDS,
} from '@/lib/geospatial/constants';
import { fetchGeeLayers, fetchGeeStatus } from '@/lib/geospatial/earthEngineClient';
import {
  DEFAULT_ACTIVE_LAYERS,
  type ActiveLayerState,
  type GeeLayerDefinition,
  type GeeLayerId,
} from '@/lib/geospatial/types';
import { DemoChoroplethLayer, GeeRasterLayer } from '@/components/maps/GeeLayers';
import { MapLayerControlPanel } from '@/components/maps/MapLayerControlPanel';
import { MapLocationSearch } from '@/components/maps/MapLocationSearch';
import { UgandaBoundaryLayer } from '@/components/maps/UgandaBoundaryLayer';
import { UgandaDistrictsLayer } from '@/components/maps/UgandaDistrictsLayer';

export interface AgriculturalMapProps {
  title?: string;
  description?: string;
  className?: string;
  heightClassName?: string;
  showLayerPanel?: boolean;
  defaultLayers?: ActiveLayerState[];
  enableSearch?: boolean;
}

export function AgriculturalMap({
  title = 'Uganda Agricultural Map',
  description = 'National boundary (GeoJSON) with SerpApi location search, zoom, and layer toggles',
  className,
  heightClassName = 'h-[480px]',
  showLayerPanel = true,
  defaultLayers = DEFAULT_ACTIVE_LAYERS,
  enableSearch = true,
}: AgriculturalMapProps) {
  const [mode, setMode] = useState<'gee' | 'demo'>('demo');
  const [layerCatalog, setLayerCatalog] = useState<GeeLayerDefinition[]>([]);
  const [activeLayers, setActiveLayers] = useState<ActiveLayerState[]>(
    defaultLayers.map((l) => ({ ...l, visible: false })),
  );
  const [showBoundary, setShowBoundary] = useState(true);
  const [showDistricts, setShowDistricts] = useState(false);
  const [showAgLayers, setShowAgLayers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setLoading(true);
      const [status, layersRes] = await Promise.all([fetchGeeStatus(), fetchGeeLayers()]);
      if (cancelled) return;
      setMode(status.mode);
      setStatusMessage(status.message);
      setLayerCatalog(layersRes.layers.length ? layersRes.layers : FALLBACK_LAYERS);
      setLoading(false);
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleLayer = useCallback(
    (id: GeeLayerId) => {
      setShowAgLayers(true);
      setActiveLayers((prev) =>
        prev.map((layer) => {
          if (layer.id === id) return { ...layer, visible: !layer.visible };
          if (mode === 'demo') return { ...layer, visible: false };
          return layer;
        }),
      );
    },
    [mode],
  );

  const resetLayers = useCallback(() => {
    setShowBoundary(true);
    setShowDistricts(false);
    setShowAgLayers(false);
    setActiveLayers(defaultLayers.map((l) => ({ ...l, visible: false })));
  }, [defaultLayers]);

  const visibleGeeLayers = useMemo(
    () => (showAgLayers ? activeLayers.filter((l) => l.visible) : []),
    [activeLayers, showAgLayers],
  );

  return (
    <div className={cn('grid grid-cols-1 gap-4', showLayerPanel && 'lg:grid-cols-[260px_1fr]', className)}>
      {showLayerPanel && (
        <Card className="self-start border-border/40 bg-card/60 shadow-md backdrop-blur-md">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base">Map Layers</CardTitle>
            <CardDescription className="text-xs">{statusMessage || 'Loading geospatial services…'}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting…
              </div>
            ) : (
              <>
                <div className="space-y-2 rounded-lg border border-border/40 bg-card/40 p-3">
                  <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    Uganda Overlays
                  </Label>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">National boundary</span>
                    <Switch checked={showBoundary} onCheckedChange={setShowBoundary} aria-label="National boundary" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">District boundaries</span>
                    <Switch checked={showDistricts} onCheckedChange={setShowDistricts} aria-label="District boundaries" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm">Agricultural layers</span>
                    <Switch
                      checked={showAgLayers}
                      onCheckedChange={(v) => {
                        setShowAgLayers(v);
                        if (!v) setActiveLayers((prev) => prev.map((l) => ({ ...l, visible: false })));
                      }}
                      aria-label="Agricultural layers"
                    />
                  </div>
                </div>

                {showAgLayers && (
                  <MapLayerControlPanel
                    layers={layerCatalog}
                    activeLayers={activeLayers}
                    mode={mode}
                    onToggle={toggleLayer}
                    onReset={resetLayers}
                  />
                )}

                {!showAgLayers && (
                  <button
                    type="button"
                    onClick={resetLayers}
                    className="w-full rounded-md border border-border/50 px-3 py-1.5 text-xs text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
                  >
                    Reset to boundary only
                  </button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="overflow-hidden border-border/40 bg-card/60 shadow-md backdrop-blur-md">
        <CardHeader className="border-b border-border/40 pb-2">
          <CardTitle className="font-heading text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="relative p-0">
          <div className={cn('relative w-full', heightClassName)}>
            <MapContainer
              center={UGANDA_CENTER}
              zoom={UGANDA_ZOOM}
              minZoom={UGANDA_MIN_ZOOM}
              maxZoom={UGANDA_MAX_ZOOM}
              maxBounds={UGANDA_BOUNDS}
              maxBoundsViscosity={1}
              zoomControl={false}
              className="h-full w-full rounded-b-lg"
              scrollWheelZoom
            >
              <ZoomControl position="topright" />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {showBoundary && <UgandaBoundaryLayer />}
              {showDistricts && <UgandaDistrictsLayer visible={showDistricts} />}
              {mode === 'gee'
                ? visibleGeeLayers.map((layer) => (
                    <GeeRasterLayer
                      key={layer.id}
                      layerId={layer.id}
                      visible={layer.visible}
                      opacity={layer.opacity}
                    />
                  ))
                : visibleGeeLayers.map((layer) => (
                    <DemoChoroplethLayer
                      key={layer.id}
                      layerId={layer.id}
                      visible={layer.visible}
                      opacity={layer.opacity}
                    />
                  ))}
              {enableSearch && <MapLocationSearch />}
            </MapContainer>
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const FALLBACK_LAYERS: GeeLayerDefinition[] = [
  {
    id: 'crop-distribution',
    name: 'Crop / Land Cover',
    description: 'ESA WorldCover land-cover classes clipped to Uganda',
    source: 'ESA/WorldCover/v200',
    legend: [
      { label: 'Low production', color: '#fef0d9' },
      { label: 'Medium', color: '#fc8d59' },
      { label: 'High', color: '#d7301f' },
    ],
  },
  {
    id: 'soil-quality',
    name: 'Soil Texture',
    description: 'USDA soil texture classification',
    source: 'OpenLandMap',
    legend: [
      { label: 'Clay', color: '#8c510a' },
      { label: 'Loam', color: '#dfc27d' },
      { label: 'Sand', color: '#c7eae5' },
    ],
  },
  {
    id: 'rainfall',
    name: 'Annual Rainfall',
    description: 'CHIRPS precipitation (12-month sum)',
    source: 'UCSB-CHG/CHIRPS/DAILY',
    legend: [
      { label: '< 800 mm', color: '#ffffcc' },
      { label: '1200 mm', color: '#41b6c4' },
      { label: '> 1600 mm', color: '#225ea8' },
    ],
  },
  {
    id: 'ndvi',
    name: 'Vegetation (NDVI)',
    description: 'Sentinel-2 median NDVI',
    source: 'COPERNICUS/S2_SR',
    legend: [
      { label: 'Sparse', color: '#d73027' },
      { label: 'Healthy', color: '#1a9850' },
    ],
  },
];
