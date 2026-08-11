import { useEffect, useState, useMemo } from 'react';
import { toast } from '@/lib/toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts';
import {
  Wifi, WifiOff, AlertTriangle, Activity, Cpu, Satellite,
  Droplets, Thermometer, Wind, Sun, Bug, ShieldAlert,
  TrendingDown, TrendingUp, Minus, RefreshCw, ChevronRight,
  FlaskConical, Layers, ScanLine, Radar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  cropMonitoringService,
  type SensorReading,
  type UavScan,
  type TimeSeriesAlert,
  type CropHealthSummary,
} from '@/lib/api/cropMonitoringService';

// ── Static NDVI time-series (simulated from Sentinel-2 composites) ────────────
const NDVI_SERIES: Record<string, Array<{ date: string; ndvi: number; evi: number; baseline: number }>> = {
  'Coffee (Robusta)': [
    { date: 'Jan', ndvi: 0.72, evi: 0.58, baseline: 0.74 },
    { date: 'Feb', ndvi: 0.74, evi: 0.60, baseline: 0.74 },
    { date: 'Mar', ndvi: 0.71, evi: 0.57, baseline: 0.73 },
    { date: 'Apr', ndvi: 0.69, evi: 0.55, baseline: 0.72 },
    { date: 'May', ndvi: 0.67, evi: 0.53, baseline: 0.71 },
    { date: 'Jun', ndvi: 0.61, evi: 0.48, baseline: 0.70 },
  ],
  Maize: [
    { date: 'Jan', ndvi: 0.38, evi: 0.30, baseline: 0.60 },
    { date: 'Feb', ndvi: 0.55, evi: 0.44, baseline: 0.62 },
    { date: 'Mar', ndvi: 0.72, evi: 0.58, baseline: 0.70 },
    { date: 'Apr', ndvi: 0.68, evi: 0.54, baseline: 0.68 },
    { date: 'May', ndvi: 0.60, evi: 0.48, baseline: 0.65 },
    { date: 'Jun', ndvi: 0.54, evi: 0.43, baseline: 0.62 },
  ],
  Beans: [
    { date: 'Jan', ndvi: 0.30, evi: 0.24, baseline: 0.65 },
    { date: 'Feb', ndvi: 0.52, evi: 0.41, baseline: 0.66 },
    { date: 'Mar', ndvi: 0.71, evi: 0.57, baseline: 0.70 },
    { date: 'Apr', ndvi: 0.76, evi: 0.61, baseline: 0.72 },
    { date: 'May', ndvi: 0.74, evi: 0.59, baseline: 0.71 },
    { date: 'Jun', ndvi: 0.74, evi: 0.59, baseline: 0.70 },
  ],
  'Bananas (Matooke)': [
    { date: 'Jan', ndvi: 0.78, evi: 0.63, baseline: 0.76 },
    { date: 'Feb', ndvi: 0.79, evi: 0.64, baseline: 0.76 },
    { date: 'Mar', ndvi: 0.76, evi: 0.61, baseline: 0.75 },
    { date: 'Apr', ndvi: 0.74, evi: 0.59, baseline: 0.75 },
    { date: 'May', ndvi: 0.71, evi: 0.57, baseline: 0.74 },
    { date: 'Jun', ndvi: 0.68, evi: 0.54, baseline: 0.74 },
  ],
  Cassava: [
    { date: 'Jan', ndvi: 0.62, evi: 0.50, baseline: 0.63 },
    { date: 'Feb', ndvi: 0.60, evi: 0.48, baseline: 0.62 },
    { date: 'Mar', ndvi: 0.55, evi: 0.44, baseline: 0.60 },
    { date: 'Apr', ndvi: 0.50, evi: 0.40, baseline: 0.59 },
    { date: 'May', ndvi: 0.46, evi: 0.37, baseline: 0.58 },
    { date: 'Jun', ndvi: 0.43, evi: 0.34, baseline: 0.57 },
  ],
};

const UGANDA_CROPS = ['Coffee (Robusta)', 'Maize', 'Beans', 'Bananas (Matooke)', 'Cassava'];
const UGANDA_DISTRICTS = ['All Districts', 'Mukono', 'Mbarara', 'Kabale', 'Masindi', 'Gulu', 'Jinja', 'Mbale', 'Arua', 'Lira'];

const UAV_CROP_IMAGES: Record<string, string> = {
  'Coffee (Robusta)': '/images/coffee.png',
  Maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
  Beans: '/images/beans-red-dry-user.png',
  'Bananas (Matooke)': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=800&q=80',
  Cassava: '/images/cassava-user.png',
};

function getUavCropImage(crop: string, fallbackUrl?: string) {
  return UAV_CROP_IMAGES[crop] ?? fallbackUrl ?? '/images/auxano.png';
}

// ── Helper components ─────────────────────────────────────────────────────────

function HealthBar({ score }: { score: number }) {
  const color = score >= 75 ? 'bg-green-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-mono font-medium w-8 text-right">{score}</span>
    </div>
  );
}

function TrendIcon({ trend }: { trend: string }) {
  if (trend === 'improving') return <TrendingUp className="h-4 w-4 text-green-500" />;
  if (trend === 'declining') return <TrendingDown className="h-4 w-4 text-red-500" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, string> = {
    Critical: 'bg-red-500/15 text-red-600 border-red-500/30',
    High:     'bg-orange-500/15 text-orange-600 border-orange-500/30',
    Medium:   'bg-amber-500/15 text-amber-700 border-amber-500/30',
    Low:      'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
  };
  return <Badge variant="outline" className={cn('font-normal text-xs', cfg[severity] ?? '')}>{severity}</Badge>;
}

function AlertTypeIcon({ type }: { type: string }) {
  const map: Record<string, React.ReactNode> = {
    disease:       <FlaskConical className="h-4 w-4 text-purple-500" />,
    pest_outbreak: <Bug className="h-4 w-4 text-red-500" />,
    drought:       <Sun className="h-4 w-4 text-amber-500" />,
    flood:         <Droplets className="h-4 w-4 text-blue-500" />,
    anomaly:       <Activity className="h-4 w-4 text-muted-foreground" />,
  };
  return <>{map[type] ?? <AlertTriangle className="h-4 w-4 text-muted-foreground" />}</>;
}

function SensorStatusDot({ status }: { status: string }) {
  const cfg = {
    online:  'bg-green-500 shadow-[0_0_6px_hsl(142_71%_45%)]',
    warning: 'bg-amber-500 shadow-[0_0_6px_hsl(38_92%_50%)]',
    offline: 'bg-muted-foreground',
  } as Record<string, string>;
  return <span className={cn('inline-block h-2 w-2 rounded-full shrink-0', cfg[status] ?? cfg.offline)} />;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CropMonitoring() {
  const [sensors, setSensors]           = useState<SensorReading[]>([]);
  const [uavScans, setUavScans]         = useState<UavScan[]>([]);
  const [tsAlerts, setTsAlerts]         = useState<TimeSeriesAlert[]>([]);
  const [healthSummary, setHealthSummary] = useState<CropHealthSummary[]>([]);

  const [loadingSensors, setLoadingSensors]     = useState(true);
  const [loadingUav, setLoadingUav]             = useState(true);
  const [loadingAlerts, setLoadingAlerts]       = useState(true);
  const [loadingHealth, setLoadingHealth]       = useState(true);

  const [selectedCrop, setSelectedCrop]         = useState<string>('Coffee (Robusta)');
  const [districtFilter, setDistrictFilter]     = useState<string>('All Districts');

  useEffect(() => { void loadAll(); }, []);

  async function loadAll() {
    await Promise.all([loadSensors(), loadUav(), loadAlerts(), loadHealth()]);
  }

  async function loadSensors() {
    try {
      setLoadingSensors(true);
      const res = await cropMonitoringService.sensors({});
      setSensors(Array.isArray(res?.data) ? res.data : []);
    } catch { toast.error('Failed to load sensor data'); }
    finally { setLoadingSensors(false); }
  }

  async function loadUav() {
    try {
      setLoadingUav(true);
      const res = await cropMonitoringService.uavScans({});
      setUavScans(Array.isArray(res?.data) ? res.data : []);
    } catch { toast.error('Failed to load UAV scans'); }
    finally { setLoadingUav(false); }
  }

  async function loadAlerts() {
    try {
      setLoadingAlerts(true);
      const res = await cropMonitoringService.timeseries_alerts({});
      setTsAlerts(Array.isArray(res?.data) ? res.data : []);
    } catch { toast.error('Failed to load time-series alerts'); }
    finally { setLoadingAlerts(false); }
  }

  async function loadHealth() {
    try {
      setLoadingHealth(true);
      const res = await cropMonitoringService.healthSummary({});
      setHealthSummary(Array.isArray(res?.data) ? res.data : []);
    } catch { toast.error('Failed to load health summary'); }
    finally { setLoadingHealth(false); }
  }

  const ndviData = NDVI_SERIES[selectedCrop] ?? [];
  const criticalAlerts = tsAlerts.filter(a => a.severity === 'Critical' || a.severity === 'High').length;
  const onlineSensors  = sensors.filter(s => s.sensor_status === 'online').length;
  const avgHealth      = healthSummary.length
    ? Math.round(healthSummary.reduce((s, h) => s + h.health_score, 0) / healthSummary.length)
    : 0;

  const filteredHealth = useMemo(() =>
    districtFilter === 'All Districts' ? healthSummary : healthSummary.filter(h => h.district === districtFilter),
    [healthSummary, districtFilter]);

  const sensorByCrop = useMemo(() => {
    const map: Record<string, SensorReading[]> = {};
    sensors.forEach(s => { (map[s.crop] ??= []).push(s); });
    return map;
  }, [sensors]);

  return (
    <div className="space-y-6 p-6 md:p-8">

      {/* ── Hero header ── */}
      <section className="relative overflow-hidden rounded-2xl border border-border/40 shadow-lg backdrop-blur-xl bg-card/60">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="flex flex-col justify-center gap-4 p-8">
            <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Radar className="h-3.5 w-3.5" /> IoT · UAV · Satellite
            </span>
            <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
              Crop Monitoring
            </h1>
            <p className="max-w-prose text-muted-foreground text-sm">
              Real-time IoT sensor telemetry, UAV drone imagery, and Sentinel-2 NDVI time-series
              analysis for Uganda's agro-ecological zones. Changepoint detection flags droughts,
              pest outbreaks, and disease events before they escalate.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Button variant="outline" size="sm" onClick={loadAll}
                className="border-primary/40 text-primary hover:bg-primary/10">
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh Data
              </Button>
            </div>
          </div>
          <div className="relative min-h-[220px] md:min-h-[280px]">
            <img
              src="https://images.unsplash.com/photo-1595508064774-5ff825520bb6?auto=format&fit=crop&w=1200&q=80"
              alt="Ugandan farmer tending crops"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
          </div>
        </div>
      </section>

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Online Sensors', value: loadingSensors ? '—' : `${onlineSensors}/${sensors.length}`, icon: Wifi, color: 'text-green-500' },
          { label: 'Active Alerts', value: loadingAlerts ? '—' : String(criticalAlerts), icon: ShieldAlert, color: 'text-red-500' },
          { label: 'Avg Crop Health', value: loadingHealth ? '—' : `${avgHealth}/100`, icon: Activity, color: 'text-primary' },
          { label: 'UAV Scans (30d)', value: loadingUav ? '—' : String(uavScans.length), icon: ScanLine, color: 'text-purple-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40', color)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold font-mono">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="health" className="space-y-6">
        <TabsList className="bg-card/60 backdrop-blur-md border border-border/40 shadow-sm flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="health"><Activity className="mr-1.5 h-4 w-4" />Crop Health</TabsTrigger>
          <TabsTrigger value="ndvi"><Satellite className="mr-1.5 h-4 w-4" />NDVI Analysis</TabsTrigger>
          <TabsTrigger value="sensors"><Cpu className="mr-1.5 h-4 w-4" />IoT Sensors</TabsTrigger>
          <TabsTrigger value="uav"><Layers className="mr-1.5 h-4 w-4" />UAV Scans</TabsTrigger>
          <TabsTrigger value="alerts"><AlertTriangle className="mr-1.5 h-4 w-4" />Time-Series Alerts</TabsTrigger>
        </TabsList>

        {/* ── CROP HEALTH TAB ── */}
        <TabsContent value="health" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold">Crop Health Scorecards</h2>
              <p className="text-sm text-muted-foreground">Live composite scores from IoT + satellite + UAV fusion.</p>
            </div>
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger className="w-[180px] rounded-full border-border/40 bg-card/60 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UGANDA_DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {loadingHealth ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredHealth.map(h => (
                <Card key={h.crop + h.district}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="font-heading text-base">{h.crop}</CardTitle>
                        <CardDescription className="text-xs">{h.district}</CardDescription>
                      </div>
                      <TrendIcon trend={h.ndvi_trend} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Health Score</span>
                        <span className={h.health_score >= 75 ? 'text-green-500' : h.health_score >= 50 ? 'text-amber-500' : 'text-red-500'}>
                          {h.health_score >= 75 ? 'Good' : h.health_score >= 50 ? 'Fair' : 'Poor'}
                        </span>
                      </div>
                      <HealthBar score={h.health_score} />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-muted-foreground">NDVI</p>
                        <p className="font-mono font-semibold">{h.ndvi_current.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-muted-foreground">Stress Index</p>
                        <p className="font-mono font-semibold">{(h.stress_index * 100).toFixed(0)}%</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2 col-span-2">
                        <p className="text-muted-foreground">Phenology Stage</p>
                        <p className="font-medium truncate">{h.phenology_stage}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      {h.days_to_harvest != null && (
                        <span className="text-xs text-muted-foreground">
                          ~{h.days_to_harvest} days to harvest
                        </span>
                      )}
                      {h.active_alerts > 0 && (
                        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs">
                          {h.active_alerts} alert{h.active_alerts > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── NDVI ANALYSIS TAB ── */}
        <TabsContent value="ndvi" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-heading text-2xl font-semibold">NDVI Time-Series Analysis</h2>
              <p className="text-sm text-muted-foreground">
                Sentinel-2 / Landsat composites with Mann-Kendall trend detection and changepoint markers.
              </p>
            </div>
            <Select value={selectedCrop} onValueChange={setSelectedCrop}>
              <SelectTrigger className="w-[200px] rounded-full border-border/40 bg-card/60 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UGANDA_CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Main NDVI chart */}
            <Card className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading">NDVI vs EVI — {selectedCrop}</CardTitle>
                <CardDescription className="text-xs">
                  2026 growing season · dashed line = 5-year baseline · ▲ = detected changepoint
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={ndviData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#228B22" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#228B22" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="eviGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FFD700" stopOpacity={0.20} />
                        <stop offset="95%" stopColor="#FFD700" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0.2, 0.9]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                      formatter={(v: number, name: string) => [v.toFixed(3), name.toUpperCase()]}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={ndviData[0]?.baseline ?? 0.7} stroke="#8B4513" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: 'Baseline', position: 'right', fontSize: 10, fill: '#8B4513' }} />
                    <Area type="monotone" dataKey="ndvi" stroke="#228B22" strokeWidth={2} fill="url(#ndviGrad)" dot={{ r: 3, fill: '#228B22' }} />
                    <Area type="monotone" dataKey="evi"  stroke="#FFD700" strokeWidth={2} fill="url(#eviGrad)"  dot={{ r: 3, fill: '#FFD700' }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Analysis stats */}
            <div className="space-y-4">
              {[
                { label: 'Analysis Method', value: 'Mann-Kendall Trend Test', sub: 'p < 0.05 significance' },
                { label: 'Seasonality', value: 'Fourier Decomposition', sub: 'Bimodal rainfall pattern' },
                { label: 'Changepoint', value: 'PELT Algorithm', sub: 'Bayesian Information Criterion' },
                { label: 'Data Source', value: 'Sentinel-2 (10 m)', sub: '5-day revisit cycle' },
              ].map(({ label, value, sub }) => (
                <Card key={label} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="font-medium text-sm mt-0.5">{value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Multi-crop comparison bar chart */}
          <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-heading">Current NDVI by Crop — District Comparison</CardTitle>
              <CardDescription className="text-xs">Latest satellite acquisition · green = healthy · amber = stressed · red = critical</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={healthSummary.map(h => ({ name: h.crop.replace(' (Robusta)', '').replace(' (Matooke)', ''), ndvi: h.ndvi_current, score: h.health_score }))}
                  margin={{ top: 4, right: 8, bottom: 0, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis domain={[0, 1]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => [v.toFixed(3), 'NDVI']}
                  />
                  <ReferenceLine y={0.5} stroke="#8B4513" strokeDasharray="4 4" strokeWidth={1.5} />
                  <Bar dataKey="ndvi" radius={[6, 6, 0, 0]}
                    fill="#228B22"
                    label={{ position: 'top', fontSize: 10, formatter: (v: number) => v.toFixed(2) }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── IOT SENSORS TAB ── */}
        <TabsContent value="sensors" className="space-y-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold">IoT Sensor Network</h2>
            <p className="text-sm text-muted-foreground">
              Live telemetry — soil moisture, pH, temperature, humidity, rainfall and solar radiation.
            </p>
          </div>

          {loadingSensors ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sensors.map(s => (
                <Card key={s.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base font-heading flex items-center gap-2">
                          <SensorStatusDot status={s.sensor_status} />
                          {s.crop}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">{s.district} · {new Date(s.timestamp).toLocaleTimeString('en-UG', { hour: '2-digit', minute: '2-digit' })}</CardDescription>
                      </div>
                      <Badge variant="outline" className={cn('text-xs font-normal capitalize',
                        s.sensor_status === 'online'  ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        s.sensor_status === 'warning' ? 'bg-amber-500/10 text-amber-700 border-amber-500/30' :
                        'bg-muted/30 text-muted-foreground')}>
                        {s.sensor_status === 'online' ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
                        {s.sensor_status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {[
                        { icon: Droplets,    label: 'Soil H₂O', value: `${s.soil_moisture}%`,     warn: s.soil_moisture < 40 },
                        { icon: FlaskConical,label: 'pH',       value: String(s.soil_ph),          warn: s.soil_ph < 5.5 || s.soil_ph > 7 },
                        { icon: Thermometer, label: 'Soil °C',  value: `${s.soil_temperature}°`,   warn: s.soil_temperature > 28 },
                        { icon: Thermometer, label: 'Air °C',   value: `${s.air_temperature}°`,    warn: s.air_temperature > 32 },
                        { icon: Wind,        label: 'Humidity', value: `${s.humidity}%`,           warn: s.humidity < 50 },
                        { icon: Sun,         label: 'Solar',    value: `${s.solar_radiation}W`,    warn: false },
                      ].map(({ icon: Icon, label, value, warn }) => (
                        <div key={label} className={cn('rounded-lg p-2 text-center', warn ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-muted/30')}>
                          <Icon className={cn('h-3.5 w-3.5 mx-auto mb-0.5', warn ? 'text-amber-500' : 'text-muted-foreground')} />
                          <p className={cn('font-mono font-semibold text-sm', warn ? 'text-amber-600' : '')}>{value}</p>
                          <p className="text-muted-foreground leading-none">{label}</p>
                        </div>
                      ))}
                    </div>
                    {s.rainfall > 0 && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-blue-500/10 px-2.5 py-1.5 text-xs text-blue-600">
                        <Droplets className="h-3.5 w-3.5 shrink-0" />
                        Rainfall: {s.rainfall} mm recorded today
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Sensor readings chart */}
          {!loadingSensors && sensors.length > 0 && (
            <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading">Soil Moisture & Temperature Across Farms</CardTitle>
                <CardDescription className="text-xs">Current readings — threshold lines at 40% moisture / 28°C soil temp</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sensors.map(s => ({ name: s.district, moisture: s.soil_moisture, temp: s.soil_temperature }))} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={40} stroke="#FFD700" strokeDasharray="4 4" label={{ value: 'Moisture min', position: 'right', fontSize: 9, fill: '#FFD700' }} />
                    <ReferenceLine y={28} stroke="#8B4513" strokeDasharray="4 4" label={{ value: 'Temp max', position: 'insideTopRight', fontSize: 9, fill: '#8B4513' }} />
                    <Bar dataKey="moisture" name="Soil Moisture %" fill="#228B22" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="temp"     name="Soil Temp °C"  fill="#FFD700" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── UAV SCANS TAB ── */}
        <TabsContent value="uav" className="space-y-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold">UAV Drone Imagery</h2>
            <p className="text-sm text-muted-foreground">
              High-resolution canopy analysis, disease detection via deep learning, and plant counting.
            </p>
          </div>

          {loadingUav ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {uavScans.map(scan => (
                <Card key={scan.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
                  {/* Thumbnail */}
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img
                      src={getUavCropImage(scan.crop, scan.thumbnail_url)}
                      alt={`UAV scan — ${scan.crop}`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    {/* Overlay badges */}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                      <Badge className="bg-black/60 text-white text-[10px] backdrop-blur-sm border-0">
                        {scan.altitude_m}m · {scan.resolution_cm}cm/px
                      </Badge>
                    </div>
                    {scan.disease_detected && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-red-500/80 text-white text-[10px] backdrop-blur-sm border-0">
                          <Bug className="h-3 w-3 mr-1" />Disease
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-heading font-semibold text-sm">{scan.crop}</p>
                        <p className="text-xs text-muted-foreground">{scan.district} · {scan.scan_date}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-xs font-normal',
                        scan.status === 'complete' ? 'bg-green-500/10 text-green-600 border-green-500/30' :
                        scan.status === 'processing' ? 'bg-blue-500/10 text-blue-600 border-blue-500/30' :
                        'bg-red-500/10 text-red-600 border-red-500/30')}>
                        {scan.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-muted-foreground">Canopy Cover</p>
                        <p className="font-mono font-semibold">{scan.canopy_cover}%</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-muted-foreground">NDVI Mean</p>
                        <p className="font-mono font-semibold">{scan.ndvi_mean.toFixed(2)}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-muted-foreground">Plant Count</p>
                        <p className="font-mono font-semibold">{scan.plant_count.toLocaleString()}</p>
                      </div>
                      <div className="rounded-lg bg-muted/30 p-2">
                        <p className="text-muted-foreground">Stressed</p>
                        <p className={cn('font-mono font-semibold', scan.stressed_plants > scan.plant_count * 0.15 ? 'text-red-500' : 'text-amber-500')}>
                          {scan.stressed_plants.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {scan.disease_detected && scan.disease_type && (
                      <div className="flex items-start gap-2 rounded-lg bg-red-500/8 border border-red-500/20 px-2.5 py-2 text-xs">
                        <Bug className="h-3.5 w-3.5 shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <span className="font-medium text-red-600">{scan.disease_type}</span>
                          <span className="text-muted-foreground ml-1">({(scan.disease_confidence * 100).toFixed(0)}% confidence)</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ── TIME-SERIES ALERTS TAB ── */}
        <TabsContent value="alerts" className="space-y-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Time-Series Alerts</h2>
            <p className="text-sm text-muted-foreground">
              Changepoint detection (PELT), Mann-Kendall trend tests, and ML anomaly classification.
            </p>
          </div>

          {/* Summary strip */}
          {!loadingAlerts && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(['Critical','High','Medium','Low'] as const).map(sev => {
                const count = tsAlerts.filter(a => a.severity === sev).length;
                const colors: Record<string, string> = {
                  Critical: 'border-red-500/30 bg-red-500/8 text-red-600',
                  High:     'border-orange-500/30 bg-orange-500/8 text-orange-600',
                  Medium:   'border-amber-500/30 bg-amber-500/8 text-amber-700',
                  Low:      'border-emerald-500/30 bg-emerald-500/8 text-emerald-700',
                };
                return (
                  <div key={sev} className={cn('rounded-xl border px-4 py-3 text-center', colors[sev])}>
                    <p className="text-2xl font-bold font-mono">{count}</p>
                    <p className="text-xs font-medium">{sev}</p>
                  </div>
                );
              })}
            </div>
          )}

          {loadingAlerts ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
            </div>
          ) : tsAlerts.length === 0 ? (
            <div className="rounded-2xl border border-border/40 bg-card/60 p-10 text-center text-muted-foreground">
              No active time-series alerts.
            </div>
          ) : (
            <div className="space-y-3">
              {tsAlerts.map(alert => (
                <Card key={alert.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted/40">
                        <AlertTypeIcon type={alert.type} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <SeverityBadge severity={alert.severity} />
                          <Badge variant="outline" className="text-xs font-normal capitalize">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {new Date(alert.detected_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <p className="font-medium text-sm">
                          {alert.crop} <span className="text-muted-foreground font-normal">— {alert.district}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                        <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs">
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                          <span><span className="font-medium text-foreground">Recommended: </span>{alert.recommended_action}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          Changepoint index: {alert.changepoint_index}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Alert type breakdown chart */}
          {!loadingAlerts && tsAlerts.length > 0 && (
            <Card className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-heading">Stress Index by Farm</CardTitle>
                <CardDescription className="text-xs">Composite index from IoT + NDVI + UAV · 0 = healthy, 1 = critical</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={healthSummary.map(h => ({ name: h.district, stress: +(h.stress_index * 100).toFixed(0), health: h.health_score }))} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={50} stroke="#FFD700" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="stress" name="Stress Index %" stroke="#8B4513" strokeWidth={2} dot={{ r: 4, fill: '#8B4513' }} />
                    <Line type="monotone" dataKey="health" name="Health Score"  stroke="#228B22" strokeWidth={2} dot={{ r: 4, fill: '#228B22' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

      </Tabs>
    </div>
  );
}
