import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { researchOutputsUpdateSchema, type ResearchOutputsUpdateInput } from '@/lib/api/researchOutputsFormSchema';
import {
    ArrowLeft, Pencil, Trash2, Download, BookOpen, Database, BrainCircuit,
    FlaskConical, Lightbulb, Quote, Clock, CheckCircle2, AlertCircle, FileLock2,
    Leaf, FileText, RefreshCw, Check, ChevronsUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
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
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    researchOutputsService,
    type ResearchOutputsDeleteParams,
    type ResearchOutputsDeleteResponse,
    type ResearchOutputsDetailParams,
    type ResearchOutputsDetailResponse,
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

type Crop = CropsListResponse['data'][number];
type DataHub = DataHubDatasetsResponse['data'][number];
type AiModel = AiModelsListResponse['data'][number];
type ResearchOutput = ResearchOutputsDetailResponse['data'];

export default function ResearchOutputDetail() {
    const navigate = useNavigate();
    const { id = '' } = useParams<{ id: string }>();
    function goBack() { navigate('/researcher/outputs'); }

    // Detail state — GET /research-outputs/detail
    const [researchOutputsItem, setResearchOutputsItem] = useState<ResearchOutputsDetailResponse['data'] | null>(null);
    const [loadingResearchOutputsItem, setLoadingResearchOutputsItem] = useState(true);
    // ↑ ResearchOutput is the singular row type
    // List state — GET /crops/list
    const [crops, setCrops] = useState<Crop[]>([]);
    const [loadingCrops, setLoadingCrops] = useState(true);
    // List state — GET /data-hub/datasets
    const [dataHub, setDataHub] = useState<DataHub[]>([]);
    const [loadingDataHub, setLoadingDataHub] = useState(true);
    // List state — GET /ai-models/list
    const [aiModels, setAiModels] = useState<AiModel[]>([]);
    const [loadingAiModels, setLoadingAiModels] = useState(true);
    // Edit dialog state — PUT /research-outputs/update
    const [editResearchOutputsTarget, setEditResearchOutputsTarget] = useState<ResearchOutput | null>(null);
    // Delete confirmation dialog
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    // Track delete in-flight to disable double-confirm
    const [deleting, setDeleting] = useState(false);
    // Track update in-flight for the save button
    const [updating, setUpdating] = useState(false);

    useEffect(() => { if (id) void loadResearchOutputsItem(); }, [id]);
    useEffect(() => { void loadCrops(); }, []);
    useEffect(() => { void loadDataHub(); }, []);
    useEffect(() => { void loadAiModels(); }, []);

    async function loadResearchOutputsItem() {
        try {
            setLoadingResearchOutputsItem(true);
            const res = await researchOutputsService.detail({ id: id });
            setResearchOutputsItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadResearchOutputsItem]', err);
        } finally {
            setLoadingResearchOutputsItem(false);
        }
    }
    async function loadCrops() {
        try {
            setLoadingCrops(true);
            const res = await cropsService.list({ page: 1, limit: 200 });
            setCrops(Array.isArray(res?.data) ? res.data : []);
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
            const res = await dataHubService.datasets({ page: 1, limit: 200 });
            setDataHub(Array.isArray(res?.data) ? res.data : []);
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
            const res = await aiModelsService.list({ page: 1, limit: 200 });
            setAiModels(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to load aiModels');
            console.error('[loadAiModels]', err);
        } finally {
            setLoadingAiModels(false);
        }
    }
    async function handleUpdateResearchOutputs(data: ResearchOutputsUpdateParams) {
        try {
            setUpdating(true);
            await researchOutputsService.update(data);
            toast.success('Updated');
            setEditResearchOutputsTarget(null);
            await loadResearchOutputsItem();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateResearchOutputs]', err);
        } finally {
            setUpdating(false);
        }
    }
    async function handleDeleteResearchOutputs(params: ResearchOutputsDeleteParams) {
        try {
            setDeleting(true);
            await researchOutputsService.delete(params);
            toast.success('Deleted');
            setDeleteConfirmOpen(false);
            gotoPage_19();
            return true;
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteResearchOutputs]', err);
            return false;
        } finally {
            setDeleting(false);
        }
    }

    function gotoPage_19() {
        navigate('/researcher/outputs');
    }

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: Research Output Detail
        DESCRIPTION: Displays the full record of a single research output including its title, abstract, author list, publication date and status, linked Hub datasets and AI models used, methodology summary, key findings narrative, embedded data visualizations, citation information, and file download options. Researchers who own the output can edit its metadata, manage version history, and update approval status. This detail view provides the complete scientific context behind each published finding, enabling reproducibility and further research building on existing outputs.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - researchOutputsItem (object or null)  — detail data, auto-loaded on mount from useParams.id
          - loadingResearchOutputsItem (boolean)
          - loadResearchOutputsItem() — call to (re)load
          - crops (array)              — list data, auto-loaded on mount and on cropsPage change
          - loadingCrops (boolean)
          - cropsPage / setCropsPage  — pagination state
          - cropsTotal (number)         — total record count for pagination UI
          - loadCrops() — call to reload the list
          - dataHub (array)              — list data, auto-loaded on mount and on dataHubPage change
          - loadingDataHub (boolean)
          - dataHubPage / setDataHubPage  — pagination state
          - dataHubTotal (number)         — total record count for pagination UI
          - loadDataHub() — call to reload the list
          - aiModels (array)              — list data, auto-loaded on mount and on aiModelsPage change
          - loadingAiModels (boolean)
          - aiModelsPage / setAiModelsPage  — pagination state
          - aiModelsTotal (number)         — total record count for pagination UI
          - loadAiModels() — call to reload the list
          - editResearchOutputsTarget / setEditResearchOutputsTarget — set to the row being edited; wrap edit form in <Dialog open={!!editResearchOutputsTarget}>
          - handleUpdateResearchOutputs(data: ResearchOutputsUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { researchOutputsUpdateSchema } from '@/lib/api/researchOutputsFormSchema' and wire useForm({ resolver: zodResolver(researchOutputsUpdateSchema), values: editResearchOutputsTarget ?? undefined }); submit via handleSubmit.
          - handleDeleteResearchOutputs(params: ResearchOutputsDeleteParams) — call from delete confirmation

        OUTGOING NAVIGATION (every edge below MUST be wired):
          - back_button -> /researcher/outputs (back arrow / breadcrumb at top of Research Output Detail)
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
    // Edit form
    const editForm = useForm<ResearchOutputsUpdateInput>({
        resolver: zodResolver(researchOutputsUpdateSchema),
        values: editResearchOutputsTarget
            ? {
                  title: editResearchOutputsTarget.title ?? '',
                  authors: editResearchOutputsTarget.authors ?? [],
                  abstract: editResearchOutputsTarget.abstract ?? '',
                  crop_focus_ids: editResearchOutputsTarget.crop_focus ?? [],
                  dataset_ids: (editResearchOutputsTarget.datasets_used ?? []).map((d) => d?.id ?? ''),
                  model_ids: (editResearchOutputsTarget.models_applied ?? []).map((m) => m?.id ?? ''),
                  methodology: editResearchOutputsTarget.methodology ?? '',
                  key_findings: editResearchOutputsTarget.key_findings ?? '',
                  status: editResearchOutputsTarget.status ?? '',
              }
            : undefined,
    });

    function onEditSubmit(values: ResearchOutputsUpdateInput) {
        void handleUpdateResearchOutputs({
            id: editResearchOutputsTarget?.id ?? id,
            title: values.title ?? '',
            authors: values.authors ?? [],
            abstract: values.abstract ?? '',
            crop_focus_ids: values.crop_focus_ids ?? [],
            dataset_ids: values.dataset_ids ?? [],
            model_ids: values.model_ids ?? [],
            methodology: values.methodology ?? '',
            key_findings: values.key_findings ?? '',
            status: values.status ?? '',
        });
    }

    async function onDelete() {
        await handleDeleteResearchOutputs({ id });
    }

    function statusBadgeVariant(status?: string) {
        if (!status) return 'secondary';
        const s = status.toLowerCase();
        if (s === 'published') return 'default';
        if (s === 'approved') return 'default';
        if (s === 'draft') return 'secondary';
        if (s === 'pending') return 'outline';
        if (s === 'rejected') return 'destructive';
        return 'secondary';
    }

    function formatDate(dateStr?: string) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-UG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    }

    const item = researchOutputsItem;

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Back button + breadcrumb */}
            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    className="gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to Research Outputs
                </Button>
            </div>

            {/* Loading skeleton */}
            {loadingResearchOutputsItem && (
                <div className="space-y-4">
                    <Skeleton className="h-10 w-2/3 rounded-lg" />
                    <Skeleton className="h-5 w-1/3 rounded-lg" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <Skeleton className="h-32 rounded-lg" />
                        <Skeleton className="h-32 rounded-lg" />
                        <Skeleton className="h-32 rounded-lg" />
                    </div>
                    <Skeleton className="h-48 rounded-lg" />
                    <Skeleton className="h-48 rounded-lg" />
                </div>
            )}

            {/* Not found */}
            {!loadingResearchOutputsItem && !item && (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                    <FileText className="h-16 w-16 text-amber-500/40" />
                    <p className="font-heading text-2xl text-foreground/70">Research output not found</p>
                    <p className="text-muted-foreground text-sm max-w-xs">
                        The record you are looking for does not exist or may have been removed.
                    </p>
                    <Button
                        variant="outline"
                        onClick={gotoPage_19}
                        className="mt-2 border-primary text-primary shadow-[0_0_12px] shadow-primary/20"
                    >
                        Return to Research Outputs
                    </Button>
                </div>
            )}

            {/* Main content */}
            {!loadingResearchOutputsItem && item && (
                <div className="space-y-6">
                    {/* Hero header card */}
                    <div className="relative rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md px-6 py-6 overflow-hidden">
                        {/* Ambient amber glow */}
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent rounded-lg" />
                        <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                            <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge variant={statusBadgeVariant(item.status)} className="text-xs capitalize">
                                        {item.status === 'published' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                                        {item.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1" />}
                                        {item.status === 'draft' && <FileLock2 className="h-3 w-3 mr-1" />}
                                        {item.status ?? 'Unknown'}
                                    </Badge>
                                    {(item.crop_focus ?? []).map((crop) => (
                                        <Badge key={crop} variant="outline" className="text-xs border-amber-500/30 text-amber-600 dark:text-amber-400">
                                            <Leaf className="h-3 w-3 mr-1" />
                                            {crop}
                                        </Badge>
                                    ))}
                                </div>
                                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground leading-tight">
                                    {item.title ?? 'Untitled Research Output'}
                                </h1>
                                {(item.authors ?? []).length > 0 && (
                                    <p className="text-sm text-muted-foreground">
                                        {(item.authors ?? []).join(', ')}
                                    </p>
                                )}
                                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                                    {item.published_at && (
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            Published {formatDate(item.published_at)}
                                        </span>
                                    )}
                                    {item.updated_at && (
                                        <span className="flex items-center gap-1">
                                            <RefreshCw className="h-3.5 w-3.5" />
                                            Updated {formatDate(item.updated_at)}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Actions */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                                {item.file_url && (
                                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                                        <Button
                                            size="sm"
                                            className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px] shadow-primary/30 hover:bg-primary/10 transition-all duration-200"
                                        >
                                            <Download className="h-4 w-4" />
                                            Download
                                        </Button>
                                    </a>
                                )}
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 border-border/60 hover:border-amber-500/50 transition-all duration-200"
                                    onClick={() => setEditResearchOutputsTarget(item)}
                                >
                                    <Pencil className="h-4 w-4" />
                                    Edit
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10 transition-all duration-200"
                                    onClick={() => setDeleteConfirmOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Retract
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs: Overview / Datasets & Models / Citation & History */}
                    <Tabs defaultValue="overview" className="space-y-4">
                        <TabsList className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg p-1 h-auto flex flex-wrap gap-1">
                            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 rounded-md transition-all duration-200">
                                <BookOpen className="h-4 w-4 mr-1.5" />
                                Overview
                            </TabsTrigger>
                            <TabsTrigger value="resources" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 rounded-md transition-all duration-200">
                                <Database className="h-4 w-4 mr-1.5" />
                                Datasets & Models
                            </TabsTrigger>
                            <TabsTrigger value="citation" className="data-[state=active]:bg-amber-500/20 data-[state=active]:text-amber-600 dark:data-[state=active]:text-amber-400 rounded-md transition-all duration-200">
                                <Quote className="h-4 w-4 mr-1.5" />
                                Citation & History
                            </TabsTrigger>
                        </TabsList>

                        {/* Overview tab */}
                        <TabsContent value="overview" className="space-y-4 mt-0">
                            {/* Abstract */}
                            <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-6 space-y-3">
                                <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <BookOpen className="h-5 w-5 text-amber-500" />
                                    Abstract
                                </h2>
                                <Separator className="bg-border/30" />
                                {item.abstract ? (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.abstract}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No abstract available.</p>
                                )}
                            </div>

                            {/* Methodology */}
                            <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-6 space-y-3">
                                <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <FlaskConical className="h-5 w-5 text-amber-500" />
                                    Methodology
                                </h2>
                                <Separator className="bg-border/30" />
                                {item.methodology ? (
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.methodology}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No methodology recorded.</p>
                                )}
                            </div>

                            {/* Key Findings */}
                            <div className="rounded-lg border border-border/40 bg-card/70 backdrop-blur-md shadow-md p-6 space-y-3 border-amber-500/20">
                                <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <Lightbulb className="h-5 w-5 text-amber-500" />
                                    Key Findings
                                </h2>
                                <Separator className="bg-border/30" />
                                {item.key_findings ? (
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{item.key_findings}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No key findings recorded.</p>
                                )}
                            </div>
                        </TabsContent>

                        {/* Datasets & Models tab */}
                        <TabsContent value="resources" className="space-y-4 mt-0">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Datasets used */}
                                <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-6 space-y-3">
                                    <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                        <Database className="h-5 w-5 text-amber-500" />
                                        Datasets Used
                                    </h2>
                                    <Separator className="bg-border/30" />
                                    {(item.datasets_used ?? []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No datasets linked.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {(item.datasets_used ?? []).map((ds, idx) => (
                                                <li key={ds?.id ?? idx} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-md bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors duration-200">
                                                    <Database className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
                                                    <span className="text-foreground/80">{ds?.name ?? ds?.id ?? 'Unknown dataset'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>

                                {/* AI Models applied */}
                                <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-6 space-y-3">
                                    <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                        <BrainCircuit className="h-5 w-5 text-amber-500" />
                                        AI Models Applied
                                    </h2>
                                    <Separator className="bg-border/30" />
                                    {(item.models_applied ?? []).length === 0 ? (
                                        <p className="text-sm text-muted-foreground italic">No AI models linked.</p>
                                    ) : (
                                        <ul className="space-y-2">
                                            {(item.models_applied ?? []).map((m, idx) => (
                                                <li key={m?.id ?? idx} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-md bg-muted/30 border border-border/20 hover:bg-muted/50 transition-colors duration-200">
                                                    <BrainCircuit className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
                                                    <span className="text-foreground/80">{m?.name ?? m?.id ?? 'Unknown model'}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        </TabsContent>

                        {/* Citation & History tab */}
                        <TabsContent value="citation" className="space-y-4 mt-0">
                            {/* Citation */}
                            <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-6 space-y-3">
                                <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <Quote className="h-5 w-5 text-amber-500" />
                                    Citation
                                </h2>
                                <Separator className="bg-border/30" />
                                {item.citation ? (
                                    <div className="rounded-md bg-muted/40 border border-border/30 p-4">
                                        <p className="text-sm font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap">{item.citation}</p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No citation available.</p>
                                )}
                            </div>

                            {/* Version history */}
                            <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-6 space-y-3">
                                <h2 className="font-heading text-lg font-semibold flex items-center gap-2 text-foreground">
                                    <Clock className="h-5 w-5 text-amber-500" />
                                    Version History
                                </h2>
                                <Separator className="bg-border/30" />
                                {(item.version_history ?? []).length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic">No version history available.</p>
                                ) : (
                                    <div className="relative pl-4 space-y-4">
                                        <div className="absolute left-0 top-0 bottom-0 w-px bg-amber-500/20" />
                                        {(item.version_history ?? []).map((vh, idx) => (
                                            <div key={idx} className="relative pl-4 space-y-1">
                                                <div className="absolute left-[-1px] top-1.5 h-2.5 w-2.5 rounded-full bg-amber-500/60 border-2 border-background" />
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                                                        v{vh?.version ?? idx + 1}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">{formatDate(vh?.updated_at)}</span>
                                                </div>
                                                {vh?.changes && (
                                                    <p className="text-sm text-foreground/70 leading-relaxed">{vh.changes}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Edit Dialog */}
            <Dialog
                open={!!editResearchOutputsTarget}
                onOpenChange={(open) => {
                    if (!open) setEditResearchOutputsTarget(null);
                }}
            >
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-md border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">Edit Research Output</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-2">
                            <FormField
                                control={editForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Research output title" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="authors"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Authors</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Comma-separated author names"
                                                value={(field.value ?? []).join(', ')}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    field.onChange(
                                                        val
                                                            ? val.split(',').map((a) => a.trim()).filter(Boolean)
                                                            : []
                                                    );
                                                }}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="abstract"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Abstract</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Brief summary of the research..." rows={3} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="methodology"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Methodology</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Describe the research methodology..." rows={3} {...field} />
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
                                            <Textarea placeholder="Summarise the key findings..." rows={3} {...field} />
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
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="draft">Draft</SelectItem>
                                                <SelectItem value="pending">Pending Review</SelectItem>
                                                <SelectItem value="approved">Approved</SelectItem>
                                                <SelectItem value="published">Published</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Crop focus selector — searchable Combobox */}
                            <FormField
                                control={editForm.control}
                                name="crop_focus_ids"
                                render={({ field }) => {
                                    const selected = field.value ?? [];
                                    return (
                                        <FormItem>
                                            <FormLabel>Crop Focus</FormLabel>
                                            {loadingCrops ? (
                                                <Skeleton className="h-9 w-full rounded-md" />
                                            ) : (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    'w-full justify-between font-normal',
                                                                    selected.length === 0 && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {selected.length > 0
                                                                    ? `${selected.length} crop${selected.length > 1 ? 's' : ''} selected`
                                                                    : 'Select crops...'}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search crops..." />
                                                            <CommandList>
                                                                <CommandEmpty>No crop found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {crops.map((crop) => {
                                                                        const isSelected = selected.includes(crop.id ?? '');
                                                                        return (
                                                                            <CommandItem
                                                                                key={crop.id}
                                                                                value={crop.name}
                                                                                onSelect={() => {
                                                                                    field.onChange(
                                                                                        isSelected
                                                                                            ? selected.filter((c) => c !== crop.id)
                                                                                            : [...selected, crop.id ?? '']
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        'mr-2 h-4 w-4',
                                                                                        isSelected ? 'opacity-100' : 'opacity-0'
                                                                                    )}
                                                                                />
                                                                                {crop.name}
                                                                            </CommandItem>
                                                                        );
                                                                    })}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Dataset selector — searchable Combobox */}
                            <FormField
                                control={editForm.control}
                                name="dataset_ids"
                                render={({ field }) => {
                                    const selected = field.value ?? [];
                                    return (
                                        <FormItem>
                                            <FormLabel>Datasets Used</FormLabel>
                                            {loadingDataHub ? (
                                                <Skeleton className="h-9 w-full rounded-md" />
                                            ) : (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    'w-full justify-between font-normal',
                                                                    selected.length === 0 && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {selected.length > 0
                                                                    ? `${selected.length} dataset${selected.length > 1 ? 's' : ''} selected`
                                                                    : 'Select datasets...'}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search datasets..." />
                                                            <CommandList>
                                                                <CommandEmpty>No dataset found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {dataHub.map((ds) => {
                                                                        const isSelected = selected.includes(ds.id ?? '');
                                                                        return (
                                                                            <CommandItem
                                                                                key={ds.id}
                                                                                value={ds.name}
                                                                                onSelect={() => {
                                                                                    field.onChange(
                                                                                        isSelected
                                                                                            ? selected.filter((c) => c !== ds.id)
                                                                                            : [...selected, ds.id ?? '']
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        'mr-2 h-4 w-4',
                                                                                        isSelected ? 'opacity-100' : 'opacity-0'
                                                                                    )}
                                                                                />
                                                                                {ds.name}
                                                                            </CommandItem>
                                                                        );
                                                                    })}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* AI Model selector — searchable Combobox */}
                            <FormField
                                control={editForm.control}
                                name="model_ids"
                                render={({ field }) => {
                                    const selected = field.value ?? [];
                                    return (
                                        <FormItem>
                                            <FormLabel>AI Models Applied</FormLabel>
                                            {loadingAiModels ? (
                                                <Skeleton className="h-9 w-full rounded-md" />
                                            ) : (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant="outline"
                                                                role="combobox"
                                                                className={cn(
                                                                    'w-full justify-between font-normal',
                                                                    selected.length === 0 && 'text-muted-foreground'
                                                                )}
                                                            >
                                                                {selected.length > 0
                                                                    ? `${selected.length} model${selected.length > 1 ? 's' : ''} selected`
                                                                    : 'Select AI models...'}
                                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                            </Button>
                                                        </FormControl>
                                                    </PopoverTrigger>
                                                    <PopoverContent className="w-full p-0" align="start">
                                                        <Command>
                                                            <CommandInput placeholder="Search AI models..." />
                                                            <CommandList>
                                                                <CommandEmpty>No AI model found.</CommandEmpty>
                                                                <CommandGroup>
                                                                    {aiModels.map((m) => {
                                                                        const isSelected = selected.includes(m.id ?? '');
                                                                        return (
                                                                            <CommandItem
                                                                                key={m.id}
                                                                                value={m.name}
                                                                                onSelect={() => {
                                                                                    field.onChange(
                                                                                        isSelected
                                                                                            ? selected.filter((c) => c !== m.id)
                                                                                            : [...selected, m.id ?? '']
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        'mr-2 h-4 w-4',
                                                                                        isSelected ? 'opacity-100' : 'opacity-0'
                                                                                    )}
                                                                                />
                                                                                {m.name}
                                                                            </CommandItem>
                                                                        );
                                                                    })}
                                                                </CommandGroup>
                                                            </CommandList>
                                                        </Command>
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            <DialogFooter className="pt-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="outline" disabled={updating}>Cancel</Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    disabled={updating}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px] shadow-primary/30 hover:bg-primary/10 transition-all duration-200"
                                >
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete/Retract confirmation */}
            <AlertDialog open={deleteConfirmOpen} onOpenChange={(open) => { if (!deleting) setDeleteConfirmOpen(open); }}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-md border border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading">Retract Research Output?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete this research output and all associated records. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => void onDelete()}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting ? 'Retracting...' : 'Retract'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
