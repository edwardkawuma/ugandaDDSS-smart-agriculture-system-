import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    nationalStatisticsService,
    type NationalStatisticsProductionParams,
    type NationalStatisticsProductionResponse,
    type NationalStatisticsTrendsParams,
    type NationalStatisticsTrendsResponse,
} from '@/lib/api/nationalStatisticsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
    BarChart3,
    TrendingUp,
    Wheat,
    MapPin,
    Filter,
    RefreshCw,
    Target,
    ChevronLeft,
    ChevronRight,
    Activity,
    Globe,
    Leaf,
    ArrowUpRight,
    ArrowDownRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Production = NationalStatisticsProductionResponse['data'][number];
type Trend = NationalStatisticsTrendsResponse['data'][number];

const CROPS = ['Coffee', 'Maize', 'Beans', 'Hass Avocado'];
const SEASONS = ['Season A', 'Season B'];
const AGRO_ZONES = ['Lake Victoria Crescent', 'Southwest Highlands', 'Eastern Highlands', 'Northern Savannah', 'Semi-Arid Northeast'];
const DISTRICTS = [
    'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbale', 'Soroti', 'Gulu', 'Arua',
    'Mbarara', 'Kabale', 'Fort Portal', 'Kasese', 'Masaka', 'Lira', 'Moroto',
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - i);

export default function NationalStatistics() {
    const navigate = useNavigate();


    // List state — GET /national-statistics/production
    const [production, setProduction] = useState<Production[]>([]);
    const [loadingProduction, setLoadingProduction] = useState(true);
    const [productionPage, setProductionPage] = useState(1);
    const [productionLimit] = useState(10);
    const [productionTotal, setProductionTotal] = useState(0);
    // List state — GET /national-statistics/trends
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(true);
    const [trendsPage, setTrendsPage] = useState(1);
    const [trendsLimit] = useState(10);
    const [trendsTotal, setTrendsTotal] = useState(0);

    // Filter state — production
    const [filterCrop, setFilterCrop] = useState<string>('');
    const [filterDistrict, setFilterDistrict] = useState<string>('');
    const [filterZone, setFilterZone] = useState<string>('');
    const [filterSeason, setFilterSeason] = useState<string>('');
    const [filterYear, setFilterYear] = useState<string>('');

    // Filter state — trends
    const [trendCrop, setTrendCrop] = useState<string>('');
    const [trendDistrict, setTrendDistrict] = useState<string>('');
    const [trendFromYear, setTrendFromYear] = useState<string>('');
    const [trendToYear, setTrendToYear] = useState<string>('');

    // Active tab
    const [activeTab, setActiveTab] = useState<string>('production');

    useEffect(() => { void loadProduction(); }, [productionPage]);
    useEffect(() => { void loadTrends(); }, [trendsPage]);

    async function loadProduction() {
        try {
            setLoadingProduction(true);
            const params: NationalStatisticsProductionParams = { page: productionPage, limit: productionLimit };
            if (filterCrop) params.crop = filterCrop;
            if (filterDistrict) params.district = filterDistrict;
            if (filterZone) params.agro_ecological_zone = filterZone;
            if (filterSeason) params.season = filterSeason;
            if (filterYear) params.year = Number(filterYear);
            const res = await nationalStatisticsService.production(params);
            setProduction(Array.isArray(res?.data) ? res.data : []);
            setProductionTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load production');
            console.error('[loadProduction]', err);
        } finally {
            setLoadingProduction(false);
        }
    }
    async function loadTrends() {
        try {
            setLoadingTrends(true);
            const params: NationalStatisticsTrendsParams = { page: trendsPage, limit: trendsLimit };
            if (trendCrop) params.crop = trendCrop;
            if (trendDistrict) params.district = trendDistrict;
            if (trendFromYear) params.from_year = Number(trendFromYear);
            if (trendToYear) params.to_year = Number(trendToYear);
            const res = await nationalStatisticsService.trends(params);
            setTrends(Array.isArray(res?.data) ? res.data : []);
            setTrendsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load trends');
            console.error('[loadTrends]', err);
        } finally {
            setLoadingTrends(false);
        }
    }

    function handleApplyProductionFilters() {
        setProductionPage(1);
        void loadProduction();
    }

    function handleApplyTrendFilters() {
        setTrendsPage(1);
        void loadTrends();
    }

    async function handleResetProductionFilters() {
        setFilterCrop('');
        setFilterDistrict('');
        setFilterZone('');
        setFilterSeason('');
        setFilterYear('');
        setProductionPage(1);
        try {
            setLoadingProduction(true);
            const res = await nationalStatisticsService.production({ page: 1, limit: productionLimit });
            setProduction(Array.isArray(res?.data) ? res.data : []);
            setProductionTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load production');
            console.error('[handleResetProductionFilters]', err);
        } finally {
            setLoadingProduction(false);
        }
    }

    async function handleResetTrendFilters() {
        setTrendCrop('');
        setTrendDistrict('');
        setTrendFromYear('');
        setTrendToYear('');
        setTrendsPage(1);
        try {
            setLoadingTrends(true);
            const res = await nationalStatisticsService.trends({ page: 1, limit: trendsLimit });
            setTrends(Array.isArray(res?.data) ? res.data : []);
            setTrendsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load trends');
            console.error('[handleResetTrendFilters]', err);
        } finally {
            setLoadingTrends(false);
        }
    }

    const productionTotalPages = Math.ceil(productionTotal / productionLimit) || 1;
    const trendsTotalPages = Math.ceil(trendsTotal / trendsLimit) || 1;

    // Derived summary stats from production data
    const totalProductionMt = production.reduce((sum, r) => sum + (r.production_volume_mt ?? 0), 0);
    const totalAreaHa = production.reduce((sum, r) => sum + (r.area_hectares ?? 0), 0);
    const avgYield = production.length
        ? production.reduce((sum, r) => sum + (r.yield_kg_per_ha ?? 0), 0) / production.length
        : 0;
    const avgTargetAchievement = trends.length
        ? trends.reduce((sum, r) => sum + (r.target_achievement_pct ?? 0), 0) / trends.length
        : 0;

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: National Statistics
        DESCRIPTION: Provides MAAIF Officials with comprehensive national agricultural production statistics aggregated from MAAIF and UBOS annual surveys and real-time farmer registry data, enabling evidence-based policy decisions and official reporting to Parliament and Cabinet. Displays crop production volumes, area under cultivation, yield per hectare, regional district comparisons, and year-over-year trends for Coffee, Maize, Beans, and Hass Avocado. Officials can filter all views by crop, district, agro-ecological zone, season, and year, and compare current performance against national food security targets and Uganda's Agricultural Sector Strategic Plan benchmarks.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - production (array)              — list data, auto-loaded on mount and on productionPage change
          - loadingProduction (boolean)
          - productionPage / setProductionPage  — pagination state
          - productionTotal (number)         — total record count for pagination UI
          - loadProduction() — call to reload the list
          - trends (array)              — list data, auto-loaded on mount and on trendsPage change
          - loadingTrends (boolean)
          - trendsPage / setTrendsPage  — pagination state
          - trendsTotal (number)         — total record count for pagination UI
          - loadTrends() — call to reload the list

        UI GUIDELINES (pick what fits the page best):
          - Choose any display that fits the data: table, cards, kanban, list, hero+grid, split-pane, timeline, etc.
          - Create/edit forms should live inside a <Dialog> or <Sheet> opened by a button — not statically inline on the page
          - Show loading skeletons or spinners while loading flags are true, and a friendly empty state when arrays are empty
          - Free to add local UI state (search text, selected tab, filter, sort, hover, etc.), derived values, and small helper components
          - Free to add utility imports (icons from lucide-react, shadcn/ui primitives, date/format helpers, cn, toast, etc.)

        HARD RULES (project conventions — these MUST hold):
          - Do NOT inline arrays as the data source for list views — always read from the state above
          - Do NOT call apiService directly or import a new {entity}Service — the services already imported above are the only data source
          - Do NOT build GLOBAL navigation chrome on this page: no top header / navbar / top-nav, no sidebar, no global search bar, and no cart / wishlist / account / profile / sign-in nav icons. The AppLayout already renders all of that on EVERY page — duplicating it produces two stacked headers. Build ONLY this page's own content (page-local filters, this page's action buttons, row/card links, dialogs).
    ----- end hints ----- */
    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen bg-background">
            {/* Page Header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 shadow-[0_0_12px_rgba(var(--primary-rgb),0.15)]">
                        <BarChart3 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                            National Statistics
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Uganda Agricultural Production &amp; Food Security Intelligence Hub
                        </p>
                    </div>
                </div>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Total Production */}
                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 ease-out hover:shadow-lg">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                            <Wheat className="w-5 h-5 text-amber-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Production</p>
                            {loadingProduction ? (
                                <Skeleton className="h-7 w-28" />
                            ) : (
                                <p className="font-heading text-2xl font-bold text-foreground">
                                    {totalProductionMt.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">MT</span>
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Metric tonnes (current filter)</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Area Under Cultivation */}
                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 ease-out hover:shadow-lg">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-2 rounded-md bg-green-500/10 border border-green-500/20">
                            <Leaf className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Area Cultivated</p>
                            {loadingProduction ? (
                                <Skeleton className="h-7 w-28" />
                            ) : (
                                <p className="font-heading text-2xl font-bold text-foreground">
                                    {totalAreaHa.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">Ha</span>
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Hectares under cultivation</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Average Yield */}
                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 ease-out hover:shadow-lg">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
                            <Activity className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Avg Yield</p>
                            {loadingProduction ? (
                                <Skeleton className="h-7 w-28" />
                            ) : (
                                <p className="font-heading text-2xl font-bold text-foreground">
                                    {avgYield.toFixed(0)} <span className="text-sm font-normal text-muted-foreground">kg/Ha</span>
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Average yield per hectare</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Target Achievement */}
                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 ease-out hover:shadow-lg">
                    <CardContent className="p-5 flex items-start gap-4">
                        <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Target Achievement</p>
                            {loadingTrends ? (
                                <Skeleton className="h-7 w-28" />
                            ) : (
                                <p className="font-heading text-2xl font-bold text-foreground">
                                    {avgTargetAchievement.toFixed(1)} <span className="text-sm font-normal text-muted-foreground">%</span>
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">Avg food security target</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="bg-card/60 border border-border/40 backdrop-blur-md rounded-lg p-1 gap-1">
                    <TabsTrigger value="production" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200">
                        <BarChart3 className="w-4 h-4" />
                        <span>Production Data</span>
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all duration-200">
                        <TrendingUp className="w-4 h-4" />
                        <span>Year-over-Year Trends</span>
                    </TabsTrigger>
                </TabsList>

                {/* ── PRODUCTION TAB ── */}
                <TabsContent value="production" className="space-y-4">
                    {/* Production Filters */}
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <CardTitle className="font-heading text-base flex items-center gap-2 text-foreground">
                                <Filter className="w-4 h-4 text-primary" />
                                Filter Production Data
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                {/* Crop */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">Crop</label>
                                    <Select value={filterCrop} onValueChange={setFilterCrop}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All crops" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All crops</SelectItem>
                                            {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* District */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">District</label>
                                    <Select value={filterDistrict} onValueChange={setFilterDistrict}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All districts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All districts</SelectItem>
                                            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Agro-Ecological Zone */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">Agro-Ecological Zone</label>
                                    <Select value={filterZone} onValueChange={setFilterZone}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All zones" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All zones</SelectItem>
                                            {AGRO_ZONES.map(z => <SelectItem key={z} value={z}>{z}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Season */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">Season</label>
                                    <Select value={filterSeason} onValueChange={setFilterSeason}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All seasons" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All seasons</SelectItem>
                                            {SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Year */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">Year</label>
                                    <Select value={filterYear} onValueChange={setFilterYear}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All years" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All years</SelectItem>
                                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    onClick={handleApplyProductionFilters}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.25)] hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                                >
                                    Apply Filters
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleResetProductionFilters}
                                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Production Table */}
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md overflow-hidden">
                        <CardHeader className="pb-3 pt-4 px-5 flex flex-row items-center justify-between">
                            <CardTitle className="font-heading text-base flex items-center gap-2 text-foreground">
                                <Globe className="w-4 h-4 text-primary" />
                                Crop Production Records
                                {!loadingProduction && (
                                    <Badge variant="secondary" className="ml-1 text-xs font-normal">
                                        {productionTotal.toLocaleString()} records
                                    </Badge>
                                )}
                            </CardTitle>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => { setProductionPage(1); void loadProduction(); }}
                                disabled={loadingProduction}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <RefreshCw className={cn("w-3.5 h-3.5", loadingProduction && "animate-spin")} />
                            </Button>
                        </CardHeader>
                        <CardContent className="px-0 pb-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/40 bg-muted/30 hover:bg-muted/30">
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Crop</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">District</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">Zone</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Season</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Production (MT)</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right hidden lg:table-cell">Area (Ha)</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right hidden lg:table-cell">Yield (kg/Ha)</TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden xl:table-cell">Source</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingProduction ? (
                                            Array.from({ length: 6 }).map((_, i) => (
                                                <TableRow key={i} className="border-border/30">
                                                    {Array.from({ length: 9 }).map((__, j) => (
                                                        <TableCell key={j}>
                                                            <Skeleton className="h-4 w-full" />
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : production.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={9} className="h-40 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                        <BarChart3 className="w-10 h-10 opacity-30" />
                                                        <p className="text-sm font-medium">No production records found</p>
                                                        <p className="text-xs opacity-70">Try adjusting your filters</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            production.map((row, idx) => (
                                                <TableRow
                                                    key={row.id ?? idx}
                                                    className="border-border/30 hover:bg-muted/20 transition-colors duration-150"
                                                >
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary bg-primary/5">
                                                            {row.crop ?? '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium text-foreground">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                                            {row.district ?? '—'}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell max-w-[160px] truncate">
                                                        {row.agro_ecological_zone ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                                                        {row.season ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {row.year ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm font-semibold text-right text-foreground">
                                                        {row.production_volume_mt != null
                                                            ? row.production_volume_mt.toLocaleString()
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-right text-muted-foreground hidden lg:table-cell">
                                                        {row.area_hectares != null
                                                            ? row.area_hectares.toLocaleString()
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-right text-muted-foreground hidden lg:table-cell">
                                                        {row.yield_kg_per_ha != null
                                                            ? row.yield_kg_per_ha.toLocaleString()
                                                            : '—'}
                                                    </TableCell>
                                                    <TableCell className="text-xs text-muted-foreground hidden xl:table-cell max-w-[120px] truncate">
                                                        {row.source ?? '—'}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>

                            {/* Production Pagination */}
                            {!loadingProduction && productionTotal > productionLimit && (
                                <div className="flex items-center justify-between px-5 py-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page <span className="font-medium text-foreground">{productionPage}</span> of{' '}
                                        <span className="font-medium text-foreground">{productionTotalPages}</span>
                                        {' '}· {productionTotal.toLocaleString()} total records
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setProductionPage(p => Math.max(1, p - 1))}
                                            disabled={productionPage <= 1}
                                            className="h-8 w-8 p-0 border-border/40"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setProductionPage(p => Math.min(productionTotalPages, p + 1))}
                                            disabled={productionPage >= productionTotalPages}
                                            className="h-8 w-8 p-0 border-border/40"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── TRENDS TAB ── */}
                <TabsContent value="trends" className="space-y-4">
                    {/* Trends Filters */}
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 pt-4 px-5">
                            <CardTitle className="font-heading text-base flex items-center gap-2 text-foreground">
                                <Filter className="w-4 h-4 text-primary" />
                                Filter Year-over-Year Trends
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-5 pb-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                {/* Crop */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">Crop</label>
                                    <Select value={trendCrop} onValueChange={setTrendCrop}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All crops" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All crops</SelectItem>
                                            {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* District */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">District</label>
                                    <Select value={trendDistrict} onValueChange={setTrendDistrict}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="All districts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">All districts</SelectItem>
                                            {DISTRICTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* From Year */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">From Year</label>
                                    <Select value={trendFromYear} onValueChange={setTrendFromYear}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="Start year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">Start year</SelectItem>
                                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* To Year */}
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground font-medium">To Year</label>
                                    <Select value={trendToYear} onValueChange={setTrendToYear}>
                                        <SelectTrigger className="bg-background/60 border-border/50 h-9 text-sm">
                                            <SelectValue placeholder="End year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="">End year</SelectItem>
                                            {YEARS.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button
                                    size="sm"
                                    onClick={handleApplyTrendFilters}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary-rgb),0.25)] hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                                >
                                    Apply Filters
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={handleResetTrendFilters}
                                    className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                                >
                                    <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                                    Reset
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Trends Cards Grid */}
                    {loadingTrends ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Card key={i} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                                    <CardContent className="p-5 space-y-3">
                                        <Skeleton className="h-5 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                        <div className="grid grid-cols-3 gap-3">
                                            <Skeleton className="h-12" />
                                            <Skeleton className="h-12" />
                                            <Skeleton className="h-12" />
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : trends.length === 0 ? (
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                            <CardContent className="h-48 flex flex-col items-center justify-center gap-3 text-muted-foreground">
                                <TrendingUp className="w-10 h-10 opacity-30" />
                                <p className="text-sm font-medium">No trend data found</p>
                                <p className="text-xs opacity-70">Adjust the filters to see year-over-year data</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {trends.map((row, idx) => {
                                    const isAboveTarget = (row.target_achievement_pct ?? 0) >= 100;
                                    return (
                                        <Card
                                            key={idx}
                                            className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 ease-out hover:shadow-lg hover:border-border/60"
                                        >
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary bg-primary/5">
                                                            {row.crop ?? '—'}
                                                        </Badge>
                                                        {row.district && (
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <MapPin className="w-3 h-3" />
                                                                {row.district}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-heading text-lg font-bold text-foreground">
                                                            {row.year ?? '—'}
                                                        </span>
                                                        {isAboveTarget ? (
                                                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="space-y-1 p-3 rounded-md bg-muted/30 border border-border/20">
                                                        <p className="text-xs text-muted-foreground font-medium">Production</p>
                                                        <p className="font-heading text-base font-bold text-foreground leading-tight">
                                                            {row.production_volume_mt != null
                                                                ? `${row.production_volume_mt.toLocaleString()} MT`
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 p-3 rounded-md bg-muted/30 border border-border/20">
                                                        <p className="text-xs text-muted-foreground font-medium">Yield</p>
                                                        <p className="font-heading text-base font-bold text-foreground leading-tight">
                                                            {row.yield_kg_per_ha != null
                                                                ? `${row.yield_kg_per_ha.toLocaleString()} kg/Ha`
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                    <div className="space-y-1 p-3 rounded-md bg-muted/30 border border-border/20">
                                                        <p className="text-xs text-muted-foreground font-medium">Target</p>
                                                        <p className="font-heading text-base font-bold text-foreground leading-tight">
                                                            {row.food_security_target_mt != null
                                                                ? `${row.food_security_target_mt.toLocaleString()} MT`
                                                                : '—'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {row.target_achievement_pct != null && (
                                                    <div className="mt-3 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">Food Security Target Achievement</span>
                                                            <span className={cn(
                                                                "text-xs font-semibold",
                                                                isAboveTarget ? "text-green-500" : "text-amber-500"
                                                            )}>
                                                                {row.target_achievement_pct.toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-muted/40 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className={cn(
                                                                    "h-full rounded-full transition-all duration-500",
                                                                    isAboveTarget
                                                                        ? "bg-green-500"
                                                                        : row.target_achievement_pct >= 75
                                                                        ? "bg-amber-500"
                                                                        : "bg-red-500"
                                                                )}
                                                                style={{ width: `${Math.min(100, row.target_achievement_pct)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {/* Trends Pagination */}
                            {trendsTotal > trendsLimit && (
                                <div className="flex items-center justify-between px-1 py-2">
                                    <p className="text-xs text-muted-foreground">
                                        Page <span className="font-medium text-foreground">{trendsPage}</span> of{' '}
                                        <span className="font-medium text-foreground">{trendsTotalPages}</span>
                                        {' '}· {trendsTotal.toLocaleString()} total records
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTrendsPage(p => Math.max(1, p - 1))}
                                            disabled={trendsPage <= 1}
                                            className="h-8 w-8 p-0 border-border/40"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setTrendsPage(p => Math.min(trendsTotalPages, p + 1))}
                                            disabled={trendsPage >= trendsTotalPages}
                                            className="h-8 w-8 p-0 border-border/40"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
