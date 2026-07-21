import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    farmsService,
    type FarmsCreateParams,
    type FarmsDeleteParams,
    type FarmsListResponse,
} from '@/lib/api/farmsService';
import {
    cropsService,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import { farmsCreateSchema } from '@/lib/api/farmsFormSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Plus, Search, MapPin, Sprout, Bell, Tractor, MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Farm = FarmsListResponse['data'][number];
type Crop = CropsListResponse['data'][number];

function CropsMultiSelect({
    value,
    onChange,
}: {
    value: string[];
    onChange: (v: string[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [options, setOptions] = useState<Crop[]>([]);
    const [selectedCrops, setSelectedCrops] = useState<Crop[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoadingOptions(true);
        cropsService
            .list({ page: 1, limit: 50, search: debouncedSearch || undefined })
            .then((res) => {
                if (!cancelled) setOptions(Array.isArray(res?.data) ? (res.data as Crop[]) : []);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoadingOptions(false); });
        return () => { cancelled = true; };
    }, [open, debouncedSearch]);

    const toggle = (crop: Crop) => {
        const id = crop.id ?? '';
        if (value.includes(id)) {
            onChange(value.filter((v) => v !== id));
            setSelectedCrops((prev) => prev.filter((c) => c.id !== id));
        } else {
            onChange([...value, id]);
            setSelectedCrops((prev) => [...prev.filter((c) => c.id !== id), crop]);
        }
    };

    const removeCrop = (id: string) => {
        onChange(value.filter((v) => v !== id));
        setSelectedCrops((prev) => prev.filter((c) => c.id !== id));
    };

    return (
        <div className="space-y-2">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between bg-background border-border"
                    >
                        {value.length === 0 ? 'Select crops...' : `${value.length} crop${value.length > 1 ? 's' : ''} selected`}
                        <Plus className="ml-2 h-4 w-4 opacity-60" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                    <Command>
                        <CommandInput placeholder="Search crops..." value={search} onValueChange={setSearch} />
                        <CommandList>
                            {loadingOptions ? (
                                <CommandEmpty>Loading...</CommandEmpty>
                            ) : options.length === 0 ? (
                                <CommandEmpty>No crop found.</CommandEmpty>
                            ) : (
                                <CommandGroup>
                                    {options.map((c) => (
                                        <CommandItem
                                            key={c.id}
                                            value={c.id ?? ''}
                                            onSelect={() => toggle(c)}
                                        >
                                            <Check className={cn('mr-2 h-4 w-4', value.includes(c.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                            {c.name}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            {selectedCrops.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedCrops.map((c) => (
                        <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
                            {c.name}
                            <button
                                type="button"
                                onClick={() => removeCrop(c.id ?? '')}
                                className="ml-1 rounded-full hover:bg-muted p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MyFarm() {
    const navigate = useNavigate();
    const myFarmImageUrl = '/images/coffee.png';

    // List state — GET /farms/list
    const [farms, setFarms] = useState<Farm[]>([]);
    const [loadingFarms, setLoadingFarms] = useState(true);
    const [farmsPage, setFarmsPage] = useState(1);
    const [farmsLimit] = useState(10);
    const [farmsTotal, setFarmsTotal] = useState(0);
    // List state — GET /crops/list (for filter dropdown)
    const [crops, setCrops] = useState<Crop[]>([]);
    // Create dialog state — POST /farms/create
    const [createFarmsOpen, setCreateFarmsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cropFilter, setCropFilter] = useState<string>('all');
    const [cropFilterOpen, setCropFilterOpen] = useState(false);
    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

    const createForm = useForm<FarmsCreateParams>({
        resolver: zodResolver(farmsCreateSchema),
        defaultValues: {
            farm_name: '',
            district: '',
            agro_ecological_zone: '',
            area_hectares: undefined,
            soil_type: '',
            gps_boundary: '',
            crop_ids: [],
        },
    });

    const filteredFarms = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        const selectedCropName = cropFilter === 'all'
            ? null
            : crops.find((c) => c.id === cropFilter)?.name ?? null;
        return farms.filter((f) => {
            const matchesQ = !q ||
                f.farm_name?.toLowerCase().includes(q) ||
                f.district?.toLowerCase().includes(q) ||
                f.soil_type?.toLowerCase().includes(q) ||
                f.agro_ecological_zone?.toLowerCase().includes(q);
            const matchesCrop = !selectedCropName ||
                (Array.isArray(f.crops) && f.crops.some((c) => c === selectedCropName));
            return matchesQ && matchesCrop;
        });
    }, [farms, searchTerm, cropFilter, crops]);

    useEffect(() => { void loadFarms(); }, [farmsPage]);
    useEffect(() => { void loadCrops(); }, []);

    async function loadFarms() {
        try {
            setLoadingFarms(true);
            const res = await farmsService.list({ page: farmsPage, limit: farmsLimit });
            setFarms(Array.isArray(res?.data) ? res.data : []);
            setFarmsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load farms');
            console.error('[loadFarms]', err);
        } finally {
            setLoadingFarms(false);
        }
    }
    async function loadCrops() {
        try {
            const res = await cropsService.list({ page: 1, limit: 100 });
            setCrops(Array.isArray(res?.data) ? (res.data as Crop[]) : []);
        } catch (err) {
            console.error('[loadCrops]', err);
        }
    }
    async function handleCreateFarms(data: FarmsCreateParams) {
        try {
            await farmsService.create(data);
            toast.success('Created');
            setCreateFarmsOpen(false);
            void loadFarms();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateFarms]', err);
        }
    }
    async function handleDeleteFarms(params: FarmsDeleteParams) {
        try {
            await farmsService.delete(params);
            toast.success('Deleted');
            void loadFarms();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteFarms]', err);
        }
    }

    function gotoPage_8_sub_1(fieldId: string | number) {
        navigate(`/farmer/my-farm/${fieldId}`);
    }

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: My Farm
        DESCRIPTION: The farmer's personal farm management hub listing all registered farms and fields with their associated crops, GPS boundaries displayed on a Google Maps embed, soil type, agro-ecological zone classification, and historical activity logs. Farmers can add new farms and fields, register GPS field boundaries, log planting dates, record observed pest sightings for community monitoring contributions, and track input usage over time. This registration data enables the system to personalize all weather alerts, pest warnings, and crop recommendations to each farmer's specific on-the-ground conditions rather than relying on district-level averages.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - farms (array)              — list data, auto-loaded on mount and on farmsPage change
          - loadingFarms (boolean)
          - farmsPage / setFarmsPage  — pagination state
          - farmsTotal (number)         — total record count for pagination UI
          - loadFarms() — call to reload the list
          - crops (array)              — list data, auto-loaded on mount and on cropsPage change
          - loadingCrops (boolean)
          - cropsPage / setCropsPage  — pagination state
          - cropsTotal (number)         — total record count for pagination UI
          - loadCrops() — call to reload the list
          - createFarmsOpen / setCreateFarmsOpen  — wrap the create form in <Dialog open={createFarmsOpen}>
          - handleCreateFarms(data: FarmsCreateParams) — call from create form submit
          - VALIDATION: import { farmsCreateSchema } from '@/lib/api/farmsFormSchema' and wire useForm({ resolver: zodResolver(farmsCreateSchema) }); it already encodes required fields — submit via handleSubmit so an incomplete form can't POST. Show errors.{field}?.message under each input.
          - handleDeleteFarms(params: FarmsDeleteParams) — call from delete confirmation

        OUTGOING NAVIGATION (every edge below MUST be wired):
          - card_click -> /farmer/my-farm/:fieldId (farm field card on My Farm list)
          Prefer the emitted `goto{TargetPageId}` helper for each edge (it wraps navigate + substitutes params); calling the `navigate` function directly is also fine. For row/card clicks pass the entity id into the route.

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
            {/* Hero */}
            <div className="relative overflow-hidden rounded-lg shadow-xl glassmorphic border border-white/10">
                <img
                    src={myFarmImageUrl}
                    alt="Uganda farm — maize, coffee, banana and cassava fields"
                    className="absolute inset-0 w-full h-full object-cover opacity-40"
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = '/images/uganda-coffee-crop.svg'; }}
                />
                <div className="relative z-10 p-8 md:p-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent">
                    <div className="space-y-2">
                        <h1 className="font-heading text-4xl md:text-5xl font-semibold text-white tracking-tight">
                            My Farm
                        </h1>
                        <p className="text-white/85 text-base max-w-2xl">
                            Manage your registered farms and fields. Map boundaries, track crops, log activity,
                            and feed on-the-ground data back to the climate-smart advisory engine.
                        </p>
                    </div>
                    <Button
                        onClick={() => setCreateFarmsOpen(true)}
                        className="neon_glow bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Register New Farm
                    </Button>
                </div>
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glassmorphic shadow-xl border-white/10">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Farms</p>
                            <p className="font-heading text-3xl font-semibold mt-1">{farmsTotal}</p>
                        </div>
                        <Tractor className="h-8 w-8 text-primary/70" />
                    </CardContent>
                </Card>
                <Card className="glassmorphic shadow-xl border-white/10">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Crops</p>
                            <p className="font-heading text-3xl font-semibold mt-1">
                                {farms.reduce((acc, f) => acc + (Array.isArray(f.crops) ? f.crops.length : 0), 0)}
                            </p>
                        </div>
                        <Sprout className="h-8 w-8 text-primary/70" />
                    </CardContent>
                </Card>
                <Card className="glassmorphic shadow-xl border-white/10">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Active Alerts</p>
                            <p className="font-heading text-3xl font-semibold mt-1">
                                {farms.reduce((acc, f) => acc + (f.active_alerts ?? 0), 0)}
                            </p>
                        </div>
                        <Bell className="h-8 w-8 text-primary/70" />
                    </CardContent>
                </Card>
                <Card className="glassmorphic shadow-xl border-white/10">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Area (ha)</p>
                            <p className="font-heading text-3xl font-semibold mt-1">
                                {farms.reduce((acc, f) => acc + (f.area_hectares ?? 0), 0).toFixed(1)}
                            </p>
                        </div>
                        <MapPin className="h-8 w-8 text-primary/70" />
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="glassmorphic shadow-xl border-white/10">
                <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-center gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search farms by name, district, soil type..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-background border-border focus:ring-primary"
                            />
                        </div>
                        <Popover open={cropFilterOpen} onOpenChange={setCropFilterOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="md:w-56 justify-between bg-background border-border font-normal"
                                >
                                    {cropFilter === 'all'
                                        ? 'Filter by crop'
                                        : crops.find((c) => c.id === cropFilter)?.name ?? 'Filter by crop'}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="md:w-56 p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search crops..." />
                                    <CommandList>
                                        <CommandEmpty>No crop found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all"
                                                onSelect={() => { setCropFilter('all'); setCropFilterOpen(false); }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', cropFilter === 'all' ? 'opacity-100' : 'opacity-0')} />
                                                All crops
                                            </CommandItem>
                                            {crops.map((c) => (
                                                <CommandItem
                                                    key={c.id}
                                                    value={c.id ?? ''}
                                                    onSelect={() => { setCropFilter(c.id ?? ''); setCropFilterOpen(false); }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', cropFilter === c.id ? 'opacity-100' : 'opacity-0')} />
                                                    {c.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
            </Card>

            {/* Farm grid */}
            {loadingFarms ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-64 w-full rounded-lg" />
                    ))}
                </div>
            ) : filteredFarms.length === 0 ? (
                <Card className="glassmorphic shadow-xl border-white/10">
                    <CardContent className="p-12 text-center">
                        <Sprout className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="font-heading text-xl font-semibold mb-2">No farms yet</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Register your first farm to start receiving field-specific weather alerts,
                            pest warnings, and crop recommendations.
                        </p>
                        <Button onClick={() => setCreateFarmsOpen(true)} className="neon_glow">
                            <Plus className="mr-2 h-4 w-4" /> Register Your First Farm
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredFarms.map((farm) => (
                        <Card
                            key={farm.id}
                            className="glassmorphic shadow-xl border-white/10 overflow-hidden cursor-pointer transition-all hover:shadow-2xl hover:-translate-y-0.5"
                            onClick={() => gotoPage_8_sub_1(farm.id)}
                        >
                            <div className="relative h-40 w-full overflow-hidden">
                                <img
                                    src={myFarmImageUrl}
                                    alt={farm.farm_name}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                    onError={(e) => { e.currentTarget.src = '/images/uganda-coffee-crop.svg'; }}
                                />
                                <div className="absolute top-3 right-3">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="secondary" size="icon" className="h-8 w-8 bg-black/60 hover:bg-black/80 text-white border-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); gotoPage_8_sub_1(farm.id); }}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive focus:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteTarget({ id: farm.id ?? '', name: farm.farm_name ?? 'this farm' });
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete Farm
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                {farm.active_alerts > 0 && (
                                    <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                                        <Bell className="mr-1 h-3 w-3" /> {farm.active_alerts} Alert{farm.active_alerts > 1 ? 's' : ''}
                                    </Badge>
                                )}
                            </div>
                            <CardContent className="p-5 space-y-3">
                                <div>
                                    <h3 className="font-heading text-xl font-semibold leading-tight">{farm.farm_name}</h3>
                                    <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                        <MapPin className="h-3.5 w-3.5" /> {farm.district}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {(farm.crops ?? []).slice(0, 4).map((crop, idx) => (
                                        <Badge key={idx} variant="secondary" className="font-normal">
                                            {crop}
                                        </Badge>
                                    ))}
                                    {(farm.crops?.length ?? 0) > 4 && (
                                        <Badge variant="outline" className="font-normal">
                                            +{(farm.crops?.length ?? 0) - 4} more
                                        </Badge>
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Area</p>
                                        <p className="font-medium">{farm.area_hectares ?? '—'} ha</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Soil</p>
                                        <p className="font-medium truncate">{farm.soil_type || '—'}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-muted-foreground">Agro-ecological zone</p>
                                        <p className="font-medium truncate">{farm.agro_ecological_zone || '—'}</p>
                                    </div>
                                </div>
                                {farm.last_activity_date && (
                                    <p className="text-xs text-muted-foreground pt-1">
                                        Last activity: {new Date(farm.last_activity_date).toLocaleDateString()}
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {farmsTotal > farmsLimit && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((farmsPage - 1) * farmsLimit) + 1}–{Math.min(farmsPage * farmsLimit, farmsTotal)} of {farmsTotal}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={farmsPage <= 1}
                            onClick={() => setFarmsPage((p) => p - 1)}
                        >
                            <ChevronLeft className="h-4 w-4" /> Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={farmsPage * farmsLimit >= farmsTotal}
                            onClick={() => setFarmsPage((p) => p + 1)}
                        >
                            Next <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Farm Dialog */}
            <Dialog open={createFarmsOpen} onOpenChange={setCreateFarmsOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glassmorphic">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Register New Farm</DialogTitle>
                        <DialogDescription>
                            Add a farm or field with GPS boundary and crop assignments. Required fields are marked *.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit((data) => void handleCreateFarms(data))} className="space-y-4">
                            <FormField
                                control={createForm.control}
                                name="farm_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Farm name *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Kigezi Highlands Farm" {...field} className="bg-background border-border" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>District *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Kabale" {...field} className="bg-background border-border" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="agro_ecological_zone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Agro-ecological zone</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background border-border">
                                                    <SelectValue placeholder="Select zone" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Eastern Highlands">Eastern Highlands</SelectItem>
                                                <SelectItem value="Lake Victoria Crescent">Lake Victoria Crescent</SelectItem>
                                                <SelectItem value="Western Highlands">Western Highlands</SelectItem>
                                                <SelectItem value="Northern">Northern</SelectItem>
                                                <SelectItem value="West Nile">West Nile</SelectItem>
                                                <SelectItem value="Karamoja">Karamoja</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="area_hectares"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Area (hectares)</FormLabel>
                                            <FormControl>
                                                <Input type="number" step="0.1" placeholder="e.g. 2.5" {...field} className="bg-background border-border" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="soil_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Soil type</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background border-border">
                                                        <SelectValue placeholder="Select soil type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Clay">Clay</SelectItem>
                                                    <SelectItem value="Loam">Loam</SelectItem>
                                                    <SelectItem value="Sandy Loam">Sandy Loam</SelectItem>
                                                    <SelectItem value="Sandy">Sandy</SelectItem>
                                                    <SelectItem value="Volcanic">Volcanic</SelectItem>
                                                    <SelectItem value="Laterite">Laterite</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={createForm.control}
                                name="gps_boundary"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>GPS boundary coordinates</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder='[{"lat":-1.05,"lng":29.78},{"lat":-1.06,"lng":29.79}]'
                                                className="bg-background border-border font-mono text-xs"
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createForm.control}
                                name="crop_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crops planted</FormLabel>
                                        <FormControl>
                                            <CropsMultiSelect
                                                value={field.value ?? []}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateFarmsOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="neon_glow">
                                    Register Farm
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Farm</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone and will remove all registered fields, crop assignments, and activity history.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTarget?.id) {
                                    void handleDeleteFarms({ id: deleteTarget.id });
                                }
                                setDeleteTarget(null);
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
