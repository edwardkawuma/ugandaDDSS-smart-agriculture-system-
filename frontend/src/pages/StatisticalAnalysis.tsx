import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
    dataHubService,
    type DataHubDatasetsResponse,
    type DataHubPreviewResponse,
} from '@/lib/api/dataHubService';
import {
    statisticalAnalysisService,
    type StatisticalAnalysisResultsParams,
    type StatisticalAnalysisResultsResponse,
    type StatisticalAnalysisRunParams,
    type StatisticalAnalysisRunResponse,
} from '@/lib/api/statisticalAnalysisService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    BarChart2,
    TrendingUp,
    Search,
    Play,
    RefreshCw,
    Database,
    FlaskConical,
    Activity,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    FileText,
    FileSpreadsheet,
    Filter,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Eye,
    GitBranch,
    Waves,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DataHub = DataHubDatasetsResponse['data'][number];

// Zod schema for running analysis
const runAnalysisSchema = z.object({
    dataset_ids: z.array(z.string()).min(1, 'Select at least one dataset'),
    analysis_method: z.string().min(1, 'Select an analysis method'),
    variables: z.array(z.string()).min(1, 'Add at least one variable'),
    season: z.string().optional().default(''),
    district: z.string().optional().default(''),
    filters: z.record(z.any()).optional().default({}),
});
type RunAnalysisForm = z.infer<typeof runAnalysisSchema>;

const ANALYSIS_METHODS = [
    { value: 'descriptive', label: 'Descriptive Statistics', icon: BarChart2, description: 'Mean, median, std dev, quartiles' },
    { value: 'pearson_correlation', label: 'Pearson Correlation', icon: Activity, description: 'Linear correlation between variables' },
    { value: 'spearman_correlation', label: 'Spearman Correlation', icon: GitBranch, description: 'Rank-based correlation analysis' },
    { value: 'time_series', label: 'Time-Series Trend', icon: TrendingUp, description: 'Trend analysis over time' },
    { value: 'seasonal_decomposition', label: 'Seasonal Decomposition', icon: Waves, description: 'Decompose seasonal production patterns' },
];

const UGANDAN_DISTRICTS = [
    'Kampala', 'Wakiso', 'Mukono', 'Jinja', 'Mbale', 'Gulu', 'Arua',
    'Mbarara', 'Masaka', 'Soroti', 'Lira', 'Fort Portal', 'Kabale', 'Tororo',
];

const SEASONS = ['Season A (Mar-Jun)', 'Season B (Aug-Nov)', 'Season A 2024', 'Season B 2023'];

const COMMON_VARIABLES = [
    'temperature', 'rainfall', 'humidity', 'yield_kg_ha', 'area_ha',
    'production_mt', 'pest_incidence', 'disease_incidence', 'soil_moisture',
];

export default function StatisticalAnalysis() {
    // List state — GET /data-hub/datasets
    const [dataHub, setDataHub] = useState<DataHub[]>([]);
    const [loadingDataHub, setLoadingDataHub] = useState(true);
    const [dataHubPage, setDataHubPage] = useState(1);
    const [dataHubLimit] = useState(10);
    const [dataHubTotal, setDataHubTotal] = useState(0);
    // Detail state — GET /statistical-analysis/results
    const [statisticalAnalysisItem, setStatisticalAnalysisItem] = useState<StatisticalAnalysisResultsResponse['data'] | null>(null);
    const [loadingStatisticalAnalysisItem, setLoadingStatisticalAnalysisItem] = useState(false);

    // Metadata preview state
    const [metadataDialogOpen, setMetadataDialogOpen] = useState(false);
    const [metadataPreview, setMetadataPreview] = useState<DataHubPreviewResponse['data'] | null>(null);
    const [metadataDatasetName, setMetadataDatasetName] = useState<string>('');
    const [loadingMetadata, setLoadingMetadata] = useState(false);

    // Local UI state
    const [datasetSearch, setDatasetSearch] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
    const [runDialogOpen, setRunDialogOpen] = useState(false);
    const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
    const [currentJobId, setCurrentJobId] = useState<string | null>(null);
    const [runningAnalysis, setRunningAnalysis] = useState(false);
    const [variableInput, setVariableInput] = useState('');
    const [selectedVariables, setSelectedVariables] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'datasets' | 'results'>('datasets');

    // React Hook Form
    const {
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<RunAnalysisForm>({
        resolver: zodResolver(runAnalysisSchema),
        defaultValues: {
            dataset_ids: [],
            analysis_method: '',
            variables: [],
            season: '',
            district: '',
            filters: {},
        },
    });

    const watchedMethod = watch('analysis_method');

    useEffect(() => { void loadDataHub(); }, [dataHubPage]);
    useEffect(() => {
        setValue('dataset_ids', selectedDatasetIds);
    }, [selectedDatasetIds, setValue]);
    useEffect(() => {
        setValue('variables', selectedVariables);
    }, [selectedVariables, setValue]);

    async function loadDataHub() {
        try {
            setLoadingDataHub(true);
            const res = await dataHubService.datasets({
                page: dataHubPage,
                limit: dataHubLimit,
                ...(categoryFilter !== 'all' ? { category: categoryFilter } : {}),
                ...(datasetSearch ? { search: datasetSearch } : {}),
            });
            setDataHub(Array.isArray(res?.data) ? res.data : []);
            setDataHubTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load datasets');
            console.error('[loadDataHub]', err);
        } finally {
            setLoadingDataHub(false);
        }
    }

    // POST /statistical-analysis/run
    async function handleRun(data: StatisticalAnalysisRunParams) {
        try {
            setRunningAnalysis(true);
            const res = await statisticalAnalysisService.run(data);
            const jobId = res?.data?.job_id ?? null;
            setCurrentJobId(jobId);
            toast.success('Analysis job submitted. Results will be ready shortly.');
            setRunDialogOpen(false);
            reset();
            setSelectedDatasetIds([]);
            setSelectedVariables([]);
            if (jobId) {
                setActiveTab('results');
                void loadStatisticalAnalysisItem(jobId);
            }
        } catch (err) {
            toast.error('Failed to run analysis');
            console.error('[handleRun]', err);
        } finally {
            setRunningAnalysis(false);
        }
    }

    async function loadStatisticalAnalysisItem(targetId: string) {
        try {
            setLoadingStatisticalAnalysisItem(true);
            const res = await statisticalAnalysisService.results({ job_id: targetId });
            setStatisticalAnalysisItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load analysis results');
            console.error('[loadStatisticalAnalysisItem]', err);
        } finally {
            setLoadingStatisticalAnalysisItem(false);
        }
    }

    async function handleViewMetadata(datasetId: string, datasetName: string) {
        try {
            setLoadingMetadata(true);
            setMetadataDatasetName(datasetName);
            setMetadataDialogOpen(true);
            const res = await dataHubService.preview({ dataset_id: datasetId, limit: 5 });
            setMetadataPreview(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load dataset metadata');
            console.error('[handleViewMetadata]', err);
            setMetadataPreview(null);
        } finally {
            setLoadingMetadata(false);
        }
    }

    function toggleDatasetSelection(id: string) {
        setSelectedDatasetIds(prev =>
            prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id],
        );
    }

    function addVariable(v: string) {
        const trimmed = v.trim();
        if (trimmed && !selectedVariables.includes(trimmed)) {
            setSelectedVariables(prev => [...prev, trimmed]);
        }
        setVariableInput('');
    }

    function removeVariable(v: string) {
        setSelectedVariables(prev => prev.filter(x => x !== v));
    }

    const onSubmitRun = handleSubmit((data) => {
        void handleRun({
            dataset_ids: data.dataset_ids,
            analysis_method: data.analysis_method,
            variables: data.variables,
            season: data.season ?? '',
            district: data.district ?? '',
            filters: data.filters ?? {},
        });
    });

    const dataHubTotalPages = Math.max(1, Math.ceil(dataHubTotal / dataHubLimit));

    function getStatusBadge(status?: string) {
        if (!status) return null;
        const s = status.toLowerCase();
        if (s === 'completed') return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>;
        if (s === 'running' || s === 'processing') return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Running</Badge>;
        if (s === 'failed' || s === 'error') return <Badge className="bg-red-500/20 text-red-400 border-red-500/30"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
        return <Badge variant="outline">{status}</Badge>;
    }

    function getCategoryColor(cat?: string): string {
        const c = (cat ?? '').toLowerCase();
        if (c.includes('weather') || c.includes('climate')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
        if (c.includes('crop') || c.includes('production')) return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
        if (c.includes('pest') || c.includes('disease')) return 'bg-red-500/20 text-red-400 border-red-500/30';
        if (c.includes('soil')) return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
        if (c.includes('market') || c.includes('price')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
        return 'bg-muted/50 text-muted-foreground border-border/40';
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Page header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
                        <FlaskConical className="h-7 w-7 text-primary" />
                        Statistical Analysis
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Browser-based workspace for exploring NARO Data Hub datasets with built-in statistical tools.
                        Export publication-ready charts and tables for NARO &amp; World Bank UCSATP reporting.
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    {selectedDatasetIds.length > 0 && (
                        <Button
                            onClick={() => setRunDialogOpen(true)}
                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-all duration-200 ease-out"
                        >
                            <Play className="h-4 w-4 mr-2" />
                            Run Analysis ({selectedDatasetIds.length})
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => void loadDataHub()}
                        className="border-border/50 hover:bg-muted/40"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg w-fit border border-border/40">
                <button
                    onClick={() => setActiveTab('datasets')}
                    className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out',
                        activeTab === 'datasets'
                            ? 'bg-card text-foreground shadow-sm border border-border/40'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <Database className="h-4 w-4 inline mr-2" />
                    Select Datasets
                </button>
                <button
                    onClick={() => setActiveTab('results')}
                    className={cn(
                        'px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ease-out',
                        activeTab === 'results'
                            ? 'bg-card text-foreground shadow-sm border border-border/40'
                            : 'text-muted-foreground hover:text-foreground',
                    )}
                >
                    <BarChart2 className="h-4 w-4 inline mr-2" />
                    Results
                    {statisticalAnalysisItem && (
                        <span className="ml-2 h-2 w-2 rounded-full bg-primary inline-block" />
                    )}
                </button>
            </div>

            {/* DATASETS TAB */}
            {activeTab === 'datasets' && (
                <div className="space-y-4">
                    {/* Analysis method overview cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {ANALYSIS_METHODS.map((method) => {
                            const Icon = method.icon;
                            return (
                                <Card
                                    key={method.value}
                                    className={cn(
                                        'bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md cursor-pointer transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)]',
                                        watchedMethod === method.value && 'border-primary/60 shadow-[0_0_16px_hsl(var(--primary)/0.25)] bg-primary/5',
                                    )}
                                    onClick={() => {
                                        setValue('analysis_method', method.value);
                                        if (selectedDatasetIds.length > 0) setRunDialogOpen(true);
                                    }}
                                >
                                    <CardContent className="p-4 flex flex-col gap-2">
                                        <Icon className="h-5 w-5 text-primary" />
                                        <p className="text-xs font-semibold font-heading">{method.label}</p>
                                        <p className="text-xs text-muted-foreground leading-tight">{method.description}</p>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    {/* Dataset browser */}
                    <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-heading flex items-center gap-2">
                                        <Database className="h-4 w-4 text-primary" />
                                        Data Hub Datasets
                                    </CardTitle>
                                    <CardDescription>
                                        Select one or more datasets to include in your statistical analysis.
                                        {selectedDatasetIds.length > 0 && (
                                            <span className="text-primary ml-1 font-medium">
                                                {selectedDatasetIds.length} selected
                                            </span>
                                        )}
                                    </CardDescription>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search datasets…"
                                            value={datasetSearch}
                                            onChange={(e) => setDatasetSearch(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') void loadDataHub(); }}
                                            className="pl-9 w-[200px] bg-background/60 border-border/50 text-sm"
                                        />
                                    </div>
                                    <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); void loadDataHub(); }}>
                                        <SelectTrigger className="w-[150px] bg-background/60 border-border/50 text-sm">
                                            <Filter className="h-3 w-3 mr-1" />
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All categories</SelectItem>
                                            <SelectItem value="weather">Weather / Climate</SelectItem>
                                            <SelectItem value="crop">Crop Production</SelectItem>
                                            <SelectItem value="pest">Pest & Disease</SelectItem>
                                            <SelectItem value="soil">Soil Data</SelectItem>
                                            <SelectItem value="market">Market Prices</SelectItem>
                                            <SelectItem value="farm">Farm Registry</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingDataHub ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : dataHub.length === 0 ? (
                                <div className="py-12 flex flex-col items-center gap-3 text-muted-foreground">
                                    <Database className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">No datasets found matching your filters.</p>
                                    <Button variant="ghost" size="sm" onClick={() => { setDatasetSearch(''); setCategoryFilter('all'); void loadDataHub(); }}>
                                        Clear filters
                                    </Button>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/40">
                                            <TableHead className="w-10"></TableHead>
                                            <TableHead>Dataset Name</TableHead>
                                            <TableHead className="hidden md:table-cell">Category</TableHead>
                                            <TableHead className="hidden lg:table-cell">Coverage</TableHead>
                                            <TableHead className="hidden lg:table-cell">Records</TableHead>
                                            <TableHead className="hidden md:table-cell">Last Updated</TableHead>
                                            <TableHead className="hidden sm:table-cell">Format</TableHead>
                                            <TableHead className="w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {dataHub.map((ds) => (
                                            <TableRow
                                                key={ds.id}
                                                className={cn(
                                                    'border-border/30 cursor-pointer transition-colors duration-150',
                                                    selectedDatasetIds.includes(ds.id ?? '')
                                                        ? 'bg-primary/5 hover:bg-primary/8'
                                                        : 'hover:bg-muted/30',
                                                )}
                                                onClick={() => toggleDatasetSelection(ds.id ?? '')}
                                            >
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedDatasetIds.includes(ds.id ?? '')}
                                                        onCheckedChange={() => toggleDatasetSelection(ds.id ?? '')}
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="border-border/60"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{ds.name ?? '—'}</p>
                                                        <p className="text-xs text-muted-foreground hidden sm:block line-clamp-1">
                                                            {ds.description ?? ds.source ?? ''}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {ds.category && (
                                                        <Badge className={cn('text-xs capitalize', getCategoryColor(ds.category))}>
                                                            {ds.category}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <p className="text-xs text-muted-foreground">{ds.spatial_coverage ?? '—'}</p>
                                                    <p className="text-xs text-muted-foreground">{ds.temporal_coverage ?? ''}</p>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    <span className="text-sm font-mono">
                                                        {ds.record_count != null ? ds.record_count.toLocaleString() : '—'}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                                    {ds.last_updated ? new Date(ds.last_updated).toLocaleDateString() : '—'}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {ds.format && (
                                                        <Badge variant="outline" className="text-xs uppercase border-border/40">
                                                            {ds.format}
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); toggleDatasetSelection(ds.id ?? ''); }}>
                                                                {selectedDatasetIds.includes(ds.id ?? '') ? 'Deselect' : 'Select for Analysis'}
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (!selectedDatasetIds.includes(ds.id ?? '')) {
                                                                        setSelectedDatasetIds([ds.id ?? '']);
                                                                    }
                                                                    setRunDialogOpen(true);
                                                                }}
                                                            >
                                                                <Play className="h-3 w-3 mr-2" />
                                                                Analyse This Dataset
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    void handleViewMetadata(ds.id ?? '', ds.name ?? ds.id ?? '');
                                                                }}
                                                            >
                                                                <Eye className="h-3 w-3 mr-2" />
                                                                View Metadata
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Pagination */}
                            {!loadingDataHub && dataHub.length > 0 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                                    <p className="text-xs text-muted-foreground">
                                        Showing {((dataHubPage - 1) * dataHubLimit) + 1}–{Math.min(dataHubPage * dataHubLimit, dataHubTotal)} of {dataHubTotal} datasets
                                    </p>
                                    <div className="flex gap-1">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 border-border/40"
                                            disabled={dataHubPage <= 1}
                                            onClick={() => setDataHubPage(p => Math.max(1, p - 1))}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="flex items-center px-2 text-xs text-muted-foreground">
                                            {dataHubPage} / {dataHubTotalPages}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-7 w-7 border-border/40"
                                            disabled={dataHubPage >= dataHubTotalPages}
                                            onClick={() => setDataHubPage(p => Math.min(dataHubTotalPages, p + 1))}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* CTA if datasets selected */}
                    {selectedDatasetIds.length > 0 && (
                        <Card className="bg-primary/5 border border-primary/30 rounded-lg shadow-[0_0_16px_hsl(var(--primary)/0.12)]">
                            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div>
                                    <p className="font-heading font-semibold text-sm">
                                        {selectedDatasetIds.length} dataset{selectedDatasetIds.length > 1 ? 's' : ''} selected
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Configure analysis method, variables, and filters to run your statistical job.
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedDatasetIds([])}
                                        className="border-border/50 text-xs"
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setRunDialogOpen(true)}
                                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 text-xs"
                                    >
                                        <Play className="h-3 w-3 mr-1" />
                                        Configure &amp; Run
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
                <div className="space-y-4">
                    {loadingStatisticalAnalysisItem ? (
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full rounded-xl" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Skeleton className="h-48 w-full rounded-xl" />
                                <Skeleton className="h-48 w-full rounded-xl" />
                            </div>
                        </div>
                    ) : !statisticalAnalysisItem ? (
                        <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                            <CardContent className="py-16 flex flex-col items-center gap-4 text-muted-foreground">
                                <BarChart2 className="h-14 w-14 opacity-25" />
                                <div className="text-center">
                                    <p className="font-heading font-semibold text-base">No analysis results yet</p>
                                    <p className="text-sm mt-1">
                                        Select datasets from the &quot;Select Datasets&quot; tab, configure your analysis method, and run a job to see results here.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveTab('datasets')}
                                    className="border-border/50 mt-2"
                                >
                                    <Database className="h-4 w-4 mr-2" />
                                    Browse Datasets
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {/* Job status header */}
                            <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                                <CardContent className="p-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <FlaskConical className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="font-heading font-semibold text-sm capitalize">
                                                    {(statisticalAnalysisItem.analysis_method ?? 'Analysis').replace(/_/g, ' ')}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Job ID: {statisticalAnalysisItem.job_id ?? '—'}
                                                    {statisticalAnalysisItem.completed_at && (
                                                        <span className="ml-2">
                                                            &middot; Completed {new Date(statisticalAnalysisItem.completed_at).toLocaleString()}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(statisticalAnalysisItem.status)}
                                            {statisticalAnalysisItem.export_url_csv && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="border-border/50 text-xs"
                                                >
                                                    <a href={statisticalAnalysisItem.export_url_csv} download>
                                                        <FileSpreadsheet className="h-3 w-3 mr-1" />
                                                        CSV
                                                    </a>
                                                </Button>
                                            )}
                                            {statisticalAnalysisItem.export_url_pdf && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    asChild
                                                    className="border-border/50 text-xs"
                                                >
                                                    <a href={statisticalAnalysisItem.export_url_pdf} download>
                                                        <FileText className="h-3 w-3 mr-1" />
                                                        PDF
                                                    </a>
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => currentJobId && void loadStatisticalAnalysisItem(currentJobId)}
                                                className="border-border/50"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Summary statistics */}
                            {statisticalAnalysisItem.summary_statistics && Object.keys(statisticalAnalysisItem.summary_statistics).length > 0 && (
                                <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-heading flex items-center gap-2">
                                            <BarChart2 className="h-4 w-4 text-primary" />
                                            Summary Statistics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {Object.entries(statisticalAnalysisItem.summary_statistics).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    className="rounded-lg bg-muted/30 border border-border/30 p-3 flex flex-col gap-1"
                                                >
                                                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                                                    <p className="text-base font-heading font-bold">
                                                        {typeof val === 'number' ? val.toFixed(4) : String(val)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Correlation matrix */}
                            {statisticalAnalysisItem.correlation_matrix && Object.keys(statisticalAnalysisItem.correlation_matrix).length > 0 && (
                                <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-heading flex items-center gap-2">
                                            <Activity className="h-4 w-4 text-primary" />
                                            Correlation Matrix
                                        </CardTitle>
                                        <CardDescription>Pairwise correlation coefficients between selected variables</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="text-xs w-full border-collapse">
                                                <tbody>
                                                    {Object.entries(statisticalAnalysisItem.correlation_matrix).map(([rowKey, rowVal]) => (
                                                        <tr key={rowKey} className="border-b border-border/20">
                                                            <td className="py-2 pr-3 font-medium capitalize whitespace-nowrap text-muted-foreground">
                                                                {rowKey.replace(/_/g, ' ')}
                                                            </td>
                                                            {typeof rowVal === 'object' && rowVal !== null
                                                                ? Object.entries(rowVal as Record<string, number>).map(([colKey, colVal]) => {
                                                                    const v = typeof colVal === 'number' ? colVal : 0;
                                                                    const intensity = Math.abs(v);
                                                                    const bg = v > 0
                                                                        ? `rgba(34,197,94,${intensity * 0.4})`
                                                                        : `rgba(239,68,68,${intensity * 0.4})`;
                                                                    return (
                                                                        <td
                                                                            key={colKey}
                                                                            className="py-2 px-3 text-center font-mono rounded"
                                                                            style={{ background: bg }}
                                                                        >
                                                                            {v.toFixed(3)}
                                                                        </td>
                                                                    );
                                                                })
                                                                : (
                                                                    <td className="py-2 px-3 text-center text-muted-foreground">
                                                                        {typeof rowVal === 'number' ? (rowVal as number).toFixed(3) : String(rowVal)}
                                                                    </td>
                                                                )
                                                            }
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Trend data */}
                            {statisticalAnalysisItem.trend_data && Object.keys(statisticalAnalysisItem.trend_data).length > 0 && (
                                <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-sm font-heading flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            Trend Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                            {Object.entries(statisticalAnalysisItem.trend_data).map(([key, val]) => (
                                                <div
                                                    key={key}
                                                    className="rounded-lg bg-muted/30 border border-border/30 p-3"
                                                >
                                                    <p className="text-xs text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                                                    <p className="text-sm font-heading font-semibold mt-1">
                                                        {typeof val === 'number' ? val.toFixed(4) : String(val)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Charts */}
                            {statisticalAnalysisItem.charts && statisticalAnalysisItem.charts.length > 0 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {statisticalAnalysisItem.charts.map((chart, i) => (
                                        <Card key={i} className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-md">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm font-heading">{chart.title ?? `Chart ${i + 1}`}</CardTitle>
                                                {chart.type && (
                                                    <Badge variant="outline" className="text-xs w-fit capitalize border-border/40">
                                                        {chart.type}
                                                    </Badge>
                                                )}
                                            </CardHeader>
                                            <CardContent>
                                                <div className="h-40 rounded-lg bg-muted/20 border border-border/20 flex items-center justify-center text-muted-foreground text-xs gap-2">
                                                    <BarChart2 className="h-5 w-5 opacity-40" />
                                                    <span className="opacity-60">Chart visualization: {chart.type ?? 'chart'}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ── Run Analysis Dialog ── */}
            <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
                <DialogContent className="max-w-xl bg-card/95 backdrop-blur-md border border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <FlaskConical className="h-5 w-5 text-primary" />
                            Configure Statistical Analysis
                        </DialogTitle>
                        <DialogDescription>
                            Set up your analysis parameters. {selectedDatasetIds.length} dataset(s) selected.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={onSubmitRun} className="space-y-4 mt-2">
                        {/* Analysis Method */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Analysis Method <span className="text-destructive">*</span></Label>
                            <Select
                                value={watchedMethod}
                                onValueChange={(v) => setValue('analysis_method', v)}
                            >
                                <SelectTrigger className="bg-background/60 border-border/50">
                                    <SelectValue placeholder="Select method…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ANALYSIS_METHODS.map(m => (
                                        <SelectItem key={m.value} value={m.value}>
                                            <span className="font-medium">{m.label}</span>
                                            <span className="text-muted-foreground text-xs ml-2">— {m.description}</span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.analysis_method && (
                                <p className="text-xs text-destructive">{errors.analysis_method.message}</p>
                            )}
                        </div>

                        {/* Variables */}
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Variables <span className="text-destructive">*</span></Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Type variable name or pick below…"
                                    value={variableInput}
                                    onChange={(e) => setVariableInput(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVariable(variableInput); } }}
                                    className="bg-background/60 border-border/50 text-sm"
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0 border-border/50"
                                    onClick={() => addVariable(variableInput)}
                                >
                                    Add
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {COMMON_VARIABLES.map(v => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => addVariable(v)}
                                        className={cn(
                                            'text-xs px-2 py-0.5 rounded border transition-colors duration-150',
                                            selectedVariables.includes(v)
                                                ? 'bg-primary/15 border-primary/40 text-primary'
                                                : 'bg-muted/30 border-border/30 text-muted-foreground hover:border-border/60',
                                        )}
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            {selectedVariables.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {selectedVariables.map(v => (
                                        <Badge
                                            key={v}
                                            variant="secondary"
                                            className="text-xs cursor-pointer hover:bg-destructive/20 transition-colors"
                                            onClick={() => removeVariable(v)}
                                        >
                                            {v} &times;
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            {errors.variables && (
                                <p className="text-xs text-destructive">{errors.variables.message}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {/* Season */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">Season</Label>
                                <Select onValueChange={(v) => setValue('season', v)}>
                                    <SelectTrigger className="bg-background/60 border-border/50 text-sm">
                                        <SelectValue placeholder="All seasons" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SEASONS.map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* District */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium">District</Label>
                                <Select onValueChange={(v) => setValue('district', v)}>
                                    <SelectTrigger className="bg-background/60 border-border/50 text-sm">
                                        <SelectValue placeholder="All districts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <ScrollArea className="h-48">
                                            {UGANDAN_DISTRICTS.map(d => (
                                                <SelectItem key={d} value={d}>{d}</SelectItem>
                                            ))}
                                        </ScrollArea>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Selected datasets summary */}
                        <div className="rounded-lg bg-muted/30 border border-border/30 p-3">
                            <p className="text-xs font-medium mb-1.5">Selected Datasets ({selectedDatasetIds.length})</p>
                            <div className="flex flex-wrap gap-1.5">
                                {selectedDatasetIds.map(id => {
                                    const ds = dataHub.find(d => d.id === id);
                                    return (
                                        <Badge key={id} variant="outline" className="text-xs border-border/40">
                                            {ds?.name ?? id}
                                        </Badge>
                                    );
                                })}
                            </div>
                            {errors.dataset_ids && (
                                <p className="text-xs text-destructive mt-1">{errors.dataset_ids.message}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setRunDialogOpen(false)}
                                className="text-muted-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={runningAnalysis}
                                className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-all duration-200 ease-out"
                            >
                                {runningAnalysis ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Submitting…
                                    </>
                                ) : (
                                    <>
                                        <Play className="h-4 w-4 mr-2" />
                                        Run Analysis
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* ── Dataset Metadata Dialog ── */}
            <Dialog open={metadataDialogOpen} onOpenChange={setMetadataDialogOpen}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md border border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <Database className="h-5 w-5 text-primary" />
                            Dataset Metadata
                        </DialogTitle>
                        <DialogDescription>
                            {metadataDatasetName || 'Preview of dataset columns and sample records.'}
                        </DialogDescription>
                    </DialogHeader>

                    {loadingMetadata ? (
                        <div className="space-y-2 py-4">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-4 w-1/2" />
                            <Skeleton className="h-32 w-full" />
                        </div>
                    ) : !metadataPreview ? (
                        <div className="py-8 flex flex-col items-center gap-2 text-muted-foreground text-sm">
                            <AlertCircle className="h-8 w-8 opacity-40" />
                            <p>No metadata available for this dataset.</p>
                        </div>
                    ) : (
                        <div className="space-y-4 mt-2">
                            {metadataPreview.columns && metadataPreview.columns.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium font-heading mb-2">Columns</p>
                                    <div className="rounded-lg border border-border/40 overflow-hidden">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-border/40">
                                                    <TableHead className="text-xs">Name</TableHead>
                                                    <TableHead className="text-xs">Type</TableHead>
                                                    <TableHead className="text-xs">Description</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {metadataPreview.columns.map((col, i) => (
                                                    <TableRow key={i} className="border-border/30">
                                                        <TableCell className="text-xs font-mono">{col.name ?? '—'}</TableCell>
                                                        <TableCell className="text-xs">
                                                            {col.type && (
                                                                <Badge variant="outline" className="text-xs border-border/40">{col.type}</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground">{col.description ?? '—'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {metadataPreview.sample_records && metadataPreview.sample_records.length > 0 && (
                                <div>
                                    <p className="text-xs font-medium font-heading mb-2">
                                        Sample Records ({metadataPreview.sample_records.length}
                                        {metadataPreview.total_records != null && ` of ${metadataPreview.total_records.toLocaleString()}`})
                                    </p>
                                    <ScrollArea className="h-48 rounded-lg border border-border/40">
                                        <pre className="text-[10px] p-3 font-mono whitespace-pre-wrap text-muted-foreground">
                                            {metadataPreview.sample_records
                                                .map((rec, i) => `${i + 1}. ${JSON.stringify(rec, null, 0)}`)
                                                .join('\n')}
                                        </pre>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setMetadataDialogOpen(false)}
                            className="text-muted-foreground"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
