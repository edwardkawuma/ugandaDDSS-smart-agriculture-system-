import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Check,
    ChevronLeft,
    ChevronRight,
    ChevronsUpDown,
    Layers,
    MapPin,
    MoreVertical,
    Pencil,
    Plus,
    Sprout,
    Trash2,
    TreePine,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
    farmsService,
    type FarmsDetailParams,
    type FarmsDetailResponse,
    type FarmsUpdateParams,
    type FarmsUpdateResponse,
} from '@/lib/api/farmsService';
import {
    cropsService,
    type CropsListParams,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    pestsService,
    type PestsListParams,
    type PestsListResponse,
} from '@/lib/api/pestsService';
import {
    farmActivitiesService,
    type FarmActivitiesCreateParams,
    type FarmActivitiesCreateResponse,
    type FarmActivitiesDeleteParams,
    type FarmActivitiesDeleteResponse,
    type FarmActivitiesDetailParams,
    type FarmActivitiesDetailResponse,
    type FarmActivitiesListParams,
    type FarmActivitiesListResponse,
    type FarmActivitiesUpdateParams,
    type FarmActivitiesUpdateResponse,
} from '@/lib/api/farmActivitiesService';
import {
    pestSightingsService,
    type PestSightingsCreateParams,
    type PestSightingsCreateResponse,
    type PestSightingsDeleteParams,
    type PestSightingsDeleteResponse,
    type PestSightingsDetailParams,
    type PestSightingsDetailResponse,
    type PestSightingsListParams,
    type PestSightingsListResponse,
    type PestSightingsUpdateParams,
    type PestSightingsUpdateResponse,
} from '@/lib/api/pestSightingsService';
import {
    farmsUpdateSchema,
    type FarmsUpdateInput,
} from '@/lib/api/farmsFormSchema';
import {
    farmActivitiesCreateSchema,
    farmActivitiesUpdateSchema,
    type FarmActivitiesCreateInput,
    type FarmActivitiesUpdateInput,
} from '@/lib/api/farmActivitiesFormSchema';
import {
    pestSightingsCreateSchema,
    pestSightingsUpdateSchema,
    type PestSightingsCreateInput,
    type PestSightingsUpdateInput,
} from '@/lib/api/pestSightingsFormSchema';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from '@/components/ui/pagination';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

type Crop = CropsListResponse['data'][number];
type Pest = PestsListResponse['data'][number];
type FarmActivity = FarmActivitiesListResponse['data'][number];
type PestSighting = PestSightingsListResponse['data'][number];
type Farm = FarmsDetailResponse['data'];

export default function FarmFieldDetail() {
    const navigate = useNavigate();
    const { id = '' } = useParams<{ id: string }>();
    function goBack() { navigate(-1); }

    // Detail state — GET /farms/detail
    const [farmsItem, setFarmsItem] = useState<FarmsDetailResponse['data'] | null>(null);
    const [loadingFarmsItem, setLoadingFarmsItem] = useState(true);
    // ↑ Farm is the singular row type
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
    // Edit dialog state — PUT /farms/update
    const [editFarmsTarget, setEditFarmsTarget] = useState<Farm | null>(null);
    // Create dialog state — POST /farm-activities/create
    const [createFarmActivitiesOpen, setCreateFarmActivitiesOpen] = useState(false);
    // List state — GET /farm-activities/list
    const [farmActivities, setFarmActivities] = useState<FarmActivity[]>([]);
    const [loadingFarmActivities, setLoadingFarmActivities] = useState(true);
    const [farmActivitiesPage, setFarmActivitiesPage] = useState(1);
    const [farmActivitiesLimit] = useState(10);
    const [farmActivitiesTotal, setFarmActivitiesTotal] = useState(0);
    // Edit dialog state — PUT /farm-activities/update
    const [editFarmActivitiesTarget, setEditFarmActivitiesTarget] = useState<FarmActivity | null>(null);
    // Create dialog state — POST /pest-sightings/create
    const [createPestSightingsOpen, setCreatePestSightingsOpen] = useState(false);
    // List state — GET /pest-sightings/list
    const [pestSightings, setPestSightings] = useState<PestSighting[]>([]);
    const [loadingPestSightings, setLoadingPestSightings] = useState(true);
    const [pestSightingsPage, setPestSightingsPage] = useState(1);
    const [pestSightingsLimit] = useState(10);
    const [pestSightingsTotal, setPestSightingsTotal] = useState(0);
    // Edit dialog state — PUT /pest-sightings/update
    const [editPestSightingsTarget, setEditPestSightingsTarget] = useState<PestSighting | null>(null);
    // Delete confirmation targets
    const [deleteFarmActivityTarget, setDeleteFarmActivityTarget] = useState<FarmActivity | null>(null);
    const [deletePestSightingTarget, setDeletePestSightingTarget] = useState<PestSighting | null>(null);
    // Combobox local UI state
    const [cropComboboxOpen, setCropComboboxOpen] = useState(false);
    const [cropSearchTerm, setCropSearchTerm] = useState('');
    const [pestComboboxOpen, setPestComboboxOpen] = useState(false);
    const [pestSearchTerm, setPestSearchTerm] = useState('');

    useEffect(() => { if (id) void loadFarmsItem(); }, [id]);
    useEffect(() => { void loadCrops(); }, [cropsPage]);
    useEffect(() => { void loadPests(); }, [pestsPage]);
    useEffect(() => { if (id) void loadFarmActivities(); }, [farmActivitiesPage, id]);
    useEffect(() => { if (id) void loadPestSightings(); }, [pestSightingsPage, id]);

    async function loadFarmsItem() {
        try {
            setLoadingFarmsItem(true);
            const res = await farmsService.detail({ id: id });
            setFarmsItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadFarmsItem]', err);
        } finally {
            setLoadingFarmsItem(false);
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
    async function handleUpdateFarms(data: FarmsUpdateParams) {
        try {
            await farmsService.update(data);
            toast.success('Updated');
            setEditFarmsTarget(null);
            void loadFarmsItem();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateFarms]', err);
        }
    }
    async function handleCreateFarmActivities(data: FarmActivitiesCreateParams) {
        try {
            await farmActivitiesService.create(data);
            toast.success('Created');
            setCreateFarmActivitiesOpen(false);
            void loadFarmActivities();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateFarmActivities]', err);
        }
    }
    async function loadFarmActivities() {
        try {
            setLoadingFarmActivities(true);
            const res = await farmActivitiesService.list({
                farm_id: id,
                page: farmActivitiesPage,
                limit: farmActivitiesLimit,
            });
            setFarmActivities(Array.isArray(res?.data) ? res.data : []);
            setFarmActivitiesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load farmActivities');
            console.error('[loadFarmActivities]', err);
        } finally {
            setLoadingFarmActivities(false);
        }
    }
    async function handleUpdateFarmActivities(data: FarmActivitiesUpdateParams) {
        try {
            await farmActivitiesService.update(data);
            toast.success('Updated');
            setEditFarmActivitiesTarget(null);
            void loadFarmActivities();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateFarmActivities]', err);
        }
    }
    async function handleDeleteFarmActivities(params: FarmActivitiesDeleteParams) {
        try {
            await farmActivitiesService.delete(params);
            toast.success('Deleted');
            void loadFarmActivities();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteFarmActivities]', err);
        }
    }
    async function handleCreatePestSightings(data: PestSightingsCreateParams) {
        try {
            await pestSightingsService.create(data);
            toast.success('Created');
            setCreatePestSightingsOpen(false);
            void loadPestSightings();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreatePestSightings]', err);
        }
    }
    async function loadPestSightings() {
        try {
            setLoadingPestSightings(true);
            const res = await pestSightingsService.list({
                farm_id: id,
                page: pestSightingsPage,
                limit: pestSightingsLimit,
            });
            setPestSightings(Array.isArray(res?.data) ? res.data : []);
            setPestSightingsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load pestSightings');
            console.error('[loadPestSightings]', err);
        } finally {
            setLoadingPestSightings(false);
        }
    }
    async function handleUpdatePestSightings(data: PestSightingsUpdateParams) {
        try {
            await pestSightingsService.update(data);
            toast.success('Updated');
            setEditPestSightingsTarget(null);
            void loadPestSightings();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdatePestSightings]', err);
        }
    }
    async function handleDeletePestSightings(params: PestSightingsDeleteParams) {
        try {
            await pestSightingsService.delete(params);
            toast.success('Deleted');
            void loadPestSightings();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeletePestSightings]', err);
        }
    }

    function gotoPage_8() {
        navigate('/farmer/my-farm');
    }

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: Farm Field Detail
        DESCRIPTION: Displays the complete profile of a single registered farm field including its GPS map boundary rendered on Google Maps, registered crops and their current growth stage, full planting history, observed pest and disease sighting records contributed by the farmer, soil analysis results, dated activity log, and all weather alerts and crop recommendations tailored specifically to this field. Farmers can edit field information, add new activity entries, update crop growth stage, and view the historical timeline of alerts and recommendations specific to this field plot.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - farmsItem (object or null)  — detail data, auto-loaded on mount from useParams.id
          - loadingFarmsItem (boolean)
          - loadFarmsItem() — call to (re)load
          - crops (array)              — list data, auto-loaded on mount and on cropsPage change
          - loadingCrops (boolean)
          - cropsPage / setCropsPage  — pagination state
          - cropsTotal (number)         — total record count for pagination UI
          - loadCrops() — call to reload the list
          - pests (array)              — list data, auto-loaded on mount and on pestsPage change
          - loadingPests (boolean)
          - pestsPage / setPestsPage  — pagination state
          - pestsTotal (number)         — total record count for pagination UI
          - loadPests() — call to reload the list
          - editFarmsTarget / setEditFarmsTarget — set to the row being edited; wrap edit form in <Dialog open={!!editFarmsTarget}>
          - handleUpdateFarms(data: FarmsUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { farmsUpdateSchema } from '@/lib/api/farmsFormSchema' and wire useForm({ resolver: zodResolver(farmsUpdateSchema), values: editFarmsTarget ?? undefined }); submit via handleSubmit.
          - createFarmActivitiesOpen / setCreateFarmActivitiesOpen  — wrap the create form in <Dialog open={createFarmActivitiesOpen}>
          - handleCreateFarmActivities(data: FarmActivitiesCreateParams) — call from create form submit
          - VALIDATION: import { farmActivitiesCreateSchema } from '@/lib/api/farmActivitiesFormSchema' and wire useForm({ resolver: zodResolver(farmActivitiesCreateSchema) }); it already encodes required fields — submit via handleSubmit so an incomplete form can't POST. Show errors.{field}?.message under each input.
          - farmActivities (array)              — list data, auto-loaded on mount and on farmActivitiesPage change
          - loadingFarmActivities (boolean)
          - farmActivitiesPage / setFarmActivitiesPage  — pagination state
          - farmActivitiesTotal (number)         — total record count for pagination UI
          - loadFarmActivities() — call to reload the list
          - farmActivitiesItem (object or null)  — detail data, auto-loaded on mount from useParams.id
          - loadingFarmActivitiesItem (boolean)
          - loadFarmActivitiesItem() — call to (re)load
          - editFarmActivitiesTarget / setEditFarmActivitiesTarget — set to the row being edited; wrap edit form in <Dialog open={!!editFarmActivitiesTarget}>
          - handleUpdateFarmActivities(data: FarmActivitiesUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { farmActivitiesUpdateSchema } from '@/lib/api/farmActivitiesFormSchema' and wire useForm({ resolver: zodResolver(farmActivitiesUpdateSchema), values: editFarmActivitiesTarget ?? undefined }); submit via handleSubmit.
          - handleDeleteFarmActivities(params: FarmActivitiesDeleteParams) — call from delete confirmation
          - createPestSightingsOpen / setCreatePestSightingsOpen  — wrap the create form in <Dialog open={createPestSightingsOpen}>
          - handleCreatePestSightings(data: PestSightingsCreateParams) — call from create form submit
          - VALIDATION: import { pestSightingsCreateSchema } from '@/lib/api/pestSightingsFormSchema' and wire useForm({ resolver: zodResolver(pestSightingsCreateSchema) }); it already encodes required fields — submit via handleSubmit so an incomplete form can't POST. Show errors.{field}?.message under each input.
          - pestSightings (array)              — list data, auto-loaded on mount and on pestSightingsPage change
          - loadingPestSightings (boolean)
          - pestSightingsPage / setPestSightingsPage  — pagination state
          - pestSightingsTotal (number)         — total record count for pagination UI
          - loadPestSightings() — call to reload the list
          - pestSightingsItem (object or null)  — detail data, auto-loaded on mount from useParams.id
          - loadingPestSightingsItem (boolean)
          - loadPestSightingsItem() — call to (re)load
          - editPestSightingsTarget / setEditPestSightingsTarget — set to the row being edited; wrap edit form in <Dialog open={!!editPestSightingsTarget}>
          - handleUpdatePestSightings(data: PestSightingsUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { pestSightingsUpdateSchema } from '@/lib/api/pestSightingsFormSchema' and wire useForm({ resolver: zodResolver(pestSightingsUpdateSchema), values: editPestSightingsTarget ?? undefined }); submit via handleSubmit.
          - handleDeletePestSightings(params: PestSightingsDeleteParams) — call from delete confirmation

        OUTGOING NAVIGATION (every edge below MUST be wired):
          - back_button -> /farmer/my-farm (back arrow / breadcrumb at top of Farm Field Detail)
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
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={gotoPage_8} className="shrink-0 mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-heading tracking-tight">
                                {farmsItem?.farm_name ?? 'Farm Field Detail'}
                            </h1>
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {farmsItem?.district ? `${farmsItem.district}` : 'Loading…'}
                            {farmsItem?.agro_ecological_zone ? ` • ${farmsItem.agro_ecological_zone}` : ''}
                            {farmsItem?.area_hectares ? ` • ${farmsItem.area_hectares} ha` : ''}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setCreateFarmActivitiesOpen(true)} className="rounded-md shadow-md hover:shadow-lg transition-all duration-200">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Activity
                    </Button>
                    <Button onClick={() => setCreatePestSightingsOpen(true)} variant="outline" className="rounded-md">
                        <Plus className="mr-2 h-4 w-4" />
                        Report Pest Sighting
                    </Button>
                    <Button onClick={() => setEditFarmsTarget(farmsItem)} variant="outline" className="rounded-md">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Field
                    </Button>
                </div>
            </div>

            {/* LOADING */}
            {loadingFarmsItem && !farmsItem && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl lg:col-span-2" />
                </div>
            )}

            {/* FARM DETAIL CARDS */}
            {farmsItem && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* FIELD INFO CARD */}
                    <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl overflow-hidden">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                <TreePine className="h-5 w-5 text-primary" />
                                Field Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{farmsItem.district || '—'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                    <span>{farmsItem.agro_ecological_zone || '—'}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Sprout className="h-4 w-4 text-muted-foreground" />
                                    <span>{farmsItem.soil_type || '—'}</span>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Area</p>
                                <p className="text-2xl font-heading text-primary">{farmsItem.area_hectares ?? '—'} ha</p>
                            </div>
                            {farmsItem.gps_boundary && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">GPS Boundary</p>
                                        <p className="text-xs text-muted-foreground break-all bg-muted/30 rounded-md p-2">{farmsItem.gps_boundary}</p>
                                    </div>
                                </>
                            )}
                            {farmsItem.soil_analysis && typeof farmsItem.soil_analysis === 'object' && Object.keys(farmsItem.soil_analysis).length > 0 && (
                                <>
                                    <Separator />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Soil Analysis</p>
                                        <div className="space-y-1.5">
                                            {Object.entries(farmsItem.soil_analysis).map(([key, value]) => (
                                                <div key={key} className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                                                    <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                            {farmsItem.created_at && (
                                <>
                                    <Separator />
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        Registered {new Date(farmsItem.created_at).toLocaleDateString()}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* CROPS CARD */}
                    <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl lg:col-span-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                <Sprout className="h-5 w-5 text-primary" />
                                Registered Crops & Growth Stages
                            </CardTitle>
                            <CardDescription>Crops currently planted with their current growth stage.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {farmsItem.crops && farmsItem.crops.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {farmsItem.crops.map((crop) => (
                                        <div key={crop.id} className="rounded-lg border border-border/60 bg-background/60 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors duration-200">
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <p className="font-medium">{crop.name}</p>
                                                <Badge variant="secondary" className="shrink-0 text-xs">
                                                    {crop.growth_stage}
                                                </Badge>
                                            </div>
                                            {crop.planting_date && (
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    Planted {new Date(crop.planting_date).toLocaleDateString()}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No crops registered for this field.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* TABS: Overview | Activity Log | Pest Sightings */}
            {farmsItem && (
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full max-w-lg grid-cols-3 bg-muted/40 backdrop-blur-sm">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="activities">Activity Log</TabsTrigger>
                        <TabsTrigger value="pests">Pest Sightings</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-4">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader>
                                <CardTitle className="font-heading">Field Summary</CardTitle>
                                <CardDescription>Quick overview of this field's current state and statistics.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-center">
                                        <p className="text-2xl font-heading text-primary">{farmsItem.crops?.length ?? 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Crops</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-center">
                                        <p className="text-2xl font-heading text-primary">{farmsItem.area_hectares ?? '—'}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Hectares</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-center">
                                        <p className="text-2xl font-heading text-primary">{farmActivitiesTotal}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Activities Logged</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-center">
                                        <p className="text-2xl font-heading text-primary">{pestSightingsTotal}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Pest Sightings</p>
                                    </div>
                                    <div className="rounded-lg border border-border/60 bg-background/60 p-4 text-center col-span-2 md:col-span-4">
                                        <p className="text-2xl font-heading text-primary">{farmsItem.active_alerts ?? 0}</p>
                                        <p className="text-xs text-muted-foreground mt-1">Active Weather Alerts &amp; Recommendations</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ACTIVITY LOG TAB */}
                    <TabsContent value="activities" className="space-y-4">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="font-heading">Activity Log</CardTitle>
                                    <CardDescription>All dated activity entries recorded for this field.</CardDescription>
                                </div>
                                <Button onClick={() => setCreateFarmActivitiesOpen(true)} size="sm" className="rounded-md shadow-md">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Activity
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loadingFarmActivities ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                                    </div>
                                ) : farmActivities.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                    <TableHead className="font-heading">Date</TableHead>
                                                    <TableHead className="font-heading">Type</TableHead>
                                                    <TableHead className="font-heading">Description</TableHead>
                                                    <TableHead className="font-heading">Inputs Used</TableHead>
                                                    <TableHead className="font-heading">Qty</TableHead>
                                                    <TableHead className="text-right font-heading">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {farmActivities.map((row, idx) => (
                                                    <TableRow key={row.id} className={idx % 2 === 0 ? 'bg-muted/10' : ''}>
                                                        <TableCell className="font-medium whitespace-nowrap">
                                                            {new Date(row.activity_date).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline" className="capitalize">{row.activity_type}</Badge>
                                                        </TableCell>
                                                        <TableCell className="max-w-[200px] truncate">{row.description || '—'}</TableCell>
                                                        <TableCell className="max-w-[150px] truncate">{row.inputs_used || '—'}</TableCell>
                                                        <TableCell>{row.quantity ?? '—'}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => setEditFarmActivitiesTarget(row)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => setDeleteFarmActivityTarget(row)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {/* Pagination */}
                                        {Math.ceil(farmActivitiesTotal / farmActivitiesLimit) > 1 && (
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground">
                                                    Page {farmActivitiesPage} of {Math.ceil(farmActivitiesTotal / farmActivitiesLimit)}
                                                </p>
                                                <Pagination>
                                                    <PaginationContent>
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() => setFarmActivitiesPage((p) => Math.max(1, p - 1))}
                                                                className={cn(farmActivitiesPage <= 1 && 'pointer-events-none opacity-50')}
                                                                aria-label="Previous page"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() => setFarmActivitiesPage((p) => Math.min(Math.ceil(farmActivitiesTotal / farmActivitiesLimit), p + 1))}
                                                                className={cn(farmActivitiesPage >= Math.ceil(farmActivitiesTotal / farmActivitiesLimit) && 'pointer-events-none opacity-50')}
                                                                aria-label="Next page"
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    </PaginationContent>
                                                </Pagination>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No activities logged yet. Click "Add Activity" to record one.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PEST SIGHTINGS TAB */}
                    <TabsContent value="pests" className="space-y-4">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="font-heading">Pest Sightings</CardTitle>
                                    <CardDescription>Observed pest and disease sightings reported for this field.</CardDescription>
                                </div>
                                <Button onClick={() => setCreatePestSightingsOpen(true)} size="sm" className="rounded-md shadow-md">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Report Sighting
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loadingPestSightings ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-md" />)}
                                    </div>
                                ) : pestSightings.length > 0 ? (
                                    <>
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                    <TableHead className="font-heading">Date</TableHead>
                                                    <TableHead className="font-heading">Pest</TableHead>
                                                    <TableHead className="font-heading">Crop Affected</TableHead>
                                                    <TableHead className="font-heading">Severity</TableHead>
                                                    <TableHead className="font-heading">Area (ha)</TableHead>
                                                    <TableHead className="text-right font-heading">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {pestSightings.map((row, idx) => (
                                                    <TableRow key={row.id} className={idx % 2 === 0 ? 'bg-muted/10' : ''}>
                                                        <TableCell className="font-medium whitespace-nowrap">
                                                            {new Date(row.sighting_date).toLocaleDateString()}
                                                        </TableCell>
                                                        <TableCell>{row.pest_name || '—'}</TableCell>
                                                        <TableCell>{row.crop_affected || '—'}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={
                                                                row.severity_estimate === 'high' ? 'destructive' :
                                                                row.severity_estimate === 'medium' ? 'secondary' : 'outline'
                                                            } className="capitalize">
                                                                {row.severity_estimate || '—'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>{row.area_affected_hectares ?? '—'}</TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                        <MoreVertical className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => setEditPestSightingsTarget(row)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => setDeletePestSightingTarget(row)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                        {/* Pagination */}
                                        {Math.ceil(pestSightingsTotal / pestSightingsLimit) > 1 && (
                                            <div className="mt-4 flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground">
                                                    Page {pestSightingsPage} of {Math.ceil(pestSightingsTotal / pestSightingsLimit)}
                                                </p>
                                                <Pagination>
                                                    <PaginationContent>
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() => setPestSightingsPage((p) => Math.max(1, p - 1))}
                                                                className={cn(pestSightingsPage <= 1 && 'pointer-events-none opacity-50')}
                                                                aria-label="Previous page"
                                                            >
                                                                <ChevronLeft className="h-4 w-4" />
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                        <PaginationItem>
                                                            <PaginationLink
                                                                onClick={() => setPestSightingsPage((p) => Math.min(Math.ceil(pestSightingsTotal / pestSightingsLimit), p + 1))}
                                                                className={cn(pestSightingsPage >= Math.ceil(pestSightingsTotal / pestSightingsLimit) && 'pointer-events-none opacity-50')}
                                                                aria-label="Next page"
                                                            >
                                                                <ChevronRight className="h-4 w-4" />
                                                            </PaginationLink>
                                                        </PaginationItem>
                                                    </PaginationContent>
                                                </Pagination>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No pest sightings reported yet. Click "Report Sighting" to add one.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* EDIT FARM DIALOG */}
            <EditFarmDialog
                farm={editFarmsTarget}
                crops={crops}
                onOpenChange={(open) => !open && setEditFarmsTarget(null)}
                onSubmit={handleUpdateFarms}
                onSaved={() => { void loadFarmsItem(); }}
            />

            {/* CREATE ACTIVITY DIALOG */}
            <CreateActivityDialog
                open={createFarmActivitiesOpen}
                onOpenChange={setCreateFarmActivitiesOpen}
                farmId={id}
                onSubmit={handleCreateFarmActivities}
            />

            {/* EDIT ACTIVITY DIALOG */}
            <EditActivityDialog
                activity={editFarmActivitiesTarget}
                onOpenChange={(open) => !open && setEditFarmActivitiesTarget(null)}
                onSubmit={handleUpdateFarmActivities}
            />

            {/* CREATE PEST SIGHTING DIALOG */}
            <CreatePestSightingDialog
                open={createPestSightingsOpen}
                onOpenChange={setCreatePestSightingsOpen}
                farmId={id}
                pests={pests}
                onSubmit={handleCreatePestSightings}
            />

            {/* EDIT PEST SIGHTING DIALOG */}
            <EditPestSightingDialog
                sighting={editPestSightingsTarget}
                onOpenChange={(open) => !open && setEditPestSightingsTarget(null)}
                onSubmit={handleUpdatePestSightings}
            />

            {/* DELETE FARM ACTIVITY CONFIRMATION */}
            <AlertDialog open={!!deleteFarmActivityTarget} onOpenChange={(open) => !open && setDeleteFarmActivityTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Activity</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this activity entry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeleteFarmActivityTarget(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteFarmActivityTarget) {
                                    handleDeleteFarmActivities({ id: deleteFarmActivityTarget.id });
                                    setDeleteFarmActivityTarget(null);
                                }
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* DELETE PEST SIGHTING CONFIRMATION */}
            <AlertDialog open={!!deletePestSightingTarget} onOpenChange={(open) => !open && setDeletePestSightingTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Pest Sighting</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this pest sighting record? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletePestSightingTarget(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deletePestSightingTarget) {
                                    handleDeletePestSightings({ id: deletePestSightingTarget.id });
                                    setDeletePestSightingTarget(null);
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

/* ---------- Helper Components ---------- */

function EditFarmDialog({
    farm,
    crops: _crops,
    onOpenChange,
    onSubmit,
    onSaved,
}: {
    farm: Farm | null;
    crops: Crop[];
    onOpenChange: (v: boolean) => void;
    onSubmit: (data: FarmsUpdateParams) => void;
    onSaved: () => void;
}) {
    const [cropComboOpen, setCropComboOpen] = useState(false);
    const [cropComboSearch, setCropComboSearch] = useState('');
    const [comboCrops, setComboCrops] = useState<Crop[]>([]);
    const [loadingComboCrops, setLoadingComboCrops] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<FarmsUpdateInput>({
        resolver: zodResolver(farmsUpdateSchema),
        values: farm ? {
            farm_name: farm.farm_name,
            area_hectares: farm.area_hectares,
            soil_type: farm.soil_type,
            gps_boundary: farm.gps_boundary,
            crop_ids: farm.crops?.map((c) => c.id) ?? [],
            growth_stage: farm.crops?.[0]?.growth_stage ?? '',
        } : undefined,
    });

    const selectedCropIds = watch('crop_ids') ?? [];

    // Debounced search for crops
    useEffect(() => {
        if (!cropComboOpen) return;
        setLoadingComboCrops(true);
        const timer = setTimeout(async () => {
            try {
                const res = await cropsService.list({ page: 1, limit: 20, search: cropComboSearch || undefined });
                setComboCrops(Array.isArray(res?.data) ? res.data : []);
            } catch {
                setComboCrops([]);
            } finally {
                setLoadingComboCrops(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [cropComboSearch, cropComboOpen]);

    // Load initial crops when dialog opens
    useEffect(() => {
        if (farm) {
            void (async () => {
                try {
                    setLoadingComboCrops(true);
                    const res = await cropsService.list({ page: 1, limit: 20 });
                    setComboCrops(Array.isArray(res?.data) ? res.data : []);
                } catch {
                    setComboCrops([]);
                } finally {
                    setLoadingComboCrops(false);
                }
            })();
        }
    }, [farm]);

    function toggleCrop(cropId: string) {
        const current = selectedCropIds;
        const next = current.includes(cropId)
            ? current.filter((id) => id !== cropId)
            : [...current, cropId];
        setValue('crop_ids', next);
    }

    return (
        <Dialog open={!!farm} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Edit Field</DialogTitle>
                    <DialogDescription>Update this field's information, crops, and growth stage.</DialogDescription>
                </DialogHeader>
                {farm && (
                    <form
                        onSubmit={handleSubmit((data) => {
                            onSubmit({ id: farm.id, ...data } as FarmsUpdateParams);
                            reset();
                            onSaved();
                        })}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_farm_name">Farm Name</Label>
                                <Input id="edit_farm_name" {...register('farm_name')} className="bg-background" />
                                {errors.farm_name && <p className="text-xs text-destructive">{errors.farm_name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_area">Area (hectares)</Label>
                                <Input id="edit_area" type="number" step="0.01" {...register('area_hectares')} className="bg-background" />
                                {errors.area_hectares && <p className="text-xs text-destructive">{errors.area_hectares.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_soil_type">Soil Type</Label>
                                <Input id="edit_soil_type" {...register('soil_type')} className="bg-background" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_growth_stage">Growth Stage</Label>
                                <Input id="edit_growth_stage" {...register('growth_stage')} placeholder="e.g. vegetative, flowering" className="bg-background" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit_gps">GPS Boundary</Label>
                                <Textarea id="edit_gps" {...register('gps_boundary')} rows={2} className="bg-background" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label>Crops</Label>
                                <Popover open={cropComboOpen} onOpenChange={setCropComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={cropComboOpen}
                                            className="w-full justify-between bg-background font-normal"
                                        >
                                            {selectedCropIds.length > 0
                                                ? `${selectedCropIds.length} crop${selectedCropIds.length > 1 ? 's' : ''} selected`
                                                : 'Select crops'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search crops…" value={cropComboSearch} onValueChange={setCropComboSearch} />
                                            <CommandList>
                                                <CommandEmpty>{loadingComboCrops ? 'Loading…' : 'No crop found.'}</CommandEmpty>
                                                <CommandGroup>
                                                    {comboCrops.map((crop) => (
                                                        <CommandItem
                                                            key={crop.id}
                                                            value={crop.name}
                                                            onSelect={() => toggleCrop(crop.id)}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', selectedCropIds.includes(crop.id) ? 'opacity-100' : 'opacity-0')} />
                                                            {crop.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedCropIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {selectedCropIds.map((cid) => {
                                            const crop = comboCrops.find((c) => c.id === cid);
                                            return crop ? (
                                                <Badge key={cid} variant="secondary" className="text-xs">
                                                    {crop.name}
                                                    <button type="button" className="ml-1 hover:text-destructive" onClick={() => toggleCrop(cid)}>×</button>
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                                {isSubmitting ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CreateActivityDialog({
    open,
    onOpenChange,
    farmId,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    farmId: string;
    onSubmit: (data: FarmActivitiesCreateParams) => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FarmActivitiesCreateInput>({
        resolver: zodResolver(farmActivitiesCreateSchema),
        defaultValues: { farm_id: farmId },
    });

    useEffect(() => {
        if (open) reset({ farm_id: farmId });
    }, [open, farmId, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Log New Activity</DialogTitle>
                    <DialogDescription>Record a dated activity entry with observations for this field.</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) => {
                        onSubmit({ ...data, farm_id: farmId } as FarmActivitiesCreateParams);
                        reset({ farm_id: farmId });
                    })}
                    className="space-y-4"
                >
                    <input type="hidden" {...register('farm_id')} value={farmId} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="activity_date">Activity Date <span className="text-destructive">*</span></Label>
                            <Input id="activity_date" type="date" {...register('activity_date')} className="bg-background" />
                            {errors.activity_date && <p className="text-xs text-destructive">{errors.activity_date.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="activity_type">Activity Type <span className="text-destructive">*</span></Label>
                            <Input id="activity_type" {...register('activity_type')} placeholder="e.g. planting, spraying, irrigation" className="bg-background" />
                            {errors.activity_type && <p className="text-xs text-destructive">{errors.activity_type.message}</p>}
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register('description')} rows={3} placeholder="Describe the activity" className="bg-background" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="observations">Observations</Label>
                            <Textarea id="observations" {...register('observations')} rows={2} placeholder="Any observations during the activity" className="bg-background" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="inputs_used">Inputs Used</Label>
                            <Input id="inputs_used" {...register('inputs_used')} placeholder="e.g. fertilizer, pesticide" className="bg-background" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="quantity">Quantity</Label>
                            <Input id="quantity" type="number" step="0.01" {...register('quantity')} className="bg-background" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="notes">Notes</Label>
                            <Textarea id="notes" {...register('notes')} rows={2} className="bg-background" />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                            {isSubmitting ? 'Saving…' : 'Save Activity'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditActivityDialog({
    activity,
    onOpenChange,
    onSubmit,
}: {
    activity: FarmActivity | null;
    onOpenChange: (v: boolean) => void;
    onSubmit: (data: FarmActivitiesUpdateParams) => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FarmActivitiesUpdateInput>({
        resolver: zodResolver(farmActivitiesUpdateSchema),
        values: activity ? {
            activity_date: activity.activity_date,
            activity_type: activity.activity_type,
            description: activity.description,
            observations: activity.observations,
            inputs_used: activity.inputs_used,
            quantity: activity.quantity,
            notes: activity.notes,
        } : undefined,
    });

    return (
        <Dialog open={!!activity} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Edit Activity</DialogTitle>
                    <DialogDescription>Update this activity entry's details and observations.</DialogDescription>
                </DialogHeader>
                {activity && (
                    <form
                        onSubmit={handleSubmit((data) => {
                            onSubmit({ id: activity.id, ...data } as FarmActivitiesUpdateParams);
                            reset();
                        })}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_act_date">Activity Date</Label>
                                <Input id="edit_act_date" type="date" {...register('activity_date')} className="bg-background" />
                                {errors.activity_date && <p className="text-xs text-destructive">{errors.activity_date.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_act_type">Activity Type</Label>
                                <Input id="edit_act_type" {...register('activity_type')} className="bg-background" />
                                {errors.activity_type && <p className="text-xs text-destructive">{errors.activity_type.message}</p>}
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit_act_desc">Description</Label>
                                <Textarea id="edit_act_desc" {...register('description')} rows={3} className="bg-background" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit_act_obs">Observations</Label>
                                <Textarea id="edit_act_obs" {...register('observations')} rows={2} className="bg-background" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_act_inputs">Inputs Used</Label>
                                <Input id="edit_act_inputs" {...register('inputs_used')} className="bg-background" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_act_qty">Quantity</Label>
                                <Input id="edit_act_qty" type="number" step="0.01" {...register('quantity')} className="bg-background" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit_act_notes">Notes</Label>
                                <Textarea id="edit_act_notes" {...register('notes')} rows={2} className="bg-background" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                                {isSubmitting ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function CreatePestSightingDialog({
    open,
    onOpenChange,
    farmId,
    pests: _pests,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    farmId: string;
    pests: Pest[];
    onSubmit: (data: PestSightingsCreateParams) => void;
}) {
    const [pestComboOpen, setPestComboOpen] = useState(false);
    const [pestComboSearch, setPestComboSearch] = useState('');
    const [comboPests, setComboPests] = useState<Pest[]>([]);
    const [loadingComboPests, setLoadingComboPests] = useState(false);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = useForm<PestSightingsCreateInput>({
        resolver: zodResolver(pestSightingsCreateSchema),
        defaultValues: { farm_id: farmId },
    });

    const selectedPestId = watch('pest_id');

    // Debounced search for pests
    useEffect(() => {
        if (!pestComboOpen) return;
        setLoadingComboPests(true);
        const timer = setTimeout(async () => {
            try {
                const res = await pestsService.list({ page: 1, limit: 20, search: pestComboSearch || undefined });
                setComboPests(Array.isArray(res?.data) ? res.data : []);
            } catch {
                setComboPests([]);
            } finally {
                setLoadingComboPests(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [pestComboSearch, pestComboOpen]);

    useEffect(() => {
        if (open) {
            reset({ farm_id: farmId });
            setValue('farm_id', farmId);
            setPestComboSearch('');
            // Load initial pests
            void (async () => {
                try {
                    setLoadingComboPests(true);
                    const res = await pestsService.list({ page: 1, limit: 20 });
                    setComboPests(Array.isArray(res?.data) ? res.data : []);
                } catch {
                    setComboPests([]);
                } finally {
                    setLoadingComboPests(false);
                }
            })();
        }
    }, [open, farmId, reset, setValue]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Report Pest Sighting</DialogTitle>
                    <DialogDescription>Submit an observed pest or disease sighting from this field.</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) => {
                        onSubmit({ ...data, farm_id: farmId } as PestSightingsCreateParams);
                        reset({ farm_id: farmId });
                    })}
                    className="space-y-4"
                >
                    <input type="hidden" {...register('farm_id')} value={farmId} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label>Pest / Disease <span className="text-destructive">*</span></Label>
                            <Popover open={pestComboOpen} onOpenChange={setPestComboOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={pestComboOpen}
                                        className="w-full justify-between bg-background font-normal"
                                    >
                                        {selectedPestId
                                            ? comboPests.find((p) => p.id === selectedPestId)?.name ?? 'Selected pest'
                                            : 'Select pest or disease'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search pests…" value={pestComboSearch} onValueChange={setPestComboSearch} />
                                        <CommandList>
                                            <CommandEmpty>{loadingComboPests ? 'Loading…' : 'No pest found.'}</CommandEmpty>
                                            <CommandGroup>
                                                {comboPests.map((pest) => (
                                                    <CommandItem
                                                        key={pest.id}
                                                        value={pest.name}
                                                        onSelect={() => {
                                                            setValue('pest_id', pest.id);
                                                            setPestComboOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', selectedPestId === pest.id ? 'opacity-100' : 'opacity-0')} />
                                                        {pest.name}
                                                        {pest.type && <span className="ml-auto text-xs text-muted-foreground">{pest.type}</span>}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <input type="hidden" {...register('pest_id')} />
                            {errors.pest_id && <p className="text-xs text-destructive">{errors.pest_id.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="sighting_date">Sighting Date <span className="text-destructive">*</span></Label>
                            <Input id="sighting_date" type="date" {...register('sighting_date')} className="bg-background" />
                            {errors.sighting_date && <p className="text-xs text-destructive">{errors.sighting_date.message}</p>}
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="crop_affected">Crop Affected</Label>
                            <Input id="crop_affected" {...register('crop_affected')} placeholder="e.g. Maize, Beans" className="bg-background" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="severity_estimate">Severity</Label>
                            <Input id="severity_estimate" {...register('severity_estimate')} placeholder="low / medium / high" className="bg-background" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="area_affected">Area Affected (ha)</Label>
                            <Input id="area_affected" type="number" step="0.01" {...register('area_affected_hectares')} className="bg-background" />
                        </div>
                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="pest_notes">Notes</Label>
                            <Textarea id="pest_notes" {...register('notes')} rows={3} placeholder="Describe the sighting in detail" className="bg-background" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="gps_lat">GPS Latitude</Label>
                            <Input id="gps_lat" type="number" step="0.000001" {...register('gps_lat')} className="bg-background" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="gps_lng">GPS Longitude</Label>
                            <Input id="gps_lng" type="number" step="0.000001" {...register('gps_lng')} className="bg-background" />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                            {isSubmitting ? 'Submitting…' : 'Submit Sighting'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditPestSightingDialog({
    sighting,
    onOpenChange,
    onSubmit,
}: {
    sighting: PestSighting | null;
    onOpenChange: (v: boolean) => void;
    onSubmit: (data: PestSightingsUpdateParams) => void;
}) {
    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<PestSightingsUpdateInput>({
        resolver: zodResolver(pestSightingsUpdateSchema),
        values: sighting ? {
            sighting_date: sighting.sighting_date,
            severity_estimate: sighting.severity_estimate,
            area_affected_hectares: sighting.area_affected_hectares,
            notes: sighting.notes,
        } : undefined,
    });

    return (
        <Dialog open={!!sighting} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Edit Pest Sighting</DialogTitle>
                    <DialogDescription>Update this sighting record's observation details.</DialogDescription>
                </DialogHeader>
                {sighting && (
                    <form
                        onSubmit={handleSubmit((data) => {
                            onSubmit({ id: sighting.id, ...data } as PestSightingsUpdateParams);
                            reset();
                        })}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_sight_date">Sighting Date</Label>
                                <Input id="edit_sight_date" type="date" {...register('sighting_date')} className="bg-background" />
                                {errors.sighting_date && <p className="text-xs text-destructive">{errors.sighting_date.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_severity">Severity</Label>
                                <Input id="edit_severity" {...register('severity_estimate')} placeholder="low / medium / high" className="bg-background" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_area_aff">Area Affected (ha)</Label>
                                <Input id="edit_area_aff" type="number" step="0.01" {...register('area_affected_hectares')} className="bg-background" />
                            </div>
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit_sight_notes">Notes</Label>
                                <Textarea id="edit_sight_notes" {...register('notes')} rows={3} className="bg-background" />
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                                {isSubmitting ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
