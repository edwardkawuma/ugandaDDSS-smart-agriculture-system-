/**
 * TimeSeriesCubePanel
 * Lets users configure and trigger the Uganda Raster Time-Series Cube pipeline,
 * watch live progress, and download the resulting NetCDF file.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  Download, Play, RefreshCw, AlertTriangle, CheckCircle2,
  Layers, Clock, Database, Satellite, ShieldAlert, Info,
  Loader2, XCircle,
} from 'lucide-react';
import {
  timeseriesService,
  type CubeLayer,
  type CubeStatus,
} from '@/lib/api/timeseriesService';

// ── Types ─────────────────────────────────────────────────────────────────────
type LogEntry = {
  id:      number;
  status:  string;
  message?: string;
  step?:   string;
  progress?: number;
  total?:  number;
};

// ── Layer groups colour map ───────────────────────────────────────────────────
const GROUP_COLOR: Record<string, string> = {
  vegetation:  'bg-green-500/15  text-green-700  border-green-500/30',
  moisture:    'bg-blue-500/15   text-blue-700   border-blue-500/30',
  agriculture: 'bg-amber-500/15  text-amber-700  border-amber-500/30',
  composite:   'bg-purple-500/15 text-purple-700 border-purple-500/30',
};

const STATUS_ICON: Record<string, React.ReactNode> = {
  running: <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />,
  done:    <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  error:   <XCircle className="h-3.5 w-3.5 text-red-500" />,
  warn:    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  info:    <Info className="h-3.5 w-3.5 text-muted-foreground" />,
  stderr:  <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />,
};

// ── Component ─────────────────────────────────────────────────────────────────
export function TimeSeriesCubePanel({ className }: { className?: string }) {
  const [availableLayers, setAvailableLayers] = useState<CubeLayer[]>([]);
  const [selectedLayers,  setSelectedLayers]  = useState<Set<string>>(
    new Set(['NDVI', 'EVI', 'MOISTURE-INDEX'])
  );
  const [months,     setMonths]     = useState(12);
  const [resolution, setResolution] = useState(512);
  const [status,     setStatus]     = useState<CubeStatus | null>(null);
  const [running,    setRunning]    = useState(false);
  const [progress,   setProgress]   = useState(0);
  const [total,      setTotal]      = useState(0);
  const [log,        setLog]        = useState<LogEntry[]>([]);
  const [currentStep,setCurrentStep]= useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const logId  = useRef(0);

  // ── Fetch initial data ──────────────────────────────────────────────────
  useEffect(() => {
    void timeseriesService.layers().then(r => {
      setAvailableLayers(r.layers);
    }).catch(() => {});

    void timeseriesService.status().then(setStatus).catch(() => {});
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const appendLog = useCallback((entry: Omit<LogEntry, 'id'>) => {
    setLog(prev => [...prev.slice(-199), { ...entry, id: ++logId.current }]);
  }, []);

  const toggleLayer = useCallback((id: string) => {
    setSelectedLayers(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const handleBuild = useCallback(async () => {
    if (running) return;
    setRunning(true);
    setProgress(0);
    setTotal(0);
    setLog([]);
    setCurrentStep('Starting pipeline…');

    await timeseriesService.buildAndStream(
      {
        layers: Array.from(selectedLayers),
        months,
        width:  resolution,
        height: resolution,
      },
      (evt) => {
        appendLog({ status: String(evt.status ?? 'info'), message: String(evt.message ?? evt.step ?? ''), step: evt.step as string });
        if (evt.progress != null) { setProgress(Number(evt.progress)); setTotal(Number(evt.total ?? total)); }
        if (evt.step) setCurrentStep(String(evt.step));
      },
      (evt) => {
        appendLog({ status: 'done', message: `NetCDF saved · ${evt.sizeMb ?? '?'} MB` });
        setRunning(false);
        setCurrentStep('Complete');
        void timeseriesService.status().then(setStatus).catch(() => {});
      },
      (msg) => {
        appendLog({ status: 'error', message: msg });
        setRunning(false);
        setCurrentStep('Failed');
      },
    );
  }, [running, selectedLayers, months, resolution, total, appendLog]);

  const refreshStatus = useCallback(() => {
    void timeseriesService.status().then(s => { setStatus(s); }).catch(() => {});
  }, []);

  const pct = total > 0 ? Math.round((progress / total) * 100) : 0;
  const credOk = status?.credentials.instance_id_set ?? false;

  return (
    <Card className={cn('rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="font-heading text-lg flex items-center gap-2">
              <Satellite className="h-5 w-5 text-primary" />
              Time-Series Cube Builder
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Monthly NDVI / EVI / Moisture raster cube clipped to Uganda · Sentinel Hub WMS → NetCDF
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={refreshStatus} className="h-7 px-2 shrink-0">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">

        {/* Credentials warning */}
        {!credOk && (
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/30 bg-amber-500/8 px-3 py-2.5 text-xs text-amber-700">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              <strong>SENTINEL_INSTANCE_ID</strong> not set in <code>backend/.env</code>.
              The pipeline will fail without valid Sentinel Hub credentials.
            </span>
          </div>
        )}

        {/* Last run status */}
        {status?.lastRun && (
          <div className={cn(
            'flex items-center gap-2 rounded-xl border px-3 py-2 text-xs',
            status.lastRun.status === 'done'    ? 'border-green-500/30 bg-green-500/8  text-green-700' :
            status.lastRun.status === 'error'   ? 'border-red-500/30   bg-red-500/8    text-red-600'   :
            'border-primary/30 bg-primary/8 text-primary',
          )}>
            {STATUS_ICON[status.lastRun.status]}
            <span>
              Last run: <strong>{status.lastRun.status}</strong>
              {status.lastRun.finishedAt && ` · ${new Date(status.lastRun.finishedAt).toLocaleTimeString('en-UG')}`}
              {status.lastRun.sizeMb && ` · ${status.lastRun.sizeMb} MB`}
            </span>
          </div>
        )}

        {/* Output ready */}
        {status?.outputReady && (
          <a
            href={timeseriesService.downloadUrl()}
            download="uganda_time_series_cube.nc"
            className="flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-medium text-primary hover:bg-primary/15 transition-colors"
          >
            <Download className="h-4 w-4 shrink-0" />
            Download NetCDF · {status.sizeMb} MB
            <Badge className="ml-auto text-[10px] bg-primary/20 text-primary border-0">Ready</Badge>
          </a>
        )}

        <Separator className="opacity-30" />

        {/* Layer selection */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Layers
          </Label>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {availableLayers.map(layer => (
              <div
                key={layer.id}
                onClick={() => !running && toggleLayer(layer.id)}
                className={cn(
                  'flex items-center gap-2.5 rounded-lg border px-3 py-2 cursor-pointer transition-colors text-sm',
                  selectedLayers.has(layer.id)
                    ? 'border-primary/50 bg-primary/8'
                    : 'border-border/40 bg-card/40 hover:border-border/60',
                  running && 'opacity-50 pointer-events-none',
                )}
              >
                <Checkbox
                  checked={selectedLayers.has(layer.id)}
                  onCheckedChange={() => !running && toggleLayer(layer.id)}
                  onClick={e => e.stopPropagation()}
                  id={`layer-${layer.id}`}
                />
                <div className="min-w-0 flex-1">
                  <span className="font-medium truncate block">{layer.name}</span>
                </div>
                <Badge variant="outline" className={cn('text-[10px] font-normal shrink-0', GROUP_COLOR[layer.group] ?? '')}>
                  {layer.group}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Months
            </Label>
            <Select value={String(months)} onValueChange={v => setMonths(Number(v))} disabled={running}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-border/40 bg-card/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[3, 6, 12, 18, 24].map(m => (
                  <SelectItem key={m} value={String(m)}>{m} months</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground flex items-center gap-1">
              <Database className="h-3.5 w-3.5" /> Resolution (px)
            </Label>
            <Select value={String(resolution)} onValueChange={v => setResolution(Number(v))} disabled={running}>
              <SelectTrigger className="h-8 text-xs rounded-lg border-border/40 bg-card/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[256, 512, 1024].map(r => (
                  <SelectItem key={r} value={String(r)}>{r} × {r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Build button */}
        <Button
          className="w-full gap-2"
          disabled={running || selectedLayers.size === 0 || !credOk}
          onClick={handleBuild}
        >
          {running
            ? <><Loader2 className="h-4 w-4 animate-spin" /> Building…</>
            : <><Play className="h-4 w-4" /> Build Cube</>
          }
        </Button>

        {/* Progress bar */}
        {running && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate">{currentStep}</span>
              <span className="shrink-0 font-mono">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {progress} / {total} tiles
            </p>
          </div>
        )}

        {/* Log console */}
        {log.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70">
              Pipeline Log
            </Label>
            <ScrollArea className="h-44 rounded-xl border border-border/40 bg-black/20">
              <div ref={logRef} className="p-3 space-y-1 font-mono text-[11px]">
                {log.map(entry => (
                  <div key={entry.id} className="flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">{STATUS_ICON[entry.status] ?? STATUS_ICON.info}</span>
                    <span className={cn(
                      'break-all',
                      entry.status === 'error'  ? 'text-red-400'   :
                      entry.status === 'done'   ? 'text-green-400' :
                      entry.status === 'warn' || entry.status === 'stderr' ? 'text-amber-400' :
                      'text-muted-foreground',
                    )}>
                      {entry.step && <span className="text-primary mr-1">[{entry.step}]</span>}
                      {entry.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
