import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    mapsService,
    type MapsCropZonesResponse,
    type MapsDistrictProductionResponse,
    type MapsExtensionCoverageResponse,
    type MapsFarmerDensityResponse,
    type MapsPestAlertsResponse,
    type MapsWeatherOverlayResponse,
} from '@/lib/api/mapsService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
    Map,
    Layers,
    Bug,
    Users,
    CloudRain,
    Leaf,
    RefreshCw,
    Camera,
    SplitSquareHorizontal,
    BarChart3,
    AlertTriangle,
    Thermometer,
    Wind,
    Droplets,
    ChevronLeft,
    ChevronRight,
    ExternalLink,
    Trees,
    Filter,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgriculturalMap } from '@/components/maps/AgriculturalMap';

type DistrictProduction = MapsDistrictProductionResponse['data'][number];
type PestAlert = MapsPestAlertsResponse['data'][number];
type ExtensionCoverage = MapsExtensionCoverageResponse['data'][number];
type FarmerDensity = MapsFarmerDensityResponse['data'][number];
type WeatherOverlay = MapsWeatherOverlayResponse['data'][number];
type CropZone = MapsCropZonesResponse['data'][number];

export default function DistrictMaps() {


    // List state — GET /maps/district-production
    const [districtProduction, setDistrictProduction] = useState<DistrictProduction[]>([]);
    const [loadingDistrictProduction, setLoadingDistrictProduction] = useState(true);
    const [districtProductionPage, setDistrictProductionPage] = useState(1);
    const [districtProductionLimit] = useState(10);
    const [districtProductionTotal, setDistrictProductionTotal] = useState(0);
    // List state — GET /maps/pest-alerts
    const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
    const [loadingPestAlerts, setLoadingPestAlerts] = useState(true);
    const [pestAlertsPage, setPestAlertsPage] = useState(1);
    const [pestAlertsLimit] = useState(10);
    const [pestAlertsTotal, setPestAlertsTotal] = useState(0);
    // List state — GET /maps/extension-coverage
    const [extensionCoverage, setExtensionCoverage] = useState<ExtensionCoverage[]>([]);
    const [loadingExtensionCoverage, setLoadingExtensionCoverage] = useState(true);
    const [extensionCoveragePage, setExtensionCoveragePage] = useState(1);
    const [extensionCoverageLimit] = useState(10);
    const [extensionCoverageTotal, setExtensionCoverageTotal] = useState(0);
    // List state — GET /maps/farmer-density
    const [farmerDensity, setFarmerDensity] = useState<FarmerDensity[]>([]);
    const [loadingFarmerDensity, setLoadingFarmerDensity] = useState(true);
    const [farmerDensityPage, setFarmerDensityPage] = useState(1);
    const [farmerDensityLimit] = useState(10);
    const [farmerDensityTotal, setFarmerDensityTotal] = useState(0);
    // List state — GET /maps/weather-overlay
    const [weatherOverlay, setWeatherOverlay] = useState<WeatherOverlay[]>([]);
    const [loadingWeatherOverlay, setLoadingWeatherOverlay] = useState(true);
    const [weatherOverlayPage, setWeatherOverlayPage] = useState(1);
    const [weatherOverlayLimit] = useState(10);
    const [weatherOverlayTotal, setWeatherOverlayTotal] = useState(0);
    // List state — GET /maps/crop-zones (agro-ecological zones)
    const [cropZones, setCropZones] = useState<CropZone[]>([]);
    const [loadingCropZones, setLoadingCropZones] = useState(true);
    const [cropZonesPage, setCropZonesPage] = useState(1);
    const [cropZonesLimit] = useState(10);
    const [cropZonesTotal, setCropZonesTotal] = useState(0);

    // Filter state for the GET endpoints that accept query params
    const [productionFilters, setProductionFilters] = useState<{ crop?: string; season?: string; year?: number; district?: string }>({});
    const [pestFilters, setPestFilters] = useState<{ district?: string; crop?: string }>({});
    const [weatherFilters, setWeatherFilters] = useState<{ district?: string }>({});
    const [cropZoneFilters, setCropZoneFilters] = useState<{ district?: string }>({});

    // Combobox state
    const [productionDistrictOpen, setProductionDistrictOpen] = useState(false);
    const [pestDistrictOpen, setPestDistrictOpen] = useState(false);
    const [weatherDistrictOpen, setWeatherDistrictOpen] = useState(false);
    const [cropZoneDistrictOpen, setCropZoneDistrictOpen] = useState(false);

    useEffect(() => { void loadDistrictProduction(); }, [districtProductionPage, productionFilters]);
    useEffect(() => { void loadPestAlerts(); }, [pestAlertsPage, pestFilters]);
    useEffect(() => { void loadExtensionCoverage(); }, [extensionCoveragePage]);
    useEffect(() => { void loadFarmerDensity(); }, [farmerDensityPage]);
    useEffect(() => { void loadWeatherOverlay(); }, [weatherOverlayPage, weatherFilters]);
    useEffect(() => { void loadCropZones(); }, [cropZonesPage, cropZoneFilters]);

    async function loadDistrictProduction() {
        try {
            setLoadingDistrictProduction(true);
            const res = await mapsService.districtProduction({ page: districtProductionPage, limit: districtProductionLimit, crop: productionFilters.crop, season: productionFilters.season, year: productionFilters.year, search: productionFilters.district });
            setDistrictProduction(Array.isArray(res?.data) ? res.data : []);
            setDistrictProductionTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districtProduction');
            console.error('[loadDistrictProduction]', err);
        } finally {
            setLoadingDistrictProduction(false);
        }
    }
    async function loadPestAlerts() {
        try {
            setLoadingPestAlerts(true);
            const res = await mapsService.pestAlerts({ page: pestAlertsPage, limit: pestAlertsLimit, ...pestFilters });
            setPestAlerts(Array.isArray(res?.data) ? res.data : []);
            setPestAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load pestAlerts');
            console.error('[loadPestAlerts]', err);
        } finally {
            setLoadingPestAlerts(false);
        }
    }
    async function loadExtensionCoverage() {
        try {
            setLoadingExtensionCoverage(true);
            const res = await mapsService.extensionCoverage({ page: extensionCoveragePage, limit: extensionCoverageLimit });
            setExtensionCoverage(Array.isArray(res?.data) ? res.data : []);
            setExtensionCoverageTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load extensionCoverage');
            console.error('[loadExtensionCoverage]', err);
        } finally {
            setLoadingExtensionCoverage(false);
        }
    }
    async function loadFarmerDensity() {
        try {
            setLoadingFarmerDensity(true);
            const res = await mapsService.farmerDensity({ page: farmerDensityPage, limit: farmerDensityLimit });
            setFarmerDensity(Array.isArray(res?.data) ? res.data : []);
            setFarmerDensityTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load farmerDensity');
            console.error('[loadFarmerDensity]', err);
        } finally {
            setLoadingFarmerDensity(false);
        }
    }
    async function loadWeatherOverlay() {
        try {
            setLoadingWeatherOverlay(true);
            const res = await mapsService.weatherOverlay({ page: weatherOverlayPage, limit: weatherOverlayLimit, ...weatherFilters });
            setWeatherOverlay(Array.isArray(res?.data) ? res.data : []);
            setWeatherOverlayTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load weatherOverlay');
            console.error('[loadWeatherOverlay]', err);
        } finally {
            setLoadingWeatherOverlay(false);
        }
    }
    async function loadCropZones() {
        try {
            setLoadingCropZones(true);
            const res = await mapsService.cropZones({ page: cropZonesPage, limit: cropZonesLimit, ...cropZoneFilters });
            setCropZones(Array.isArray(res?.data) ? res.data : []);
            setCropZonesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load crop zones');
            console.error('[loadCropZones]', err);
        } finally {
            setLoadingCropZones(false);
        }
    }

    const navigate = useNavigate();

    // Layer toggle state
    const [activeLayers, setActiveLayers] = useState({
        production: true,
        pestAlerts: true,
        extensionCoverage: false,
        farmerDensity: false,
        agroZones: false,
        weatherOverlay: false,
    });
    const [activeTab, setActiveTab] = useState<'map' | 'production' | 'pest' | 'extension' | 'farmers' | 'agro' | 'weather'>('map');
    const [splitView, setSplitView] = useState(false);
    const [splitSeasonA, setSplitSeasonA] = useState('Season A');
    const [splitSeasonB, setSplitSeasonB] = useState('Season B');

    function toggleLayer(layer: keyof typeof activeLayers) {
        setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
    }

    function handleSnapshot() {
        toast.success('Map snapshot generated and ready for download');
    }

    function getSeverityColor(severity?: string): string {
        switch ((severity ?? '').toLowerCase()) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/40';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/40';
            case 'medium': return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
            case 'low': return 'bg-green-500/20 text-green-400 border-green-500/40';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
        }
    }

    const isAnyLoading = loadingDistrictProduction || loadingPestAlerts || loadingExtensionCoverage || loadingFarmerDensity || loadingWeatherOverlay || loadingCropZones;

    // Build a combined list of unique districts across the data sources we have loaded —
    // this is what powers the searchable Combobox for the GET-list backed filters.
    const districtOptions = Array.from(
        new Set(
            [
                ...districtProduction.map(d => d.district_name).filter(Boolean) as string[],
                ...pestAlerts.map(d => d.district_name).filter(Boolean) as string[],
                ...extensionCoverage.map(d => d.district_name).filter(Boolean) as string[],
                ...farmerDensity.map(d => d.district_name).filter(Boolean) as string[],
                ...weatherOverlay.map(d => d.district_name).filter(Boolean) as string[],
                ...cropZones.map(d => d.district_name).filter(Boolean) as string[],
            ]
        )
    ).sort();

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen bg-background">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
                        District Maps
                    </h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Interactive spatial analysis of agricultural data across Uganda's districts
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSplitView(v => !v)}
                        className="border-border/50 hover:border-primary/60 transition-colors duration-200"
                    >
                        <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                        {splitView ? 'Single View' : 'Split View'}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSnapshot}
                        className="border-border/50 hover:border-primary/60 transition-colors duration-200"
                    >
                        <Camera className="w-4 h-4 mr-2" />
                        Snapshot
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => { void loadDistrictProduction(); void loadPestAlerts(); void loadExtensionCoverage(); void loadFarmerDensity(); void loadWeatherOverlay(); void loadCropZones(); }}
                        disabled={isAnyLoading}
                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:bg-primary/10 transition-all duration-200"
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isAnyLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Layer Controls */}
            <Card className="backdrop-blur-md bg-background/70 border border-border/40 rounded-lg shadow-md">
                <CardHeader className="pb-3">
                    <CardTitle className="font-heading text-lg flex items-center gap-2">
                        <Layers className="w-5 h-5 text-primary" />
                        Data Layers
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-lg border border-border/40 bg-background/45 px-3 py-2">
                        {[
                            { key: 'production' as const, label: 'Crop Production', icon: <Leaf className="w-4 h-4" />, color: 'text-green-400' },
                            { key: 'pestAlerts' as const, label: 'Pest Alerts', icon: <Bug className="w-4 h-4" />, color: 'text-red-400' },
                            { key: 'extensionCoverage' as const, label: 'Extension Coverage', icon: <BarChart3 className="w-4 h-4" />, color: 'text-blue-400' },
                            { key: 'farmerDensity' as const, label: 'Farmer Density', icon: <Users className="w-4 h-4" />, color: 'text-amber-400' },
                            { key: 'agroZones' as const, label: 'Agro-Ecological Zones', icon: <Trees className="w-4 h-4" />, color: 'text-emerald-400' },
                            { key: 'weatherOverlay' as const, label: 'Weather', icon: <CloudRain className="w-4 h-4" />, color: 'text-cyan-400' },
                        ].map(layer => (
                            <div
                                key={layer.key}
                                className="flex items-center justify-between gap-3 border-b border-border/30 py-2 last:border-b-0"
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleLayer(layer.key)}
                                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                >
                                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${activeLayers[layer.key] ? 'bg-primary' : 'bg-muted-foreground/35'}`} />
                                    <span className={`${layer.color} ${activeLayers[layer.key] ? 'opacity-100' : 'opacity-55'} transition-opacity duration-200`}>
                                        {layer.icon}
                                    </span>
                                    <span className={`truncate text-sm font-medium ${activeLayers[layer.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {layer.label}
                                    </span>
                                </button>
                                <Switch
                                    checked={activeLayers[layer.key]}
                                    onCheckedChange={() => toggleLayer(layer.key)}
                                    aria-label={`Toggle ${layer.label}`}
                                />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)}>
                <TabsList className="bg-background/70 backdrop-blur-md border border-border/40 rounded-lg">
                    <TabsTrigger value="map" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Map className="w-4 h-4 mr-1.5" />
                        Map View
                    </TabsTrigger>
                    <TabsTrigger value="production" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Leaf className="w-4 h-4 mr-1.5" />
                        Production
                    </TabsTrigger>
                    <TabsTrigger value="pest" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Bug className="w-4 h-4 mr-1.5" />
                        Pest Alerts
                    </TabsTrigger>
                    <TabsTrigger value="extension" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <BarChart3 className="w-4 h-4 mr-1.5" />
                        Extension
                    </TabsTrigger>
                    <TabsTrigger value="farmers" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Users className="w-4 h-4 mr-1.5" />
                        Farmers
                    </TabsTrigger>
                    <TabsTrigger value="agro" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Trees className="w-4 h-4 mr-1.5" />
                        Agro Zones
                    </TabsTrigger>
                    <TabsTrigger value="weather" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <CloudRain className="w-4 h-4 mr-1.5" />
                        Weather
                    </TabsTrigger>
                </TabsList>

                {/* Map View Tab */}
                <TabsContent value="map" className="mt-4 space-y-4">
                    <AgriculturalMap
                        title="Uganda District Agricultural Map"
                        description="Google Earth Engine layers clipped to Uganda's national boundary — crop distribution, soil texture, rainfall, and NDVI"
                        heightClassName="h-[520px]"
                    />

                    {/* Quick stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        <Card className="backdrop-blur-md bg-background/70 border border-border/40 rounded-lg shadow-md p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-green-500/30 bg-black/20 flex items-center justify-center">
                                    <Leaf className="w-5 h-5 text-green-400" />
                                </div>
                                <div>
                                    {loadingDistrictProduction ? <Skeleton className="h-5 w-16" /> : (
                                        <p className="font-heading text-xl font-bold text-foreground">{districtProductionTotal}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Production Records</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="backdrop-blur-md bg-background/70 border border-border/40 rounded-lg shadow-md p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-red-500/30 bg-black/20 flex items-center justify-center">
                                    <Bug className="w-5 h-5 text-red-400" />
                                </div>
                                <div>
                                    {loadingPestAlerts ? <Skeleton className="h-5 w-16" /> : (
                                        <p className="font-heading text-xl font-bold text-foreground">{pestAlertsTotal}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Active Alerts</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="backdrop-blur-md bg-background/70 border border-border/40 rounded-lg shadow-md p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-amber-500/30 bg-black/20 flex items-center justify-center">
                                    <Users className="w-5 h-5 text-amber-400" />
                                </div>
                                <div>
                                    {loadingFarmerDensity ? <Skeleton className="h-5 w-16" /> : (
                                        <p className="font-heading text-xl font-bold text-foreground">{farmerDensityTotal}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Farmer Districts</p>
                                </div>
                            </div>
                        </Card>
                        <Card className="backdrop-blur-md bg-background/70 border border-border/40 rounded-lg shadow-md p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-lg border border-cyan-500/30 bg-black/20 flex items-center justify-center">
                                    <CloudRain className="w-5 h-5 text-cyan-400" />
                                </div>
                                <div>
                                    {loadingWeatherOverlay ? <Skeleton className="h-5 w-16" /> : (
                                        <p className="font-heading text-xl font-bold text-foreground">{weatherOverlayTotal}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Weather Stations</p>
                                </div>
                            </div>
                        </Card>
                    </div>
                </TabsContent>

                {/* Production Tab */}
                <TabsContent value="production" className="mt-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-center justify-between gap-3 flex-wrap">
                                <CardTitle className="font-heading text-lg flex items-center gap-2">
                                    <Leaf className="w-5 h-5 text-green-400" />
                                    Crop Production by District
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setProductionDistrictOpen(true)}
                                    className="text-xs border-border/50 hover:border-primary/60"
                                >
                                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                                    Filter by District
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3">
                                <div className="space-y-1">
                                    <Label htmlFor="prod-crop" className="text-xs">Crop</Label>
                                    <Input
                                        id="prod-crop"
                                        placeholder="e.g. Maize"
                                        value={productionFilters.crop ?? ''}
                                        onChange={e => setProductionFilters(prev => ({ ...prev, crop: e.target.value || undefined }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="prod-season" className="text-xs">Season</Label>
                                    <Select
                                        value={productionFilters.season ?? '__all__'}
                                        onValueChange={v => setProductionFilters(prev => ({ ...prev, season: v === '__all__' ? undefined : v }))}
                                    >
                                        <SelectTrigger id="prod-season" className="h-8">
                                            <SelectValue placeholder="All seasons" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">All seasons</SelectItem>
                                            <SelectItem value="Season A">Season A</SelectItem>
                                            <SelectItem value="Season B">Season B</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="prod-year" className="text-xs">Year</Label>
                                    <Input
                                        id="prod-year"
                                        type="number"
                                        placeholder="e.g. 2025"
                                        value={productionFilters.year ?? ''}
                                        onChange={e => setProductionFilters(prev => ({ ...prev, year: e.target.value ? Number(e.target.value) : undefined }))}
                                        className="h-8"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loadingDistrictProduction ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : districtProduction.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Leaf className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">No production data available</p>
                                    <p className="text-muted-foreground/60 text-sm">Apply filters or refresh to load district production records</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[420px] pr-2">
                                    <div className="space-y-3">
                                        {districtProduction.map((item, idx) => (
                                            <div key={item.district_id ?? idx} className="flex items-center gap-4 p-3 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 transition-colors duration-200">
                                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                                                    <Leaf className="w-5 h-5 text-green-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{item.district_name ?? 'Unknown District'}</p>
                                                    <p className="text-xs text-muted-foreground">{item.crop ?? '—'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-foreground">{item.production_volume_mt?.toLocaleString() ?? '—'} MT</p>
                                                    <p className="text-xs text-muted-foreground">{item.yield_kg_per_ha?.toLocaleString() ?? '—'} kg/ha</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {/* Pagination */}
                            {districtProductionTotal > 10 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page {districtProductionPage} — {districtProductionTotal} total records
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" disabled={districtProductionPage <= 1} onClick={() => setDistrictProductionPage(p => p - 1)} className="h-7 px-2">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={districtProductionPage * 10 >= districtProductionTotal} onClick={() => setDistrictProductionPage(p => p + 1)} className="h-7 px-2">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Pest Alerts Tab */}
                <TabsContent value="pest" className="mt-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-heading text-lg flex items-center gap-2">
                                    <Bug className="w-5 h-5 text-red-400" />
                                    Active Pest & Disease Alert Zones
                                </CardTitle>
                                <Button variant="outline" size="sm" onClick={() => navigate('/farmer/pest-disease')} className="text-xs border-border/50 hover:border-primary/60">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    Full Report
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                                <div className="space-y-1">
                                    <Label htmlFor="pest-crop" className="text-xs">Crop</Label>
                                    <Input
                                        id="pest-crop"
                                        placeholder="e.g. Coffee"
                                        value={pestFilters.crop ?? ''}
                                        onChange={e => setPestFilters(prev => ({ ...prev, crop: e.target.value || undefined }))}
                                        className="h-8"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">District</Label>
                                    <Button
                                        variant="outline"
                                        onClick={() => setPestDistrictOpen(true)}
                                        className="h-8 w-full justify-between text-sm font-normal"
                                    >
                                        {pestFilters.district ?? 'All districts'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loadingPestAlerts ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : pestAlerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <AlertTriangle className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">No active alerts</p>
                                    <p className="text-muted-foreground/60 text-sm">All districts are currently clear of reported pest alerts</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[420px] pr-2">
                                    <div className="space-y-3">
                                        {pestAlerts.map((alert, idx) => (
                                            <div key={alert.alert_id ?? idx} className="p-4 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 transition-colors duration-200">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
                                                            <Bug className="w-5 h-5 text-red-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{alert.pest_name ?? 'Unknown Pest'}</p>
                                                            <p className="text-xs text-muted-foreground">{alert.district_name ?? '—'} · {alert.crop ?? '—'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                                        <Badge className={`text-xs border ${getSeverityColor(alert.severity)}`}>
                                                            {alert.severity ?? 'Unknown'}
                                                        </Badge>
                                                        {alert.alert_level && (
                                                            <span className="text-xs text-muted-foreground">Level: {alert.alert_level}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                {alert.issued_at && (
                                                    <p className="text-xs text-muted-foreground/60 mt-2 pl-13">
                                                        Issued: {new Date(alert.issued_at).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {pestAlertsTotal > 10 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page {pestAlertsPage} — {pestAlertsTotal} total alerts
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" disabled={pestAlertsPage <= 1} onClick={() => setPestAlertsPage(p => p - 1)} className="h-7 px-2">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={pestAlertsPage * 10 >= pestAlertsTotal} onClick={() => setPestAlertsPage(p => p + 1)} className="h-7 px-2">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Extension Coverage Tab */}
                <TabsContent value="extension" className="mt-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="font-heading text-lg flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-400" />
                                Extension Service Coverage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loadingExtensionCoverage ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-20 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : extensionCoverage.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <BarChart3 className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">No coverage data available</p>
                                    <p className="text-muted-foreground/60 text-sm">Extension service coverage data will appear here once loaded</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[420px] pr-2">
                                    <div className="space-y-3">
                                        {extensionCoverage.map((item, idx) => (
                                            <div key={item.district_id ?? idx} className="p-4 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 transition-colors duration-200">
                                                <div className="flex items-center justify-between gap-3 mb-2">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                                                            <BarChart3 className="w-4 h-4 text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">{item.district_name ?? 'Unknown'}</p>
                                                            <p className="text-xs text-muted-foreground">{item.extension_workers ?? 0} workers · {item.farmers_covered?.toLocaleString() ?? 0} farmers</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-sm font-semibold text-blue-400">
                                                        {item.coverage_rate != null ? `${(item.coverage_rate * 100).toFixed(0)}%` : '—'}
                                                    </span>
                                                </div>
                                                <Progress value={item.coverage_rate != null ? item.coverage_rate * 100 : 0} className="h-1.5 bg-blue-500/10" />
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {extensionCoverageTotal > 10 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page {extensionCoveragePage} — {extensionCoverageTotal} total records
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" disabled={extensionCoveragePage <= 1} onClick={() => setExtensionCoveragePage(p => p - 1)} className="h-7 px-2">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={extensionCoveragePage * 10 >= extensionCoverageTotal} onClick={() => setExtensionCoveragePage(p => p + 1)} className="h-7 px-2">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Farmer Density Tab */}
                <TabsContent value="farmers" className="mt-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <CardTitle className="font-heading text-lg flex items-center gap-2">
                                <Users className="w-5 h-5 text-amber-400" />
                                Farmer Registration Density
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loadingFarmerDensity ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : farmerDensity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Users className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">No farmer density data</p>
                                    <p className="text-muted-foreground/60 text-sm">District farmer registration data will appear here</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[420px] pr-2">
                                    <div className="space-y-3">
                                        {farmerDensity.map((item, idx) => (
                                            <div key={item.district_id ?? idx} className="flex items-center gap-4 p-3 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 transition-colors duration-200">
                                                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                                    <Users className="w-5 h-5 text-amber-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{item.district_name ?? 'Unknown'}</p>
                                                    <p className="text-xs text-muted-foreground">{item.farmer_count?.toLocaleString() ?? 0} registered farmers</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <p className="text-sm font-semibold text-amber-400">{item.density_per_km2?.toFixed(1) ?? '—'}</p>
                                                    <p className="text-xs text-muted-foreground">per km²</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {farmerDensityTotal > 10 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page {farmerDensityPage} — {farmerDensityTotal} total records
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" disabled={farmerDensityPage <= 1} onClick={() => setFarmerDensityPage(p => p - 1)} className="h-7 px-2">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={farmerDensityPage * 10 >= farmerDensityTotal} onClick={() => setFarmerDensityPage(p => p + 1)} className="h-7 px-2">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Agro-Ecological Zones Tab */}
                <TabsContent value="agro" className="mt-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-heading text-lg flex items-center gap-2">
                                    <Trees className="w-5 h-5 text-emerald-400" />
                                    Agro-Ecological Zone Classifications
                                </CardTitle>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCropZoneDistrictOpen(true)}
                                    className="text-xs border-border/50 hover:border-primary/60"
                                >
                                    <Filter className="w-3.5 h-3.5 mr-1.5" />
                                    Filter by District
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loadingCropZones ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : cropZones.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <Trees className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">No agro-ecological zone data</p>
                                    <p className="text-muted-foreground/60 text-sm">District zone classifications will appear here once loaded</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[420px] pr-2">
                                    <div className="space-y-3">
                                        {cropZones.map((item, idx) => (
                                            <div key={item.district_id ?? idx} className="flex items-center gap-4 p-3 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 transition-colors duration-200">
                                                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                                                    <Trees className="w-5 h-5 text-emerald-400" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-foreground truncate">{item.district_name ?? 'Unknown District'}</p>
                                                    <p className="text-xs text-muted-foreground">Crop: {item.crop ?? '—'}</p>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <Badge variant="outline" className="text-xs border-emerald-400/40 text-emerald-400">
                                                        {item.agro_ecological_zone ?? '—'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {cropZonesTotal > 10 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page {cropZonesPage} — {cropZonesTotal} total records
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" disabled={cropZonesPage <= 1} onClick={() => setCropZonesPage(p => p - 1)} className="h-7 px-2">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={cropZonesPage * 10 >= cropZonesTotal} onClick={() => setCropZonesPage(p => p + 1)} className="h-7 px-2">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Weather Overlay Tab */}
                <TabsContent value="weather" className="mt-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3 border-b border-border/30">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-heading text-lg flex items-center gap-2">
                                    <CloudRain className="w-5 h-5 text-cyan-400" />
                                    Weather Conditions by District
                                </CardTitle>
                                <Button variant="outline" size="sm" onClick={() => navigate('/farmer/alerts')} className="text-xs border-border/50 hover:border-primary/60">
                                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                                    Weather Alerts
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 items-end">
                                <div className="space-y-1">
                                    <Label className="text-xs">District</Label>
                                    <Button
                                        variant="outline"
                                        onClick={() => setWeatherDistrictOpen(true)}
                                        className="h-8 w-full justify-between text-sm font-normal"
                                    >
                                        {weatherFilters.district ?? 'All districts'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setWeatherFilters({ district: undefined })}
                                    className="text-xs text-muted-foreground hover:text-foreground"
                                >
                                    Clear district filter
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {loadingWeatherOverlay ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <Skeleton key={i} className="h-28 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : weatherOverlay.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3">
                                    <CloudRain className="w-12 h-12 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">No weather data available</p>
                                    <p className="text-muted-foreground/60 text-sm">Weather overlay data from OpenWeatherMap will appear here</p>
                                </div>
                            ) : (
                                <ScrollArea className="h-[440px] pr-2">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {weatherOverlay.map((item, idx) => (
                                            <div key={item.district_id ?? idx} className="p-4 rounded-lg border border-border/30 bg-card/40 hover:border-border/60 transition-colors duration-200">
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="font-medium text-foreground">{item.district_name ?? 'Unknown'}</p>
                                                    {item.condition && (
                                                        <Badge variant="outline" className="text-xs border-cyan-400/40 text-cyan-400">
                                                            {item.condition}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="flex items-center gap-1.5">
                                                        <Thermometer className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                                                        <span className="text-xs text-muted-foreground">{item.temperature != null ? `${item.temperature}°C` : '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Droplets className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                                        <span className="text-xs text-muted-foreground">{item.rainfall != null ? `${item.rainfall} mm` : '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <CloudRain className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                                        <span className="text-xs text-muted-foreground">{item.humidity != null ? `${item.humidity}%` : '—'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <Wind className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                        <span className="text-xs text-muted-foreground">{item.wind_speed != null ? `${item.wind_speed} km/h` : '—'}</span>
                                                    </div>
                                                </div>
                                                {item.recorded_at && (
                                                    <p className="text-xs text-muted-foreground/50 mt-2">
                                                        Recorded: {new Date(item.recorded_at).toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                            {weatherOverlayTotal > 10 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Page {weatherOverlayPage} — {weatherOverlayTotal} total records
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" variant="outline" disabled={weatherOverlayPage <= 1} onClick={() => setWeatherOverlayPage(p => p - 1)} className="h-7 px-2">
                                            <ChevronLeft className="w-3.5 h-3.5" />
                                        </Button>
                                        <Button size="sm" variant="outline" disabled={weatherOverlayPage * 10 >= weatherOverlayTotal} onClick={() => setWeatherOverlayPage(p => p + 1)} className="h-7 px-2">
                                            <ChevronRight className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* District Combobox Popovers — wired to GET list endpoints */}
            <Popover open={productionDistrictOpen} onOpenChange={setProductionDistrictOpen}>
                <PopoverTrigger asChild><span className="sr-only" /></PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                    <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="__all__"
                                    onSelect={() => {
                                        setProductionFilters(prev => ({ ...prev, district: undefined } as any));
                                        setProductionDistrictOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', !productionFilters.district ? 'opacity-100' : 'opacity-0')} />
                                    All districts
                                </CommandItem>
                                {districtOptions.map(district => (
                                    <CommandItem
                                        key={district}
                                        value={district}
                                        onSelect={() => {
                                            setProductionFilters(prev => ({ ...prev, district } as any));
                                            setProductionDistrictOpen(false);
                                        }}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', productionFilters.district === district ? 'opacity-100' : 'opacity-0')} />
                                        {district}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Popover open={pestDistrictOpen} onOpenChange={setPestDistrictOpen}>
                <PopoverTrigger asChild><span className="sr-only" /></PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                    <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="__all__"
                                    onSelect={() => {
                                        setPestFilters(prev => ({ ...prev, district: undefined }));
                                        setPestDistrictOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', !pestFilters.district ? 'opacity-100' : 'opacity-0')} />
                                    All districts
                                </CommandItem>
                                {districtOptions.map(district => (
                                    <CommandItem
                                        key={district}
                                        value={district}
                                        onSelect={() => {
                                            setPestFilters(prev => ({ ...prev, district }));
                                            setPestDistrictOpen(false);
                                        }}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', pestFilters.district === district ? 'opacity-100' : 'opacity-0')} />
                                        {district}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Popover open={weatherDistrictOpen} onOpenChange={setWeatherDistrictOpen}>
                <PopoverTrigger asChild><span className="sr-only" /></PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                    <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="__all__"
                                    onSelect={() => {
                                        setWeatherFilters({ district: undefined });
                                        setWeatherDistrictOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', !weatherFilters.district ? 'opacity-100' : 'opacity-0')} />
                                    All districts
                                </CommandItem>
                                {districtOptions.map(district => (
                                    <CommandItem
                                        key={district}
                                        value={district}
                                        onSelect={() => {
                                            setWeatherFilters({ district });
                                            setWeatherDistrictOpen(false);
                                        }}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', weatherFilters.district === district ? 'opacity-100' : 'opacity-0')} />
                                        {district}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Popover open={cropZoneDistrictOpen} onOpenChange={setCropZoneDistrictOpen}>
                <PopoverTrigger asChild><span className="sr-only" /></PopoverTrigger>
                <PopoverContent className="w-[260px] p-0" align="end">
                    <Command>
                        <CommandInput placeholder="Search district..." />
                        <CommandList>
                            <CommandEmpty>No district found.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    value="__all__"
                                    onSelect={() => {
                                        setCropZoneFilters({ district: undefined });
                                        setCropZoneDistrictOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', !cropZoneFilters.district ? 'opacity-100' : 'opacity-0')} />
                                    All districts
                                </CommandItem>
                                {districtOptions.map(district => (
                                    <CommandItem
                                        key={district}
                                        value={district}
                                        onSelect={() => {
                                            setCropZoneFilters({ district });
                                            setCropZoneDistrictOpen(false);
                                        }}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', cropZoneFilters.district === district ? 'opacity-100' : 'opacity-0')} />
                                        {district}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
