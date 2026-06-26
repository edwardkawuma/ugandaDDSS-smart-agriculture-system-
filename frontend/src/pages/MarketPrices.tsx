import { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    marketPricesService,
    type MarketPricesListParams,
    type MarketPricesListResponse,
    type MarketPricesTrendsParams,
    type MarketPricesTrendsResponse,
} from '@/lib/api/marketPricesService';
import {
    cropsService,
    type CropsListParams,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    priceAlertsService,
    type PriceAlertsCreateParams,
    type PriceAlertsCreateResponse,
    type PriceAlertsDeleteParams,
    type PriceAlertsDeleteResponse,
    type PriceAlertsDetailParams,
    type PriceAlertsDetailResponse,
    type PriceAlertsListParams,
    type PriceAlertsListResponse,
    type PriceAlertsUpdateParams,
    type PriceAlertsUpdateResponse,
} from '@/lib/api/priceAlertsService';
import { priceAlertsCreateSchema, priceAlertsUpdateSchema, type PriceAlertsCreateInput, type PriceAlertsUpdateInput } from '@/lib/api/priceAlertsFormSchema';
import { formatCurrency } from '@/lib/formatCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { Skeleton } from '@/components/ui/skeleton';

import { TrendingUp, TrendingDown, Bell, BellPlus, ChevronLeft, ChevronRight, Filter, BarChart3, AlertTriangle, ArrowLeft, Check, ChevronsUpDown, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type MarketPrice = MarketPricesListResponse['data'][number];
type Crop = CropsListResponse['data'][number];
type PriceAlert = PriceAlertsListResponse['data'][number];

export default function MarketPrices() {


    // List state — GET /market-prices/list
    const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
    const [loadingMarketPrices, setLoadingMarketPrices] = useState(true);
    const [marketPricesPage, setMarketPricesPage] = useState(1);
    const [marketPricesLimit] = useState(10);
    const [marketPricesTotal, setMarketPricesTotal] = useState(0);
    // Detail state — GET /market-prices/trends
    const [marketPricesItem, setMarketPricesItem] = useState<MarketPricesTrendsResponse['data'] | null>(null);
    const [loadingMarketPricesItem, setLoadingMarketPricesItem] = useState(false);
    // ↑ MarketPrice is the singular row type
    // List state — GET /crops/list
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [cropsPage, setCropsPage] = useState(1);
    const [cropsLimit] = useState(10);
    const [cropsTotal, setCropsTotal] = useState(0);
    // Edit dialog state — PUT /price-alerts/update
    const [editPriceAlertsTarget, setEditPriceAlertsTarget] = useState<PriceAlert | null>(null);
    // List state — GET /price-alerts/list
    const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
    const [loadingPriceAlerts, setLoadingPriceAlerts] = useState(true);
    const [priceAlertsPage, setPriceAlertsPage] = useState(1);
    const [priceAlertsLimit] = useState(10);
    const [priceAlertsTotal, setPriceAlertsTotal] = useState(0);
    // Detail state — GET /price-alerts/detail
    const [priceAlertsItem, setPriceAlertsItem] = useState<PriceAlertsDetailResponse['data'] | null>(null);
    const [loadingPriceAlertsItem, setLoadingPriceAlertsItem] = useState(false);
    // ↑ PriceAlert is the singular row type
    // Create dialog state — POST /price-alerts/create
    const [createPriceAlertsOpen, setCreatePriceAlertsOpen] = useState(false);

    // Local filter state
    const [filterCrop, setFilterCrop] = useState<string>('all');
    const [filterMarket, setFilterMarket] = useState<string>('');
    const [filterDistrict, setFilterDistrict] = useState<string>('');
    // Trend selection state
    const [trendCrop, setTrendCrop] = useState<string>('');
    const [trendPeriod, setTrendPeriod] = useState<number>(30);
    const [trendData, setTrendData] = useState<MarketPricesTrendsResponse['data'] | null>(null);
    const [loadingTrend, setLoadingTrend] = useState(false);
    // Delete confirmation
    const [deleteAlertTarget, setDeleteAlertTarget] = useState<PriceAlert | null>(null);

    // Reset to page 1 when filters change
    useEffect(() => { setMarketPricesPage(1); }, [filterCrop, filterMarket, filterDistrict]);

    const loadMarketPrices = useCallback(async () => {
        try {
            setLoadingMarketPrices(true);
            const res = await marketPricesService.list({
                page: marketPricesPage,
                limit: marketPricesLimit,
                crop: filterCrop !== 'all' ? filterCrop : undefined,
                market: filterMarket || undefined,
                district: filterDistrict || undefined,
            });
            setMarketPrices(Array.isArray(res?.data) ? res.data : []);
            setMarketPricesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load marketPrices');
            console.error('[loadMarketPrices]', err);
        } finally {
            setLoadingMarketPrices(false);
        }
    }, [marketPricesPage, marketPricesLimit, filterCrop, filterMarket, filterDistrict]);

    useEffect(() => { void loadMarketPrices(); }, [loadMarketPrices]);
    useEffect(() => { void loadCrops(); }, [cropsPage]);
    useEffect(() => { void loadPriceAlerts(); }, [priceAlertsPage]);

    async function loadMarketPricesItem(crop: string, periodDays: number, district?: string) {
        try {
            setLoadingMarketPricesItem(true);
            const res = await marketPricesService.trends({ crop, period_days: periodDays, district });
            setMarketPricesItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadMarketPricesItem]', err);
        } finally {
            setLoadingMarketPricesItem(false);
        }
    }
    async function loadCrops() {
        try {
            setLoadingCrops(true);
            const res = await cropsService.list({ page: cropsPage, limit: cropsLimit });
            setCrops(Array.isArray(res?.data) ? res.data : []);
            setCropsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load crops');
            console.error('[loadCrops]', err);
        } finally {
            setLoadingCrops(false);
        }
    }
    async function handleUpdatePriceAlerts(data: PriceAlertsUpdateParams) {
        try {
            await priceAlertsService.update(data);
            toast.success('Updated');
            setEditPriceAlertsTarget(null);
            void loadPriceAlerts();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdatePriceAlerts]', err);
        }
    }
    async function loadPriceAlerts() {
        try {
            setLoadingPriceAlerts(true);
            const res = await priceAlertsService.list({ page: priceAlertsPage, limit: priceAlertsLimit });
            setPriceAlerts(Array.isArray(res?.data) ? res.data : []);
            setPriceAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load priceAlerts');
            console.error('[loadPriceAlerts]', err);
        } finally {
            setLoadingPriceAlerts(false);
        }
    }
    async function loadPriceAlertsItem(targetId: string) {
        try {
            setLoadingPriceAlertsItem(true);
            const res = await priceAlertsService.detail({ id: targetId });
            setPriceAlertsItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadPriceAlertsItem]', err);
        } finally {
            setLoadingPriceAlertsItem(false);
        }
    }
    async function handleCreatePriceAlerts(data: PriceAlertsCreateParams) {
        try {
            await priceAlertsService.create(data);
            toast.success('Created');
            setCreatePriceAlertsOpen(false);
            void loadPriceAlerts();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreatePriceAlerts]', err);
        }
    }
    async function handleDeletePriceAlerts(params: PriceAlertsDeleteParams) {
        try {
            await priceAlertsService.delete(params);
            toast.success('Deleted');
            void loadPriceAlerts();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeletePriceAlerts]', err);
        }
    }

    async function loadTrends(crop: string, periodDays: number, district?: string) {
        try {
            setLoadingTrend(true);
            const res = await marketPricesService.trends({ crop, period_days: periodDays, district: district || undefined });
            setTrendData(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load price trends');
            console.error('[loadTrends]', err);
        } finally {
            setLoadingTrend(false);
        }
    }

    const filteredPrices = useMemo(() => {
        return marketPrices.filter((p) => {
            if (filterCrop !== 'all' && p.crop !== filterCrop) return false;
            if (filterMarket && !p.market_name?.toLowerCase().includes(filterMarket.toLowerCase())) return false;
            if (filterDistrict && !p.district?.toLowerCase().includes(filterDistrict.toLowerCase())) return false;
            return true;
        });
    }, [marketPrices, filterCrop, filterMarket, filterDistrict]);

    const uniqueCrops = useMemo(() => {
        const set = new Set(marketPrices.map((p) => p.crop).filter(Boolean));
        return Array.from(set) as string[];
    }, [marketPrices]);

    const uniqueMarkets = useMemo(() => {
        const set = new Set(marketPrices.map((p) => p.market_name).filter(Boolean));
        return Array.from(set) as string[];
    }, [marketPrices]);

    const uniqueDistricts = useMemo(() => {
        const set = new Set(marketPrices.map((p) => p.district).filter(Boolean));
        return Array.from(set) as string[];
    }, [marketPrices]);

    function handleTrendSelect(crop: string) {
        setTrendCrop(crop);
        void loadTrends(crop, trendPeriod);
    }

    function handlePeriodChange(days: number) {
        setTrendPeriod(days);
        if (trendCrop) void loadTrends(trendCrop, days);
    }

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: Market Prices
        DESCRIPTION: Displays real-time and historical commodity market prices for Coffee, Maize, Beans, and Hass Avocado across major Ugandan markets and export benchmark prices, helping farmers make informed decisions about when and where to sell their produce. Shows farm-gate versus market price comparisons, 30-day and 90-day price trend charts, regional price variation by district, and export market reference prices for Coffee and Hass Avocado. Farmers can configure price threshold alerts via Twilio SMS so they are notified when prices reach their target selling price without needing to check the platform daily.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - marketPrices (array)              — list data, auto-loaded on mount and on marketPricesPage change
          - loadingMarketPrices (boolean)
          - marketPricesPage / setMarketPricesPage  — pagination state
          - marketPricesTotal (number)         — total record count for pagination UI
          - loadMarketPrices() — call to reload the list
          - marketPricesItem (object or null)  — detail data
          - loadingMarketPricesItem (boolean)
          - loadMarketPricesItem(id: string) — call to (re)load
          - crops (array)              — list data, auto-loaded on mount and on cropsPage change
          - loadingCrops (boolean)
          - cropsPage / setCropsPage  — pagination state
          - cropsTotal (number)         — total record count for pagination UI
          - loadCrops() — call to reload the list
          - editPriceAlertsTarget / setEditPriceAlertsTarget — set to the row being edited; wrap edit form in <Dialog open={!!editPriceAlertsTarget}>
          - handleUpdatePriceAlerts(data: PriceAlertsUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { priceAlertsUpdateSchema } from '@/lib/api/priceAlertsFormSchema' and wire useForm({ resolver: zodResolver(priceAlertsUpdateSchema), values: editPriceAlertsTarget ?? undefined }); submit via handleSubmit.
          - priceAlerts (array)              — list data, auto-loaded on mount and on priceAlertsPage change
          - loadingPriceAlerts (boolean)
          - priceAlertsPage / setPriceAlertsPage  — pagination state
          - priceAlertsTotal (number)         — total record count for pagination UI
          - loadPriceAlerts() — call to reload the list
          - priceAlertsItem (object or null)  — detail data
          - loadingPriceAlertsItem (boolean)
          - loadPriceAlertsItem(id: string) — call to (re)load
          - createPriceAlertsOpen / setCreatePriceAlertsOpen  — wrap the create form in <Dialog open={createPriceAlertsOpen}>
          - handleCreatePriceAlerts(data: PriceAlertsCreateParams) — call from create form submit
          - VALIDATION: import { priceAlertsCreateSchema } from '@/lib/api/priceAlertsFormSchema' and wire useForm({ resolver: zodResolver(priceAlertsCreateSchema) }); it already encodes required fields — submit via handleSubmit so an incomplete form can't POST. Show errors.{field}?.message under each input.
          - handleDeletePriceAlerts(params: PriceAlertsDeleteParams) — call from delete confirmation

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
        <div className="p-6 md:p-8 space-y-8">
            {/* Page Title */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Market Prices</h1>
                <p className="text-muted-foreground mt-1">
                    Real-time and historical commodity prices for Coffee, Maize, Beans, and Hass Avocado across Ugandan markets.
                </p>
            </div>

            {/* Filters + Price Table */}
            <Card className="backdrop-blur-sm bg-card/80 border border-white/10 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Current Market Prices
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-3">
                            <Select value={filterCrop} onValueChange={setFilterCrop}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="All Crops" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Crops</SelectItem>
                                    {uniqueCrops.map((c) => (
                                        <SelectItem key={c} value={c}>{c}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Filter by market..."
                                value={filterMarket}
                                onChange={(e) => setFilterMarket(e.target.value)}
                                className="w-[170px]"
                            />
                            <Input
                                placeholder="Filter by district..."
                                value={filterDistrict}
                                onChange={(e) => setFilterDistrict(e.target.value)}
                                className="w-[170px]"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingMarketPrices ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-md" />
                            ))}
                        </div>
                    ) : filteredPrices.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Filter className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-lg font-medium">No market prices found</p>
                            <p className="text-sm mt-1">Try adjusting your filters or check back later.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Crop</TableHead>
                                            <TableHead>Market</TableHead>
                                            <TableHead>District</TableHead>
                                            <TableHead className="text-right">Farm-Gate Price</TableHead>
                                            <TableHead className="text-right">Market Price</TableHead>
                                            <TableHead className="text-right">Export Price</TableHead>
                                            <TableHead>Unit</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-center">Trend</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredPrices.map((row, idx) => (
                                            <TableRow key={row.id ?? idx}>
                                                <TableCell className="font-medium">{row.crop ?? '-'}</TableCell>
                                                <TableCell>{row.market_name ?? '-'}</TableCell>
                                                <TableCell>{row.district ?? '-'}</TableCell>
                                                <TableCell className="text-right">{row.farm_gate_price != null ? formatCurrency(row.farm_gate_price) : '-'}</TableCell>
                                                <TableCell className="text-right font-semibold">{row.market_price != null ? formatCurrency(row.market_price) : '-'}</TableCell>
                                                <TableCell className="text-right">{row.export_price != null ? formatCurrency(row.export_price) : '-'}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{row.unit ?? '-'}</TableCell>
                                                <TableCell className="text-muted-foreground text-sm">{row.recorded_date ?? '-'}</TableCell>
                                                <TableCell className="text-center">
                                                    {row.market_price != null && row.farm_gate_price != null ? (
                                                        row.market_price >= row.farm_gate_price ? (
                                                            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
                                                                <TrendingUp className="h-3 w-3 mr-1" />+
                                                                {(((row.market_price - row.farm_gate_price) / row.farm_gate_price) * 100).toFixed(1)}%
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
                                                                <TrendingDown className="h-3 w-3 mr-1" />
                                                                {(((row.farm_gate_price - row.market_price) / row.farm_gate_price) * 100).toFixed(1)}%
                                                            </Badge>
                                                        )
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Pagination */}
                            <div className="flex items-center justify-between mt-4 pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing {filteredPrices.length} of {marketPricesTotal} results
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={marketPricesPage <= 1}
                                        onClick={() => setMarketPricesPage((p) => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium px-2">Page {marketPricesPage}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={marketPrices.length < marketPricesLimit}
                                        onClick={() => setMarketPricesPage((p) => p + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Price Trends Section */}
            <Card className="backdrop-blur-sm bg-card/80 border border-white/10 shadow-lg">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Price Trends
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-3">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={false}
                                        className="w-[200px] justify-between font-normal"
                                    >
                                        {trendCrop ? (
                                            <span>{trendCrop}</span>
                                        ) : (
                                            <span className="text-muted-foreground">Select crop...</span>
                                        )}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[260px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search crops..." />
                                        <CommandList>
                                            <CommandEmpty>No crops found.</CommandEmpty>
                                            <CommandGroup>
                                                {(crops.length > 0 ? crops.map((c) => c.name).filter(Boolean) as string[] : (uniqueCrops.length > 0 ? uniqueCrops : ['Coffee', 'Maize', 'Beans', 'Hass Avocado'])).map((name) => (
                                                    <CommandItem
                                                        key={name}
                                                        value={name}
                                                        onSelect={() => handleTrendSelect(name)}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', trendCrop === name ? 'opacity-100' : 'opacity-0')} />
                                                        {name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant={trendPeriod === 30 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePeriodChange(30)}
                                >
                                    30 Days
                                </Button>
                                <Button
                                    variant={trendPeriod === 90 ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => handlePeriodChange(90)}
                                >
                                    90 Days
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {!trendCrop ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-lg font-medium">Select a crop to view price trends</p>
                            <p className="text-sm mt-1">Choose a commodity above to see {trendPeriod}-day price movement.</p>
                        </div>
                    ) : loadingTrend ? (
                        <div className="space-y-3">
                            <Skeleton className="h-40 w-full rounded-md" />
                            <div className="flex gap-4">
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-24" />
                                <Skeleton className="h-8 w-24" />
                            </div>
                        </div>
                    ) : trendData ? (
                        <div className="space-y-6">
                            {/* Summary stats */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Min Price</p>
                                    <p className="text-xl font-bold">{trendData.price_min != null ? formatCurrency(trendData.price_min) : '-'}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Max Price</p>
                                    <p className="text-xl font-bold">{trendData.price_max != null ? formatCurrency(trendData.price_max) : '-'}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Avg Price</p>
                                    <p className="text-xl font-bold">{trendData.price_avg != null ? formatCurrency(trendData.price_avg) : '-'}</p>
                                </div>
                                <div className="rounded-lg bg-muted/50 p-4">
                                    <p className="text-sm text-muted-foreground">Change</p>
                                    <p className={cn(
                                        'text-xl font-bold',
                                        (trendData.price_change_pct ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                    )}>
                                        {trendData.price_change_pct != null ? (
                                            <>
                                                {(trendData.price_change_pct >= 0 ? '+' : '') + trendData.price_change_pct.toFixed(1)}%
                                            </>
                                        ) : '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Mini bar chart using divs */}
                            {trendData.trend_data && trendData.trend_data.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-3">Price Movement</p>
                                    <div className="flex items-end gap-1 h-40">
                                        {trendData.trend_data.map((point, idx) => {
                                            const price = point.price ?? 0;
                                            const min = trendData.price_min ?? 0;
                                            const max = trendData.price_max ?? 1;
                                            const range = max - min || 1;
                                            const heightPct = ((price - min) / range) * 100;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex-1 flex flex-col items-center gap-1 group"
                                                >
                                                    <div className="text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity bg-popover px-1 py-0.5 rounded shadow">
                                                        {formatCurrency(price)}
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'w-full rounded-t-sm transition-all min-h-[4px]',
                                                            price >= (trendData.price_avg ?? 0)
                                                                ? 'bg-green-500/70'
                                                                : 'bg-amber-500/70'
                                                        )}
                                                        style={{ height: `${Math.max(4, heightPct)}%` }}
                                                    />
                                                    <div className="text-[10px] text-muted-foreground truncate w-full text-center">
                                                        {point.date ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Market breakdown */}
                            {trendData.trend_data && trendData.trend_data.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-2">Markets tracked</p>
                                    <div className="flex flex-wrap gap-2">
                                        {Array.from(new Set(trendData.trend_data.map((p) => p.market).filter(Boolean))).map((m) => (
                                            <Badge key={m} variant="outline">{m}</Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No trend data available for the selected crop.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Price Alerts Section */}
            <Card className="backdrop-blur-sm bg-card/80 border border-white/10 shadow-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Price Alerts
                            {priceAlertsTotal > 0 && (
                                <Badge variant="secondary" className="ml-2">{priceAlertsTotal}</Badge>
                            )}
                        </CardTitle>
                        <Button size="sm" onClick={() => setCreatePriceAlertsOpen(true)}>
                            <BellPlus className="h-4 w-4 mr-2" />
                            New Alert
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingPriceAlerts ? (
                        <div className="space-y-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-16 w-full rounded-md" />
                            ))}
                        </div>
                    ) : priceAlerts.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <Bell className="h-10 w-10 mx-auto mb-3 opacity-40" />
                            <p className="text-lg font-medium">No price alerts configured</p>
                            <p className="text-sm mt-1">Create an alert to get notified when a crop reaches your target price.</p>
                            <Button className="mt-4" onClick={() => setCreatePriceAlertsOpen(true)}>
                                <BellPlus className="h-4 w-4 mr-2" />
                                Create Your First Alert
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {priceAlerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg border',
                                        alert.triggered ? 'bg-green-500/5 border-green-500/20' : 'bg-muted/30'
                                    )}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold">{alert.crop ?? 'Unknown Crop'}</span>
                                            {alert.triggered && (
                                                <Badge className="bg-green-500/15 text-green-600 border-green-500/20">
                                                    <AlertTriangle className="h-3 w-3 mr-1" /> Triggered
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                            <span>Target: <strong className="text-foreground">{formatCurrency(alert.target_price ?? 0)}</strong></span>
                                            <span>Current: <strong className="text-foreground">{formatCurrency(alert.current_price ?? 0)}</strong></span>
                                            {alert.market && <span>Market: {alert.market}</span>}
                                        </div>
                                        <div className="flex items-center gap-3 mt-2">
                                            {alert.sms_enabled != null && (
                                                <Badge variant="outline" className="text-xs">SMS {alert.sms_enabled ? 'ON' : 'OFF'}</Badge>
                                            )}
                                            {alert.email_enabled != null && (
                                                <Badge variant="outline" className="text-xs">Email {alert.email_enabled ? 'ON' : 'OFF'}</Badge>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    aria-label={`Actions for alert ${alert.crop ?? alert.id ?? ''}`}
                                                >
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditPriceAlertsTarget(alert)}>
                                                    <Pencil className="h-4 w-4 mr-2" />
                                                    Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive"
                                                    onClick={() => setDeleteAlertTarget(alert)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                            {/* Pagination for alerts */}
                            {priceAlertsTotal > 10 && (
                                <div className="flex items-center justify-end gap-2 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={priceAlertsPage <= 1}
                                        onClick={() => setPriceAlertsPage((p) => Math.max(1, p - 1))}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-muted-foreground px-2">Page {priceAlertsPage}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={priceAlerts.length < priceAlertsLimit}
                                        onClick={() => setPriceAlertsPage((p) => p + 1)}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Alert Dialog */}
            <CreateAlertDialog
                open={createPriceAlertsOpen}
                onOpenChange={setCreatePriceAlertsOpen}
                crops={crops}
                onSubmit={handleCreatePriceAlerts}
            />

            {/* Edit Alert Dialog */}
            <EditAlertDialog
                target={editPriceAlertsTarget}
                onClose={() => setEditPriceAlertsTarget(null)}
                crops={crops}
                onSubmit={handleUpdatePriceAlerts}
            />

            {/* Delete Alert Confirmation */}
            <AlertDialog open={!!deleteAlertTarget} onOpenChange={(open) => { if (!open) setDeleteAlertTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Price Alert</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete the price alert for <strong>{deleteAlertTarget?.crop}</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deleteAlertTarget?.id) {
                                    void handleDeletePriceAlerts({ id: deleteAlertTarget.id });
                                    setDeleteAlertTarget(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

/* ── Helper: Create Alert Dialog ── */
function CreateAlertDialog({
    open,
    onOpenChange,
    crops,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    crops: Crop[];
    onSubmit: (data: PriceAlertsCreateParams) => void;
}) {
    const form = useForm<PriceAlertsCreateInput>({
        resolver: zodResolver(priceAlertsCreateSchema),
        defaultValues: {
            crop_id: '',
            target_price: undefined as unknown as number,
            market: '',
            sms_enabled: 1,
            email_enabled: 0,
        },
    });

    useEffect(() => {
        if (open) {
            form.reset({
                crop_id: '',
                target_price: undefined as unknown as number,
                market: '',
                sms_enabled: 1,
                email_enabled: 0,
            });
        }
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Create Price Alert</DialogTitle>
                    <DialogDescription>
                        Get notified when a crop reaches your target selling price.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((data) => {
                            onSubmit({
                                crop_id: data.crop_id,
                                target_price: data.target_price,
                                market: data.market ?? '',
                                sms_enabled: data.sms_enabled ? true : false,
                                email_enabled: data.email_enabled ? true : false,
                            });
                        })}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="crop_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Crop</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        'w-full justify-between font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value
                                                        ? crops.find((c) => c.id === field.value)?.name ?? 'Select a crop...'
                                                        : 'Select a crop...'}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search crops..." />
                                                <CommandList>
                                                    <CommandEmpty>No crops found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {crops.map((c) => (
                                                            <CommandItem
                                                                key={c.id}
                                                                value={c.name ?? ''}
                                                                onSelect={() => {
                                                                    field.onChange(c.id);
                                                                }}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', field.value === c.id ? 'opacity-100' : 'opacity-0')} />
                                                                {c.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="target_price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 5000"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="market"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Market (optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Kampala" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-6">
                            <FormField
                                control={form.control}
                                name="sms_enabled"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0">SMS Alerts</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email_enabled"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0">Email Alerts</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Create Alert</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

/* ── Helper: Edit Alert Dialog ── */
function EditAlertDialog({
    target,
    onClose,
    crops,
    onSubmit,
}: {
    target: PriceAlert | null;
    onClose: () => void;
    crops: Crop[];
    onSubmit: (data: PriceAlertsUpdateParams) => void;
}) {
    const form = useForm<PriceAlertsUpdateInput>({
        resolver: zodResolver(priceAlertsUpdateSchema),
        values: target
            ? {
                crop_id: '',
                target_price: target.target_price ?? undefined,
                market: target.market ?? '',
                sms_enabled: target.sms_enabled ? 1 : 0,
                email_enabled: target.email_enabled ? 1 : 0,
            }
            : undefined,
    });

    return (
        <Dialog open={!!target} onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Edit Price Alert</DialogTitle>
                    <DialogDescription>
                        Update your price alert for <strong>{target?.crop}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((data) => {
                            if (!target?.id) return;
                            onSubmit({
                                id: target.id,
                                crop_id: data.crop_id ?? '',
                                target_price: data.target_price ?? 0,
                                market: data.market ?? '',
                                sms_enabled: data.sms_enabled ? true : false,
                                email_enabled: data.email_enabled ? true : false,
                            });
                        })}
                        className="space-y-4"
                    >
                        <FormField
                            control={form.control}
                            name="crop_id"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Crop</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn(
                                                        'w-full justify-between font-normal',
                                                        !field.value && 'text-muted-foreground'
                                                    )}
                                                >
                                                    {field.value
                                                        ? crops.find((c) => c.id === field.value)?.name ?? 'Select a crop...'
                                                        : 'Select a crop...'}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Search crops..." />
                                                <CommandList>
                                                    <CommandEmpty>No crops found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {crops.map((c) => (
                                                            <CommandItem
                                                                key={c.id}
                                                                value={c.name ?? ''}
                                                                onSelect={() => {
                                                                    field.onChange(c.id);
                                                                }}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', field.value === c.id ? 'opacity-100' : 'opacity-0')} />
                                                                {c.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="target_price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Target Price</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            placeholder="e.g. 5000"
                                            {...field}
                                            value={field.value ?? ''}
                                            onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="market"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Market (optional)</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Kampala" {...field} value={field.value ?? ''} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex items-center gap-6">
                            <FormField
                                control={form.control}
                                name="sms_enabled"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0">SMS Alerts</FormLabel>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email_enabled"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2">
                                        <FormControl>
                                            <Switch
                                                checked={!!field.value}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </FormControl>
                                        <FormLabel className="!mt-0">Email Alerts</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit">Save Changes</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
