/**
 * SentinelMapDashboard — Uganda Interactive District Satellite Map
 *
 * • Uganda district choropleth coloured by the active Sentinel Hub layer
 *   (NDVI, EVI, Moisture Index, SAVI, Agriculture, False Colour, Barren Soil)
 * • WMS tiles overlaid from Sentinel Hub (proxied through /api/sentinel/wms)
 * • Click any district → detail panel (name, region, crop, layer value)
 * • Layer switcher → re-colours all districts instantly + swaps WMS overlay
 * • Embedded Time-Series Cube Builder panel
 */
import { useCallback, useState } from 'react';
import {
  MapContainer, TileLayer, ZoomControl, WMSTileLayer,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge }     from '@/components/ui/badge';
import { Button }    from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn }        from '@/lib/utils';
import {
  Satellite, Layers, Info, MapPin, Leaf,
  Droplets, Tractor, Eye, RefreshCw, X, ChevronRight,
} from 'lucide-react';
import {
  UGANDA_CENTER, UGANDA_ZOOM,
  UGANDA_MIN_ZOOM, UGANDA_MAX_ZOOM, UGANDA_BOUNDS,
} from '@/lib/geospatial/constants';
import { UgandaBoundaryLayer }  from '@/components/maps/UgandaBoundaryLayer';
import { UgandaDistrictsLayer, type SelectedDistrict }
                                from '@/components/maps/UgandaDistrictsLayer';
import { MapLocationSearch }    from '@/components/maps/MapLocationSearch';
import {
  SENTINEL_LAYERS, type SentinelLayerId,
} from '@/lib/geospatial/sentinelHub';
import {
  LAYER_COLOUR_RAMPS, DISTRICT_LAYER_VALUES, rampColor,
} from '@/lib/geospatial/districtLayerValues';
import { TimeSeriesCubePanel }  from '@/components/TimeSeriesCubePanel';

// ── Constants ─────────────────────────────────────────────────────────────────
const SENTINEL_WMS_URL = '/api/sentinel/wms';

const GROUP_ICONS: Record<string, React.ElementType> = {
  vegetation:  Leaf,
  moisture:    Droplets,
  agriculture: Tractor,
  composite:   Eye,
};

const GROUP_COLOR: Record<string, string> = {
  vegetation:  'border-green-500/40  bg-green-500/10  text-green-700',
  moisture:    'border-blue-500/40   bg-blue-500/10   text-blue-700',
  agriculture: 'border-amber-500/40  bg-amber-500/10  text-amber-700',
  composite:   'border-purple-500/40 bg-purple-500/10 text-purple-700',
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function SentinelMapDashboard() {
  const [activeLayerId,    setActiveLayerId]    = useState<SentinelLayerId>('NDVI');
  const [showWmsTiles,     setShowWmsTiles]     = useState(true);
  const [showBoundary,     setShowBoundary]     = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedDistrict | null>(null);
  const [districtOpacity,  setDistrictOpacity]  = useState(0.75);

  const activeDef = SENTINEL_LAYERS.find(l => l.id === activeLayerId)!;
  const ramp      = LAYER_COLOUR_RAMPS[activeLayerId] ?? LAYER_COLOUR_RAMPS['NDVI'];

  const handleDistrictClick = useCallback((d: SelectedDistrict) => {
    setSelectedDistrict(prev => prev?.id === d.id ? null : d);
  }, []);

  const handleLayerSelect = useCallback((id: SentinelLayerId) => {
    setActiveLayerId(id);
    setSelectedDistrict(null);
  }, []);

  return (
    <div className="space-y-6 p-6 md:p-8">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/40 shadow-lg backdrop-blur-xl bg-card/60">
        <div className="grid md:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-8">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Satellite className="h-3.5 w-3.5" />
              Copernicus Sentinel-2 · Uganda District Map
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight md:text-5xl">
              Uganda Satellite Dashboard
            </h1>
            <p className="max-w-prose text-sm text-muted-foreground">
              Interactive district choropleth driven by Sentinel Hub WMS layers —
              NDVI, EVI, Moisture Index, SAVI, Agriculture &amp; more.
              Click any district for detailed analytics.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {['NDVI', 'EVI', 'Moisture', 'SAVI', 'Agriculture'].map(t => (
                <Badge key={t} variant="outline" className="text-xs border-primary/30 text-primary/80">{t}</Badge>
              ))}
            </div>
          </div>
          <div className="relative min-h-[200px] md:min-h-[260px]">
            <img
              src="https://images.unsplash.com/photo-1446776653964-20c1d3a81b06?auto=format&fit=crop&w=1200&q=80"
              alt="Satellite view Uganda"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Main layout: layer panel | map | district detail ── */}
      <div className="grid gap-4 xl:grid-cols-[260px_1fr_280px]">

        {/* ── LEFT: Layer selector ── */}
        <Card className="self-start rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-heading flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" /> Sentinel Layers
            </CardTitle>
            <CardDescription className="text-xs">
              Select a layer to recolour the district map
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">

            {/* WMS overlay toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-3 py-2 mb-3">
              <span className="text-sm">WMS tile overlay</span>
              <button
                onClick={() => setShowWmsTiles(v => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  showWmsTiles ? 'bg-primary' : 'bg-input',
                )}
                role="switch" aria-checked={showWmsTiles}
              >
                <span className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform',
                  showWmsTiles ? 'translate-x-4' : 'translate-x-0',
                )} />
              </button>
            </div>

            {/* District fill opacity */}
            <div className="rounded-xl border border-border/40 bg-card/40 px-3 py-2 mb-3 space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>District opacity</span>
                <span className="font-mono">{Math.round(districtOpacity * 100)}%</span>
              </div>
              <input
                type="range" min={0.1} max={1} step={0.05}
                value={districtOpacity}
                onChange={e => setDistrictOpacity(Number(e.target.value))}
                className="w-full accent-primary h-1.5 rounded-full"
              />
            </div>

            {/* Boundary toggle */}
            <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/40 px-3 py-2 mb-3">
              <span className="text-sm">National boundary</span>
              <button
                onClick={() => setShowBoundary(v => !v)}
                className={cn(
                  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors',
                  showBoundary ? 'bg-primary' : 'bg-input',
                )}
                role="switch" aria-checked={showBoundary}
              >
                <span className={cn(
                  'pointer-events-none inline-block h-4 w-4 rounded-full bg-background shadow-lg transition-transform',
                  showBoundary ? 'translate-x-4' : 'translate-x-0',
                )} />
              </button>
            </div>

            <Separator className="opacity-30 my-2" />

            {/* Layer buttons grouped */}
            {(['composite', 'vegetation', 'moisture', 'agriculture'] as const).map(group => {
              const groupLayers = SENTINEL_LAYERS.filter(l => l.group === group);
              const Icon        = GROUP_ICONS[group] ?? Layers;
              return (
                <div key={group} className="space-y-1 mb-3">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1 px-1">
                    <Icon className="h-3 w-3" /> {group}
                  </p>
                  {groupLayers.map(layer => {
                    const isActive = layer.id === activeLayerId;
                    return (
                      <button
                        key={layer.id}
                        onClick={() => handleLayerSelect(layer.id as SentinelLayerId)}
                        className={cn(
                          'w-full text-left rounded-xl border px-3 py-2 text-sm transition-all',
                          isActive
                            ? 'border-primary/60 bg-primary/12 text-foreground font-medium'
                            : 'border-border/40 bg-card/40 text-muted-foreground hover:border-border/70 hover:text-foreground',
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          {layer.name}
                          {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              );
            })}

            {/* Active layer legend */}
            <div className="rounded-xl border border-border/40 bg-card/40 p-3 mt-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 mb-2">
                Legend — {activeDef.name}
              </p>
              <div className="flex gap-0.5 h-4 rounded overflow-hidden mb-1.5">
                {ramp.map((stop, i) => (
                  <div
                    key={i}
                    className="flex-1 h-full"
                    style={{ backgroundColor: stop.color }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>{activeDef.legend[0]?.label ?? 'Low'}</span>
                <span>{activeDef.legend[activeDef.legend.length - 1]?.label ?? 'High'}</span>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* ── CENTRE: Interactive map ── */}
        <Card className="overflow-hidden rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-md">
          <CardHeader className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="font-heading text-lg">
                  Uganda Districts — {activeDef.name}
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Click a district to inspect · Centre 1.37°N 32.29°E · Sentinel-2 10 m
                </CardDescription>
              </div>
              <Badge variant="outline" className={cn('text-xs gap-1', GROUP_COLOR[activeDef.group])}>
                {(() => { const I = GROUP_ICONS[activeDef.group] ?? Layers; return <I className="h-3 w-3" />; })()}
                {activeDef.group}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative h-[580px] w-full">
              <MapContainer
                center={UGANDA_CENTER}
                zoom={UGANDA_ZOOM}
                minZoom={UGANDA_MIN_ZOOM}
                maxZoom={UGANDA_MAX_ZOOM}
                maxBounds={UGANDA_BOUNDS}
                maxBoundsViscosity={0.9}
                zoomControl={false}
                scrollWheelZoom
                className="h-full w-full rounded-b-2xl"
              >
                <ZoomControl position="topright" />

                {/* Subtle base tiles */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://carto.com">CARTO</a>'
                  opacity={0.5}
                />

                {/* Sentinel Hub WMS overlay (behind districts) */}
                {showWmsTiles && (
                  <WMSTileLayer
                    url={SENTINEL_WMS_URL}
                    layers={activeDef.wmsLayer}
                    format="image/png"
                    transparent
                    opacity={0.35}
                    version="1.3.0"
                    // @ts-ignore
                    MAXCC="20"
                    tileSize={512}
                    attribution="© Sentinel Hub / Copernicus"
                  />
                )}

                {/* Uganda national boundary */}
                {showBoundary && <UgandaBoundaryLayer fitBounds />}

                {/* Interactive district choropleth */}
                <UgandaDistrictsLayer
                  activeLayerId={activeLayerId}
                  opacity={districtOpacity}
                  onDistrictClick={handleDistrictClick}
                />

                <MapLocationSearch />
              </MapContainer>

              {/* Floating info pill */}
              <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1.5 rounded-xl bg-background/80 backdrop-blur-md border border-border/40 px-3 py-2 text-xs text-muted-foreground shadow-sm">
                <Info className="h-3.5 w-3.5 shrink-0" />
                BBox W29.5 S−1.5 E35.0 N4.2 · Click district for details
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── RIGHT: District detail panel ── */}
        <div className="space-y-4">
          {selectedDistrict ? (
            <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="font-heading text-lg">{selectedDistrict.name}</CardTitle>
                    <CardDescription className="text-xs mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {selectedDistrict.region} Region
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0"
                    onClick={() => setSelectedDistrict(null)}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">

                {/* Layer value gauge */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{activeDef.name}</span>
                    <span className="font-mono font-bold">
                      {(selectedDistrict.value * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${selectedDistrict.value * 100}%`,
                        backgroundColor: rampColor(selectedDistrict.value, ramp),
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>Low</span><span>High</span>
                  </div>
                </div>

                <Separator className="opacity-30" />

                {/* Stats grid */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { label: 'District ID',  value: selectedDistrict.id },
                    { label: 'Main Crop',    value: selectedDistrict.crop },
                    { label: 'Active Layer', value: selectedDistrict.layer },
                    { label: 'Source',       value: 'Sentinel-2 L2A' },
                    { label: 'Resolution',   value: '10 m/px' },
                    { label: 'Revisit',      value: '5 days' },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-lg bg-muted/30 p-2">
                      <p className="text-muted-foreground">{label}</p>
                      <p className="font-medium mt-0.5 truncate">{value}</p>
                    </div>
                  ))}
                </div>

                <Separator className="opacity-30" />

                {/* All-layer values for this district */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
                    All Layer Values
                  </p>
                  {SENTINEL_LAYERS.map(l => {
                    const layerVals = DISTRICT_LAYER_VALUES[l.id] ?? {};
                    const v   = layerVals[selectedDistrict.id] ?? 0.5;
                    const lramp = LAYER_COLOUR_RAMPS[l.id] ?? LAYER_COLOUR_RAMPS['NDVI'];
                    const c   = rampColor(v, lramp);
                    const pct = (v * 100).toFixed(0);
                    const isActive = l.id === activeLayerId;
                    return (
                      <div
                        key={l.id}
                        onClick={() => handleLayerSelect(l.id as SentinelLayerId)}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer transition-colors text-xs',
                          isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/30',
                        )}
                      >
                        <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: c }} />
                        <span className="flex-1 truncate">{l.name}</span>
                        <span className="font-mono font-semibold shrink-0" style={{ color: c }}>{pct}%</span>
                      </div>
                    );
                  })}
                </div>

              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <MapPin className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  Click any district on the map to see its satellite layer values
                </p>
              </CardContent>
            </Card>
          )}

          {/* Quick layer stats */}
          <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-heading">Layer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <p className="text-muted-foreground">{activeDef.description}</p>
              <Separator className="opacity-30" />
              <div className="flex flex-wrap gap-1">
                {activeDef.legend.map(item => (
                  <span key={item.label} className="flex items-center gap-1 text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    {item.label}
                  </span>
                ))}
              </div>
              <Separator className="opacity-30" />
              <p className="text-muted-foreground/60">
                WMS: <code className="text-[10px]">{activeDef.wmsLayer}</code>
              </p>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* ── Time-Series Cube Builder ── */}
      <TimeSeriesCubePanel />

      {/* ── Layer reference table ── */}
      <Card className="rounded-2xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-heading">Sentinel Hub Layer Reference</CardTitle>
          <CardDescription className="text-xs">
            All layers via WMS endpoint · Uganda bbox only (W29.5 S−1.5 E35.0 N4.2)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/40">
                  {['Layer', 'WMS LAYERS=', 'Group', 'Description'].map(h => (
                    <th key={h} className="pb-2 pr-4 text-left text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {SENTINEL_LAYERS.map(l => {
                  const Icon    = GROUP_ICONS[l.group] ?? Layers;
                  const isActive = l.id === activeLayerId;
                  return (
                    <tr
                      key={l.id}
                      onClick={() => handleLayerSelect(l.id as SentinelLayerId)}
                      className={cn('cursor-pointer transition-colors', isActive ? 'bg-primary/5' : 'hover:bg-muted/20')}
                    >
                      <td className="py-2.5 pr-4 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 text-primary shrink-0" />
                          {l.name}
                          {isActive && <Badge className="text-[10px] bg-primary/15 text-primary border-0 px-1.5 py-0">active</Badge>}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{l.wmsLayer}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant="outline" className={cn('text-[10px] font-normal capitalize', GROUP_COLOR[l.group] ?? '')}>
                          {l.group}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground max-w-xs">{l.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
