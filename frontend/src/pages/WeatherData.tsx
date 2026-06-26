import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
    weatherService,
    type WeatherCurrentResponse,
    type WeatherExportParams,
    type WeatherExportResponse,
    type WeatherExportScheduleParams,
    type WeatherHistoricalParams,
    type WeatherHistoricalResponse,
} from '@/lib/api/weatherService';
import {
    districtsService,
    type DistrictsListResponse,
} from '@/lib/api/districtsService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import {
    Cloud,
    Thermometer,
    Droplets,
    Wind,
    Download,
    CalendarClock,
    RefreshCw,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    MapPin,
    AlertTriangle,
    Clock,
    FileDown,
    Settings2,
    CloudRain,
    Gauge,
    Search,
    X,
    ChevronDown,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const exportScheduleSchema = z.object({
    district: z.string().min(1, 'District is required'),
    variables: z.array(z.string()).min(1, 'Select at least one variable'),
    format: z.string().min(1, 'Format is required'),
    frequency: z.string().min(1, 'Frequency is required'),
    destination_url: z.string().url('Enter a valid URL'),
    start_date: z.string().min(1, 'Start date is required'),
});

type ExportScheduleForm = z.infer<typeof exportScheduleSchema>;

const SEASONS = ['Season A', 'Season B', 'Dry Season'];
const VARIABLES = ['temperature', 'rainfall', 'humidity', 'wind_speed'];
const VARIABLE_LABELS: Record<string, string> = {
    temperature: 'Temperature (°C)',
    rainfall: 'Rainfall (mm)',
    humidity: 'Humidity (%)',
    wind_speed: 'Wind Speed (km/h)',
};
const FORMATS = ['CSV', 'JSON'];
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly'];

type Weather = WeatherHistoricalResponse['data'][number];
type District = DistrictsListResponse['data'][number];

// Build a deduped list of agro-ecological zones from the districts list.
function uniqueZones(list: District[]): string[] {
    const seen = new Set<string>();
    for (const d of list) {
        const z = d.agro_ecological_zone?.trim();
        if (z) seen.add(z);
    }
    return Array.from(seen).sort();
}

export default function WeatherData() {
    // List state — GET /weather/historical
    const [weather, setWeather] = useState<Weather[]>([]);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [weatherPage, setWeatherPage] = useState(1);
    const [weatherLimit] = useState(10);
    const [weatherTotal, setWeatherTotal] = useState(0);
    // Detail state — GET /weather/current
    const [currentItem, setCurrentItem] = useState<NonNullable<WeatherCurrentResponse['data']> | null>(null);
    const [loadingCurrentItem, setLoadingCurrentItem] = useState(false);
    // ↑ Current is the singular row type
    // Detail state — GET /weather/export
    const [exportItem, setExportItem] = useState<WeatherExportResponse['data'] | null>(null);
    const [loadingExportItem, setLoadingExportItem] = useState(false);
    // ↑ Export is the singular row type

    // Districts — backed by GET /districts (list endpoint)
    const [districts, setDistricts] = useState<District[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(true);
    const [filterDistrictSearch, setFilterDistrictSearch] = useState('');
    const [filterDistrictOpen, setFilterDistrictOpen] = useState(false);
    const [exportDistrictOpen, setExportDistrictOpen] = useState(false);
    const [exportDistrictSearch, setExportDistrictSearch] = useState('');
    const [scheduleDistrictOpen, setScheduleDistrictOpen] = useState(false);
    const [scheduleDistrictSearch, setScheduleDistrictSearch] = useState('');

    // Local UI state — filters
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterZone, setFilterZone] = useState('');
    const [filterFromDate, setFilterFromDate] = useState('');
    const [filterToDate, setFilterToDate] = useState('');
    const [filterSeason, setFilterSeason] = useState('');
    const [filterVariable, setFilterVariable] = useState('');

    // Local UI state — dialogs
    const [currentSheetOpen, setCurrentSheetOpen] = useState(false);
    const [currentSheetDistrict, setCurrentSheetDistrict] = useState('');
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportDistrict, setExportDistrict] = useState('');
    const [exportFromDate, setExportFromDate] = useState('');
    const [exportToDate, setExportToDate] = useState('');
    const [exportFormat, setExportFormat] = useState('CSV');
    const [exportVariables, setExportVariables] = useState<string[]>(['temperature', 'rainfall']);
    const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);

    const scheduleForm = useForm<ExportScheduleForm>({
        resolver: zodResolver(exportScheduleSchema),
        defaultValues: {
            district: '',
            variables: ['temperature', 'rainfall'],
            format: 'CSV',
            frequency: 'Weekly',
            destination_url: '',
            start_date: '',
        },
    });

    const totalPages = Math.max(1, Math.ceil(weatherTotal / weatherLimit));
    const agroZones = uniqueZones(districts);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { void loadWeather(); }, [weatherPage]);
    useEffect(() => { void loadDistricts(); }, []);

    async function loadDistricts() {
        try {
            setLoadingDistricts(true);
            const res = await districtsService.list({ page: 1, limit: 200 });
            setDistricts(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to load districts');
            console.error('[loadDistricts]', err);
        } finally {
            setLoadingDistricts(false);
        }
    }

    async function loadWeather(overrides?: WeatherHistoricalParams) {
        try {
            setLoadingWeather(true);
            const params: WeatherHistoricalParams = {
                page: weatherPage,
                limit: weatherLimit,
                district: overrides?.district ?? (filterDistrict || undefined),
                agro_ecological_zone: overrides?.agro_ecological_zone ?? (filterZone || undefined),
                from_date: overrides?.from_date ?? (filterFromDate || undefined),
                to_date: overrides?.to_date ?? (filterToDate || undefined),
                season: overrides?.season ?? (filterSeason || undefined),
                variable: overrides?.variable ?? (filterVariable || undefined),
            };
            const res = await weatherService.historical(params);
            setWeather(Array.isArray(res?.data) ? res.data : []);
            setWeatherTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load weather data');
            console.error('[loadWeather]', err);
        } finally {
            setLoadingWeather(false);
        }
    }

    async function loadCurrentItem(district: string) {
        try {
            setLoadingCurrentItem(true);
            const res = await weatherService.current({ district });
            setCurrentItem(res?.data != null ? res.data as NonNullable<WeatherCurrentResponse['data']> : null);
        } catch (err) {
            toast.error('Failed to load current weather');
            console.error('[loadCurrentItem]', err);
        } finally {
            setLoadingCurrentItem(false);
        }
    }

    async function loadExportItem(params: WeatherExportParams) {
        try {
            setLoadingExportItem(true);
            const res = await weatherService.export(params);
            setExportItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to generate export');
            console.error('[loadExportItem]', err);
        } finally {
            setLoadingExportItem(false);
        }
    }

    // POST /weather/export-schedule
    async function handleExportSchedule(data: WeatherExportScheduleParams) {
        try {
            await weatherService.exportSchedule(data);
            toast.success('Automated export schedule configured successfully');
            setScheduleDialogOpen(false);
            scheduleForm.reset();
        } catch (err) {
            toast.error('Failed to configure export schedule');
            console.error('[handleExportSchedule]', err);
        }
    }

    function handleApplyFilters() {
        setWeatherPage(1);
        void loadWeather({
            district: filterDistrict || undefined,
            agro_ecological_zone: filterZone || undefined,
            from_date: filterFromDate || undefined,
            to_date: filterToDate || undefined,
            season: filterSeason || undefined,
            variable: filterVariable || undefined,
        });
    }

    function handleClearFilters() {
        setFilterDistrict('');
        setFilterZone('');
        setFilterFromDate('');
        setFilterToDate('');
        setFilterSeason('');
        setFilterVariable('');
        setWeatherPage(1);
        void loadWeather({ district: undefined, agro_ecological_zone: undefined, from_date: undefined, to_date: undefined, season: undefined, variable: undefined });
    }

    function handleViewCurrentWeather(district: string) {
        setCurrentSheetDistrict(district);
        setCurrentSheetOpen(true);
        void loadCurrentItem(district);
    }

    function handleOpenExportDialog(district?: string) {
        setExportDistrict(district ?? '');
        setExportItem(null);
        setExportDialogOpen(true);
    }

    async function handleRunExport() {
        await loadExportItem({
            district: exportDistrict || undefined,
            from_date: exportFromDate || undefined,
            to_date: exportToDate || undefined,
            format: exportFormat,
            variables: exportVariables.join(','),
        });
    }

    function toggleExportVariable(v: string) {
        setExportVariables(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
    }

    function toggleScheduleVariable(v: string, current: string[]) {
        return current.includes(v) ? current.filter(x => x !== v) : [...current, v];
    }

    const selectedFilterDistrict = districts.find(d => (d.id ?? d.name) === filterDistrict);
    const selectedExportDistrict = districts.find(d => (d.id ?? d.name) === exportDistrict);

    return (
        <div className="p-6 md:p-8 space-y-8">

            {/* ── Page Header ── */}
            <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Cloud className="h-8 w-8 text-amber-400" />
                        Weather Data
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Historical &amp; real-time climate intelligence for Uganda's agro-ecological zones — sourced from OpenWeatherMap and national meteorological stations.
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-400/50 text-amber-400 hover:bg-amber-400/10 gap-1.5"
                        onClick={() => setScheduleDialogOpen(true)}
                    >
                        <CalendarClock className="h-4 w-4" />
                        Schedule Export
                    </Button>
                    <Button
                        size="sm"
                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:bg-primary/10 gap-1.5 transition-all duration-200"
                        onClick={() => handleOpenExportDialog()}
                    >
                        <FileDown className="h-4 w-4" />
                        Export Data
                    </Button>
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium text-foreground">Filter &amp; Query</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {/* District — Combobox backed by GET /districts */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">District</Label>
                        <Popover open={filterDistrictOpen} onOpenChange={setFilterDistrictOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={filterDistrictOpen}
                                    className="w-full h-8 text-xs justify-between font-normal bg-background/60 px-2.5"
                                >
                                    <span className="truncate text-left">
                                        {selectedFilterDistrict ? selectedFilterDistrict.name : 'All districts'}
                                    </span>
                                    <ChevronDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[260px] p-0" align="start">
                                <Command>
                                    <CommandInput
                                        placeholder="Search districts…"
                                        value={filterDistrictSearch}
                                        onValueChange={setFilterDistrictSearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                        </CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value=""
                                                onSelect={() => {
                                                    setFilterDistrict('');
                                                    setFilterDistrictOpen(false);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', filterDistrict === '' ? 'opacity-100' : 'opacity-0')} />
                                                All districts
                                            </CommandItem>
                                            {districts
                                                .filter(d => !filterDistrictSearch || (d.name ?? '').toLowerCase().includes(filterDistrictSearch.toLowerCase()))
                                                .map(d => {
                                                    const key = d.id ?? d.name ?? '';
                                                    const selected = filterDistrict === key;
                                                    return (
                                                        <CommandItem
                                                            key={key}
                                                            value={d.name ?? key}
                                                            onSelect={() => {
                                                                setFilterDistrict(selected ? '' : key);
                                                                setFilterDistrictOpen(false);
                                                            }}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                            <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                            {d.name ?? key}
                                                        </CommandItem>
                                                    );
                                                })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    {/* Agro-ecological zone — derived from districts list */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Agro-Ecological Zone</Label>
                        <select
                            value={filterZone}
                            onChange={e => setFilterZone(e.target.value)}
                            className="w-full h-8 text-xs px-2 rounded-md border border-border/40 bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            <option value="">All zones</option>
                            {agroZones.map(z => (
                                <option key={z} value={z}>{z}</option>
                            ))}
                        </select>
                    </div>
                    {/* Season */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Season</Label>
                        <select
                            value={filterSeason}
                            onChange={e => setFilterSeason(e.target.value)}
                            className="w-full h-8 text-xs px-2 rounded-md border border-border/40 bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            <option value="">All seasons</option>
                            {SEASONS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                    {/* Variable */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Variable</Label>
                        <select
                            value={filterVariable}
                            onChange={e => setFilterVariable(e.target.value)}
                            className="w-full h-8 text-xs px-2 rounded-md border border-border/40 bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                        >
                            <option value="">All variables</option>
                            {VARIABLES.map(v => (
                                <option key={v} value={v}>{VARIABLE_LABELS[v]}</option>
                            ))}
                        </select>
                    </div>
                    {/* From date */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">From Date</Label>
                        <Input
                            type="date"
                            value={filterFromDate}
                            onChange={e => setFilterFromDate(e.target.value)}
                            className="h-8 text-xs bg-background/60"
                        />
                    </div>
                    {/* To date */}
                    <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">To Date</Label>
                        <Input
                            type="date"
                            value={filterToDate}
                            onChange={e => setFilterToDate(e.target.value)}
                            className="h-8 text-xs bg-background/60"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 pt-1">
                    <Button size="sm" onClick={handleApplyFilters} className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:bg-primary/10 gap-1.5 h-8 text-xs transition-all duration-200">
                        <Search className="h-3.5 w-3.5" />
                        Apply Filters
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleClearFilters} className="h-8 text-xs text-muted-foreground gap-1.5">
                        <X className="h-3.5 w-3.5" />
                        Clear
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void loadWeather()} className="h-8 text-xs text-muted-foreground gap-1.5 ml-auto">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* ── Historical Weather Table ── */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md overflow-hidden">
                <div className="px-5 py-3 flex items-center justify-between border-b border-border/30">
                    <div className="flex items-center gap-2">
                        <CloudRain className="h-4 w-4 text-sky-400" />
                        <span className="text-sm font-semibold text-foreground">Historical Time-Series</span>
                        {!loadingWeather && (
                            <Badge variant="secondary" className="text-xs ml-1">{weatherTotal.toLocaleString()} records</Badge>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-border/30 hover:bg-transparent">
                                <TableHead className="text-xs text-muted-foreground">Date</TableHead>
                                <TableHead className="text-xs text-muted-foreground">District</TableHead>
                                <TableHead className="text-xs text-muted-foreground">AEZ</TableHead>
                                <TableHead className="text-xs text-muted-foreground text-right">
                                    <span className="flex items-center justify-end gap-1"><Thermometer className="h-3 w-3" />Temp (°C)</span>
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground text-right">
                                    <span className="flex items-center justify-end gap-1"><Droplets className="h-3 w-3" />Rain (mm)</span>
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground text-right">
                                    <span className="flex items-center justify-end gap-1"><Gauge className="h-3 w-3" />Hum (%)</span>
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground text-right">
                                    <span className="flex items-center justify-end gap-1"><Wind className="h-3 w-3" />Wind (km/h)</span>
                                </TableHead>
                                <TableHead className="text-xs text-muted-foreground">Season</TableHead>
                                <TableHead className="w-10" />
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loadingWeather ? (
                                Array.from({ length: 7 }).map((_, i) => (
                                    <TableRow key={i} className="border-border/20">
                                        {Array.from({ length: 9 }).map((__, j) => (
                                            <TableCell key={j}><Skeleton className="h-4 w-full rounded" /></TableCell>
                                        ))}
                                    </TableRow>
                                ))
                            ) : weather.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={9} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                            <Cloud className="h-10 w-10 opacity-30" />
                                            <p className="text-sm">No weather records found for the selected filters.</p>
                                            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs">Clear filters</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                weather.map((row, idx) => (
                                    <TableRow
                                        key={idx}
                                        className="border-border/20 hover:bg-accent/30 transition-colors duration-150 cursor-pointer"
                                    >
                                        <TableCell className="text-xs font-mono text-muted-foreground">
                                            {row.date ? new Date(row.date).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3 text-amber-400 flex-shrink-0" />
                                                {row.district ?? '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-muted-foreground max-w-[140px] truncate" title={row.agro_ecological_zone}>
                                            {row.agro_ecological_zone ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-mono">
                                            <span className={cn(
                                                "font-medium",
                                                row.temperature != null && row.temperature > 30 ? "text-rose-400" : row.temperature != null && row.temperature < 15 ? "text-sky-400" : "text-foreground"
                                            )}>
                                                {row.temperature != null ? row.temperature.toFixed(1) : '—'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-mono text-sky-300">
                                            {row.rainfall != null ? row.rainfall.toFixed(1) : '—'}
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-mono">
                                            {row.humidity != null ? `${row.humidity.toFixed(0)}` : '—'}
                                        </TableCell>
                                        <TableCell className="text-xs text-right font-mono text-teal-300">
                                            {row.wind_speed != null ? row.wind_speed.toFixed(1) : '—'}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {row.season ? (
                                                <Badge variant="outline" className="text-[10px] border-amber-400/40 text-amber-300 px-1.5 py-0">{row.season}</Badge>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="text-xs">
                                                    <DropdownMenuItem onClick={() => row.district && handleViewCurrentWeather(row.district)} className="gap-2">
                                                        <Cloud className="h-3.5 w-3.5" />
                                                        View Current Weather
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenExportDialog(row.district)} className="gap-2">
                                                        <Download className="h-3.5 w-3.5" />
                                                        Export District Data
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {!loadingWeather && weatherTotal > weatherLimit && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/30">
                        <p className="text-xs text-muted-foreground">
                            Page {weatherPage} of {totalPages} &mdash; {weatherTotal.toLocaleString()} total records
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={weatherPage <= 1}
                                onClick={() => setWeatherPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                disabled={weatherPage >= totalPages}
                                onClick={() => setWeatherPage(p => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Current Weather Sheet ── */}
            <Sheet open={currentSheetOpen} onOpenChange={setCurrentSheetOpen}>
                <SheetContent className="w-full sm:max-w-md overflow-y-auto backdrop-blur-md bg-card/80 border-l border-border/40">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="font-heading flex items-center gap-2">
                            <Cloud className="h-5 w-5 text-sky-400" />
                            Real-Time Weather — {currentSheetDistrict}
                        </SheetTitle>
                    </SheetHeader>
                    {loadingCurrentItem ? (
                        <div className="space-y-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            ))}
                        </div>
                    ) : currentItem ? (
                        <div className="space-y-5">
                            {/* Anomaly banner */}
                            {currentItem.anomaly_flag && (
                                <div className="flex items-center gap-2 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                    Anomaly detected — readings deviate from historical baseline.
                                </div>
                            )}
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: 'Temperature', value: currentItem.temperature != null ? `${currentItem.temperature.toFixed(1)} °C` : '—', icon: <Thermometer className="h-4 w-4 text-rose-400" />, color: 'text-rose-300' },
                                    { label: 'Rainfall', value: currentItem.rainfall != null ? `${currentItem.rainfall.toFixed(1)} mm` : '—', icon: <Droplets className="h-4 w-4 text-sky-400" />, color: 'text-sky-300' },
                                    { label: 'Humidity', value: currentItem.humidity != null ? `${currentItem.humidity.toFixed(0)} %` : '—', icon: <Gauge className="h-4 w-4 text-teal-400" />, color: 'text-teal-300' },
                                    { label: 'Wind Speed', value: currentItem.wind_speed != null ? `${currentItem.wind_speed.toFixed(1)} km/h` : '—', icon: <Wind className="h-4 w-4 text-amber-400" />, color: 'text-amber-300' },
                                ].map(stat => (
                                    <div key={stat.label} className="backdrop-blur-sm bg-background/40 border border-border/30 rounded-lg p-3 space-y-1">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            {stat.icon}
                                            {stat.label}
                                        </div>
                                        <p className={cn("text-xl font-bold font-mono", stat.color)}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                            <Separator className="bg-border/30" />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Condition</span>
                                    <span className="font-medium capitalize">{currentItem.condition ?? '—'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Season Position</span>
                                    <span className="font-medium">{currentItem.season_position ?? '—'}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" />Recorded At</span>
                                    <span className="text-xs font-mono text-muted-foreground">
                                        {currentItem.recorded_at ? new Date(currentItem.recorded_at).toLocaleString('en-UG') : '—'}
                                    </span>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-amber-400/40 text-amber-300 hover:bg-amber-400/10 gap-2 mt-2"
                                onClick={() => handleOpenExportDialog(currentSheetDistrict)}
                            >
                                <Download className="h-4 w-4" />
                                Export {currentSheetDistrict} Data
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                            <Cloud className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No current data available for {currentSheetDistrict}.</p>
                        </div>
                    )}
                </SheetContent>
            </Sheet>

            {/* ── Export Dialog ── */}
            <Dialog open={exportDialogOpen} onOpenChange={open => { setExportDialogOpen(open); if (!open) setExportItem(null); }}>
                <DialogContent className="sm:max-w-lg backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <FileDown className="h-5 w-5 text-amber-400" />
                            Export Weather Dataset
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-4">
                            {/* District — Combobox backed by GET /districts */}
                            <div className="space-y-1.5">
                                <Label className="text-xs">District</Label>
                                <Popover open={exportDistrictOpen} onOpenChange={setExportDistrictOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={exportDistrictOpen}
                                            className="w-full h-9 text-sm justify-between font-normal bg-background/60"
                                        >
                                            <span className="truncate text-left">
                                                {selectedExportDistrict ? selectedExportDistrict.name : 'All districts'}
                                            </span>
                                            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search districts…"
                                                value={exportDistrictSearch}
                                                onValueChange={setExportDistrictSearch}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    <CommandItem
                                                        value=""
                                                        onSelect={() => {
                                                            setExportDistrict('');
                                                            setExportDistrictOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', exportDistrict === '' ? 'opacity-100' : 'opacity-0')} />
                                                        All districts
                                                    </CommandItem>
                                                    {districts
                                                        .filter(d => !exportDistrictSearch || (d.name ?? '').toLowerCase().includes(exportDistrictSearch.toLowerCase()))
                                                        .map(d => {
                                                            const key = d.id ?? d.name ?? '';
                                                            const selected = exportDistrict === key;
                                                            return (
                                                                <CommandItem
                                                                    key={key}
                                                                    value={d.name ?? key}
                                                                    onSelect={() => {
                                                                        setExportDistrict(selected ? '' : key);
                                                                        setExportDistrictOpen(false);
                                                                    }}
                                                                >
                                                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                    {d.name ?? key}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Format</Label>
                                <select
                                    value={exportFormat}
                                    onChange={e => setExportFormat(e.target.value)}
                                    className="w-full h-9 text-sm px-2 rounded-md border border-border/40 bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                                >
                                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">From Date</Label>
                                <Input type="date" value={exportFromDate} onChange={e => setExportFromDate(e.target.value)} className="h-9 text-sm bg-background/60" />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">To Date</Label>
                                <Input type="date" value={exportToDate} onChange={e => setExportToDate(e.target.value)} className="h-9 text-sm bg-background/60" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Variables to include</Label>
                            <div className="flex flex-wrap gap-2">
                                {VARIABLES.map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => toggleExportVariable(v)}
                                        className={cn(
                                            "text-xs px-2.5 py-1 rounded-full border transition-all duration-150",
                                            exportVariables.includes(v)
                                                ? "border-primary bg-primary/15 text-primary"
                                                : "border-border/40 text-muted-foreground hover:border-primary/40"
                                        )}
                                    >
                                        {VARIABLE_LABELS[v]}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {exportItem && (
                            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-2">
                                <p className="text-xs font-semibold text-emerald-300 flex items-center gap-1.5"><Download className="h-3.5 w-3.5" />Export Ready</p>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                    <span className="text-muted-foreground">File</span><span className="font-mono text-foreground truncate">{exportItem.file_name}</span>
                                    <span className="text-muted-foreground">Records</span><span className="font-mono text-foreground">{exportItem.record_count?.toLocaleString()}</span>
                                    <span className="text-muted-foreground">Generated</span><span className="font-mono text-foreground">{exportItem.generated_at ? new Date(exportItem.generated_at).toLocaleString('en-UG') : '—'}</span>
                                </div>
                                {exportItem.download_url && (
                                    <a
                                        href={exportItem.download_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 text-xs text-emerald-300 underline underline-offset-2 hover:text-emerald-200 mt-1"
                                    >
                                        <Download className="h-3.5 w-3.5" />
                                        Download file
                                    </a>
                                )}
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="outline" size="sm" onClick={() => setExportDialogOpen(false)}>Cancel</Button>
                        <Button
                            size="sm"
                            disabled={loadingExportItem || exportVariables.length === 0}
                            onClick={handleRunExport}
                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 gap-1.5 transition-all duration-200"
                        >
                            {loadingExportItem ? <RefreshCw className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                            {exportItem ? 'Re-generate' : 'Generate Export'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Schedule Export Dialog ── */}
            <Dialog open={scheduleDialogOpen} onOpenChange={open => { setScheduleDialogOpen(open); if (!open) scheduleForm.reset(); }}>
                <DialogContent className="sm:max-w-lg backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <CalendarClock className="h-5 w-5 text-amber-400" />
                            Configure Automated Export
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...scheduleForm}>
                        <form onSubmit={scheduleForm.handleSubmit(data => handleExportSchedule(data as WeatherExportScheduleParams))} className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={scheduleForm.control}
                                    name="district"
                                    render={({ field }) => {
                                        const selectedDistrict = districts.find(d => (d.id ?? d.name) === field.value);
                                        return (
                                            <FormItem>
                                                <FormLabel className="text-xs">District</FormLabel>
                                                <FormControl>
                                                    <Popover open={scheduleDistrictOpen} onOpenChange={setScheduleDistrictOpen}>
                                                        <PopoverTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                aria-expanded={scheduleDistrictOpen}
                                                                className="w-full h-9 text-sm justify-between font-normal bg-background/60"
                                                            >
                                                                <span className="truncate text-left">
                                                                    {selectedDistrict ? selectedDistrict.name : 'Select district'}
                                                                </span>
                                                                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[320px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput
                                                                    placeholder="Search districts…"
                                                                    value={scheduleDistrictSearch}
                                                                    onValueChange={setScheduleDistrictSearch}
                                                                />
                                                                <CommandList>
                                                                    <CommandEmpty>
                                                                        {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                                                    </CommandEmpty>
                                                                    <CommandGroup>
                                                                        {districts
                                                                            .filter(d => !scheduleDistrictSearch || (d.name ?? '').toLowerCase().includes(scheduleDistrictSearch.toLowerCase()))
                                                                            .map(d => {
                                                                                const key = d.id ?? d.name ?? '';
                                                                                const selected = field.value === key;
                                                                                return (
                                                                                    <CommandItem
                                                                                        key={key}
                                                                                        value={d.name ?? key}
                                                                                        onSelect={() => {
                                                                                            field.onChange(key);
                                                                                            setScheduleDistrictOpen(false);
                                                                                        }}
                                                                                    >
                                                                                        <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                                                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                                        {d.name ?? key}
                                                                                    </CommandItem>
                                                                                );
                                                                            })}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                </FormControl>
                                                <FormMessage className="text-xs" />
                                            </FormItem>
                                        );
                                    }}
                                />
                                <FormField
                                    control={scheduleForm.control}
                                    name="format"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Format</FormLabel>
                                            <FormControl>
                                                <select
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="w-full h-9 text-sm px-2 rounded-md border border-border/40 bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                                                >
                                                    {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={scheduleForm.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Frequency</FormLabel>
                                            <FormControl>
                                                <select
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    className="w-full h-9 text-sm px-2 rounded-md border border-border/40 bg-background/60 text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
                                                >
                                                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                                                </select>
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={scheduleForm.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Start Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="h-9 text-sm bg-background/60" />
                                            </FormControl>
                                            <FormMessage className="text-xs" />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={scheduleForm.control}
                                name="destination_url"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Destination URL</FormLabel>
                                        <FormControl>
                                            <Input placeholder="https://your-institution.ac.ug/api/ingest" {...field} className="h-9 text-sm bg-background/60" />
                                        </FormControl>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={scheduleForm.control}
                                name="variables"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-xs">Variables</FormLabel>
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            {VARIABLES.map(v => (
                                                <button
                                                    key={v}
                                                    type="button"
                                                    onClick={() => field.onChange(toggleScheduleVariable(v, field.value))}
                                                    className={cn(
                                                        "text-xs px-2.5 py-1 rounded-full border transition-all duration-150",
                                                        field.value.includes(v)
                                                            ? "border-primary bg-primary/15 text-primary"
                                                            : "border-border/40 text-muted-foreground hover:border-primary/40"
                                                    )}
                                                >
                                                    {VARIABLE_LABELS[v]}
                                                </button>
                                            ))}
                                        </div>
                                        <FormMessage className="text-xs" />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" size="sm" onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={scheduleForm.formState.isSubmitting}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 gap-1.5 transition-all duration-200"
                                >
                                    {scheduleForm.formState.isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
                                    Save Schedule
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}