import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CalendarDays, Check, ChevronsUpDown, Filter, Leaf, RefreshCw, ShieldCheck, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
    recommendationsService,
    type RecommendationsEarlyWarningsParams,
    type RecommendationsEarlyWarningsResponse,
    type RecommendationsListParams,
    type RecommendationsListResponse,
} from '@/lib/api/recommendationsService';
import {
    farmsService,
    type FarmsListParams,
    type FarmsListResponse,
} from '@/lib/api/farmsService';

type List = RecommendationsListResponse['data'][number];
type EarlyWarning = RecommendationsEarlyWarningsResponse['data'][number];
type Farm = FarmsListResponse['data'][number];

export default function CropRecommendations() {


    // List state — GET /recommendations/list
    const [list, setList] = useState<List[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listPage, setListPage] = useState(1);
    const [listLimit] = useState(10);
    const [listTotal, setListTotal] = useState(0);
    // List state — GET /recommendations/early-warnings
    const [earlyWarnings, setEarlyWarnings] = useState<EarlyWarning[]>([]);
    const [loadingEarlyWarnings, setLoadingEarlyWarnings] = useState(true);
    const [earlyWarningsPage, setEarlyWarningsPage] = useState(1);
    const [earlyWarningsLimit] = useState(10);
    const [earlyWarningsTotal, setEarlyWarningsTotal] = useState(0);
    // List state — GET /farms/list (used to populate the farm filter)
    const [farms, setFarms] = useState<Farm[]>([]);

    // Filters
    const [cropFilter, setCropFilter] = useState<string>('all');
    const [farmIdFilter, setFarmIdFilter] = useState<string>('all');

    // Derive crop options from real API data so they stay in sync with recommendations.
    const cropOptions = useMemo(() => {
        const names = new Set<string>();
        list.forEach((item) => {
            if (item.crop) names.add(item.crop);
        });
        earlyWarnings.forEach((item) => {
            if (item.crop) names.add(item.crop);
        });
        return Array.from(names).sort();
    }, [list, earlyWarnings]);

    useEffect(() => { void loadList(); }, [listPage, cropFilter, farmIdFilter]);
    useEffect(() => { void loadEarlyWarnings(); }, [earlyWarningsPage, cropFilter]);
    useEffect(() => { void loadFarms(); }, []);

    async function loadList() {
        try {
            setLoadingList(true);
            const params: RecommendationsListParams = { page: listPage, limit: listLimit };
            if (cropFilter !== 'all') params.crop = cropFilter;
            if (farmIdFilter !== 'all') params.farm_id = farmIdFilter;
            const res = await recommendationsService.list(params);
            setList(Array.isArray(res?.data) ? res.data : []);
            setListTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load list');
            console.error('[loadList]', err);
        } finally {
            setLoadingList(false);
        }
    }
    async function loadEarlyWarnings() {
        try {
            setLoadingEarlyWarnings(true);
            const params: RecommendationsEarlyWarningsParams = { page: earlyWarningsPage, limit: earlyWarningsLimit };
            if (cropFilter !== 'all') params.crop = cropFilter;
            const res = await recommendationsService.earlyWarnings(params);
            setEarlyWarnings(Array.isArray(res?.data) ? res.data : []);
            setEarlyWarningsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load earlyWarnings');
            console.error('[loadEarlyWarnings]', err);
        } finally {
            setLoadingEarlyWarnings(false);
        }
    }
    async function loadFarms() {
        try {
            // Fetch a generous page of farms to power the farm_id filter combobox.
            const params: FarmsListParams = { page: 1, limit: 100 };
            const res = await farmsService.list(params);
            setFarms(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            console.error('[loadFarms]', err);
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="space-y-2">
                    <h1 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight">
                        Crop Recommendations
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        AI-generated agronomic guidance tailored to your registered crops and location.
                        Aligned with NARO and MAAIF seasonal calendars for Coffee, Maize, Beans and Hass Avocado.
                    </p>
                </div>
                <div className="flex items-center gap-3 self-start md:self-auto">
                    <Badge variant="outline" className="gap-1.5">
                        <Sparkles className="h-3.5 w-3.5" />
                        Powered by climate-smart AI
                    </Badge>
                    <Button
                        onClick={() => { void loadList(); void loadEarlyWarnings(); }}
                        className="neon_glow bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                        size="sm"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-emerald-500 bg-card/60 backdrop-blur-md shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Active Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{listTotal}</div>
                        <p className="text-xs text-muted-foreground mt-1">across your crops</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500 bg-card/60 backdrop-blur-md shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Early Warnings</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{earlyWarningsTotal}</div>
                        <p className="text-xs text-muted-foreground mt-1">5–10 day forecast horizon</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-sky-500 bg-card/60 backdrop-blur-md shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Seasons</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm font-medium">March–May</div>
                        <p className="text-xs text-muted-foreground mt-1">and October–December</p>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-violet-500 bg-card/60 backdrop-blur-md shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Crops Covered</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{cropOptions.length}</div>
                        <p className="text-xs text-muted-foreground mt-1 capitalize truncate">
                            {cropOptions.length === 0
                                ? 'Awaiting data'
                                : cropOptions.map((c) => c.replace(/_/g, ' ')).join(', ')}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center flex-wrap">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters</span>
                </div>

                {/* Crop Combobox (backed by real recommendation data) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={false}
                            className="w-[220px] justify-between bg-card/60 backdrop-blur-md border-border/60 font-normal"
                        >
                            <span className="truncate capitalize">
                                {cropFilter === 'all'
                                    ? 'All Crops'
                                    : cropFilter.replace(/_/g, ' ')}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search crop..." />
                            <CommandList>
                                <CommandEmpty>No crop found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="all"
                                        onSelect={() => setCropFilter('all')}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', cropFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                                        All Crops
                                    </CommandItem>
                                    {cropOptions.map((c) => (
                                        <CommandItem
                                            key={c}
                                            value={c}
                                            onSelect={(currentValue) => {
                                                setCropFilter(currentValue === cropFilter ? 'all' : currentValue);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    cropFilter === c ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                            <span className="capitalize">{c.replace(/_/g, ' ')}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {/* Farm Combobox (backed by GET /farms/list) */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={false}
                            className="w-[240px] justify-between bg-card/60 backdrop-blur-md border-border/60 font-normal"
                        >
                            <span className="truncate">
                                {farmIdFilter === 'all'
                                    ? 'All Farms'
                                    : farms.find((f) => f.id === farmIdFilter)?.farm_name ?? 'Selected farm'}
                            </span>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[320px] p-0" align="start">
                        <Command>
                            <CommandInput placeholder="Search farms..." />
                            <CommandList>
                                <CommandEmpty>No farm found.</CommandEmpty>
                                <CommandGroup>
                                    <CommandItem
                                        value="all"
                                        onSelect={() => setFarmIdFilter('all')}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', farmIdFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                                        All Farms
                                    </CommandItem>
                                    {farms.map((f) => (
                                        <CommandItem
                                            key={f.id}
                                            value={f.farm_name ?? f.id ?? ''}
                                            onSelect={() => {
                                                const id = f.id ?? '';
                                                setFarmIdFilter(farmIdFilter === id ? 'all' : id);
                                            }}
                                        >
                                            <Check
                                                className={cn(
                                                    'mr-2 h-4 w-4',
                                                    farmIdFilter === f.id ? 'opacity-100' : 'opacity-0',
                                                )}
                                            />
                                            <div className="flex flex-col">
                                                <span>{f.farm_name ?? `Farm ${f.id}`}</span>
                                                {f.district && (
                                                    <span className="text-xs text-muted-foreground">{f.district}</span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>

                {(cropFilter !== 'all' || farmIdFilter !== 'all') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { setCropFilter('all'); setFarmIdFilter('all'); }}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            <Tabs defaultValue="recommendations" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                    <TabsTrigger value="warnings">Early Warnings</TabsTrigger>
                </TabsList>

                <TabsContent value="recommendations" className="space-y-4">
                    <Card className="bg-card/60 backdrop-blur-md shadow-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="font-heading">Personalized Recommendations</CardTitle>
                            <CardDescription>
                                Each card shows the triggering conditions, confidence score and the NARO/MAAIF guideline it aligns with.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingList ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <Skeleton key={i} className="h-44 w-full" />
                                    ))}
                                </div>
                            ) : list.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
                                    <Leaf className="h-10 w-10 opacity-50" />
                                    <p>No recommendations yet. They will appear once your farm profile is active.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {list.map((item) => {
                                        const type = (item.recommendation_type || 'general').toLowerCase();
                                        const conf = typeof item.confidence_score === 'number' ? item.confidence_score : 0;
                                        const borderCls = conf >= 0.8
                                            ? 'border-l-emerald-500'
                                            : conf >= 0.5
                                                ? 'border-l-amber-500'
                                                : 'border-l-rose-500';
                                        return (
                                            <Card key={item.id} className={`border-l-4 ${borderCls} bg-background/40 backdrop-blur-md shadow-md hover:shadow-xl transition-all duration-200`}>
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <CardTitle className="font-heading text-lg leading-snug">
                                                                {item.title || 'Recommendation'}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {item.crop && (
                                                                    <Badge variant="secondary" className="capitalize">
                                                                        {item.crop}
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="outline" className="capitalize">
                                                                    {type.replace(/_/g, ' ')}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1 shrink-0 min-w-[100px]">
                                                            <span className="text-xs text-muted-foreground">Confidence</span>
                                                            <span className="text-lg font-bold tabular-nums">{Math.round(conf * 100)}%</span>
                                                            <Progress
                                                                value={conf * 100}
                                                                className={`h-2 ${conf >= 0.8 ? '[&>div]:bg-emerald-500' : conf >= 0.5 ? '[&>div]:bg-amber-500' : '[&>div]:bg-rose-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardHeader>
                                                <CardContent className="space-y-3 text-sm">
                                                    <p className="text-foreground/90 leading-relaxed">{item.description}</p>
                                                    {item.triggering_conditions && (
                                                        <div className="rounded-md bg-muted/40 p-3 border border-border/60">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                                                Triggering Conditions
                                                            </p>
                                                            <p>{item.triggering_conditions}</p>
                                                        </div>
                                                    )}
                                                    {item.guideline_reference && (
                                                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                                            <BookOpen className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                                            <span>{item.guideline_reference}</span>
                                                        </div>
                                                    )}
                                                    {(item.valid_from || item.valid_until) && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 border-t border-border/40">
                                                            <CalendarDays className="h-3.5 w-3.5" />
                                                            <span>
                                                                Valid {item.valid_from || '—'} → {item.valid_until || '—'}
                                                            </span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {listTotal > listLimit && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setListPage((p) => Math.max(1, p - 1))}
                                            className={listPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-3 text-sm text-muted-foreground">
                                            Page {listPage} of {Math.max(1, Math.ceil(listTotal / listLimit))}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setListPage((p) => p + 1)}
                                            className={listPage >= Math.ceil(listTotal / listLimit) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="warnings" className="space-y-4">
                    <Card className="bg-card/60 backdrop-blur-md shadow-xl border-border/60">
                        <CardHeader>
                            <CardTitle className="font-heading flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Proactive Early Warnings
                            </CardTitle>
                            <CardDescription>
                                Forecast-driven advisories 5–10 days ahead. Take action before risk crystallises.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingEarlyWarnings ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 3 }).map((_, i) => (
                                        <Skeleton key={i} className="h-24 w-full" />
                                    ))}
                                </div>
                            ) : earlyWarnings.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground gap-2">
                                    <ShieldCheck className="h-10 w-10 opacity-50 text-emerald-500" />
                                    <p>No active warnings — conditions look favourable for the upcoming window.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {earlyWarnings.map((w) => {
                                        const conf = typeof w.confidence_score === 'number' ? w.confidence_score : 0;
                                        const borderCls = conf >= 0.8
                                            ? 'border-l-red-500'
                                            : conf >= 0.5
                                                ? 'border-l-amber-500'
                                                : 'border-l-emerald-500';
                                        return (
                                            <Card key={w.id} className={`border-l-4 ${borderCls} bg-background/40 backdrop-blur-md shadow-md`}>
                                                <CardContent className="p-4 space-y-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="space-y-1">
                                                            <h3 className="font-heading text-base font-semibold">
                                                                {w.title || 'Warning'}
                                                            </h3>
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                {w.crop && (
                                                                    <Badge variant="secondary" className="capitalize">{w.crop}</Badge>
                                                                )}
                                                                {w.warning_type && (
                                                                    <Badge variant="outline" className="capitalize">
                                                                        {w.warning_type.replace(/_/g, ' ')}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end text-right shrink-0 min-w-[100px]">
                                                            <span className="text-xs text-muted-foreground">Confidence</span>
                                                            <span className="text-lg font-bold tabular-nums">{Math.round(conf * 100)}%</span>
                                                            <Progress
                                                                value={conf * 100}
                                                                className={`h-2 ${conf >= 0.8 ? '[&>div]:bg-red-500' : conf >= 0.5 ? '[&>div]:bg-amber-500' : '[&>div]:bg-emerald-500'}`}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-foreground/90 leading-relaxed">{w.description}</p>
                                                    {w.triggering_forecast && (
                                                        <div className="rounded-md bg-muted/40 p-3 border border-border/60 text-sm">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                                                Triggering Forecast
                                                            </p>
                                                            <p>{w.triggering_forecast}</p>
                                                        </div>
                                                    )}
                                                    {w.recommended_action && (
                                                        <div className="flex items-start gap-2 rounded-md bg-primary/5 p-3 border border-primary/20 text-sm">
                                                            <Sparkles className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                                                                    Recommended Action
                                                                </p>
                                                                <p>{w.recommended_action}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {w.forecast_date && (
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                                                            <CalendarDays className="h-3.5 w-3.5" />
                                                            <span>Forecast date: {w.forecast_date}</span>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    {earlyWarningsTotal > earlyWarningsLimit && (
                        <div className="flex justify-center">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => setEarlyWarningsPage((p) => Math.max(1, p - 1))}
                                            className={earlyWarningsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                    <PaginationItem>
                                        <span className="px-3 text-sm text-muted-foreground">
                                            Page {earlyWarningsPage} of {Math.max(1, Math.ceil(earlyWarningsTotal / earlyWarningsLimit))}
                                        </span>
                                    </PaginationItem>
                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => setEarlyWarningsPage((p) => p + 1)}
                                            className={earlyWarningsPage >= Math.ceil(earlyWarningsTotal / earlyWarningsLimit) ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
}
