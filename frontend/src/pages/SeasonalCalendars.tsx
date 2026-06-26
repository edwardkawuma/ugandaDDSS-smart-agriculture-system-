import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    seasonalCalendarsService,
    type SeasonalCalendarsListParams,
    type SeasonalCalendarsListResponse,
    type SeasonalCalendarsPestRiskWindowsParams,
    type SeasonalCalendarsPestRiskWindowsResponse,
} from '@/lib/api/seasonalCalendarsService';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Sprout, Droplets, Sun, Bug, Filter, ChevronRight, ChevronLeft } from 'lucide-react';

type ListItem = SeasonalCalendarsListResponse['data'][number];
type PestRiskWindow = SeasonalCalendarsPestRiskWindowsResponse['data'][number];

const CROPS = ['All Crops', 'Coffee', 'Maize', 'Beans', 'Hass Avocado'];
const SEASONS = ['All Seasons', 'Long Rains', 'Short Rains', 'Main Dry', 'Short Dry'];
const ZONES = ['All Zones', 'Highland', 'Mid-altitude', 'Lowland', 'Lake Victoria Basin'];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const SEASON_COLORS: Record<string, { bg: string; border: string; text: string }> = {
    'Long Rains': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-700 dark:text-emerald-400' },
    'Short Rains': { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-700 dark:text-sky-400' },
    'Main Dry': { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-700 dark:text-amber-400' },
    'Short Dry': { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-700 dark:text-orange-400' },
};

const RISK_LEVEL_STYLES: Record<string, string> = {
    high: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
    medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    moderate: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
};

function monthToIndex(m: string): number {
    if (!m) return -1;
    const lower = m.toLowerCase().trim();
    return MONTHS.findIndex((mn) => lower.startsWith(mn.toLowerCase()));
}

function TimelineBar({ startMonth, endMonth, color, label }: { startMonth: string; endMonth: string; color: string; label: string }) {
    const start = monthToIndex(startMonth);
    const end = monthToIndex(endMonth);
    if (start < 0 || end < 0) return null;

    const span = end >= start ? end - start + 1 : 12 - start + end + 1;
    const leftPct = (start / 12) * 100;
    const widthPct = (span / 12) * 100;

    return (
        <div className="relative h-5 w-full">
            <div className="absolute inset-0 flex">
                {MONTHS.map((m) => (
                    <div key={m} className="flex-1 text-[9px] text-muted-foreground text-center leading-5">{m.charAt(0)}</div>
                ))}
            </div>
            <div
                className={`absolute top-0 h-5 rounded-sm ${color} opacity-80 flex items-center justify-center`}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
            >
                <span className="text-[9px] font-medium text-white truncate px-1">{label}</span>
            </div>
        </div>
    );
}

function CalendarCard({ row }: { row: ListItem }) {
    const seasonStyle = SEASON_COLORS[row.season ?? ''] ?? { bg: 'bg-muted/30', border: 'border-border', text: 'text-foreground' };

    return (
        <Card className={`backdrop-blur-md bg-card/70 border shadow-md hover:shadow-lg transition-shadow duration-200 ${seasonStyle.border}`}>
            <CardHeader className={`pb-3 rounded-t-lg ${seasonStyle.bg}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-md bg-primary/10">
                            <Sprout className={`h-4 w-4 ${seasonStyle.text}`} />
                        </div>
                        <div>
                            <CardTitle className="text-base">{row.crop ?? '—'}</CardTitle>
                            <CardDescription className={`text-xs mt-0.5 ${seasonStyle.text}`}>
                                {row.season ?? '—'} &middot; {row.season_months ?? ''}
                            </CardDescription>
                        </div>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                        {row.agro_ecological_zone ?? 'All zones'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Phase indicators */}
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" /> Planting
                        </p>
                        <p className="text-xs font-medium text-foreground mt-0.5">{row.planting_start ?? '—'} &rarr; {row.planting_end ?? '—'}</p>
                    </div>
                    <div className="rounded-md bg-sky-500/10 border border-sky-500/20 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-sky-700 dark:text-sky-400 font-semibold flex items-center justify-center gap-1">
                            <Droplets className="h-3 w-3" /> Growing
                        </p>
                        <p className="text-xs font-medium text-foreground mt-0.5">{row.growing_start ?? '—'} &rarr; {row.growing_end ?? '—'}</p>
                    </div>
                    <div className="rounded-md bg-amber-500/10 border border-amber-500/20 p-2">
                        <p className="text-[10px] uppercase tracking-wide text-amber-700 dark:text-amber-400 font-semibold flex items-center justify-center gap-1">
                            <Sun className="h-3 w-3" /> Harvest
                        </p>
                        <p className="text-xs font-medium text-foreground mt-0.5">{row.harvest_start ?? '—'} &rarr; {row.harvest_end ?? '—'}</p>
                    </div>
                </div>

                {/* Visual timeline */}
                <div className="space-y-1.5 pt-1">
                    <div className="relative h-5 w-full rounded bg-muted/30 overflow-hidden">
                        <TimelineBar startMonth={row.planting_start ?? ''} endMonth={row.planting_end ?? ''} color="bg-emerald-500" label="Plant" />
                    </div>
                    <div className="relative h-5 w-full rounded bg-muted/30 overflow-hidden">
                        <TimelineBar startMonth={row.growing_start ?? ''} endMonth={row.growing_end ?? ''} color="bg-sky-500" label="Grow" />
                    </div>
                    <div className="relative h-5 w-full rounded bg-muted/30 overflow-hidden">
                        <TimelineBar startMonth={row.harvest_start ?? ''} endMonth={row.harvest_end ?? ''} color="bg-amber-500" label="Harvest" />
                    </div>
                </div>

                {row.notes && (
                    <p className="text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-2">{row.notes}</p>
                )}
            </CardContent>
        </Card>
    );
}

export default function SeasonalCalendars() {
    const navigate = useNavigate();

    // Filter state
    const [filterCrop, setFilterCrop] = useState('All Crops');
    const [filterSeason, setFilterSeason] = useState('All Seasons');
    const [filterZone, setFilterZone] = useState('All Zones');

    // List state — GET /seasonal-calendars/list
    const [list, setList] = useState<ListItem[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listPage, setListPage] = useState(1);
    const [listLimit] = useState(50);
    const [listTotal, setListTotal] = useState(0);

    // Pest risk state — GET /seasonal-calendars/pest-risk-windows
    const [pestRiskWindows, setPestRiskWindows] = useState<PestRiskWindow[]>([]);
    const [loadingPestRiskWindows, setLoadingPestRiskWindows] = useState(true);
    const [pestRiskWindowsPage, setPestRiskWindowsPage] = useState(1);
    const [pestRiskWindowsLimit] = useState(50);
    const [pestRiskWindowsTotal, setPestRiskWindowsTotal] = useState(0);

    // Build API filter params
    const listParams: SeasonalCalendarsListParams = useMemo(() => {
        const p: SeasonalCalendarsListParams = { page: listPage, limit: listLimit };
        if (filterCrop !== 'All Crops') p.crop = filterCrop;
        if (filterSeason !== 'All Seasons') p.season = filterSeason;
        if (filterZone !== 'All Zones') p.agro_ecological_zone = filterZone;
        return p;
    }, [listPage, listLimit, filterCrop, filterSeason, filterZone]);

    const pestParams: SeasonalCalendarsPestRiskWindowsParams = useMemo(() => {
        const p: SeasonalCalendarsPestRiskWindowsParams = { page: pestRiskWindowsPage, limit: pestRiskWindowsLimit };
        if (filterCrop !== 'All Crops') p.crop = filterCrop;
        if (filterSeason !== 'All Seasons') p.season = filterSeason;
        if (filterZone !== 'All Zones') p.agro_ecological_zone = filterZone;
        return p;
    }, [pestRiskWindowsPage, pestRiskWindowsLimit, filterCrop, filterSeason, filterZone]);

    useEffect(() => { void loadList(); }, [listParams]);
    useEffect(() => { void loadPestRiskWindows(); }, [pestParams]);

    async function loadList() {
        try {
            setLoadingList(true);
            const res = await seasonalCalendarsService.list(listParams);
            setList(Array.isArray(res?.data) ? res.data : []);
            setListTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load seasonal calendar data');
            console.error('[loadList]', err);
        } finally {
            setLoadingList(false);
        }
    }

    async function loadPestRiskWindows() {
        try {
            setLoadingPestRiskWindows(true);
            const res = await seasonalCalendarsService.pestRiskWindows(pestParams);
            setPestRiskWindows(Array.isArray(res?.data) ? res.data : []);
            setPestRiskWindowsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load pest risk windows');
            console.error('[loadPestRiskWindows]', err);
        } finally {
            setLoadingPestRiskWindows(false);
        }
    }

    function handleResetFilters() {
        setFilterCrop('All Crops');
        setFilterSeason('All Seasons');
        setFilterZone('All Zones');
        setListPage(1);
        setPestRiskWindowsPage(1);
    }

    const activeFilterCount = [filterCrop !== 'All Crops', filterSeason !== 'All Seasons', filterZone !== 'All Zones'].filter(Boolean).length;

    return (
        <div className="p-6 md:p-8 space-y-8">
            {/* Hero */}
            <div className="relative w-full h-56 md:h-64 rounded-xl overflow-hidden shadow-md">
                <img
                    src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80"
                    alt="Uganda farmland with seasonal crop rows"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
                <div className="relative z-10 flex flex-col justify-end h-full p-6 md:p-8">
                    <span className="w-fit mb-2 px-3 py-1 rounded-full bg-white/20 text-white border border-white/30 backdrop-blur-sm text-xs font-medium">
                        Uganda Climate Calendar
                    </span>
                    <h1 className="font-heading text-3xl md:text-4xl font-bold text-white">Seasonal Calendars</h1>
                    <p className="text-sm md:text-base text-white/85 mt-2 max-w-3xl">
                        Plan planting, growing, and harvesting windows for Coffee, Maize, Beans, and Hass Avocado across
                        Uganda&rsquo;s rainy and dry seasons. Includes agro-ecological zone guidance and pest &amp; disease risk windows.
                    </p>
                </div>
            </div>

            {/* Overview: Season cards */}
            <section>
                <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground mb-4">Uganda&rsquo;s Four Annual Seasons</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { title: 'Long Rains', months: 'March – May', icon: <Droplets className="h-5 w-5" />, color: 'from-emerald-500/20 to-emerald-500/5', text: 'text-emerald-700 dark:text-emerald-400', desc: 'Main planting window for maize and beans across most agro-ecological zones.' },
                        { title: 'Main Dry', months: 'June – August', icon: <Sun className="h-5 w-5" />, color: 'from-amber-500/20 to-amber-500/5', text: 'text-amber-700 dark:text-amber-400', desc: 'Harvest maize, manage coffee pruning, irrigate Hass Avocado orchards.' },
                        { title: 'Short Rains', months: 'October – December', icon: <Droplets className="h-5 w-5" />, color: 'from-sky-500/20 to-sky-500/5', text: 'text-sky-700 dark:text-sky-400', desc: 'Second planting season for beans; coffee main harvesting begins.' },
                        { title: 'Short Dry', months: 'January – February', icon: <Sun className="h-5 w-5" />, color: 'from-orange-500/20 to-orange-500/5', text: 'text-orange-700 dark:text-orange-400', desc: 'Land preparation, soil moisture conservation, nursery activities.' },
                    ].map((s) => (
                        <Card key={s.title} className={`backdrop-blur-md bg-card/70 border border-border/40 shadow-md bg-gradient-to-br ${s.color}`}>
                            <CardHeader className="pb-2">
                                <div className={`flex items-center gap-2 ${s.text}`}>
                                    {s.icon}
                                    <CardTitle className="text-base">{s.title}</CardTitle>
                                </div>
                                <p className="text-sm font-medium text-foreground/80">{s.months}</p>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </section>

            {/* Filter bar */}
            <Card className="backdrop-blur-md bg-card/70 border border-border/40 shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Filter className="h-4 w-4" />
                            <span className="font-medium">Filters</span>
                            {activeFilterCount > 0 && (
                                <Badge variant="secondary" className="text-xs">{activeFilterCount} active</Badge>
                            )}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 flex-1">
                            <Select value={filterCrop} onValueChange={(v) => { setFilterCrop(v); setListPage(1); setPestRiskWindowsPage(1); }}>
                                <SelectTrigger className="w-full sm:w-44">
                                    <SelectValue placeholder="Crop" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CROPS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filterSeason} onValueChange={(v) => { setFilterSeason(v); setListPage(1); setPestRiskWindowsPage(1); }}>
                                <SelectTrigger className="w-full sm:w-44">
                                    <SelectValue placeholder="Season" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SEASONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <Select value={filterZone} onValueChange={(v) => { setFilterZone(v); setListPage(1); setPestRiskWindowsPage(1); }}>
                                <SelectTrigger className="w-full sm:w-44">
                                    <SelectValue placeholder="Zone" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ZONES.map((z) => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {activeFilterCount > 0 && (
                            <button onClick={handleResetFilters} className="text-xs text-primary hover:underline whitespace-nowrap">
                                Reset filters
                            </button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Main content: Tabs for Calendars and Pest Risk */}
            <Tabs defaultValue="calendars" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="calendars" className="gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Planting &amp; Harvest Windows
                    </TabsTrigger>
                    <TabsTrigger value="pest-risk" className="gap-1.5">
                        <Bug className="h-4 w-4" />
                        Pest &amp; Disease Risk
                    </TabsTrigger>
                </TabsList>

                {/* Calendars tab */}
                <TabsContent value="calendars" className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground">Planting &amp; Harvest Windows by Crop</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Drawn from NARO &amp; MAAIF seasonal advisories.
                                {listTotal > 0 && <span className="ml-1 text-muted-foreground/70">({listTotal} records)</span>}
                            </p>
                        </div>
                    </div>

                    {loadingList ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Card key={i} className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md">
                                    <CardHeader>
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-3 w-48 mt-1" />
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="grid grid-cols-3 gap-2">
                                            <Skeleton className="h-14 w-full rounded-md" />
                                            <Skeleton className="h-14 w-full rounded-md" />
                                            <Skeleton className="h-14 w-full rounded-md" />
                                        </div>
                                        <Skeleton className="h-5 w-full rounded" />
                                        <Skeleton className="h-5 w-full rounded" />
                                        <Skeleton className="h-5 w-full rounded" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : list.length === 0 ? (
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md">
                            <CardContent className="p-8 text-center">
                                <Calendar className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                <p className="text-muted-foreground">No seasonal calendar data is currently available.</p>
                                {activeFilterCount > 0 && (
                                    <button onClick={handleResetFilters} className="mt-2 text-sm text-primary hover:underline">
                                        Clear filters to see all data
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {list.map((row) => (
                                    <CalendarCard key={row.id} row={row} />
                                ))}
                            </div>
                            {listTotal > listLimit && (
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        Page {listPage} of {Math.ceil(listTotal / listLimit)}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={listPage <= 1}
                                            onClick={() => setListPage((p) => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={listPage >= Math.ceil(listTotal / listLimit)}
                                            onClick={() => setListPage((p) => p + 1)}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                {/* Pest risk tab */}
                <TabsContent value="pest-risk" className="space-y-4">
                    <div className="flex items-end justify-between">
                        <div>
                            <h2 className="font-heading text-xl md:text-2xl font-semibold text-foreground">Seasonal Pest &amp; Disease Risk Windows</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Critical vulnerable periods &mdash; scout, monitor, and act on time.
                                {pestRiskWindowsTotal > 0 && <span className="ml-1 text-muted-foreground/70">({pestRiskWindowsTotal} records)</span>}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 text-xs">
                            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-red-500" /> High</span>
                            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" /> Medium</span>
                            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" /> Low</span>
                        </div>
                    </div>

                    {loadingPestRiskWindows ? (
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md">
                            <CardContent className="p-6 space-y-3">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <Skeleton key={i} className="h-10 w-full rounded" />
                                ))}
                            </CardContent>
                        </Card>
                    ) : pestRiskWindows.length === 0 ? (
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 shadow-md">
                            <CardContent className="p-8 text-center">
                                <Bug className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                                <p className="text-muted-foreground">No pest &amp; disease risk windows are currently published.</p>
                                {activeFilterCount > 0 && (
                                    <button onClick={handleResetFilters} className="mt-2 text-sm text-primary hover:underline">
                                        Clear filters to see all data
                                    </button>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card className="backdrop-blur-md bg-card/70 border border-border/40 shadow-md overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Crop</TableHead>
                                            <TableHead>Pest / Disease</TableHead>
                                            <TableHead>Risk Window</TableHead>
                                            <TableHead>Season</TableHead>
                                            <TableHead>Zone</TableHead>
                                            <TableHead>Risk Level</TableHead>
                                            <TableHead>Triggers</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pestRiskWindows.map((row, idx) => {
                                            const level = (row.risk_level ?? '').toLowerCase();
                                            const levelClass = RISK_LEVEL_STYLES[level] ?? 'bg-muted text-muted-foreground border-border';
                                            return (
                                                <TableRow key={row.id ?? idx}>
                                                    <TableCell className="font-medium">{row.crop ?? '—'}</TableCell>
                                                    <TableCell>{row.pest_name ?? '—'}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{row.risk_start_month ?? '—'} &rarr; {row.risk_end_month ?? '—'}</TableCell>
                                                    <TableCell className="text-muted-foreground">{row.season ?? '—'}</TableCell>
                                                    <TableCell className="text-muted-foreground">{row.agro_ecological_zone ?? '—'}</TableCell>
                                                    <TableCell>
                                                        <Badge className={`border ${levelClass}`}>
                                                            {row.risk_level ?? '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-muted-foreground text-xs max-w-[200px]">{row.trigger_conditions ?? '—'}</TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </Card>
                            {pestRiskWindowsTotal > pestRiskWindowsLimit && (
                                <div className="flex items-center justify-between pt-2">
                                    <p className="text-sm text-muted-foreground">
                                        Page {pestRiskWindowsPage} of {Math.ceil(pestRiskWindowsTotal / pestRiskWindowsLimit)}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pestRiskWindowsPage <= 1}
                                            onClick={() => setPestRiskWindowsPage((p) => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                            Previous
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={pestRiskWindowsPage >= Math.ceil(pestRiskWindowsTotal / pestRiskWindowsLimit)}
                                            onClick={() => setPestRiskWindowsPage((p) => p + 1)}
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>

            {/* Footer CTA strip */}
            <Card className="backdrop-blur-md bg-primary/5 border border-primary/20 shadow-md">
                <CardContent className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="font-heading text-lg font-semibold text-foreground">Need crop-specific guidance?</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Sign in to receive personalised seasonal advisories, pest alerts, and farm-specific recommendations from extension workers.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-md bg-transparent border border-primary text-primary font-medium shadow-[0_0_12px_theme(colors.primary.DEFAULT/0.4)] hover:shadow-[0_0_18px_theme(colors.primary.DEFAULT/0.6)] transition-all duration-200"
                        >
                            Sign In <ChevronRight className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/signup')}
                            className="inline-flex items-center justify-center px-5 py-2 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors duration-200"
                        >
                            Create Account
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
