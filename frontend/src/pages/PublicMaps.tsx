import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    mapsService,
    type MapsCropZonesResponse,
    type MapsDistrictStatsResponse,
    type MapsPestAlertsResponse,
    type MapsWeatherOverlayResponse,
} from '@/lib/api/mapsService';
import {
    AlertTriangle,
    ArrowRight,
    ArrowUpDown,
    Bug,
    ChevronLeft,
    ChevronRight,
    Cloud,
    Loader2,
    Map,
    MapPin,
    RefreshCw,
    Search,
    Sprout,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { AgriculturalMap } from '@/components/maps/AgriculturalMap';

type CropZone = MapsCropZonesResponse['data'][number];
type WeatherOverlay = MapsWeatherOverlayResponse['data'][number];
type PestAlert = MapsPestAlertsResponse['data'][number];
type DistrictStat = MapsDistrictStatsResponse['data'][number];

export default function PublicMaps() {


    // List state — GET /maps/crop-zones
    const [cropZones, setCropZones] = useState<CropZone[]>([]);
    const [loadingCropZones, setLoadingCropZones] = useState(true);
    const [cropZonesPage, setCropZonesPage] = useState(1);
    const [cropZonesLimit] = useState(10);
    const [cropZonesTotal, setCropZonesTotal] = useState(0);
    // List state — GET /maps/weather-overlay
    const [weatherOverlay, setWeatherOverlay] = useState<WeatherOverlay[]>([]);
    const [loadingWeatherOverlay, setLoadingWeatherOverlay] = useState(true);
    const [weatherOverlayPage, setWeatherOverlayPage] = useState(1);
    const [weatherOverlayLimit] = useState(10);
    const [weatherOverlayTotal, setWeatherOverlayTotal] = useState(0);
    // List state — GET /maps/pest-alerts
    const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
    const [loadingPestAlerts, setLoadingPestAlerts] = useState(true);
    const [pestAlertsPage, setPestAlertsPage] = useState(1);
    const [pestAlertsLimit] = useState(10);
    const [pestAlertsTotal, setPestAlertsTotal] = useState(0);
    // List state — GET /maps/district-stats
    const [districtStats, setDistrictStats] = useState<DistrictStat[]>([]);
    const [loadingDistrictStats, setLoadingDistrictStats] = useState(true);
    const [districtStatsPage, setDistrictStatsPage] = useState(1);
    const [districtStatsLimit] = useState(10);
    const [districtStatsTotal, setDistrictStatsTotal] = useState(0);

    useEffect(() => { void loadCropZones(); }, [cropZonesPage]);
    useEffect(() => { void loadWeatherOverlay(); }, [weatherOverlayPage]);
    useEffect(() => { void loadPestAlerts(); }, [pestAlertsPage]);
    useEffect(() => { void loadDistrictStats(); }, [districtStatsPage]);

    async function loadCropZones() {
        try {
            setLoadingCropZones(true);
            const res = await mapsService.cropZones({ page: cropZonesPage, limit: cropZonesLimit });
            setCropZones(Array.isArray(res?.data) ? res.data : []);
            setCropZonesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load cropZones');
            console.error('[loadCropZones]', err);
        } finally {
            setLoadingCropZones(false);
        }
    }
    async function loadWeatherOverlay() {
        try {
            setLoadingWeatherOverlay(true);
            const res = await mapsService.weatherOverlay({ page: weatherOverlayPage, limit: weatherOverlayLimit });
            setWeatherOverlay(Array.isArray(res?.data) ? res.data : []);
            setWeatherOverlayTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load weatherOverlay');
            console.error('[loadWeatherOverlay]', err);
        } finally {
            setLoadingWeatherOverlay(false);
        }
    }
    async function loadPestAlerts() {
        try {
            setLoadingPestAlerts(true);
            const res = await mapsService.pestAlerts({ page: pestAlertsPage, limit: pestAlertsLimit });
            setPestAlerts(Array.isArray(res?.data) ? res.data : []);
            setPestAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load pestAlerts');
            console.error('[loadPestAlerts]', err);
        } finally {
            setLoadingPestAlerts(false);
        }
    }
    async function loadDistrictStats() {
        try {
            setLoadingDistrictStats(true);
            const res = await mapsService.districtStats({ page: districtStatsPage, limit: districtStatsLimit });
            setDistrictStats(Array.isArray(res?.data) ? res.data : []);
            setDistrictStatsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districtStats');
            console.error('[loadDistrictStats]', err);
        } finally {
            setLoadingDistrictStats(false);
        }
    }

    // Navigation helper for outgoing edge → page_3 (/information)
    const navigate = useNavigate();
    const gotoPage_3 = () => navigate('/information');

    // ----- Page-local UI state (filters, selection, derived views) -----
    const [districtSearch, setDistrictSearch] = useState('');
    const [sortKey, setSortKey] = useState<'district_name' | 'crop' | 'total_farmers' | 'production_volume' | 'area_hectares' | 'active_alerts' | 'season'>('production_volume');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [selectedDistrict, setSelectedDistrict] = useState<DistrictStat | null>(null);
    const [selectedPestAlert, setSelectedPestAlert] = useState<PestAlert | null>(null);

    function toggleSort(key: typeof sortKey) {
        if (sortKey === key) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(key);
            setSortDir('desc');
        }
    }

    const filteredCropZones = cropZones;
    const filteredWeather = weatherOverlay;
    const filteredPestAlerts = pestAlerts;
    const filteredDistrictStats = useMemo(() => {
        if (!districtSearch.trim()) return districtStats;
        const q = districtSearch.toLowerCase();
        return districtStats.filter(
            (d) =>
                (d.district_name ?? '').toLowerCase().includes(q) ||
                (d.crop ?? '').toLowerCase().includes(q) ||
                (d.season ?? '').toLowerCase().includes(q),
        );
    }, [districtStats, districtSearch]);

    const sortedDistrictStats = useMemo(() => {
        const copy = [...filteredDistrictStats];
        copy.sort((a, b) => {
            const av = (a as any)[sortKey];
            const bv = (b as any)[sortKey];
            if (av == null && bv == null) return 0;
            if (av == null) return 1;
            if (bv == null) return -1;
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortDir === 'asc' ? av - bv : bv - av;
            }
            return sortDir === 'asc'
                ? String(av).localeCompare(String(bv))
                : String(bv).localeCompare(String(av));
        });
        return copy;
    }, [filteredDistrictStats, sortKey, sortDir]);

    return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-lg border border-border/40 shadow-md">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1600&q=80&auto=format&fit=crop"
            alt="Uganda agricultural landscape"
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-background/55 backdrop-blur-sm" />
        </div>
        <div className="relative z-10 space-y-4 px-6 py-12 md:px-12 md:py-16">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-primary/40 bg-card/70 shadow-[0_0_12px_hsl(var(--primary)/0.35)] backdrop-blur-md">
              <Map className="h-6 w-6 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
              Public Access — No Login Required
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold leading-tight md:text-5xl">
            Uganda Agricultural Maps
          </h1>
          <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
            Explore interactive geographic layers of Uganda&rsquo;s agricultural landscape &mdash; crop growing zones,
            live weather conditions, pest and disease alerts, agro-ecological regions, and district production summaries.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => gotoPage_3()}
              className="border border-primary bg-transparent text-primary shadow-[0_0_12px_hsl(var(--primary)/0.45)] transition-all duration-200 ease-out hover:bg-primary/10 hover:shadow-[0_0_18px_hsl(var(--primary)/0.6)]"
            >
              Agricultural Information
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                const el = document.getElementById('map-canvas');
                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Explore the Map
            </Button>
          </div>
        </div>
      </section>

      {/* Stat strip */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { label: 'Districts Mapped', value: districtStats.length || 0, icon: MapPin },
          { label: 'Crop Zones', value: cropZones.length || 0, icon: Sprout },
          { label: 'Active Pest Alerts', value: pestAlerts.length || 0, icon: Bug },
          { label: 'Weather Stations', value: weatherOverlay.length || 0, icon: Cloud },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-border/40 bg-card/60 backdrop-blur-md shadow-md">
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  <p className="font-heading text-xl font-semibold">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Interactive GEE map */}
      <section id="map-canvas">
        <AgriculturalMap
          title="Republic of Uganda"
          description={`${filteredCropZones.length} crop zones · ${filteredDistrictStats.length} district stats · ${filteredPestAlerts.length} pest alerts — powered by Google Earth Engine`}
          heightClassName="min-h-[480px] h-[52vh]"
        />
      </section>

      {/* District statistics table */}
      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold">District Production Summary</h2>
            <p className="text-sm text-muted-foreground">
              Click a column header to sort. Use pagination to browse all {districtStatsTotal} records.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={districtSearch}
                onChange={(e) => setDistrictSearch(e.target.value)}
                placeholder="Search districts"
                className="w-56 bg-background pl-8"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => void loadDistrictStats()}
              aria-label="Refresh district stats"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden border-border/40 bg-card/60 shadow-md backdrop-blur-md">
          <div className="max-h-[420px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur">
                <TableRow>
                  {[
                    { key: 'district_name', label: 'District' },
                    { key: 'crop', label: 'Crop' },
                    { key: 'total_farmers', label: 'Farmers' },
                    { key: 'production_volume', label: 'Production (MT)' },
                    { key: 'area_hectares', label: 'Area (ha)' },
                    { key: 'active_alerts', label: 'Alerts' },
                    { key: 'season', label: 'Season' },
                  ].map((c) => (
                    <TableHead
                      key={c.key}
                      onClick={() => toggleSort(c.key as Parameters<typeof toggleSort>[0])}
                      className="cursor-pointer select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center gap-1">
                        {c.label}
                        <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingDistrictStats && (
                  Array.from({ length: 6 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
                {!loadingDistrictStats && sortedDistrictStats.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No district statistics available yet.
                    </TableCell>
                  </TableRow>
                )}
                {!loadingDistrictStats &&
                  sortedDistrictStats.map((d, idx) => (
                    <TableRow
                      key={d.district_id ?? `${idx}`}
                      className="cursor-pointer bg-muted/30 transition-colors hover:bg-muted/60"
                      onClick={() => setSelectedDistrict(d)}
                    >
                      <TableCell className="font-medium">{d.district_name ?? '—'}</TableCell>
                      <TableCell>{d.crop ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">{d.total_farmers?.toLocaleString() ?? '—'}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.production_volume?.toLocaleString() ?? '—'}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {d.area_hectares?.toLocaleString() ?? '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {typeof d.active_alerts === 'number' && d.active_alerts > 0 ? (
                          <Badge variant="destructive">{d.active_alerts}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{d.season ?? '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDistrict(d);
                          }}
                        >
                          View
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-border/40 bg-card/40 px-4 py-3 text-sm">
            <span className="text-muted-foreground">
              Page {districtStatsPage} of {Math.max(1, Math.ceil(districtStatsTotal / districtStatsLimit))} &middot;{' '}
              {districtStatsTotal} records
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={districtStatsPage <= 1}
                onClick={() => setDistrictStatsPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={districtStatsPage >= Math.ceil(districtStatsTotal / districtStatsLimit)}
                onClick={() => setDistrictStatsPage((p) => p + 1)}
              >
                Next <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </section>

      {/* Active pest alerts panel */}
      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Active Pest &amp; Disease Alerts</h2>
            <p className="text-sm text-muted-foreground">Real-time outbreak data from extension officers across Uganda.</p>
          </div>
          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive">
            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Live
          </Badge>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loadingPestAlerts &&
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={`pa-skel-${i}`} className="border-border/40 bg-card/60 shadow-md backdrop-blur-md">
                <CardHeader>
                  <Skeleton className="h-5 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-16 w-full" />
                </CardContent>
              </Card>
            ))}
          {!loadingPestAlerts && filteredPestAlerts.length === 0 && (
            <Card className="col-span-full border-border/40 bg-card/60 p-8 text-center text-sm text-muted-foreground backdrop-blur-md">
              No active pest alerts in the current view.
            </Card>
          )}
          {!loadingPestAlerts &&
            filteredPestAlerts.map((pa) => {
              const sev = (pa.severity ?? '').toLowerCase();
              const sevClass = sev.includes('high')
                ? 'border-destructive/50 bg-destructive/10 text-destructive'
                : sev.includes('medium')
                ? 'border-yellow-500/50 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                : 'border-primary/40 bg-primary/10 text-primary';
              return (
                <Card
                  key={pa.alert_id}
                  className="cursor-pointer border-border/40 bg-card/60 shadow-md backdrop-blur-md transition-all duration-200 ease-out hover:shadow-lg"
                  onClick={() => setSelectedPestAlert(pa)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="font-heading text-lg">{pa.pest_name ?? 'Unknown pest'}</CardTitle>
                      <Badge variant="outline" className={cn('border', sevClass)}>
                        {pa.severity ?? '—'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {pa.district_name} &middot; {pa.crop}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Alert level</span>
                      <span className="font-medium text-foreground">{pa.alert_level ?? '—'}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Issued</span>
                      <span className="font-medium text-foreground">{pa.issued_at?.slice(0, 10) ?? '—'}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      </section>

      {/* District detail dialog */}
      <Dialog open={!!selectedDistrict} onOpenChange={(o) => !o && setSelectedDistrict(null)}>
        <DialogContent className="max-w-lg border-border/40 bg-card/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{selectedDistrict?.district_name ?? 'District details'}</DialogTitle>
            <DialogDescription>Production summary and on-the-ground indicators.</DialogDescription>
          </DialogHeader>
          {selectedDistrict && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/40 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Crop</p>
                  <p className="font-heading text-lg">{selectedDistrict.crop ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Season</p>
                  <p className="font-heading text-lg">{selectedDistrict.season ?? '—'}</p>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Total farmers</p>
                  <p className="font-heading text-lg tabular-nums">
                    {selectedDistrict.total_farmers?.toLocaleString() ?? '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border/40 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Active alerts</p>
                  <p className="font-heading text-lg tabular-nums">{selectedDistrict.active_alerts ?? 0}</p>
                </div>
                <div className="col-span-2 rounded-lg border border-border/40 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Production volume</p>
                  <p className="font-heading text-2xl tabular-nums">
                    {selectedDistrict.production_volume?.toLocaleString() ?? '—'} <span className="text-sm font-normal text-muted-foreground">MT</span>
                  </p>
                </div>
                <div className="col-span-2 rounded-lg border border-border/40 bg-card/60 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cultivated area</p>
                  <p className="font-heading text-2xl tabular-nums">
                    {selectedDistrict.area_hectares?.toLocaleString() ?? '—'} <span className="text-sm font-normal text-muted-foreground">ha</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pest alert detail dialog */}
      <Dialog open={!!selectedPestAlert} onOpenChange={(o) => !o && setSelectedPestAlert(null)}>
        <DialogContent className="max-w-md border-border/40 bg-card/90 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{selectedPestAlert?.pest_name ?? 'Pest alert'}</DialogTitle>
            <DialogDescription>
              {selectedPestAlert?.district_name} &middot; {selectedPestAlert?.crop}
            </DialogDescription>
          </DialogHeader>
          {selectedPestAlert && (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 p-3">
                <span className="text-muted-foreground">Severity</span>
                <Badge variant="outline" className="border-destructive/50 bg-destructive/10 text-destructive">
                  {selectedPestAlert.severity ?? '—'}
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 p-3">
                <span className="text-muted-foreground">Alert level</span>
                <span className="font-medium">{selectedPestAlert.alert_level ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 p-3">
                <span className="text-muted-foreground">Issued at</span>
                <span className="font-medium">{selectedPestAlert.issued_at?.slice(0, 10) ?? '—'}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
