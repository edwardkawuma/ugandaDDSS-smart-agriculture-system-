import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    researchOutputsCreateSchema,
    researchOutputsUpdateSchema,
    type ResearchOutputsCreateInput,
    type ResearchOutputsUpdateInput,
} from '@/lib/api/researchOutputsFormSchema';
import { cn } from '@/lib/utils';
import {
    BookOpen, Plus, Search, Filter, MoreVertical, Eye, Edit2, Trash2,
    FileText, Users, Calendar, Database, Cpu, ChevronLeft, ChevronRight,
    Upload, X, Check, ChevronsUpDown, FlaskConical, Leaf
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    researchOutputsService,
    type ResearchOutputsCreateParams,
    type ResearchOutputsCreateResponse,
    type ResearchOutputsDeleteParams,
    type ResearchOutputsDeleteResponse,
    type ResearchOutputsListParams,
    type ResearchOutputsListResponse,
    type ResearchOutputsUpdateParams,
    type ResearchOutputsUpdateResponse,
} from '@/lib/api/researchOutputsService';
import {
    cropsService,
    type CropsListParams,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    dataHubService,
    type DataHubDatasetsParams,
    type DataHubDatasetsResponse,
} from '@/lib/api/dataHubService';
import {
    aiModelsService,
    type AiModelsListParams,
    type AiModelsListResponse,
} from '@/lib/api/aiModelsService';

type ResearchOutput = ResearchOutputsListResponse['data'][number];
type Crop = CropsListResponse['data'][number];
type DataHub = DataHubDatasetsResponse['data'][number];
type AiModel = AiModelsListResponse['data'][number];

export default function ResearchOutputs() {
    const navigate = useNavigate();

    // List state — GET /research-outputs/list
    const [researchOutputs, setResearchOutputs] = useState<ResearchOutput[]>([]);
    const [loadingResearchOutputs, setLoadingResearchOutputs] = useState(true);
    const [researchOutputsPage, setResearchOutputsPage] = useState(1);
    const [researchOutputsLimit] = useState(10);
    const [researchOutputsTotal, setResearchOutputsTotal] = useState(0);
    // List state — GET /crops/list
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    const [cropsPage, setCropsPage] = useState(1);
    const [cropsLimit] = useState(10);
    const [cropsTotal, setCropsTotal] = useState(0);
    // List state — GET /data-hub/datasets
    const [dataHub, setDataHub] = useState<DataHub[]>([]);
    const [loadingDataHub, setLoadingDataHub] = useState(true);
    const [dataHubPage, setDataHubPage] = useState(1);
    const [dataHubLimit] = useState(10);
    const [dataHubTotal, setDataHubTotal] = useState(0);
    // List state — GET /ai-models/list
    const [aiModels, setAiModels] = useState<AiModel[]>([]);
    const [loadingAiModels, setLoadingAiModels] = useState(true);
    const [aiModelsPage, setAiModelsPage] = useState(1);
    const [aiModelsLimit] = useState(10);
    const [aiModelsTotal, setAiModelsTotal] = useState(0);
    // Create dialog state — POST /research-outputs/create
    const [createResearchOutputsOpen, setCreateResearchOutputsOpen] = useState(false);
    // Edit dialog state — PUT /research-outputs/update
    const [editResearchOutputsTarget, setEditResearchOutputsTarget] = useState<ResearchOutput | null>(null);

    // ── filter/search state (declared here so useEffect deps can reference them) ─
    const [searchText, setSearchText] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCrop, setFilterCrop] = useState('all');
    const [deleteTarget, setDeleteTarget] = useState<ResearchOutput | null>(null);

    useEffect(() => { setResearchOutputsPage(1); }, [searchText, filterStatus, filterCrop]);
    useEffect(() => { void loadResearchOutputs(); }, [researchOutputsPage, searchText, filterStatus, filterCrop]);
    useEffect(() => { void loadCrops(); }, [cropsPage]);
    useEffect(() => { void loadDataHub(); }, [dataHubPage]);
    useEffect(() => { void loadAiModels(); }, [aiModelsPage]);

    async function loadResearchOutputs() {
        try {
            setLoadingResearchOutputs(true);
            const params: ResearchOutputsListParams = { page: researchOutputsPage, limit: researchOutputsLimit };
            if (searchText) params.search = searchText;
            if (filterStatus !== 'all') params.status = filterStatus;
            if (filterCrop !== 'all') params.crop = filterCrop;
            const res = await researchOutputsService.list(params);
            setResearchOutputs(Array.isArray(res?.data) ? res.data : []);
            setResearchOutputsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load researchOutputs');
            console.error('[loadResearchOutputs]', err);
        } finally {
            setLoadingResearchOutputs(false);
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
    async function loadDataHub() {
        try {
            setLoadingDataHub(true);
            const res = await dataHubService.datasets({ page: dataHubPage, limit: dataHubLimit });
            setDataHub(Array.isArray(res?.data) ? res.data : []);
            setDataHubTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load dataHub');
            console.error('[loadDataHub]', err);
        } finally {
            setLoadingDataHub(false);
        }
    }
    async function loadAiModels() {
        try {
            setLoadingAiModels(true);
            const res = await aiModelsService.list({ page: aiModelsPage, limit: aiModelsLimit });
            setAiModels(Array.isArray(res?.data) ? res.data : []);
            setAiModelsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load aiModels');
            console.error('[loadAiModels]', err);
        } finally {
            setLoadingAiModels(false);
        }
    }
    async function handleCreateResearchOutputs(data: ResearchOutputsCreateParams) {
        try {
            await researchOutputsService.create(data);
            toast.success('Created');
            setCreateResearchOutputsOpen(false);
            void loadResearchOutputs();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateResearchOutputs]', err);
        }
    }
    async function handleUpdateResearchOutputs(data: ResearchOutputsUpdateParams) {
        try {
            await researchOutputsService.update(data);
            toast.success('Updated');
            setEditResearchOutputsTarget(null);
            void loadResearchOutputs();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateResearchOutputs]', err);
        }
    }
    async function handleDeleteResearchOutputs(params: ResearchOutputsDeleteParams) {
        try {
            await researchOutputsService.delete(params);
            toast.success('Deleted');
            void loadResearchOutputs();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteResearchOutputs]', err);
        }
    }

    function gotoPage_19_sub_1(outputId: string | number) {
        navigate(`/researcher/outputs/${outputId}`);
    }

    // ── combobox open flags ───────────────────────────────────────────────────
    const [cropComboOpen, setCropComboOpen] = useState(false);
    const [datasetComboOpen, setDatasetComboOpen] = useState(false);
    const [modelComboOpen, setModelComboOpen] = useState(false);
    const [editCropComboOpen, setEditCropComboOpen] = useState(false);
    const [editDatasetComboOpen, setEditDatasetComboOpen] = useState(false);
    const [editModelComboOpen, setEditModelComboOpen] = useState(false);

    // selected multi-value arrays for create form
    const [selectedCropIds, setSelectedCropIds] = useState<string[]>([]);
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
    const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
    const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
    const [authorInput, setAuthorInput] = useState('');

    // selected multi-value arrays for edit form
    const [editSelectedCropIds, setEditSelectedCropIds] = useState<string[]>([]);
    const [editSelectedDatasetIds, setEditSelectedDatasetIds] = useState<string[]>([]);
    const [editSelectedModelIds, setEditSelectedModelIds] = useState<string[]>([]);
    const [editSelectedAuthors, setEditSelectedAuthors] = useState<string[]>([]);
    const [editAuthorInput, setEditAuthorInput] = useState('');

    // file upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFileName, setSelectedFileName] = useState('');

    // ── forms ─────────────────────────────────────────────────────────────────
    const createForm = useForm<ResearchOutputsCreateInput>({
        resolver: zodResolver(researchOutputsCreateSchema),
        defaultValues: {
            title: '',
            authors: [],
            abstract: '',
            crop_focus_ids: [],
            dataset_ids: [],
            model_ids: [],
            methodology: '',
            key_findings: '',
            file: '',
        },
    });

    const editForm = useForm<ResearchOutputsUpdateInput>({
        resolver: zodResolver(researchOutputsUpdateSchema),
        values: editResearchOutputsTarget
            ? {
                title: editResearchOutputsTarget.title ?? '',
                authors: editResearchOutputsTarget.authors ?? [],
                abstract: editResearchOutputsTarget.abstract ?? '',
                crop_focus_ids: [],
                dataset_ids: [],
                model_ids: [],
                methodology: '',
                key_findings: '',
                status: editResearchOutputsTarget.status ?? '',
            }
            : undefined,
    });

    // sync edit combobox state when target changes
    useEffect(() => {
        if (editResearchOutputsTarget) {
            setEditSelectedAuthors(editResearchOutputsTarget.authors ?? []);
            setEditSelectedCropIds([]);
            setEditSelectedDatasetIds([]);
            setEditSelectedModelIds([]);
        }
    }, [editResearchOutputsTarget]);

    // ── helpers ───────────────────────────────────────────────────────────────
    const totalPages = Math.ceil(researchOutputsTotal / researchOutputsLimit) || 1;

    function statusColor(status?: string) {
        switch (status?.toLowerCase()) {
            case 'published': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'pending': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'draft': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-muted/40 text-muted-foreground border-border/40';
        }
    }

    function formatDate(dateStr?: string) {
        if (!dateStr) return '—';
        return new Date(dateStr).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function toggleItem(arr: string[], id: string, setArr: (v: string[]) => void) {
        setArr(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
    }

    function addAuthor(authors: string[], input: string, setAuthors: (v: string[]) => void, setInput: (v: string) => void) {
        const trimmed = input.trim();
        if (trimmed && !authors.includes(trimmed)) {
            setAuthors([...authors, trimmed]);
        }
        setInput('');
    }

    // ── form submit handlers ──────────────────────────────────────────────────
    function onCreateSubmit(values: ResearchOutputsCreateInput) {
        handleCreateResearchOutputs({
            ...values,
            authors: selectedAuthors.filter(Boolean).join(','),
            crop_focus_ids: selectedCropIds.join(','),
            dataset_ids: selectedDatasetIds.join(','),
            model_ids: selectedModelIds.join(','),
        } as ResearchOutputsCreateParams);
        createForm.reset();
        setSelectedCropIds([]);
        setSelectedDatasetIds([]);
        setSelectedModelIds([]);
        setSelectedAuthors([]);
        setSelectedFileName('');
    }

    function onEditSubmit(values: ResearchOutputsUpdateInput) {
        if (!editResearchOutputsTarget?.id) return;
        handleUpdateResearchOutputs({
            id: editResearchOutputsTarget.id,
            title: values.title ?? '',
            authors: editSelectedAuthors,
            abstract: values.abstract ?? '',
            crop_focus_ids: editSelectedCropIds,
            dataset_ids: editSelectedDatasetIds,
            model_ids: editSelectedModelIds,
            methodology: values.methodology ?? '',
            key_findings: values.key_findings ?? '',
            status: values.status ?? '',
        });
    }

    // ── derived filtered list (client-side quick filter on loaded page) ───────
    const filteredOutputs = researchOutputs.filter(o => {
        const matchSearch = !searchText
            || (o.title ?? '').toLowerCase().includes(searchText.toLowerCase())
            || (o.abstract ?? '').toLowerCase().includes(searchText.toLowerCase())
            || (o.authors ?? []).some((a: string) => a.toLowerCase().includes(searchText.toLowerCase()));
        const matchStatus = filterStatus === 'all' || o.status === filterStatus;
        const matchCrop = filterCrop === 'all'
            || (o.crop_focus ?? []).some((c: string) => c.toLowerCase().includes(filterCrop.toLowerCase()));
        return matchSearch && matchStatus && matchCrop;
    });

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-amber-950/10">

            {/* ── Page Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <FlaskConical className="w-6 h-6 text-amber-400" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
                            Research Outputs
                        </h1>
                    </div>
                    <p className="text-muted-foreground text-sm pl-[52px]">
                        Published findings, data reports &amp; scientific publications from NARO scientists
                    </p>
                </div>
                <Button
                    onClick={() => setCreateResearchOutputsOpen(true)}
                    className="self-start sm:self-auto bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 hover:shadow-[0_0_18px_hsl(var(--primary)/0.5)] transition-all duration-200 ease-out"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Research Output
                </Button>
            </div>

            {/* ── Stats Row ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total Outputs', value: researchOutputsTotal, icon: BookOpen, color: 'text-amber-400' },
                    { label: 'Published', value: researchOutputs.filter(o => o.status === 'published').length, icon: Check, color: 'text-emerald-400' },
                    { label: 'Pending Review', value: researchOutputs.filter(o => o.status === 'pending').length, icon: FileText, color: 'text-blue-400' },
                    { label: 'Crop Varieties', value: crops.length, icon: Leaf, color: 'text-green-400' },
                ].map(stat => (
                    <Card key={stat.label} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-muted/30">
                                <stat.icon className={cn('w-5 h-5', stat.color)} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold font-heading text-foreground">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* ── Filters & Search ─────────────────────────────────────────────── */}
            <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by title, abstract, or author..."
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                className="pl-9 bg-muted/20 border-border/40 focus:border-primary/50 transition-colors"
                            />
                        </div>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full sm:w-44 bg-muted/20 border-border/40">
                                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="published">Published</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={filterCrop} onValueChange={setFilterCrop}>
                            <SelectTrigger className="w-full sm:w-44 bg-muted/20 border-border/40">
                                <Leaf className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Crop Focus" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Crops</SelectItem>
                                {crops.map(c => (
                                    <SelectItem key={c.id ?? c.name} value={c.name ?? ''}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* ── Research Outputs Grid ─────────────────────────────────────────── */}
            {loadingResearchOutputs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                            <CardContent className="p-5 space-y-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-16 w-full" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-20 rounded-full" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredOutputs.length === 0 ? (
                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                    <CardContent className="py-16 flex flex-col items-center gap-4 text-center">
                        <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                            <BookOpen className="w-10 h-10 text-amber-400/60" />
                        </div>
                        <div>
                            <p className="font-heading text-lg font-semibold text-foreground">No Research Outputs Found</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {searchText || filterStatus !== 'all' || filterCrop !== 'all'
                                    ? 'Try adjusting your filters or search terms.'
                                    : 'Upload your first research output to get started.'}
                            </p>
                        </div>
                        {!searchText && filterStatus === 'all' && filterCrop === 'all' && (
                            <Button
                                onClick={() => setCreateResearchOutputsOpen(true)}
                                className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.3)] hover:bg-primary/10 transition-all duration-200"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Upload Research Output
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredOutputs.map(output => (
                        <Card
                            key={output.id}
                            onClick={() => gotoPage_19_sub_1(output.id ?? '')}
                            className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md hover:shadow-amber-500/10 hover:border-amber-500/30 hover:shadow-lg transition-all duration-200 ease-out cursor-pointer group"
                        >
                            <CardContent className="p-5 space-y-4">
                                {/* header row */}
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-3 flex-1 min-w-0">
                                        <div className="mt-0.5 p-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 shrink-0">
                                            <FileText className="w-4 h-4 text-amber-400" />
                                        </div>
                                        <h3 className="font-heading text-base font-semibold text-foreground leading-snug line-clamp-2 group-hover:text-amber-300 transition-colors duration-200">
                                            {output.title ?? 'Untitled Output'}
                                        </h3>
                                    </div>
                                    {/* kebab menu */}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-7 h-7 shrink-0 opacity-0 group-hover:opacity-100 hover:bg-muted/40 transition-all duration-200"
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-44">
                                            <DropdownMenuItem
                                                onClick={e => { e.stopPropagation(); gotoPage_19_sub_1(output.id ?? ''); }}
                                                className="gap-2"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={e => { e.stopPropagation(); setEditResearchOutputsTarget(output); }}
                                                className="gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={e => { e.stopPropagation(); setDeleteTarget(output); }}
                                                className="gap-2 text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                {/* abstract */}
                                {output.abstract && (
                                    <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                        {output.abstract}
                                    </p>
                                )}

                                {/* status + date */}
                                <div className="flex items-center justify-between gap-2">
                                    <Badge className={cn('text-xs border px-2 py-0.5 font-medium', statusColor(output.status))}>
                                        {output.status ?? 'unknown'}
                                    </Badge>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="w-3 h-3" />
                                        {formatDate(output.published_at ?? output.created_at)}
                                    </div>
                                </div>

                                {/* authors */}
                                {(output.authors ?? []).length > 0 && (
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Users className="w-3.5 h-3.5 shrink-0" />
                                        <span className="truncate">
                                            {(output.authors ?? []).slice(0, 2).join(', ')}
                                            {(output.authors?.length ?? 0) > 2 ? ` +${(output.authors?.length ?? 0) - 2} more` : ''}
                                        </span>
                                    </div>
                                )}

                                {/* crop focus tags */}
                                {(output.crop_focus ?? []).length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {(output.crop_focus ?? []).slice(0, 3).map((c: string, i: number) => (
                                            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400">
                                                <Leaf className="w-2.5 h-2.5" />
                                                {c}
                                            </span>
                                        ))}
                                        {(output.crop_focus?.length ?? 0) > 3 && (
                                            <span className="text-xs text-muted-foreground">+{(output.crop_focus?.length ?? 0) - 3}</span>
                                        )}
                                    </div>
                                )}

                                {/* datasets + models count */}
                                <div className="flex items-center gap-4 pt-1 border-t border-border/30">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Database className="w-3.5 h-3.5" />
                                        <span>{(output.datasets_used ?? []).length} dataset{(output.datasets_used?.length ?? 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <Cpu className="w-3.5 h-3.5" />
                                        <span>{(output.models_applied ?? []).length} model{(output.models_applied?.length ?? 0) !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* ── Pagination ────────────────────────────────────────────────────── */}
            {!loadingResearchOutputs && researchOutputsTotal > researchOutputsLimit && (
                <div className="flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                        Page {researchOutputsPage} of {totalPages} &middot; {researchOutputsTotal} total outputs
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={researchOutputsPage <= 1}
                            onClick={() => setResearchOutputsPage(p => Math.max(1, p - 1))}
                            className="border-border/40 hover:bg-muted/30"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={researchOutputsPage >= totalPages}
                            onClick={() => setResearchOutputsPage(p => Math.min(totalPages, p + 1))}
                            className="border-border/40 hover:bg-muted/30"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Create Dialog ─────────────────────────────────────────────────── */}
            <Dialog open={createResearchOutputsOpen} onOpenChange={open => { setCreateResearchOutputsOpen(open); if (!open) createForm.reset(); }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <Upload className="w-5 h-5 text-amber-400" />
                            Upload Research Output
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-5">
                            {/* title */}
                            <FormField
                                control={createForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title *</FormLabel>
                                        <FormControl>
                                            <Input {...field} placeholder="e.g. Maize Yield Prediction in Semi-Arid Uganda" className="bg-muted/20 border-border/40" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* authors */}
                            <div className="space-y-2">
                                <FormLabel>Authors</FormLabel>
                                <div className="flex gap-2">
                                    <Input
                                        value={authorInput}
                                        onChange={e => setAuthorInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAuthor(selectedAuthors, authorInput, setSelectedAuthors, setAuthorInput); } }}
                                        placeholder="Author name — press Enter to add"
                                        className="bg-muted/20 border-border/40"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => addAuthor(selectedAuthors, authorInput, setSelectedAuthors, setAuthorInput)} className="border-border/40">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {selectedAuthors.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedAuthors.map((a, i) => (
                                            <Badge key={i} variant="secondary" className="gap-1 text-xs">
                                                {a}
                                                <button type="button" onClick={() => setSelectedAuthors(selectedAuthors.filter((_, idx) => idx !== i))} className="ml-1 hover:text-destructive">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* abstract */}
                            <FormField
                                control={createForm.control}
                                name="abstract"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Abstract</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={3} placeholder="Brief summary of the research..." className="bg-muted/20 border-border/40 resize-none" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* crop focus - searchable combobox */}
                            <div className="space-y-2">
                                <FormLabel>Crop Focus</FormLabel>
                                <Popover open={cropComboOpen} onOpenChange={setCropComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/20 border-border/40 font-normal">
                                            {selectedCropIds.length > 0 ? `${selectedCropIds.length} crop(s) selected` : 'Select crops...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search crops..." />
                                            <CommandEmpty>{loadingCrops ? 'Loading...' : 'No crops found.'}</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-48">
                                                    {crops.map(c => (
                                                        <CommandItem key={c.id} onSelect={() => toggleItem(selectedCropIds, c.id ?? '', setSelectedCropIds)} className="gap-2">
                                                            <Check className={cn('h-4 w-4', selectedCropIds.includes(c.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedCropIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedCropIds.map(id => {
                                            const c = crops.find(x => x.id === id);
                                            return c ? (
                                                <Badge key={id} variant="secondary" className="gap-1 text-xs">
                                                    <Leaf className="w-3 h-3" />{c.name}
                                                    <button type="button" onClick={() => setSelectedCropIds(selectedCropIds.filter(x => x !== id))}><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* datasets used - searchable combobox */}
                            <div className="space-y-2">
                                <FormLabel>Datasets Used</FormLabel>
                                <Popover open={datasetComboOpen} onOpenChange={setDatasetComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/20 border-border/40 font-normal">
                                            {selectedDatasetIds.length > 0 ? `${selectedDatasetIds.length} dataset(s) selected` : 'Select datasets...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search datasets..." />
                                            <CommandEmpty>{loadingDataHub ? 'Loading...' : 'No datasets found.'}</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-48">
                                                    {dataHub.map(d => (
                                                        <CommandItem key={d.id} onSelect={() => toggleItem(selectedDatasetIds, d.id ?? '', setSelectedDatasetIds)} className="gap-2">
                                                            <Check className={cn('h-4 w-4', selectedDatasetIds.includes(d.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                                            <span className="flex-1 truncate">{d.name}</span>
                                                            {d.category && <span className="text-xs text-muted-foreground">{d.category}</span>}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedDatasetIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedDatasetIds.map(id => {
                                            const d = dataHub.find(x => x.id === id);
                                            return d ? (
                                                <Badge key={id} variant="secondary" className="gap-1 text-xs">
                                                    <Database className="w-3 h-3" />{d.name}
                                                    <button type="button" onClick={() => setSelectedDatasetIds(selectedDatasetIds.filter(x => x !== id))}><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* AI models - searchable combobox */}
                            <div className="space-y-2">
                                <FormLabel>AI Models Applied</FormLabel>
                                <Popover open={modelComboOpen} onOpenChange={setModelComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/20 border-border/40 font-normal">
                                            {selectedModelIds.length > 0 ? `${selectedModelIds.length} model(s) selected` : 'Select AI models...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search models..." />
                                            <CommandEmpty>{loadingAiModels ? 'Loading...' : 'No models found.'}</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-48">
                                                    {aiModels.map(m => (
                                                        <CommandItem key={m.id} onSelect={() => toggleItem(selectedModelIds, m.id ?? '', setSelectedModelIds)} className="gap-2">
                                                            <Check className={cn('h-4 w-4', selectedModelIds.includes(m.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                                            <span className="flex-1 truncate">{m.name}</span>
                                                            {m.model_type && <span className="text-xs text-muted-foreground">{m.model_type}</span>}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedModelIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedModelIds.map(id => {
                                            const m = aiModels.find(x => x.id === id);
                                            return m ? (
                                                <Badge key={id} variant="secondary" className="gap-1 text-xs">
                                                    <Cpu className="w-3 h-3" />{m.name}
                                                    <button type="button" onClick={() => setSelectedModelIds(selectedModelIds.filter(x => x !== id))}><X className="w-3 h-3" /></button>
                                                </Badge>
                                            ) : null;
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* methodology */}
                            <FormField
                                control={createForm.control}
                                name="methodology"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Methodology</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={2} placeholder="Describe the research methodology..." className="bg-muted/20 border-border/40 resize-none" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* key findings */}
                            <FormField
                                control={createForm.control}
                                name="key_findings"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Key Findings</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={2} placeholder="Summarise the key findings..." className="bg-muted/20 border-border/40 resize-none" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* file upload */}
                            <FormField
                                control={createForm.control}
                                name="file"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Research File *</FormLabel>
                                        <FormControl>
                                            <div className="space-y-2">
                                                <input
                                                    ref={fileInputRef}
                                                    type="file"
                                                    accept=".pdf,.doc,.docx,.xlsx,.csv"
                                                    className="hidden"
                                                    onChange={e => {
                                                        const f = e.target.files?.[0];
                                                        if (f) {
                                                            setSelectedFileName(f.name);
                                                            field.onChange(f.name);
                                                        }
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="w-full justify-start gap-2 bg-muted/20 border-border/40 border-dashed"
                                                >
                                                    <Upload className="w-4 h-4 text-muted-foreground" />
                                                    {selectedFileName || 'Click to upload file (PDF, DOC, XLSX, CSV)'}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateResearchOutputsOpen(false)} className="border-border/40">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-all duration-200"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Upload Output
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ── Edit Dialog ───────────────────────────────────────────────────── */}
            <Dialog open={!!editResearchOutputsTarget} onOpenChange={open => { if (!open) setEditResearchOutputsTarget(null); }}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <Edit2 className="w-5 h-5 text-amber-400" />
                            Edit Research Output
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-5">
                            <FormField
                                control={editForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-muted/20 border-border/40" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* authors edit */}
                            <div className="space-y-2">
                                <FormLabel>Authors</FormLabel>
                                <div className="flex gap-2">
                                    <Input
                                        value={editAuthorInput}
                                        onChange={e => setEditAuthorInput(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAuthor(editSelectedAuthors, editAuthorInput, setEditSelectedAuthors, setEditAuthorInput); } }}
                                        placeholder="Author name — press Enter to add"
                                        className="bg-muted/20 border-border/40"
                                    />
                                    <Button type="button" variant="outline" size="sm" onClick={() => addAuthor(editSelectedAuthors, editAuthorInput, setEditSelectedAuthors, setEditAuthorInput)} className="border-border/40">
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {editSelectedAuthors.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {editSelectedAuthors.map((a, i) => (
                                            <Badge key={i} variant="secondary" className="gap-1 text-xs">
                                                {a}
                                                <button type="button" onClick={() => setEditSelectedAuthors(editSelectedAuthors.filter((_, idx) => idx !== i))}><X className="w-3 h-3" /></button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <FormField
                                control={editForm.control}
                                name="abstract"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Abstract</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={3} className="bg-muted/20 border-border/40 resize-none" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* crop focus edit */}
                            <div className="space-y-2">
                                <FormLabel>Crop Focus</FormLabel>
                                <Popover open={editCropComboOpen} onOpenChange={setEditCropComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/20 border-border/40 font-normal">
                                            {editSelectedCropIds.length > 0 ? `${editSelectedCropIds.length} crop(s)` : 'Select crops...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search crops..." />
                                            <CommandEmpty>No crops found.</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-48">
                                                    {crops.map(c => (
                                                        <CommandItem key={c.id} onSelect={() => toggleItem(editSelectedCropIds, c.id ?? '', setEditSelectedCropIds)} className="gap-2">
                                                            <Check className={cn('h-4 w-4', editSelectedCropIds.includes(c.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* datasets edit */}
                            <div className="space-y-2">
                                <FormLabel>Datasets Used</FormLabel>
                                <Popover open={editDatasetComboOpen} onOpenChange={setEditDatasetComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/20 border-border/40 font-normal">
                                            {editSelectedDatasetIds.length > 0 ? `${editSelectedDatasetIds.length} dataset(s)` : 'Select datasets...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search datasets..." />
                                            <CommandEmpty>No datasets found.</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-48">
                                                    {dataHub.map(d => (
                                                        <CommandItem key={d.id} onSelect={() => toggleItem(editSelectedDatasetIds, d.id ?? '', setEditSelectedDatasetIds)} className="gap-2">
                                                            <Check className={cn('h-4 w-4', editSelectedDatasetIds.includes(d.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                                            {d.name}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* models edit */}
                            <div className="space-y-2">
                                <FormLabel>AI Models Applied</FormLabel>
                                <Popover open={editModelComboOpen} onOpenChange={setEditModelComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between bg-muted/20 border-border/40 font-normal">
                                            {editSelectedModelIds.length > 0 ? `${editSelectedModelIds.length} model(s)` : 'Select AI models...'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search models..." />
                                            <CommandEmpty>No models found.</CommandEmpty>
                                            <CommandGroup>
                                                <ScrollArea className="h-48">
                                                    {aiModels.map(m => (
                                                        <CommandItem key={m.id} onSelect={() => toggleItem(editSelectedModelIds, m.id ?? '', setEditSelectedModelIds)} className="gap-2">
                                                            <Check className={cn('h-4 w-4', editSelectedModelIds.includes(m.id ?? '') ? 'opacity-100' : 'opacity-0')} />
                                                            {m.name}
                                                        </CommandItem>
                                                    ))}
                                                </ScrollArea>
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <FormField
                                control={editForm.control}
                                name="methodology"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Methodology</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={2} className="bg-muted/20 border-border/40 resize-none" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="key_findings"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Key Findings</FormLabel>
                                        <FormControl>
                                            <Textarea {...field} rows={2} className="bg-muted/20 border-border/40 resize-none" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                            <FormControl>
                                                <SelectTrigger className="bg-muted/20 border-border/40">
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="pending">Pending Review</SelectItem>
                                                <SelectItem value="published">Published</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditResearchOutputsTarget(null)} className="border-border/40">
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-all duration-200"
                                >
                                    <Check className="w-4 h-4 mr-2" />
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation ───────────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent className="backdrop-blur-md bg-card/90 border border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-destructive" />
                            Delete Research Output
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to permanently delete <span className="font-semibold text-foreground">"{deleteTarget?.title}"</span>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border/40">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTarget?.id) {
                                    handleDeleteResearchOutputs({ id: deleteTarget.id });
                                    setDeleteTarget(null);
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
