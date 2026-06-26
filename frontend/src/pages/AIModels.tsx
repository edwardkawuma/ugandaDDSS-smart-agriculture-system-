import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
    aiModelsService,
    type AiModelsListParams,
    type AiModelsListResponse,
    type AiModelsResultsResponse,
    type AiModelsRunParams,
} from '@/lib/api/aiModelsService';
import {
    dataHubService,
    type DataHubDatasetsParams,
    type DataHubDatasetsResponse,
} from '@/lib/api/dataHubService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Brain,
    Search,
    Play,
    Download,
    MoreVertical,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Cpu,
    TrendingUp,
    Bug,
    Cloud,
    Leaf,
    Clock,
    ChevronDown,
    Check,
    BarChart2,
    FlaskConical,
    Settings2,
    History,
    Info,
    Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Inline run schema (no auto-generated form schema exists for ai-models/run)
// parameters is managed via state (textarea JSON) since it's a free-form object.
const runInferenceSchema = z.object({
    model_id: z.string().min(1, 'Model is required'),
    dataset_ids: z.array(z.string()).min(1, 'Select at least one dataset'),
    district: z.string().min(1, 'District is required'),
    crop: z.string().min(1, 'Crop is required'),
    season: z.string().min(1, 'Season is required'),
});
type RunInferenceInput = z.infer<typeof runInferenceSchema>;

const MODEL_TYPE_ICONS: Record<string, React.ReactNode> = {
    yield_prediction: <TrendingUp className="h-4 w-4" />,
    pest_forecast: <Bug className="h-4 w-4" />,
    disease_spread: <FlaskConical className="h-4 w-4" />,
    climate_anomaly: <Cloud className="h-4 w-4" />,
};

const MODEL_TYPE_LABELS: Record<string, string> = {
    yield_prediction: 'Yield Prediction',
    pest_forecast: 'Pest Forecast',
    disease_spread: 'Disease Spread',
    climate_anomaly: 'Climate Anomaly',
};

const UGANDAN_DISTRICTS = [
    'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbale', 'Gulu', 'Lira', 'Mbarara',
    'Masaka', 'Soroti', 'Arua', 'Fort Portal', 'Hoima', 'Kabale', 'Tororo',
    'Iganga', 'Masindi', 'Busia', 'Mityana', 'Kasese',
];

const UGANDAN_CROPS = [
    'Maize', 'Coffee', 'Banana', 'Cassava', 'Beans', 'Sorghum', 'Millet',
    'Sweet Potato', 'Rice', 'Groundnut', 'Sunflower', 'Cotton', 'Tea', 'Tobacco',
];

const SEASONS = ['Season A (Mar-Jun)', 'Season B (Aug-Dec)', 'Season A 2025', 'Season B 2025', 'Season A 2024', 'Season B 2024'];

type AiModel = AiModelsListResponse['data'][number];
type DataHub = DataHubDatasetsResponse['data'][number];

export default function AIModels() {
    const navigate = useNavigate();

    // List state — GET /ai-models/list
    const [aiModels, setAiModels] = useState<AiModel[]>([]);
    const [loadingAiModels, setLoadingAiModels] = useState(true);
    const [aiModelsPage, setAiModelsPage] = useState(1);
    const [aiModelsLimit] = useState(9);
    const [aiModelsTotal, setAiModelsTotal] = useState(0);
    const [modelTypeFilter, setModelTypeFilter] = useState('all');
    const [modelSearch, setModelSearch] = useState('');

    // List state — GET /data-hub/datasets
    const [dataHub, setDataHub] = useState<DataHub[]>([]);
    const [loadingDataHub, setLoadingDataHub] = useState(true);
    const [dataHubPage, setDataHubPage] = useState(1);
    const [dataHubLimit] = useState(50);
    const [dataHubTotal, setDataHubTotal] = useState(0);
    const [datasetSearch, setDatasetSearch] = useState('');
    const [datasetPopoverOpen, setDatasetPopoverOpen] = useState(false);

    // Detail state — GET /ai-models/results
    const [aiModelsItem, setAiModelsItem] = useState<AiModelsResultsResponse['data'] | null>(null);
    const [loadingAiModelsItem, setLoadingAiModelsItem] = useState(false);

    // Local UI state
    const [selectedModel, setSelectedModel] = useState<AiModel | null>(null);
    const [detailSheetOpen, setDetailSheetOpen] = useState(false);
    const [runDialogOpen, setRunDialogOpen] = useState(false);
    const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
    const [runningJobId, setRunningJobId] = useState<string | null>(null);
    const [isRunning, setIsRunning] = useState(false);
    const [detailTab, setDetailTab] = useState('overview');
    const [parametersJson, setParametersJson] = useState('{}');
    const [parametersError, setParametersError] = useState<string | null>(null);

    useEffect(() => { void loadAiModels(); }, [aiModelsPage, modelTypeFilter]);

    // Debounce dataset search so we fire the service call 300ms after the user stops typing
    const datasetSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        if (datasetSearchDebounceRef.current) clearTimeout(datasetSearchDebounceRef.current);
        datasetSearchDebounceRef.current = setTimeout(() => {
            setDataHubPage(1);
            void loadDataHub(datasetSearch);
        }, 300);
        return () => { if (datasetSearchDebounceRef.current) clearTimeout(datasetSearchDebounceRef.current); };
    }, [datasetSearch]);

    useEffect(() => { void loadDataHub(datasetSearch); }, [dataHubPage]);

    async function loadAiModels() {
        try {
            setLoadingAiModels(true);
            const params: AiModelsListParams = { page: aiModelsPage, limit: aiModelsLimit };
            if (modelTypeFilter !== 'all') params.model_type = modelTypeFilter;
            const res = await aiModelsService.list(params);
            setAiModels(Array.isArray(res?.data) ? res.data : []);
            setAiModelsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load AI models');
            console.error('[loadAiModels]', err);
        } finally {
            setLoadingAiModels(false);
        }
    }

    async function loadDataHub(search?: string) {
        try {
            setLoadingDataHub(true);
            const params: DataHubDatasetsParams = { page: dataHubPage, limit: dataHubLimit };
            if (search && search.trim()) params.search = search.trim();
            const res = await dataHubService.datasets(params);
            setDataHub(Array.isArray(res?.data) ? res.data : []);
            setDataHubTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load datasets');
            console.error('[loadDataHub]', err);
        } finally {
            setLoadingDataHub(false);
        }
    }

    async function handleRun(data: RunInferenceInput) {
        try {
            setIsRunning(true);
            // Parse parameters JSON — already validated in form submit handler, but guard here
            let paramsObj: Record<string, any> = {};
            try {
                paramsObj = parametersJson.trim() ? JSON.parse(parametersJson) : {};
                if (typeof paramsObj !== 'object' || paramsObj === null || Array.isArray(paramsObj)) {
                    throw new Error('Parameters must be a JSON object');
                }
            } catch (parseErr) {
                toast.error('Invalid parameters JSON');
                setParametersError(parseErr instanceof Error ? parseErr.message : 'Invalid JSON');
                setIsRunning(false);
                return;
            }
            const payload = { ...data, parameters: paramsObj } as AiModelsRunParams;
            const res = await aiModelsService.run(payload);
            const jobId = res?.data?.job_id ?? null;
            setRunningJobId(jobId);
            toast.success('Inference job submitted successfully');
            setRunDialogOpen(false);
            if (jobId) {
                void loadAiModelsItem(jobId);
                setResultsDialogOpen(true);
            }
        } catch (err) {
            toast.error('Failed to run model inference');
            console.error('[handleRun]', err);
        } finally {
            setIsRunning(false);
        }
    }

    async function loadAiModelsItem(targetId: string) {
        try {
            setLoadingAiModelsItem(true);
            const res = await aiModelsService.results({ job_id: targetId });
            setAiModelsItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load inference results');
            console.error('[loadAiModelsItem]', err);
        } finally {
            setLoadingAiModelsItem(false);
        }
    }

    const filteredModels = useMemo(() => {
        if (!modelSearch.trim()) return aiModels;
        const q = modelSearch.toLowerCase();
        return aiModels.filter(m =>
            m.name?.toLowerCase().includes(q) ||
            m.description?.toLowerCase().includes(q) ||
            m.model_type?.toLowerCase().includes(q)
        );
    }, [aiModels, modelSearch]);

    // Server-side search is used for datasets; render whatever the service returned directly.
    const filteredDatasets = dataHub;

    const totalPages = Math.ceil(aiModelsTotal / aiModelsLimit);

    // Run inference form
    const runForm = useForm<RunInferenceInput>({
        resolver: zodResolver(runInferenceSchema),
        defaultValues: {
            model_id: selectedModel?.id ?? '',
            dataset_ids: [],
            district: '',
            crop: '',
            season: '',
        },
    });

    useEffect(() => {
        if (selectedModel?.id) {
            runForm.setValue('model_id', selectedModel.id);
        }
    }, [selectedModel]);

    function openRunDialog(model: AiModel) {
        setSelectedModel(model);
        runForm.reset({
            model_id: model.id ?? '',
            dataset_ids: [],
            district: '',
            crop: '',
            season: '',
        });
        // Pre-fill parameters JSON from model's default input_parameters schema
        const defaultParams = model.input_parameters && Object.keys(model.input_parameters).length > 0
            ? model.input_parameters
            : {};
        setParametersJson(JSON.stringify(defaultParams, null, 2));
        setParametersError(null);
        setRunDialogOpen(true);
    }

    function openDetailSheet(model: AiModel) {
        setSelectedModel(model);
        setDetailTab('overview');
        setDetailSheetOpen(true);
    }

    function getModelTypeBadgeColor(type?: string) {
        switch (type) {
            case 'yield_prediction': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'pest_forecast': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
            case 'disease_spread': return 'bg-red-500/20 text-red-400 border-red-500/30';
            case 'climate_anomaly': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen bg-gradient-to-br from-background via-background to-amber-950/10">

            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
                <button
                    type="button"
                    onClick={() => navigate('/researcher/data-hub')}
                    className="hover:text-amber-400 transition-colors"
                >
                    Data Hub
                </button>
                <span>/</span>
                <span className="text-foreground font-medium">AI Models</span>
            </nav>

            {/* Page Header */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate('/researcher/data-hub')}
                            className="h-9 w-9 hover:bg-amber-500/10"
                            aria-label="Back to Data Hub"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <Brain className="h-6 w-6 text-amber-400" />
                        </div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">AI Models</h1>
                    </div>
                    <p className="text-muted-foreground text-sm ml-14">
                        Machine learning models for crop yield, pest forecasting, disease spread &amp; climate anomaly detection
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadAiModels()}
                        className="gap-2 border-border/40 hover:bg-amber-500/5"
                    >
                        <RefreshCw className="h-4 w-4" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Filters Row */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search models..."
                        value={modelSearch}
                        onChange={e => setModelSearch(e.target.value)}
                        className="pl-9 bg-card/60 border-border/40 backdrop-blur-md"
                    />
                </div>
                <Select value={modelTypeFilter} onValueChange={v => { setModelTypeFilter(v); setAiModelsPage(1); }}>
                    <SelectTrigger className="w-48 bg-card/60 border-border/40 backdrop-blur-md">
                        <SelectValue placeholder="All model types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="yield_prediction">Yield Prediction</SelectItem>
                        <SelectItem value="pest_forecast">Pest Forecast</SelectItem>
                        <SelectItem value="disease_spread">Disease Spread</SelectItem>
                        <SelectItem value="climate_anomaly">Climate Anomaly</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Total Models', value: aiModelsTotal, icon: <Brain className="h-4 w-4 text-amber-400" /> },
                    { label: 'Yield Models', value: aiModels.filter(m => m.model_type === 'yield_prediction').length, icon: <TrendingUp className="h-4 w-4 text-emerald-400" /> },
                    { label: 'Pest Models', value: aiModels.filter(m => m.model_type === 'pest_forecast').length, icon: <Bug className="h-4 w-4 text-orange-400" /> },
                    { label: 'Climate Models', value: aiModels.filter(m => m.model_type === 'climate_anomaly').length, icon: <Cloud className="h-4 w-4 text-blue-400" /> },
                ].map(stat => (
                    <div key={stat.label} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 flex items-center gap-3 transition-all duration-200 hover:bg-card/80">
                        <div className="p-2 rounded-md bg-background/40">{stat.icon}</div>
                        <div>
                            <div className="text-xl font-bold text-foreground">{stat.value}</div>
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Models Grid */}
            {loadingAiModels ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-56 rounded-lg" />
                    ))}
                </div>
            ) : filteredModels.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                    <Brain className="h-12 w-12 text-muted-foreground/40 mb-4" />
                    <p className="text-muted-foreground font-medium">No models found</p>
                    <p className="text-sm text-muted-foreground/60 mt-1">Try adjusting your search or filter</p>
                    <Button variant="outline" size="sm" className="mt-4" onClick={() => { setModelSearch(''); setModelTypeFilter('all'); }}>
                        Clear filters
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filteredModels.map(model => (
                        <div
                            key={model.id}
                            className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-4 transition-all duration-200 ease-out hover:bg-card/80 hover:shadow-amber-500/10 hover:shadow-lg hover:border-amber-500/20"
                        >
                            {/* Card Header */}
                            <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20 shrink-0">
                                        {MODEL_TYPE_ICONS[model.model_type ?? ''] ?? <Cpu className="h-4 w-4 text-amber-400" />}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-heading font-semibold text-base text-foreground truncate">{model.name ?? 'Unnamed Model'}</h3>
                                        <span className={cn('inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium mt-0.5', getModelTypeBadgeColor(model.model_type))}>
                                            {MODEL_TYPE_LABELS[model.model_type ?? ''] ?? model.model_type ?? 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openDetailSheet(model)}>
                                            <Info className="h-4 w-4 mr-2" /> View Details
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => openRunDialog(model)}>
                                            <Play className="h-4 w-4 mr-2" /> Run Inference
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>

                            {/* Description */}
                            <p className="text-sm text-muted-foreground line-clamp-2 flex-1">{model.description ?? 'No description available.'}</p>

                            {/* Meta row */}
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <History className="h-3 w-3" /> v{model.version ?? '1.0'}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Leaf className="h-3 w-3" />
                                    {model.supported_crops?.slice(0, 2).join(', ') ?? 'Various crops'}
                                    {(model.supported_crops?.length ?? 0) > 2 && ` +${(model.supported_crops?.length ?? 0) - 2}`}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {model.last_updated ? new Date(model.last_updated).toLocaleDateString('en-UG', { month: 'short', year: 'numeric' }) : '—'}
                                </span>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 pt-1">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 text-xs border-border/40 hover:bg-amber-500/5"
                                    onClick={() => openDetailSheet(model)}
                                >
                                    <Info className="h-3 w-3 mr-1" /> Details
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 text-xs bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:bg-primary/5 transition-all duration-200"
                                    onClick={() => openRunDialog(model)}
                                >
                                    <Zap className="h-3 w-3 mr-1" /> Run Model
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loadingAiModels && totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Showing {((aiModelsPage - 1) * aiModelsLimit) + 1}–{Math.min(aiModelsPage * aiModelsLimit, aiModelsTotal)} of {aiModelsTotal} models
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={aiModelsPage === 1}
                            onClick={() => setAiModelsPage(p => Math.max(1, p - 1))}
                            className="border-border/40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="text-sm text-muted-foreground px-2">{aiModelsPage} / {totalPages}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={aiModelsPage >= totalPages}
                            onClick={() => setAiModelsPage(p => p + 1)}
                            className="border-border/40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* ── Model Detail Sheet ── */}
            <Sheet open={detailSheetOpen} onOpenChange={setDetailSheetOpen}>
                <SheetContent side="right" className="w-full sm:max-w-2xl backdrop-blur-md bg-card/95 border-border/40 overflow-hidden flex flex-col">
                    <SheetHeader className="shrink-0 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                                {MODEL_TYPE_ICONS[selectedModel?.model_type ?? ''] ?? <Brain className="h-5 w-5 text-amber-400" />}
                            </div>
                            <div>
                                <SheetTitle className="font-heading text-xl">{selectedModel?.name ?? 'Model Details'}</SheetTitle>
                                <SheetDescription className="text-xs">
                                    {MODEL_TYPE_LABELS[selectedModel?.model_type ?? ''] ?? selectedModel?.model_type ?? ''} • v{selectedModel?.version ?? '1.0'}
                                </SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <Tabs value={detailTab} onValueChange={setDetailTab} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="shrink-0 bg-background/40 border border-border/30 mb-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="parameters">Parameters</TabsTrigger>
                            <TabsTrigger value="history">Version History</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1">
                            <TabsContent value="overview" className="mt-0 space-y-5 pr-2">
                                <div className="space-y-2">
                                    <h4 className="font-heading text-sm font-semibold text-amber-400 uppercase tracking-wider">Description</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedModel?.description ?? '—'}</p>
                                </div>
                                <Separator className="border-border/30" />
                                <div className="space-y-2">
                                    <h4 className="font-heading text-sm font-semibold text-amber-400 uppercase tracking-wider">Output Description</h4>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedModel?.output_description ?? '—'}</p>
                                </div>
                                <Separator className="border-border/30" />
                                <div className="space-y-3">
                                    <h4 className="font-heading text-sm font-semibold text-amber-400 uppercase tracking-wider">Supported Crops</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedModel?.supported_crops ?? []).length === 0
                                            ? <span className="text-sm text-muted-foreground">Not specified</span>
                                            : selectedModel?.supported_crops?.map(crop => (
                                                <Badge key={crop} variant="outline" className="text-xs border-border/40 bg-background/40">
                                                    <Leaf className="h-3 w-3 mr-1 text-emerald-400" />{crop}
                                                </Badge>
                                            ))
                                        }
                                    </div>
                                </div>
                                <Separator className="border-border/30" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Current Version</p>
                                        <p className="text-sm font-medium">v{selectedModel?.version ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground mb-1">Last Updated</p>
                                        <p className="text-sm font-medium">{selectedModel?.last_updated ? new Date(selectedModel.last_updated).toLocaleDateString() : '—'}</p>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="parameters" className="mt-0 space-y-4 pr-2">
                                <div className="space-y-2">
                                    <h4 className="font-heading text-sm font-semibold text-amber-400 uppercase tracking-wider">Input Parameters</h4>
                                    {selectedModel?.input_parameters && Object.keys(selectedModel.input_parameters).length > 0 ? (
                                        <div className="space-y-2">
                                            {Object.entries(selectedModel.input_parameters).map(([key, val]) => (
                                                <div key={key} className="flex items-start gap-3 p-3 rounded-md bg-background/40 border border-border/30">
                                                    <Settings2 className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                                                        <p className="text-xs text-muted-foreground mt-0.5 break-all">
                                                            {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No custom parameters defined.</p>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="history" className="mt-0 space-y-3 pr-2">
                                {(selectedModel?.version_history ?? []).length === 0 ? (
                                    <div className="flex flex-col items-center py-10 text-muted-foreground">
                                        <History className="h-8 w-8 mb-2 opacity-40" />
                                        <p className="text-sm">No version history available</p>
                                    </div>
                                ) : (
                                    selectedModel?.version_history?.map((vh, i) => (
                                        <div key={i} className="flex gap-3 p-3 rounded-md bg-background/40 border border-border/30">
                                            <div className="shrink-0 mt-1">
                                                <div className="w-2 h-2 rounded-full bg-amber-400"></div>
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold">v{vh.version}</span>
                                                    <span className="text-xs text-muted-foreground">{vh.released_at ? new Date(vh.released_at).toLocaleDateString() : '—'}</span>
                                                </div>
                                                <p className="text-xs text-muted-foreground">{vh.changes ?? '—'}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <div className="shrink-0 pt-4 border-t border-border/30">
                        <Button
                            className="w-full bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:bg-primary/5 transition-all duration-200"
                            onClick={() => { setDetailSheetOpen(false); if (selectedModel) openRunDialog(selectedModel); }}
                        >
                            <Zap className="h-4 w-4 mr-2" /> Run Inference with this Model
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>

            {/* ── Run Inference Dialog ── */}
            <Dialog open={runDialogOpen} onOpenChange={v => { if (!isRunning) setRunDialogOpen(v); }}>
                <DialogContent className="sm:max-w-lg backdrop-blur-md bg-card/95 border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <Play className="h-5 w-5 text-amber-400" /> Run Inference
                        </DialogTitle>
                        <DialogDescription>
                            Configure and execute <span className="text-foreground font-medium">{selectedModel?.name ?? 'model'}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...runForm}>
                        <form
                            onSubmit={runForm.handleSubmit(d => {
                                // Validate JSON before submitting
                                try {
                                    const parsed = parametersJson.trim() ? JSON.parse(parametersJson) : {};
                                    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                                        throw new Error('Parameters must be a JSON object');
                                    }
                                    setParametersError(null);
                                    void handleRun(d);
                                } catch (parseErr) {
                                    setParametersError(parseErr instanceof Error ? parseErr.message : 'Invalid JSON');
                                }
                            })}
                            className="space-y-4"
                        >

                            {/* Dataset selector — searchable */}
                            <FormField
                                control={runForm.control}
                                name="dataset_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Datasets</FormLabel>
                                        <FormControl>
                                            <Popover open={datasetPopoverOpen} onOpenChange={setDatasetPopoverOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between border-border/40 bg-background/40 font-normal"
                                                    >
                                                        {field.value.length === 0
                                                            ? 'Select datasets…'
                                                            : `${field.value.length} dataset${field.value.length > 1 ? 's' : ''} selected`}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0 backdrop-blur-md bg-card/95 border-border/40" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search datasets..."
                                                            value={datasetSearch}
                                                            onValueChange={setDatasetSearch}
                                                        />
                                                        <CommandList>
                                                            {loadingDataHub ? (
                                                                <div className="p-3 space-y-2">
                                                                    <Skeleton className="h-8 w-full" />
                                                                    <Skeleton className="h-8 w-full" />
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <CommandEmpty>No datasets found</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {filteredDatasets.map(ds => (
                                                                            <CommandItem
                                                                                key={ds.id}
                                                                                value={ds.id ?? ''}
                                                                                onSelect={() => {
                                                                                    const current = field.value;
                                                                                    const id = ds.id ?? '';
                                                                                    field.onChange(current.includes(id)
                                                                                        ? current.filter(x => x !== id)
                                                                                        : [...current, id]
                                                                                    );
                                                                                }}
                                                                            >
                                                                                <Check className={cn('mr-2 h-4 w-4', field.value.includes(ds.id ?? '') ? 'opacity-100 text-amber-400' : 'opacity-0')} />
                                                                                <div className="min-w-0">
                                                                                    <p className="text-sm truncate">{ds.name}</p>
                                                                                    <p className="text-xs text-muted-foreground truncate">{ds.category}</p>
                                                                                </div>
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* District */}
                            <FormField
                                control={runForm.control}
                                name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>District</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-border/40 bg-background/40">
                                                    <SelectValue placeholder="Select district" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {UGANDAN_DISTRICTS.map(d => (
                                                    <SelectItem key={d} value={d}>{d}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Crop */}
                            <FormField
                                control={runForm.control}
                                name="crop"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crop</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-border/40 bg-background/40">
                                                    <SelectValue placeholder="Select crop" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {UGANDAN_CROPS.map(c => (
                                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Season */}
                            <FormField
                                control={runForm.control}
                                name="season"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Season</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="border-border/40 bg-background/40">
                                                    <SelectValue placeholder="Select season" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {SEASONS.map(s => (
                                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Parameters (free-form JSON) */}
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium leading-none flex items-center gap-2">
                                    <Settings2 className="h-4 w-4 text-amber-400" />
                                    Parameters (JSON)
                                </label>
                                <Textarea
                                    value={parametersJson}
                                    onChange={e => {
                                        setParametersJson(e.target.value);
                                        if (parametersError) setParametersError(null);
                                    }}
                                    placeholder='{"key": "value"}'
                                    className="font-mono text-xs min-h-[100px] border-border/40 bg-background/40"
                                    rows={5}
                                />
                                {parametersError ? (
                                    <p className="text-xs text-destructive">{parametersError}</p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Optional. Override model defaults with a JSON object.
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="outline" size="sm" className="border-border/40" onClick={() => setRunDialogOpen(false)} disabled={isRunning}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    size="sm"
                                    disabled={isRunning}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:bg-primary/5 transition-all duration-200 min-w-[100px]"
                                >
                                    {isRunning ? (
                                        <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running…</>
                                    ) : (
                                        <><Zap className="h-4 w-4 mr-2" /> Run</>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ── Results Dialog ── */}
            <Dialog open={resultsDialogOpen} onOpenChange={setResultsDialogOpen}>
                <DialogContent className="sm:max-w-3xl max-h-[85vh] backdrop-blur-md bg-card/95 border-border/40 flex flex-col">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <BarChart2 className="h-5 w-5 text-amber-400" /> Inference Results
                        </DialogTitle>
                        <DialogDescription>
                            Job ID: <span className="font-mono text-xs text-foreground">{runningJobId ?? '—'}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1">
                        {loadingAiModelsItem ? (
                            <div className="space-y-4 p-2">
                                <div className="flex flex-col items-center py-8 gap-4">
                                    <RefreshCw className="h-8 w-8 text-amber-400 animate-spin" />
                                    <p className="text-muted-foreground">Processing inference job…</p>
                                    <Progress value={undefined} className="w-48 h-1" />
                                </div>
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : !aiModelsItem ? (
                            <div className="flex flex-col items-center py-16 gap-3">
                                <BarChart2 className="h-10 w-10 text-muted-foreground/40" />
                                <p className="text-muted-foreground">No results yet</p>
                                {runningJobId && (
                                    <Button size="sm" variant="outline" className="border-border/40 mt-2" onClick={() => void loadAiModelsItem(runningJobId)}>
                                        <RefreshCw className="h-4 w-4 mr-2" /> Poll for Results
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-5 p-2">
                                {/* Job Summary */}
                                <div className="grid grid-cols-3 gap-4">
                                    {[
                                        { label: 'Model', value: aiModelsItem.model_name ?? '—' },
                                        { label: 'Status', value: aiModelsItem.status ?? '—', badge: true },
                                        { label: 'Completed', value: aiModelsItem.completed_at ? new Date(aiModelsItem.completed_at).toLocaleString() : '—' },
                                    ].map(item => (
                                        <div key={item.label} className="p-3 rounded-md bg-background/40 border border-border/30">
                                            <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                                            {item.badge ? (
                                                <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', item.value === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30')}>
                                                    {item.value}
                                                </span>
                                            ) : (
                                                <p className="text-sm font-medium truncate">{item.value}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {/* Predictions Table */}
                                {(aiModelsItem.predictions ?? []).length > 0 && (
                                    <div>
                                        <h4 className="font-heading text-sm font-semibold text-amber-400 uppercase tracking-wider mb-3">Predictions</h4>
                                        <div className="rounded-lg border border-border/40 overflow-hidden">
                                            <Table>
                                                <TableHeader>
                                                    <TableRow className="border-border/30 bg-background/20 hover:bg-transparent">
                                                        <TableHead className="text-xs font-semibold">District</TableHead>
                                                        <TableHead className="text-xs font-semibold">Crop</TableHead>
                                                        <TableHead className="text-xs font-semibold">Metric</TableHead>
                                                        <TableHead className="text-xs font-semibold text-right">Predicted Value</TableHead>
                                                        <TableHead className="text-xs font-semibold text-right">Confidence</TableHead>
                                                        <TableHead className="text-xs font-semibold">Date</TableHead>
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {aiModelsItem.predictions?.map((pred, i) => (
                                                        <TableRow key={i} className="border-border/20 hover:bg-amber-500/5">
                                                            <TableCell className="text-sm">{pred.district ?? '—'}</TableCell>
                                                            <TableCell className="text-sm">{pred.crop ?? '—'}</TableCell>
                                                            <TableCell>
                                                                <Badge variant="outline" className="text-xs border-border/40 bg-background/40">{pred.metric ?? '—'}</Badge>
                                                            </TableCell>
                                                            <TableCell className="text-sm text-right font-mono">{pred.predicted_value?.toFixed(2) ?? '—'}</TableCell>
                                                            <TableCell className="text-right">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <Progress value={(pred.confidence ?? 0) * 100} className="w-16 h-1.5" />
                                                                    <span className="text-xs text-muted-foreground w-10">{((pred.confidence ?? 0) * 100).toFixed(0)}%</span>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-muted-foreground">{pred.date ? new Date(pred.date).toLocaleDateString() : '—'}</TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </div>
                                )}

                                {/* Download */}
                                {aiModelsItem.download_url && (
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            size="sm"
                                            asChild
                                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:bg-primary/5 transition-all duration-200"
                                        >
                                            <a href={aiModelsItem.download_url} download>
                                                <Download className="h-4 w-4 mr-2" /> Download Predictions
                                            </a>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>
        </div>
    );
}
