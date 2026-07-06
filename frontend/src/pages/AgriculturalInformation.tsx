import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    ArrowRight,
    Bug,
    CalendarDays,
    Cloud,
    FileDown,
    Filter,
    Leaf,
    Sprout,
    ShieldCheck,
    Wheat,
} from 'lucide-react';
import {
    cropsService,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    pestsService,
    type PestsListResponse,
} from '@/lib/api/pestsService';
import {
    farmingPracticesService,
    type FarmingPracticesListResponse,
} from '@/lib/api/farmingPracticesService';
import {
    varietiesService,
    type VarietiesListResponse,
} from '@/lib/api/varietiesService';

type Crop = CropsListResponse['data'][number];
type Pest = PestsListResponse['data'][number];
type FarmingPractice = FarmingPracticesListResponse['data'][number];
type Variety = VarietiesListResponse['data'][number];

export default function AgriculturalInformation() {
    const navigate = useNavigate();

    // List state — GET /crops/list
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [cropsPage, setCropsPage] = useState(1);
    const [cropsLimit] = useState(10);
    const [cropsTotal, setCropsTotal] = useState(0);
    // List state — GET /pests/list
    const [pests, setPests] = useState<Pest[]>([]);
    const [loadingPests, setLoadingPests] = useState(true);
    const [pestsPage, setPestsPage] = useState(1);
    const [pestsLimit] = useState(10);
    const [pestsTotal, setPestsTotal] = useState(0);
    // List state — GET /farming-practices/list
    const [farmingPractices, setFarmingPractices] = useState<FarmingPractice[]>([]);
    const [loadingFarmingPractices, setLoadingFarmingPractices] = useState(true);
    const [farmingPracticesPage, setFarmingPracticesPage] = useState(1);
    const [farmingPracticesLimit] = useState(10);
    const [farmingPracticesTotal, setFarmingPracticesTotal] = useState(0);
    // List state — GET /varieties/list
    const [varieties, setVarieties] = useState<Variety[]>([]);
    const [loadingVarieties, setLoadingVarieties] = useState(true);
    const [varietiesPage, setVarietiesPage] = useState(1);
    const [varietiesLimit] = useState(10);
    const [varietiesTotal, setVarietiesTotal] = useState(0);

    useEffect(() => { void loadCrops(); }, [cropsPage]);
    useEffect(() => { void loadPests(); }, [pestsPage]);
    useEffect(() => { void loadFarmingPractices(); }, [farmingPracticesPage]);
    useEffect(() => { void loadVarieties(); }, [varietiesPage]);

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
    async function loadPests() {
        try {
            setLoadingPests(true);
            const res = await pestsService.list({ page: pestsPage, limit: pestsLimit });
            setPests(Array.isArray(res?.data) ? res.data : []);
            setPestsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load pests');
            console.error('[loadPests]', err);
        } finally {
            setLoadingPests(false);
        }
    }
    async function loadFarmingPractices() {
        try {
            setLoadingFarmingPractices(true);
            const res = await farmingPracticesService.list({ page: farmingPracticesPage, limit: farmingPracticesLimit });
            setFarmingPractices(Array.isArray(res?.data) ? res.data : []);
            setFarmingPracticesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load farmingPractices');
            console.error('[loadFarmingPractices]', err);
        } finally {
            setLoadingFarmingPractices(false);
        }
    }
    async function loadVarieties() {
        try {
            setLoadingVarieties(true);
            const res = await varietiesService.list({ page: varietiesPage, limit: varietiesLimit });
            setVarieties(Array.isArray(res?.data) ? res.data : []);
            setVarietiesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load varieties');
            console.error('[loadVarieties]', err);
        } finally {
            setLoadingVarieties(false);
        }
    }

    // Crop filter for tabs that support filtering
    const [cropFilter, setCropFilter] = useState<string>('all');
    const [cropFilterOpen, setCropFilterOpen] = useState(false);

    // Pagination helper
    function calcTotalPages(total: number, limit: number): number {
        return Math.max(1, Math.ceil(total / limit));
    }

    // Standard crop pictures — verified Unsplash free photos, best available for each Uganda crop
    const cropImages: Record<string, string> = {
        // Coffee (Robusta) — hands picking ripe red coffee cherries, East Africa (photo: aXLk1YTaxNM)
        coffee: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
        // Maize — golden maize/corn cobs, correct crop photo
        maize: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?auto=format&fit=crop&w=800&q=80',
        // Beans — assorted coloured bean variety — kidney, black, mung (photo: t4X660oKiYs)
        beans: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
        // Banana / Matooke — green banana bunch on tropical plantation
        banana: 'https://images.unsplash.com/photo-1603833665858-e61d17a86224?auto=format&fit=crop&w=800&q=80',
        // Cassava — pile of raw cassava roots cut cross-section (photo: 0_GtcvY4Mj4)
        cassava: 'https://images.unsplash.com/photo-1594282486552-05b4d80fbb9f?auto=format&fit=crop&w=800&q=80',
        // Avocado — Hass avocados on tree branch
        avocado: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=800&q=80',
        // Tea — rows of green tea bushes on hillside plantation
        tea: 'https://images.unsplash.com/photo-1556610961-2febc32c4e73?auto=format&fit=crop&w=800&q=80',
        // Sugarcane — tall sugarcane crop ready for harvest
        sugarcane: 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=800&q=80',
        // Cotton — white cotton bolls open in the field
        cotton: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=800&q=80',
        // Groundnuts — peanut / groundnut plants with pods
        groundnuts: 'https://images.unsplash.com/photo-1591187571-2271be02aa2b?auto=format&fit=crop&w=800&q=80',
    };

    function getCropImage(name: string): string {
        const lower = name.toLowerCase();
        if (lower.includes('coffee')) return cropImages.coffee;
        if (lower.includes('maize') || lower.includes('corn')) return cropImages.maize;
        if (lower.includes('bean')) return cropImages.beans;
        if (lower.includes('banana') || lower.includes('matooke')) return cropImages.banana;
        if (lower.includes('cassava')) return cropImages.cassava;
        if (lower.includes('avocado')) return cropImages.avocado;
        if (lower.includes('tea')) return cropImages.tea;
        if (lower.includes('sugar')) return cropImages.sugarcane;
        if (lower.includes('cotton')) return cropImages.cotton;
        if (lower.includes('ground') || lower.includes('nut')) return cropImages.groundnuts;
        return cropImages.maize;
    }

    // Unique crop names from data for filter dropdowns
    const cropNames = useMemo(() => {
        const names = new Set<string>();
        crops.forEach((c) => names.add(c.name));
        return Array.from(names).sort();
    }, [crops]);

    // Filtered data
    const filteredPests = useMemo(
        () => (cropFilter === 'all' ? pests : pests.filter((p) => p.affected_crops?.some((c) => c.toLowerCase().includes(cropFilter.toLowerCase())))),
        [pests, cropFilter],
    );
    const filteredPractices = useMemo(
        () => (cropFilter === 'all' ? farmingPractices : farmingPractices.filter((p) => p.crop?.toLowerCase().includes(cropFilter.toLowerCase()))),
        [farmingPractices, cropFilter],
    );
    const filteredVarieties = useMemo(
        () => (cropFilter === 'all' ? varieties : varieties.filter((v) => v.crop?.toLowerCase().includes(cropFilter.toLowerCase()))),
        [varieties, cropFilter],
    );

    function gotoPage_4() {
        navigate('/seasons');
    }
    function gotoPage_30() {
        navigate('/reports');
    }

    return (
        <div className="space-y-6 p-6 md:p-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-2xl border border-border/40 shadow-lg backdrop-blur-xl bg-card/60">
                <div className="grid gap-6 md:grid-cols-2">
                    <div className="flex flex-col justify-center gap-4 p-8">
                        <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            National Agricultural Data Hub
                        </span>
                        <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight md:text-5xl">
                            Agricultural Information
                        </h1>
                        <p className="max-w-prose text-muted-foreground">
                            Explore Uganda's four priority crops, common pests and diseases,
                            climate-smart farming practices recommended by NARO and MAAIF,
                            and improved variety guides tailored to our agro-ecological zones.
                        </p>
                        <div className="flex flex-wrap gap-3 pt-2">
                            <Button
                                variant="outline"
                                className="border-primary text-primary shadow-[0_0_12px_hsl(var(--primary))] transition-all duration-200 ease-out hover:bg-primary/10"
                                onClick={() => gotoPage_4()}
                            >
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Seasonal Calendars
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                onClick={() => gotoPage_30()}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                View Public Reports
                            </Button>
                        </div>
                    </div>
                    <div className="relative min-h-[260px] md:min-h-[360px]">
                        <img
                            src="https://images.unsplash.com/photo-1595508064774-5ff825520bb6?auto=format&fit=crop&w=1200&q=80"
                            alt="Ugandan farmer in a lush green crop field"
                            loading="lazy"
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
                    </div>
                </div>
            </section>

            {/* Tab-based content */}
            <Tabs defaultValue="crops" className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <TabsList className="bg-card/60 backdrop-blur-md border border-border/40 shadow-sm">
                        <TabsTrigger value="crops">
                            <Sprout className="mr-1.5 h-4 w-4" />
                            Crops
                        </TabsTrigger>
                        <TabsTrigger value="pests">
                            <Bug className="mr-1.5 h-4 w-4" />
                            Pests &amp; Diseases
                        </TabsTrigger>
                        <TabsTrigger value="practices">
                            <Leaf className="mr-1.5 h-4 w-4" />
                            Farming Practices
                        </TabsTrigger>
                        <TabsTrigger value="varieties">
                            <Wheat className="mr-1.5 h-4 w-4" />
                            Varieties
                        </TabsTrigger>
                    </TabsList>

                    {/* Crop filter combobox (visible on pests, practices, varieties tabs) */}
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Popover open={cropFilterOpen} onOpenChange={setCropFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={cropFilterOpen}
                                    className="w-[200px] justify-between rounded-full border-border/40 bg-card/60 backdrop-blur-md font-normal"
                                >
                                    <span className="truncate">
                                        {cropFilter === 'all' ? 'Filter by crop' : cropFilter}
                                    </span>
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[240px] p-0" align="end">
                                <Command>
                                    <CommandInput placeholder="Search crop..." />
                                    <CommandList>
                                        <CommandEmpty>No crop found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all"
                                                onSelect={() => {
                                                    setCropFilter('all');
                                                    setCropFilterOpen(false);
                                                }}
                                            >
                                                <Check
                                                    className={cn(
                                                        'mr-2 h-4 w-4',
                                                        cropFilter === 'all' ? 'opacity-100' : 'opacity-0',
                                                    )}
                                                />
                                                All Crops
                                            </CommandItem>
                                            {cropNames.map((name) => (
                                                <CommandItem
                                                    key={name}
                                                    value={name}
                                                    onSelect={(currentValue) => {
                                                        setCropFilter(currentValue === cropFilter ? 'all' : currentValue);
                                                        setCropFilterOpen(false);
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            'mr-2 h-4 w-4',
                                                            cropFilter === name ? 'opacity-100' : 'opacity-0',
                                                        )}
                                                    />
                                                    {name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* ===== CROPS TAB ===== */}
                <TabsContent value="crops" className="space-y-4">
                    <div className="flex items-end justify-between gap-3">
                        <div>
                            <h2 className="font-heading text-2xl font-semibold">Priority Crops</h2>
                            <p className="text-sm text-muted-foreground">
                                Uganda's four cornerstone crops across the agro-ecological zones.
                            </p>
                        </div>
                        <Button variant="link" onClick={() => gotoPage_4()} className="text-primary">
                            See planting seasons
                            <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                    {loadingCrops ? (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-72 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : crops.length === 0 ? (
                        <div className="rounded-2xl border border-border/40 bg-card/60 p-10 text-center text-muted-foreground backdrop-blur-xl">
                            No crop profiles available.
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                            {crops.map((crop) => (
                                <Card
                                    key={crop.id}
                                    className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl hover:border-white/20 dark:bg-white/5"
                                >
                                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                                        <img
                                            src={crop.image_url || getCropImage(crop.name)}
                                            alt={crop.name}
                                            loading="lazy"
                                            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                        <Badge
                                            variant="secondary"
                                            className="absolute bottom-3 left-3 bg-white/20 text-white backdrop-blur-md border-white/10 font-normal"
                                        >
                                            {crop.season}
                                        </Badge>
                                    </div>
                                    <CardContent className="space-y-2 p-5">
                                        <CardTitle className="font-heading text-lg">{crop.name}</CardTitle>
                                        <p className="line-clamp-3 text-sm text-muted-foreground">
                                            {crop.description}
                                        </p>
                                        {crop.agro_ecological_zones?.length ? (
                                            <div className="flex flex-wrap gap-1 pt-1">
                                                {crop.agro_ecological_zones.slice(0, 3).map((z) => (
                                                    <Badge key={z} variant="outline" className="font-normal text-xs">
                                                        {z}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : null}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ===== PESTS & DISEASES TAB ===== */}
                <TabsContent value="pests" className="space-y-4">
                    <div>
                        <h2 className="font-heading text-2xl font-semibold">Pests &amp; Diseases</h2>
                        <p className="text-sm text-muted-foreground">
                            Threats monitored across Uganda's growing regions. Filter by crop to see relevant pests.
                        </p>
                    </div>
                    {loadingPests ? (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Skeleton key={i} className="h-52 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredPests.length === 0 ? (
                        <div className="rounded-2xl border border-border/40 bg-card/60 p-10 text-center text-muted-foreground backdrop-blur-xl">
                            {cropFilter !== 'all'
                                ? `No pest information found for "${cropFilter}".`
                                : 'No pest information available.'}
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {filteredPests.map((pest) => {
                                const severityColor =
                                    pest.severity === 'High'
                                        ? 'bg-destructive/15 text-destructive border-destructive/30'
                                        : pest.severity === 'Medium'
                                          ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                          : 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
                                return (
                                    <Card
                                        key={pest.id}
                                        className="rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-xl hover:border-white/20 dark:bg-white/5"
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <CardTitle className="font-heading text-base">
                                                    {pest.name}
                                                </CardTitle>
                                                <Badge variant="outline" className={`font-normal ${severityColor}`}>
                                                    {pest.severity}
                                                </Badge>
                                            </div>
                                            <CardDescription className="text-xs uppercase tracking-wide">
                                                {pest.type}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3 text-sm">
                                            <p className="text-muted-foreground line-clamp-3">{pest.description}</p>
                                            <div className="flex items-start gap-2 text-xs rounded-lg bg-muted/30 p-2.5">
                                                <Cloud className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                                <span className="text-muted-foreground">
                                                    <span className="font-medium text-foreground">Climate Trigger:</span>{' '}
                                                    {pest.climate_trigger}
                                                </span>
                                            </div>
                                            {pest.recommended_actions ? (
                                                <div className="flex items-start gap-2 text-xs rounded-lg bg-primary/5 p-2.5">
                                                    <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                                                    <span className="text-muted-foreground">
                                                        <span className="font-medium text-foreground">Action:</span>{' '}
                                                        {pest.recommended_actions}
                                                    </span>
                                                </div>
                                            ) : null}
                                            {pest.affected_crops?.length ? (
                                                <div className="flex flex-wrap gap-1 pt-1">
                                                    {pest.affected_crops.map((c) => (
                                                        <Badge key={c} variant="secondary" className="font-normal">
                                                            {c}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                    {!loadingPests && pestsTotal > pestsLimit && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-muted-foreground">
                                Page {pestsPage} of {calcTotalPages(pestsTotal, pestsLimit)}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pestsPage <= 1}
                                    onClick={() => setPestsPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={pestsPage >= calcTotalPages(pestsTotal, pestsLimit)}
                                    onClick={() => setPestsPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ===== FARMING PRACTICES TAB ===== */}
                <TabsContent value="practices" className="space-y-4">
                    <div>
                        <h2 className="font-heading text-2xl font-semibold">Climate-Smart Practices</h2>
                        <p className="text-sm text-muted-foreground">
                            Guidance from NARO and MAAIF to build resilience on your farm.
                        </p>
                    </div>
                    {loadingFarmingPractices ? (
                        <div className="grid gap-5 md:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-36 w-full rounded-2xl" />
                            ))}
                        </div>
                    ) : filteredPractices.length === 0 ? (
                        <div className="rounded-2xl border border-border/40 bg-card/60 p-10 text-center text-muted-foreground backdrop-blur-xl">
                            {cropFilter !== 'all'
                                ? `No practices found for "${cropFilter}".`
                                : 'No practices available.'}
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2">
                            {filteredPractices.map((practice) => (
                                <Card
                                    key={practice.id}
                                    className="rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-xl transition-all duration-300 ease-out hover:shadow-xl hover:border-white/20 dark:bg-white/5"
                                >
                                    <CardHeader className="pb-2">
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="font-heading text-lg leading-snug">
                                                {practice.title}
                                            </CardTitle>
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                                <Leaf className="h-4.5 w-4.5 text-primary" />
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            <Badge variant="secondary" className="font-normal">
                                                {practice.crop}
                                            </Badge>
                                            <Badge variant="outline" className="font-normal">
                                                {practice.practice_type}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {practice.description}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Source:{' '}
                                            <span className="font-medium text-foreground">{practice.source}</span>
                                            {practice.agro_ecological_zone
                                                ? ` · ${practice.agro_ecological_zone}`
                                                : ''}
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                    {!loadingFarmingPractices && farmingPracticesTotal > farmingPracticesLimit && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-muted-foreground">
                                Page {farmingPracticesPage} of {calcTotalPages(farmingPracticesTotal, farmingPracticesLimit)}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={farmingPracticesPage <= 1}
                                    onClick={() => setFarmingPracticesPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={farmingPracticesPage >= calcTotalPages(farmingPracticesTotal, farmingPracticesLimit)}
                                    onClick={() => setFarmingPracticesPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* ===== VARIETIES TAB ===== */}
                <TabsContent value="varieties" className="space-y-4">
                    <div>
                        <h2 className="font-heading text-2xl font-semibold">Improved Varieties</h2>
                        <p className="text-sm text-muted-foreground">
                            Higher-yielding, climate-resilient seed varieties for Uganda.
                        </p>
                    </div>
                    {loadingVarieties ? (
                        <div className="rounded-2xl border border-border/40 bg-card/60 p-6 shadow-md backdrop-blur-xl">
                            <Skeleton className="h-48 w-full" />
                        </div>
                    ) : filteredVarieties.length === 0 ? (
                        <div className="rounded-2xl border border-border/40 bg-card/60 p-10 text-center text-muted-foreground backdrop-blur-xl">
                            {cropFilter !== 'all'
                                ? `No varieties found for "${cropFilter}".`
                                : 'No variety information available.'}
                        </div>
                    ) : (
                        <Card className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-lg backdrop-blur-xl dark:bg-white/5">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                                        <TableHead className="font-heading">Variety</TableHead>
                                        <TableHead className="font-heading">Crop</TableHead>
                                        <TableHead className="font-heading text-right">Yield (kg/ha)</TableHead>
                                        <TableHead className="font-heading text-right">Maturity (days)</TableHead>
                                        <TableHead className="font-heading">Traits</TableHead>
                                        <TableHead className="font-heading">Developer</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVarieties.map((v) => (
                                        <TableRow key={v.id} className="transition-colors duration-150 ease-out hover:bg-muted/30">
                                            <TableCell className="font-medium">{v.variety_name}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal">
                                                    {v.crop}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {v.yield_improvement_kg_ha?.toLocaleString() ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-right tabular-nums">
                                                {v.maturity_days ?? '—'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {v.drought_tolerant ? (
                                                        <Badge variant="outline" className="font-normal text-xs">
                                                            Drought-tolerant
                                                        </Badge>
                                                    ) : null}
                                                    {v.pest_resistant ? (
                                                        <Badge variant="outline" className="font-normal text-xs">
                                                            Pest-resistant
                                                        </Badge>
                                                    ) : null}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{v.developer}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    )}
                    {!loadingVarieties && varietiesTotal > varietiesLimit && (
                        <div className="flex items-center justify-between pt-2">
                            <p className="text-sm text-muted-foreground">
                                Page {varietiesPage} of {calcTotalPages(varietiesTotal, varietiesLimit)}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={varietiesPage <= 1}
                                    onClick={() => setVarietiesPage((p) => p - 1)}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={varietiesPage >= calcTotalPages(varietiesTotal, varietiesLimit)}
                                    onClick={() => setVarietiesPage((p) => p + 1)}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Footer CTA */}
            <section className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-6 shadow-lg backdrop-blur-xl dark:bg-white/5 md:flex-row">
                <div>
                    <h3 className="font-heading text-xl font-semibold">Want the full agronomy library?</h3>
                    <p className="text-sm text-muted-foreground">
                        Browse public reports and the seasonal planting calendar.
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button
                        variant="outline"
                        className="border-primary text-primary shadow-[0_0_12px_hsl(var(--primary))] transition-all duration-200 ease-out hover:bg-primary/10"
                        onClick={() => gotoPage_4()}
                    >
                        <CalendarDays className="mr-2 h-4 w-4" />
                        Seasonal Calendars
                    </Button>
                    <Button onClick={() => gotoPage_30()}>
                        <FileDown className="mr-2 h-4 w-4" />
                        View Public Reports
                    </Button>
                </div>
            </section>
        </div>
    );
}
