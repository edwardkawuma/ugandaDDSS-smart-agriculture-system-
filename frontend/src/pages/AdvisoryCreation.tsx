import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
    Plus,
    Search,
    Filter,
    Megaphone,
    FileText,
    Loader2,
    MoreVertical,
    Pencil,
    Eye,
    Trash2,
    ArrowLeft,
    ArrowRight,
    Send,
    Check,
    Link2,
    ChevronsUpDown,
} from 'lucide-react';
import {
    advisoriesService,
    type AdvisoriesCreateParams,
    type AdvisoriesCreateResponse,
    type AdvisoriesDeleteParams,
    type AdvisoriesDeleteResponse,
    type AdvisoriesDetailParams,
    type AdvisoriesDetailResponse,
    type AdvisoriesListParams,
    type AdvisoriesListResponse,
    type AdvisoriesUpdateParams,
    type AdvisoriesUpdateResponse,
} from '@/lib/api/advisoriesService';
import {
    advisoriesCreateSchema,
    advisoriesUpdateSchema,
} from '@/lib/api/advisoriesFormSchema';
import {
    cropsService,
    type CropsListParams,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    districtsService,
    type DistrictsListParams,
    type DistrictsListResponse,
} from '@/lib/api/districtsService';
import {
    alertsService,
    type AlertsActiveListParams,
    type AlertsActiveListResponse,
} from '@/lib/api/alertsService';

type Advisory = AdvisoriesListResponse['data'][number];
type Crop = CropsListResponse['data'][number];
type District = DistrictsListResponse['data'][number];
type Alert = AlertsActiveListResponse['data'][number];

export default function AdvisoryCreation() {


    // List state — GET /advisories/list
    const [advisories, setAdvisories] = useState<Advisory[]>([]);
    const [loadingAdvisories, setLoadingAdvisories] = useState(true);
    const [advisoriesPage, setAdvisoriesPage] = useState(1);
    const [advisoriesLimit] = useState(10);
    const [advisoriesTotal, setAdvisoriesTotal] = useState(0);
    // List state — GET /crops/list
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [cropsPage, setCropsPage] = useState(1);
    const [cropsLimit] = useState(10);
    const [cropsTotal, setCropsTotal] = useState(0);
    // List state — GET /districts/list
    const [districts, setDistricts] = useState<District[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(true);
    const [districtsPage, setDistrictsPage] = useState(1);
    const [districtsLimit] = useState(10);
    const [districtsTotal, setDistrictsTotal] = useState(0);
    // Create dialog state — POST /advisories/create
    const [createAdvisoriesOpen, setCreateAdvisoriesOpen] = useState(false);
    // Edit dialog state — PUT /advisories/update
    const [editAdvisoriesTarget, setEditAdvisoriesTarget] = useState<Advisory | null>(null);
    // Detail state — GET /advisories/detail
    const [advisoriesItem, setAdvisoriesItem] = useState<AdvisoriesDetailResponse['data'] | null>(null);
    const [loadingAdvisoriesItem, setLoadingAdvisoriesItem] = useState(false);
    // ↑ Advisory is the singular row type
    // List state — GET /alerts/active/list
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [alertsPage, setAlertsPage] = useState(1);
    const [alertsLimit] = useState(10);
    const [alertsTotal, setAlertsTotal] = useState(0);

    // Local UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCrop, setFilterCrop] = useState('all');
    const [filterDistrict, setFilterDistrict] = useState('all');
    const [wizardStep, setWizardStep] = useState(0);

    // Debounced search state for form lookup comboboxes
    const [cropSearch, setCropSearch] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');
    const [alertSearch, setAlertSearch] = useState('');
    const [searchCrops, setSearchCrops] = useState<Crop[]>([]);
    const [searchDistricts, setSearchDistricts] = useState<District[]>([]);
    const [searchAlerts, setSearchAlerts] = useState<Alert[]>([]);
    const cropSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const districtSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const alertSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [detailAdvisory, setDetailAdvisory] = useState<Advisory | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Advisory | null>(null);

    // Create form (react-hook-form + zod)
    const createForm = useForm<AdvisoriesCreateParams>({
        resolver: zodResolver(advisoriesCreateSchema),
        defaultValues: {
            title: '',
            content: '',
            target_crop_ids: [],
            target_district_ids: [],
            farmer_segment: '',
            linked_alert_id: undefined,
            status: 'draft',
        },
    });

    // Edit form (react-hook-form + zod, values seeded from edit target)
    const editForm = useForm<AdvisoriesUpdateParams>({
        resolver: zodResolver(advisoriesUpdateSchema),
        values: editAdvisoriesTarget
            ? {
                  id: editAdvisoriesTarget.id,
                  title: editAdvisoriesTarget.title,
                  content: editAdvisoriesTarget.content,
                  target_crop_ids: (editAdvisoriesTarget as any).target_crop_ids ?? [],
                  target_district_ids: (editAdvisoriesTarget as any).target_district_ids ?? [],
                  farmer_segment: (editAdvisoriesTarget as any).farmer_segment ?? '',
                  linked_alert_id: editAdvisoriesTarget.linked_alert_id ?? '',
                  status: editAdvisoriesTarget.status ?? 'draft',
              }
            : undefined,
    });

    // Derived: filtered advisories list
    const filteredAdvisories = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return advisories.filter((row) => {
            const matchesStatus = filterStatus === 'all' || row.status === filterStatus;
            const matchesCrop = filterCrop === 'all' || (row.target_crops ?? []).includes(filterCrop);
            const matchesDistrict = filterDistrict === 'all' || (row.target_districts ?? []).includes(filterDistrict);
            const matchesTerm = !term || (row.title ?? '').toLowerCase().includes(term);
            return matchesStatus && matchesCrop && matchesDistrict && matchesTerm;
        });
    }, [advisories, searchTerm, filterStatus, filterCrop, filterDistrict]);

    useEffect(() => { void loadAdvisories(); }, [advisoriesPage, filterStatus, filterCrop, filterDistrict, searchTerm]);
    useEffect(() => { void loadCrops(); }, [cropsPage]);
    useEffect(() => { void loadDistricts(); }, [districtsPage]);
    useEffect(() => { void loadAlerts(); }, [alertsPage]);

    async function loadAdvisories() {
        try {
            setLoadingAdvisories(true);
            const params: AdvisoriesListParams = { page: advisoriesPage, limit: advisoriesLimit };
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterCrop !== 'all') params.crop = filterCrop;
            if (filterDistrict !== 'all') params.district = filterDistrict;
            if (searchTerm.trim()) params.search = searchTerm.trim();
            const res = await advisoriesService.list(params);
            setAdvisories(Array.isArray(res?.data) ? res.data : []);
            setAdvisoriesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load advisories');
            console.error('[loadAdvisories]', err);
        } finally {
            setLoadingAdvisories(false);
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
    async function loadDistricts() {
        try {
            setLoadingDistricts(true);
            const res = await districtsService.list({ page: districtsPage, limit: districtsLimit });
            setDistricts(Array.isArray(res?.data) ? res.data : []);
            setDistrictsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districts');
            console.error('[loadDistricts]', err);
        } finally {
            setLoadingDistricts(false);
        }
    }
    async function handleCreateAdvisories(data: AdvisoriesCreateParams) {
        try {
            await advisoriesService.create(data);
            toast.success('Created');
            setCreateAdvisoriesOpen(false);
            void loadAdvisories();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateAdvisories]', err);
        }
    }
    async function handleUpdateAdvisories(data: AdvisoriesUpdateParams) {
        try {
            await advisoriesService.update(data);
            toast.success('Updated');
            setEditAdvisoriesTarget(null);
            void loadAdvisories();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateAdvisories]', err);
        }
    }
    async function handleDeleteAdvisories(params: AdvisoriesDeleteParams) {
        try {
            await advisoriesService.delete(params);
            toast.success('Deleted');
            void loadAdvisories();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteAdvisories]', err);
        }
    }
    async function loadAdvisoriesItem(targetId: string) {
        try {
            setLoadingAdvisoriesItem(true);
            const res = await advisoriesService.detail({ id: targetId });
            setAdvisoriesItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadAdvisoriesItem]', err);
        } finally {
            setLoadingAdvisoriesItem(false);
        }
    }
    async function loadAlerts() {
        try {
            setLoadingAlerts(true);
            const res = await alertsService.activeList({ page: alertsPage, limit: alertsLimit });
            setAlerts(Array.isArray(res?.data) ? res.data : []);
            setAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load alerts');
            console.error('[loadAlerts]', err);
        } finally {
            setLoadingAlerts(false);
        }
    }

    // Debounced search handlers for form lookup comboboxes
    const handleCropSearchChange = useCallback((value: string) => {
        setCropSearch(value);
        if (cropSearchTimer.current) clearTimeout(cropSearchTimer.current);
        cropSearchTimer.current = setTimeout(async () => {
            try {
                const res = await cropsService.list({ search: value, limit: 20 });
                setSearchCrops(Array.isArray(res?.data) ? res.data : []);
            } catch {
                // silently ignore
            }
        }, 300);
    }, []);

    const handleDistrictSearchChange = useCallback((value: string) => {
        setDistrictSearch(value);
        if (districtSearchTimer.current) clearTimeout(districtSearchTimer.current);
        districtSearchTimer.current = setTimeout(async () => {
            try {
                const res = await districtsService.list({ search: value, limit: 20 });
                setSearchDistricts(Array.isArray(res?.data) ? res.data : []);
            } catch {
                // silently ignore
            }
        }, 300);
    }, []);

    const handleAlertSearchChange = useCallback((value: string) => {
        setAlertSearch(value);
        if (alertSearchTimer.current) clearTimeout(alertSearchTimer.current);
        alertSearchTimer.current = setTimeout(async () => {
            try {
                const res = await alertsService.activeList({ page: 1, limit: 20, ...(value ? { search: value } : {}) } as AlertsActiveListParams);
                setSearchAlerts(Array.isArray(res?.data) ? res.data : []);
            } catch {
                // silently ignore
            }
        }, 300);
    }, []);

    // Effective lookup lists: use search results when a search is active, else fall back to pre-loaded list
    const effectiveCrops = cropSearch ? searchCrops : crops;
    const effectiveDistricts = districtSearch ? searchDistricts : districts;
    const effectiveAlerts = alertSearch ? searchAlerts : alerts;

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: Advisory Creation
        DESCRIPTION: A content authoring interface where Extension Workers create, manage, draft, and publish crop-specific agricultural advisories for farmer groups or districts in their coverage area. Advisories can be linked to active pest or disease alerts and seasonal weather triggers, ensuring communication is timely and contextually relevant. Extension workers select target crops, districts, and farmer segments, then draft recommendations using structured templates aligned with NAADS guidelines and MAAIF-approved practices. Published advisories are automatically pushed to affected farmers via Twilio SMS and SendGrid email notifications, with delivery status tracking.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - advisories (array)              — list data, auto-loaded on mount and on advisoriesPage change
          - loadingAdvisories (boolean)
          - advisoriesPage / setAdvisoriesPage  — pagination state
          - advisoriesTotal (number)         — total record count for pagination UI
          - loadAdvisories() — call to reload the list
          - crops (array)              — list data, auto-loaded on mount and on cropsPage change
          - loadingCrops (boolean)
          - cropsPage / setCropsPage  — pagination state
          - cropsTotal (number)         — total record count for pagination UI
          - loadCrops() — call to reload the list
          - districts (array)              — list data, auto-loaded on mount and on districtsPage change
          - loadingDistricts (boolean)
          - districtsPage / setDistrictsPage  — pagination state
          - districtsTotal (number)         — total record count for pagination UI
          - loadDistricts() — call to reload the list
          - createAdvisoriesOpen / setCreateAdvisoriesOpen  — wrap the create form in <Dialog open={createAdvisoriesOpen}>
          - handleCreateAdvisories(data: AdvisoriesCreateParams) — call from create form submit
          - VALIDATION: import { advisoriesCreateSchema } from '@/lib/api/advisoriesFormSchema' and wire useForm({ resolver: zodResolver(advisoriesCreateSchema) }); it already encodes required fields — submit via handleSubmit so an incomplete form can't POST. Show errors.{field}?.message under each input.
          - editAdvisoriesTarget / setEditAdvisoriesTarget — set to the row being edited; wrap edit form in <Dialog open={!!editAdvisoriesTarget}>
          - handleUpdateAdvisories(data: AdvisoriesUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { advisoriesUpdateSchema } from '@/lib/api/advisoriesFormSchema' and wire useForm({ resolver: zodResolver(advisoriesUpdateSchema), values: editAdvisoriesTarget ?? undefined }); submit via handleSubmit.
          - handleDeleteAdvisories(params: AdvisoriesDeleteParams) — call from delete confirmation
          - advisoriesItem (object or null)  — detail data
          - loadingAdvisoriesItem (boolean)
          - loadAdvisoriesItem(id: string) — call to (re)load
          - alerts (array)              — list data, auto-loaded on mount and on alertsPage change
          - loadingAlerts (boolean)
          - alertsPage / setAlertsPage  — pagination state
          - alertsTotal (number)         — total record count for pagination UI
          - loadAlerts() — call to reload the list

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
        <div className="p-6 md:p-8 space-y-8 font-sans">
            {/* Page hero */}
            <div className="relative overflow-hidden rounded-lg shadow-xl border border-border/40 bg-card/60 backdrop-blur-md">
                <img
                    src="https://images.unsplash.com/photo-1595508064774-5ff825520bb6?auto=format&fit=crop&w=1600&q=80"
                    alt="Uganda coffee farm advisory"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    loading="lazy"
                />
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                            Advisory Creation
                        </h1>
                        <p className="mt-2 text-muted-foreground max-w-2xl">
                            Draft, target, and publish crop-specific advisories aligned with NAADS and MAAIF guidelines. Linked alerts trigger timely SMS + email push to affected farmers.
                        </p>
                    </div>
                    <Button
                        onClick={() => {
                            createForm.reset({
                                title: '',
                                content: '',
                                target_crop_ids: [],
                                target_district_ids: [],
                                farmer_segment: '',
                                linked_alert_id: undefined,
                                status: 'draft',
                            });
                            setWizardStep(0);
                            setCropSearch('');
                            setDistrictSearch('');
                            setAlertSearch('');
                            setCreateAdvisoriesOpen(true);
                        }}
                        className="transition-all duration-200 ease-out hover:shadow-[0_0_18px_rgba(74,222,128,0.55)] bg-primary text-primary-foreground"
                    >
                        <Plus className="mr-2 h-4 w-4" /> New Advisory
                    </Button>
                </div>
            </div>

            {/* Filters row */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-lg">
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Filters</span>
                    </div>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-44 bg-background border-border focus:ring-primary">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={false}
                                className="w-44 justify-between bg-background border-border focus:ring-primary font-normal"
                            >
                                <span className="truncate">
                                    {filterCrop === 'all' ? 'Crop' : filterCrop}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-0 bg-popover border-border" align="start">
                            <Command>
                                <CommandInput placeholder="Search crop..." />
                                <CommandList>
                                    <CommandEmpty>No crop found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all"
                                            onSelect={() => setFilterCrop('all')}
                                        >
                                            <Check className={cn('mr-2 h-4 w-4', filterCrop === 'all' ? 'opacity-100' : 'opacity-0')} />
                                            All crops
                                        </CommandItem>
                                        {crops.map((c) => (
                                            <CommandItem
                                                key={c.id}
                                                value={c.name}
                                                onSelect={(currentValue) => setFilterCrop(currentValue === filterCrop ? 'all' : currentValue)}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', filterCrop === c.name ? 'opacity-100' : 'opacity-0')} />
                                                {c.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={false}
                                className="w-44 justify-between bg-background border-border focus:ring-primary font-normal"
                            >
                                <span className="truncate">
                                    {filterDistrict === 'all' ? 'District' : filterDistrict}
                                </span>
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-0 bg-popover border-border" align="start">
                            <Command>
                                <CommandInput placeholder="Search district..." />
                                <CommandList>
                                    <CommandEmpty>No district found.</CommandEmpty>
                                    <CommandGroup>
                                        <CommandItem
                                            value="all"
                                            onSelect={() => setFilterDistrict('all')}
                                        >
                                            <Check className={cn('mr-2 h-4 w-4', filterDistrict === 'all' ? 'opacity-100' : 'opacity-0')} />
                                            All districts
                                        </CommandItem>
                                        {districts.map((d) => (
                                            <CommandItem
                                                key={d.id}
                                                value={d.name}
                                                onSelect={(currentValue) => setFilterDistrict(currentValue === filterDistrict ? 'all' : currentValue)}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', filterDistrict === d.name ? 'opacity-100' : 'opacity-0')} />
                                                {d.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search advisories by title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background border-border focus:ring-primary"
                        />
                    </div>
                    <Badge variant="secondary" className="ml-auto font-medium">
                        {advisoriesTotal} total
                    </Badge>
                </CardContent>
            </Card>

            {/* Advisories Table */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-xl overflow-hidden">
                <CardHeader className="border-b border-border/40">
                    <CardTitle className="font-heading text-xl">Your Advisories</CardTitle>
                    <CardDescription>
                        Drafts and published advisories you have authored for your coverage area.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingAdvisories ? (
                        <div className="p-12 flex flex-col items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading advisories...</span>
                        </div>
                    ) : filteredAdvisories.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No advisories yet</p>
                            <p className="text-sm mt-1">Create your first advisory to start reaching farmers.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur z-10">
                                <TableRow>
                                    <TableHead className="font-heading">Title</TableHead>
                                    <TableHead>Crops</TableHead>
                                    <TableHead>Districts</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Updated</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAdvisories.map((row, idx) => (
                                    <TableRow
                                        key={row.id}
                                        className={`cursor-pointer transition-colors hover:bg-muted/30 ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}
                                        onClick={() => setEditAdvisoriesTarget(row)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-start gap-2">
                                                <Megaphone className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                                                <div>
                                                    <div>{row.title}</div>
                                                    {row.linked_alert_id && (
                                                        <Badge variant="outline" className="mt-1 text-xs gap-1">
                                                            <Link2 className="h-3 w-3" /> Linked alert
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(row.target_crops ?? []).slice(0, 2).map((c) => (
                                                    <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>
                                                ))}
                                                {(row.target_crops?.length ?? 0) > 2 && (
                                                    <span className="text-xs text-muted-foreground">+{(row.target_crops?.length ?? 0) - 2}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {(row.target_districts ?? []).slice(0, 2).map((d) => (
                                                    <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                                                ))}
                                                {(row.target_districts?.length ?? 0) > 2 && (
                                                    <span className="text-xs text-muted-foreground">+{(row.target_districts?.length ?? 0) - 2}</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={
                                                    row.status === 'published'
                                                        ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                                                        : row.status === 'draft'
                                                            ? 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                                                            : 'bg-muted text-muted-foreground'
                                                }
                                            >
                                                {row.status ?? 'unknown'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {row.created_at ? new Date(row.created_at).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem onClick={() => setEditAdvisoriesTarget(row)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => { setDetailAdvisory(row); void loadAdvisoriesItem(row.id); }}>
                                                        <Eye className="mr-2 h-4 w-4" /> View delivery
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDeleteTarget(row)}
                                                        disabled={row.status === 'published'}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {Math.max(1, Math.ceil(advisoriesTotal / advisoriesLimit)) > 1 && (
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 backdrop-blur-md px-4 py-3 shadow-md">
                    <span className="text-sm text-muted-foreground">
                        Page {advisoriesPage} of {Math.max(1, Math.ceil(advisoriesTotal / advisoriesLimit))}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdvisoriesPage((p) => Math.max(1, p - 1))}
                            disabled={advisoriesPage <= 1}
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setAdvisoriesPage((p) => p + 1)}
                            disabled={advisoriesPage >= Math.ceil(advisoriesTotal / advisoriesLimit)}
                        >
                            Next <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Advisory Wizard */}
            <Dialog open={createAdvisoriesOpen} onOpenChange={(o) => { if (!o) { setWizardStep(0); createForm.reset(); } setCreateAdvisoriesOpen(o); }}>
                <DialogContent className="max-w-3xl bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Create New Advisory</DialogTitle>
                        <DialogDescription>
                            Step {wizardStep + 1} of 3 — {['Targeting', 'Content', 'Review'][wizardStep]}
                        </DialogDescription>
                    </DialogHeader>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 my-2">
                        {['Targeting', 'Content', 'Review'].map((label, i) => (
                            <div key={label} className="flex items-center gap-2 flex-1">
                                <div
                                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                                        i <= wizardStep
                                            ? 'bg-primary text-primary-foreground shadow-[0_0_12px_rgba(74,222,128,0.5)]'
                                            : 'bg-muted text-muted-foreground'
                                    }`}
                                >
                                    {i + 1}
                                </div>
                                <span className={`text-sm ${i <= wizardStep ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                    {label}
                                </span>
                                {i < 2 && <div className={`flex-1 h-0.5 ${i < wizardStep ? 'bg-primary' : 'bg-muted'}`} />}
                            </div>
                        ))}
                    </div>

                    <div className="min-h-[320px] py-4">
                        {wizardStep === 0 && (
                            <div className="space-y-4">
                                {/* Target Crops — Combobox with debounced search */}
                                <div>
                                    <Label className="text-sm font-medium">Target Crops</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="mt-2 w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                            >
                                                <span className="truncate">
                                                    {(createForm.watch('target_crop_ids') ?? []).length > 0
                                                        ? `${(createForm.watch('target_crop_ids') ?? []).length} crop(s) selected`
                                                        : 'Select crops...'}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0 bg-popover border-border" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search crops..."
                                                    value={cropSearch}
                                                    onValueChange={handleCropSearchChange}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No crops found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {effectiveCrops.map((c) => {
                                                            const selected = (createForm.watch('target_crop_ids') ?? []).includes(c.id ?? '');
                                                            return (
                                                                <CommandItem
                                                                    key={c.id}
                                                                    value={c.id ?? ''}
                                                                    onSelect={() => {
                                                                        const cur = createForm.watch('target_crop_ids') ?? [];
                                                                        createForm.setValue(
                                                                            'target_crop_ids',
                                                                            selected ? cur.filter((x) => x !== c.id) : [...cur, c.id ?? '']
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                                    {c.name}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {(createForm.watch('target_crop_ids') ?? []).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {(createForm.watch('target_crop_ids') ?? []).map((id) => {
                                                const crop = effectiveCrops.find((c) => c.id === id) ?? crops.find((c) => c.id === id);
                                                return (
                                                    <Badge key={id} variant="secondary" className="gap-1 text-xs">
                                                        {crop?.name ?? id}
                                                        <button
                                                            type="button"
                                                            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                            onClick={() => {
                                                                const cur = createForm.watch('target_crop_ids') ?? [];
                                                                createForm.setValue('target_crop_ids', cur.filter((x) => x !== id));
                                                            }}
                                                        >×</button>
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                {/* Target Districts — Combobox with debounced search */}
                                <div>
                                    <Label className="text-sm font-medium">Target Districts</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className="mt-2 w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                            >
                                                <span className="truncate">
                                                    {(createForm.watch('target_district_ids') ?? []).length > 0
                                                        ? `${(createForm.watch('target_district_ids') ?? []).length} district(s) selected`
                                                        : 'Select districts...'}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-80 p-0 bg-popover border-border" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search districts..."
                                                    value={districtSearch}
                                                    onValueChange={handleDistrictSearchChange}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No districts found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {effectiveDistricts.map((d) => {
                                                            const selected = (createForm.watch('target_district_ids') ?? []).includes(d.id ?? '');
                                                            return (
                                                                <CommandItem
                                                                    key={d.id}
                                                                    value={d.id ?? ''}
                                                                    onSelect={() => {
                                                                        const cur = createForm.watch('target_district_ids') ?? [];
                                                                        createForm.setValue(
                                                                            'target_district_ids',
                                                                            selected ? cur.filter((x) => x !== d.id) : [...cur, d.id ?? '']
                                                                        );
                                                                    }}
                                                                >
                                                                    <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                                    {d.name}
                                                                </CommandItem>
                                                            );
                                                        })}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {(createForm.watch('target_district_ids') ?? []).length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1">
                                            {(createForm.watch('target_district_ids') ?? []).map((id) => {
                                                const district = effectiveDistricts.find((d) => d.id === id) ?? districts.find((d) => d.id === id);
                                                return (
                                                    <Badge key={id} variant="outline" className="gap-1 text-xs">
                                                        {district?.name ?? id}
                                                        <button
                                                            type="button"
                                                            className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                            onClick={() => {
                                                                const cur = createForm.watch('target_district_ids') ?? [];
                                                                createForm.setValue('target_district_ids', cur.filter((x) => x !== id));
                                                            }}
                                                        >×</button>
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="farmer_segment" className="text-sm font-medium">Farmer Segment</Label>
                                    <Select
                                        value={createForm.watch('farmer_segment') || undefined}
                                        onValueChange={(v) => createForm.setValue('farmer_segment', v)}
                                    >
                                        <SelectTrigger className="mt-2 bg-background border-border focus:ring-primary">
                                            <SelectValue placeholder="Select farmer segment" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="smallholder">Smallholder farmers</SelectItem>
                                            <SelectItem value="commercial">Commercial farmers</SelectItem>
                                            <SelectItem value="cooperative">Cooperative groups</SelectItem>
                                            <SelectItem value="youth">Youth in agriculture</SelectItem>
                                            <SelectItem value="women">Women farmers</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {/* Link Active Alert — Combobox with debounced search */}
                                <div>
                                    <Label htmlFor="linked_alert_id" className="text-sm font-medium">Link Active Alert (optional)</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={false}
                                                className="mt-2 w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                            >
                                                <span className="truncate">
                                                    {(() => {
                                                        const id = createForm.watch('linked_alert_id');
                                                        if (!id) return 'No linked alert';
                                                        const a = [...effectiveAlerts, ...alerts].find((x) => x.id === id);
                                                        return a ? `${a.title} — ${a.alert_level}` : 'No linked alert';
                                                    })()}
                                                </span>
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[460px] p-0 bg-popover border-border" align="start">
                                            <Command shouldFilter={false}>
                                                <CommandInput
                                                    placeholder="Search active alerts..."
                                                    value={alertSearch}
                                                    onValueChange={handleAlertSearchChange}
                                                />
                                                <CommandList>
                                                    <CommandEmpty>No active alerts found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="__none__"
                                                            onSelect={() => createForm.setValue('linked_alert_id', undefined)}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', !createForm.watch('linked_alert_id') ? 'opacity-100' : 'opacity-0')} />
                                                            No linked alert
                                                        </CommandItem>
                                                        {effectiveAlerts.map((a) => (
                                                            <CommandItem
                                                                key={a.id}
                                                                value={a.id ?? ''}
                                                                onSelect={() => createForm.setValue('linked_alert_id', a.id)}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', createForm.watch('linked_alert_id') === a.id ? 'opacity-100' : 'opacity-0')} />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm truncate">{a.title} <span className="text-muted-foreground">— {a.alert_level}</span></p>
                                                                    <p className="text-xs text-muted-foreground truncate">{a.crop} • {a.district}</p>
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>
                        )}

                        {wizardStep === 1 && (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="create_title" className="text-sm font-medium">Advisory Title</Label>
                                    <Input
                                        id="create_title"
                                        {...createForm.register('title')}
                                        placeholder="e.g. Manage coffee berry borer outbreak in central region"
                                        className="mt-2 bg-background border-border focus:ring-primary"
                                    />
                                    {createForm.formState.errors.title && (
                                        <p className="text-xs text-destructive mt-1">{createForm.formState.errors.title.message}</p>
                                    )}
                                </div>
                                <div>
                                    <Label htmlFor="create_content" className="text-sm font-medium">Advisory Content</Label>
                                    <Textarea
                                        id="create_content"
                                        {...createForm.register('content')}
                                        placeholder="Write recommendations aligned with NAADS / MAAIF guidelines..."
                                        rows={8}
                                        className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                    />
                                    {createForm.formState.errors.content && (
                                        <p className="text-xs text-destructive mt-1">{createForm.formState.errors.content.message}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {wizardStep === 2 && (
                            <div className="space-y-4">
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-4 space-y-3">
                                    <h4 className="font-heading text-base font-semibold">Review</h4>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-muted-foreground">Title:</span> {createForm.watch('title') || '—'}</p>
                                        <p><span className="text-muted-foreground">Crops:</span> {(createForm.watch('target_crop_ids') ?? []).length} selected</p>
                                        <p><span className="text-muted-foreground">Districts:</span> {(createForm.watch('target_district_ids') ?? []).length} selected</p>
                                        <p><span className="text-muted-foreground">Segment:</span> {createForm.watch('farmer_segment') || '—'}</p>
                                        <p className="whitespace-pre-wrap"><span className="text-muted-foreground">Content preview:</span><br />{(createForm.watch('content') ?? '').slice(0, 240)}{(createForm.watch('content') ?? '').length > 240 ? '...' : ''}</p>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Status</Label>
                                    <Select
                                        value={createForm.watch('status') ?? 'draft'}
                                        onValueChange={(v) => createForm.setValue('status', v)}
                                    >
                                        <SelectTrigger className="mt-2 bg-background border-border focus:ring-primary">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="draft">Draft</SelectItem>
                                            <SelectItem value="published">Published</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex items-center justify-between gap-2">
                        <Button
                            variant="ghost"
                            onClick={() => setWizardStep((s) => Math.max(0, s - 1))}
                            disabled={wizardStep === 0}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={() => { setWizardStep(0); createForm.reset(); setCreateAdvisoriesOpen(false); }}>
                                Cancel
                            </Button>
                            {wizardStep < 2 ? (
                                <Button onClick={() => setWizardStep((s) => Math.min(2, s + 1))}>
                                    Next <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={createForm.handleSubmit((data) => void handleCreateAdvisories(data))}
                                    className="transition-all duration-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.55)]"
                                >
                                    <Send className="mr-2 h-4 w-4" /> {createForm.watch('status') === 'published' ? 'Publish Advisory' : 'Save as Draft'}
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Advisory Dialog */}
            <Dialog open={!!editAdvisoriesTarget} onOpenChange={(o) => !o && setEditAdvisoriesTarget(null)}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Edit Advisory</DialogTitle>
                        <DialogDescription>Update the targeting, content, or publication status.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="edit_title" className="text-sm font-medium">Title</Label>
                            <Input
                                id="edit_title"
                                {...editForm.register('title')}
                                className="mt-2 bg-background border-border focus:ring-primary"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit_content" className="text-sm font-medium">Content</Label>
                            <Textarea
                                id="edit_content"
                                {...editForm.register('content')}
                                rows={6}
                                className="mt-2 bg-background border-border focus:ring-primary resize-none"
                            />
                        </div>
                        {/* Target Crops — Combobox with debounced search */}
                        <div>
                            <Label className="text-sm font-medium">Target Crops</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="mt-2 w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                    >
                                        <span className="truncate">
                                            {(editForm.watch('target_crop_ids') ?? []).length > 0
                                                ? `${(editForm.watch('target_crop_ids') ?? []).length} crop(s) selected`
                                                : 'Select crops...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 bg-popover border-border" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search crops..."
                                            value={cropSearch}
                                            onValueChange={handleCropSearchChange}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No crops found.</CommandEmpty>
                                            <CommandGroup>
                                                {effectiveCrops.map((c) => {
                                                    const selected = (editForm.watch('target_crop_ids') ?? []).includes(c.id ?? '');
                                                    return (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.id ?? ''}
                                                            onSelect={() => {
                                                                const cur = editForm.watch('target_crop_ids') ?? [];
                                                                editForm.setValue(
                                                                    'target_crop_ids',
                                                                    selected ? cur.filter((x) => x !== c.id) : [...cur, c.id ?? '']
                                                                );
                                                            }}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                            {c.name}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {(editForm.watch('target_crop_ids') ?? []).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {(editForm.watch('target_crop_ids') ?? []).map((id) => {
                                        const crop = effectiveCrops.find((c) => c.id === id) ?? crops.find((c) => c.id === id);
                                        return (
                                            <Badge key={id} variant="secondary" className="gap-1 text-xs">
                                                {crop?.name ?? id}
                                                <button
                                                    type="button"
                                                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                    onClick={() => {
                                                        const cur = editForm.watch('target_crop_ids') ?? [];
                                                        editForm.setValue('target_crop_ids', cur.filter((x) => x !== id));
                                                    }}
                                                >×</button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/* Target Districts — Combobox with debounced search */}
                        <div>
                            <Label className="text-sm font-medium">Target Districts</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="mt-2 w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                    >
                                        <span className="truncate">
                                            {(editForm.watch('target_district_ids') ?? []).length > 0
                                                ? `${(editForm.watch('target_district_ids') ?? []).length} district(s) selected`
                                                : 'Select districts...'}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0 bg-popover border-border" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search districts..."
                                            value={districtSearch}
                                            onValueChange={handleDistrictSearchChange}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No districts found.</CommandEmpty>
                                            <CommandGroup>
                                                {effectiveDistricts.map((d) => {
                                                    const selected = (editForm.watch('target_district_ids') ?? []).includes(d.id ?? '');
                                                    return (
                                                        <CommandItem
                                                            key={d.id}
                                                            value={d.id ?? ''}
                                                            onSelect={() => {
                                                                const cur = editForm.watch('target_district_ids') ?? [];
                                                                editForm.setValue(
                                                                    'target_district_ids',
                                                                    selected ? cur.filter((x) => x !== d.id) : [...cur, d.id ?? '']
                                                                );
                                                            }}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', selected ? 'opacity-100' : 'opacity-0')} />
                                                            {d.name}
                                                        </CommandItem>
                                                    );
                                                })}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {(editForm.watch('target_district_ids') ?? []).length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                    {(editForm.watch('target_district_ids') ?? []).map((id) => {
                                        const district = effectiveDistricts.find((d) => d.id === id) ?? districts.find((d) => d.id === id);
                                        return (
                                            <Badge key={id} variant="outline" className="gap-1 text-xs">
                                                {district?.name ?? id}
                                                <button
                                                    type="button"
                                                    className="ml-1 rounded-full hover:bg-muted-foreground/20 p-0.5"
                                                    onClick={() => {
                                                        const cur = editForm.watch('target_district_ids') ?? [];
                                                        editForm.setValue('target_district_ids', cur.filter((x) => x !== id));
                                                    }}
                                                >×</button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        {/* Link Active Alert — Combobox with debounced search */}
                        <div>
                            <Label className="text-sm font-medium">Link Active Alert (optional)</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={false}
                                        className="mt-2 w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                    >
                                        <span className="truncate">
                                            {(() => {
                                                const id = editForm.watch('linked_alert_id');
                                                if (!id) return 'No linked alert';
                                                const a = [...effectiveAlerts, ...alerts].find((x) => x.id === id);
                                                return a ? `${a.title} — ${a.alert_level}` : 'No linked alert';
                                            })()}
                                        </span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[460px] p-0 bg-popover border-border" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search active alerts..."
                                            value={alertSearch}
                                            onValueChange={handleAlertSearchChange}
                                        />
                                        <CommandList>
                                            <CommandEmpty>No active alerts found.</CommandEmpty>
                                            <CommandGroup>
                                                <CommandItem
                                                    value="__none__"
                                                    onSelect={() => editForm.setValue('linked_alert_id', undefined)}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', !editForm.watch('linked_alert_id') ? 'opacity-100' : 'opacity-0')} />
                                                    No linked alert
                                                </CommandItem>
                                                {effectiveAlerts.map((a) => (
                                                    <CommandItem
                                                        key={a.id}
                                                        value={a.id ?? ''}
                                                        onSelect={() => editForm.setValue('linked_alert_id', a.id)}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', editForm.watch('linked_alert_id') === a.id ? 'opacity-100' : 'opacity-0')} />
                                                        <div className="min-w-0">
                                                            <p className="text-sm truncate">{a.title} <span className="text-muted-foreground">— {a.alert_level}</span></p>
                                                            <p className="text-xs text-muted-foreground truncate">{a.crop} • {a.district}</p>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label className="text-sm font-medium">Status</Label>
                                <Select
                                    value={editForm.watch('status') ?? 'draft'}
                                    onValueChange={(v) => editForm.setValue('status', v)}
                                >
                                    <SelectTrigger className="mt-2 bg-background border-border focus:ring-primary">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="published">Published</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="text-sm font-medium">Farmer Segment</Label>
                                <Select
                                    value={editForm.watch('farmer_segment') || undefined}
                                    onValueChange={(v) => editForm.setValue('farmer_segment', v)}
                                >
                                    <SelectTrigger className="mt-2 bg-background border-border focus:ring-primary">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="smallholder">Smallholder</SelectItem>
                                        <SelectItem value="commercial">Commercial</SelectItem>
                                        <SelectItem value="cooperative">Cooperative</SelectItem>
                                        <SelectItem value="youth">Youth</SelectItem>
                                        <SelectItem value="women">Women</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditAdvisoriesTarget(null)}>Cancel</Button>
                        <Button
                            onClick={editForm.handleSubmit((data) => {
                                if (!editAdvisoriesTarget) return;
                                void handleUpdateAdvisories({ ...data, id: editAdvisoriesTarget.id } as AdvisoriesUpdateParams);
                            })}
                            className="transition-all duration-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.55)]"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog (delivery status) */}
            <Dialog open={!!detailAdvisory} onOpenChange={(o) => !o && setDetailAdvisory(null)}>
                <DialogContent className="max-w-xl bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Delivery Status</DialogTitle>
                        <DialogDescription>{detailAdvisory?.title}</DialogDescription>
                    </DialogHeader>
                    {loadingAdvisoriesItem ? (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : advisoriesItem?.delivery_status ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">SMS (Twilio)</p>
                                <p className="mt-1 text-2xl font-heading font-semibold">
                                    {(advisoriesItem.delivery_status as any)?.sms_sent ?? '—'}
                                </p>
                            </div>
                            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Email (SendGrid)</p>
                                <p className="mt-1 text-2xl font-heading font-semibold">
                                    {(advisoriesItem.delivery_status as any)?.email_sent ?? '—'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No delivery data yet — advisory not published.</p>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setDetailAdvisory(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading text-xl">Delete Advisory</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{deleteTarget?.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTarget) {
                                    void handleDeleteAdvisories({ id: deleteTarget.id });
                                    setDeleteTarget(null);
                                }
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
