import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    customQueriesService,
    type CustomQueriesCreateParams,
    type CustomQueriesDeleteParams,
    type CustomQueriesDetailResponse,
    type CustomQueriesExecuteResponse,
    type CustomQueriesListResponse,
    type CustomQueriesUpdateParams,
} from '@/lib/api/customQueriesService';
import {
    dataHubService,
    type DataHubDatasetsResponse,
} from '@/lib/api/dataHubService';
import { customQueriesCreateSchema, customQueriesUpdateSchema, type CustomQueriesCreateInput, type CustomQueriesUpdateInput } from '@/lib/api/customQueriesFormSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import {
    Plus,
    Search,
    Play,
    Save,
    Trash2,
    Edit2,
    MoreVertical,
    Share2,
    Database,
    Filter,
    BarChart2,
    FileDown,
    ChevronLeft,
    ChevronRight,
    Check,
    ChevronsUpDown,
    Eye,
    Loader2,
    FlaskConical,
    Layers,
    ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CustomQuery = CustomQueriesListResponse['data'][number];
type DataHub = DataHubDatasetsResponse['data'][number];

export default function CustomQueries() {


    // List state — GET /custom-queries/list
    const [customQueries, setCustomQueries] = useState<CustomQuery[]>([]);
    const [loadingCustomQueries, setLoadingCustomQueries] = useState(true);
    const [customQueriesPage, setCustomQueriesPage] = useState(1);
    const [customQueriesLimit] = useState(10);
    const [customQueriesTotal, setCustomQueriesTotal] = useState(0);
    // List state — GET /data-hub/datasets
    const [dataHub, setDataHub] = useState<DataHub[]>([]);
    const [loadingDataHub, setLoadingDataHub] = useState(true);
    const [dataHubPage, setDataHubPage] = useState(1);
    const [dataHubLimit] = useState(10);
    const [dataHubTotal, setDataHubTotal] = useState(0);
    // Create dialog state — POST /custom-queries/create
    const [createCustomQueriesOpen, setCreateCustomQueriesOpen] = useState(false);
    // Edit dialog state — PUT /custom-queries/update
    const [editCustomQueriesTarget, setEditCustomQueriesTarget] = useState<CustomQuery | null>(null);
    // Detail state — GET /custom-queries/detail
    const [customQueriesItem, setCustomQueriesItem] = useState<CustomQueriesDetailResponse['data'] | null>(null);
    const [loadingCustomQueriesItem, setLoadingCustomQueriesItem] = useState(false);
    // ↑ CustomQuery is the singular row type

    useEffect(() => { void loadCustomQueries(); }, [customQueriesPage]);
    useEffect(() => { void loadDataHub(); }, [dataHubPage]);

    async function loadCustomQueries() {
        try {
            setLoadingCustomQueries(true);
            const res = await customQueriesService.list({ page: customQueriesPage, limit: customQueriesLimit });
            setCustomQueries(Array.isArray(res?.data) ? res.data : []);
            setCustomQueriesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load customQueries');
            console.error('[loadCustomQueries]', err);
        } finally {
            setLoadingCustomQueries(false);
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
    // POST /custom-queries/create
    async function handleCreateCustomQueries(data: CustomQueriesCreateParams) {
        try {
            await customQueriesService.create(data);
            toast.success('Created');
            setCreateCustomQueriesOpen(false);
            void loadCustomQueries();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateCustomQueries]', err);
        }
    }
    async function handleUpdateCustomQueries(data: CustomQueriesUpdateParams) {
        try {
            await customQueriesService.update(data);
            toast.success('Updated');
            setEditCustomQueriesTarget(null);
            void loadCustomQueries();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateCustomQueries]', err);
        }
    }
    async function handleDeleteCustomQueries(params: CustomQueriesDeleteParams) {
        try {
            await customQueriesService.delete(params);
            toast.success('Deleted');
            void loadCustomQueries();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteCustomQueries]', err);
        }
    }
    async function loadCustomQueriesItem(targetId: string) {
        try {
            setLoadingCustomQueriesItem(true);
            const res = await customQueriesService.detail({ id: targetId });
            setCustomQueriesItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadCustomQueriesItem]', err);
        } finally {
            setLoadingCustomQueriesItem(false);
        }
    }

    // Local UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'builder' | 'templates'>('builder');
    const [queryMode, setQueryMode] = useState<'visual' | 'raw'>('visual');
    const [deleteTarget, setDeleteTarget] = useState<CustomQuery | null>(null);
    const [datasetSelectorOpen, setDatasetSelectorOpen] = useState(false);
    const [datasetSearchTerm, setDatasetSearchTerm] = useState('');
    const [selectedDatasetIds, setSelectedDatasetIds] = useState<string[]>([]);
    const [executeResults, setExecuteResults] = useState<CustomQueriesExecuteResponse['data'] | null>(null);
    const [executingQuery, setExecutingQuery] = useState(false);
    const [rawQueryText, setRawQueryText] = useState('');
    const [filtersJson, setFiltersJson] = useState('');
    const [aggregationsJson, setAggregationsJson] = useState('');
    const [filtersJsonError, setFiltersJsonError] = useState<string | null>(null);
    const [aggregationsJsonError, setAggregationsJsonError] = useState<string | null>(null);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);
    const [createDatasetSelectorOpen, setCreateDatasetSelectorOpen] = useState(false);
    const [createDatasetSearchTerm, setCreateDatasetSearchTerm] = useState('');
    const [createSelectedDatasetIds, setCreateSelectedDatasetIds] = useState<string[]>([]);
    const [editDatasetSelectorOpen, setEditDatasetSelectorOpen] = useState(false);
    const [editDatasetSearchTerm, setEditDatasetSearchTerm] = useState('');
    const [editSelectedDatasetIds, setEditSelectedDatasetIds] = useState<string[]>([]);

    // Create form
    const createForm = useForm<CustomQueriesCreateInput>({
        resolver: zodResolver(customQueriesCreateSchema),
        defaultValues: {
            name: '',
            description: '',
            dataset_ids: [],
            filters: {},
            aggregations: {},
            joins: {},
            shared: undefined,
        },
    });

    // Edit form
    const editForm = useForm<CustomQueriesUpdateInput>({
        resolver: zodResolver(customQueriesUpdateSchema),
        values: editCustomQueriesTarget
            ? {
                  name: editCustomQueriesTarget.name ?? '',
                  description: editCustomQueriesTarget.description ?? '',
                  dataset_ids: (editCustomQueriesTarget as any).dataset_ids ?? editCustomQueriesTarget.datasets_used ?? [],
                  filters: (editCustomQueriesTarget as any).filter_config ?? {},
                  aggregations: (editCustomQueriesTarget as any).aggregation_config ?? {},
                  joins: {},
                  shared: editCustomQueriesTarget.shared ? 1 : 0,
              }
            : undefined,
    });

    // Sync edit selected datasets when target changes
    useEffect(() => {
        if (editCustomQueriesTarget) {
            const ids = (editCustomQueriesTarget as any).dataset_ids ?? editCustomQueriesTarget.datasets_used ?? [];
            setEditSelectedDatasetIds(ids);
        }
    }, [editCustomQueriesTarget]);

    // Filtered datasets for searchable dropdown
    const filteredDatasets = useMemo(
        () =>
            dataHub.filter(
                (d) =>
                    !datasetSearchTerm ||
                    d.name?.toLowerCase().includes(datasetSearchTerm.toLowerCase()) ||
                    d.category?.toLowerCase().includes(datasetSearchTerm.toLowerCase()),
            ),
        [dataHub, datasetSearchTerm],
    );

    const filteredCreateDatasets = useMemo(
        () =>
            dataHub.filter(
                (d) =>
                    !createDatasetSearchTerm ||
                    d.name?.toLowerCase().includes(createDatasetSearchTerm.toLowerCase()) ||
                    d.category?.toLowerCase().includes(createDatasetSearchTerm.toLowerCase()),
            ),
        [dataHub, createDatasetSearchTerm],
    );

    const filteredEditDatasets = useMemo(
        () =>
            dataHub.filter(
                (d) =>
                    !editDatasetSearchTerm ||
                    d.name?.toLowerCase().includes(editDatasetSearchTerm.toLowerCase()) ||
                    d.category?.toLowerCase().includes(editDatasetSearchTerm.toLowerCase()),
            ),
        [dataHub, editDatasetSearchTerm],
    );

    // Filtered templates list
    const filteredQueries = useMemo(
        () =>
            customQueries.filter(
                (q) =>
                    !searchQuery ||
                    q.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    q.description?.toLowerCase().includes(searchQuery.toLowerCase()),
            ),
        [customQueries, searchQuery],
    );

    // Execute handler with result
    async function handleRunQuery() {
        if (selectedDatasetIds.length === 0) {
            toast.error('Select at least one dataset to run a query');
            return;
        }

        let filtersPayload: Record<string, any> = {};
        let aggregationsPayload: Record<string, any> = {};

        if (queryMode === 'visual') {
            if (filtersJson.trim()) {
                try {
                    const parsed = JSON.parse(filtersJson);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        filtersPayload = parsed;
                        setFiltersJsonError(null);
                    } else {
                        setFiltersJsonError('Filters must be a JSON object');
                        toast.error('Filters must be a JSON object');
                        return;
                    }
                } catch {
                    setFiltersJsonError('Invalid JSON in Filters');
                    toast.error('Invalid JSON in Filters');
                    return;
                }
            }
            if (aggregationsJson.trim()) {
                try {
                    const parsed = JSON.parse(aggregationsJson);
                    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                        aggregationsPayload = parsed;
                        setAggregationsJsonError(null);
                    } else {
                        setAggregationsJsonError('Aggregations must be a JSON object');
                        toast.error('Aggregations must be a JSON object');
                        return;
                    }
                } catch {
                    setAggregationsJsonError('Invalid JSON in Aggregations');
                    toast.error('Invalid JSON in Aggregations');
                    return;
                }
            }
        } else {
            // Raw mode: wrap raw text under filters.raw so backend can interpret
            if (rawQueryText.trim()) {
                filtersPayload = { raw: rawQueryText };
                aggregationsPayload = { raw: rawQueryText };
            }
        }

        setExecutingQuery(true);
        try {
            const res = await customQueriesService.execute({
                dataset_ids: selectedDatasetIds,
                filters: filtersPayload,
                aggregations: aggregationsPayload,
                joins: {},
                page: 1,
                limit: 50,
            });
            setExecuteResults(res?.data ?? null);
            toast.success('Query executed successfully');
        } catch (err) {
            toast.error('Query execution failed');
            console.error('[handleRunQuery]', err);
        } finally {
            setExecutingQuery(false);
        }
    }

    function handleLoadTemplate(q: CustomQuery) {
        const ids = (q as any).dataset_ids ?? q.datasets_used ?? [];
        setSelectedDatasetIds(ids);
        const fc = (q as any).filter_config ?? (q as any).filters ?? {};
        const ac = (q as any).aggregation_config ?? (q as any).aggregations ?? {};
        setFiltersJson(Object.keys(fc).length > 0 ? JSON.stringify(fc, null, 2) : '');
        setAggregationsJson(Object.keys(ac).length > 0 ? JSON.stringify(ac, null, 2) : '');
        setFiltersJsonError(null);
        setAggregationsJsonError(null);
        setActiveTab('builder');
        toast.success(`Loaded template: ${q.name}`);
    }

    function handleExportCsv() {
        if (!executeResults?.rows || !executeResults.columns) return;
        const headers = executeResults.columns.map((c) => c.name);
        const csvRows = [
            headers.join(','),
            ...executeResults.rows.map((row) =>
                headers
                    .map((h) => {
                        const val = row[h] ?? '';
                        const str = String(val);
                        return str.includes(',') || str.includes('"') || str.includes('\n')
                            ? `"${str.replace(/"/g, '""')}"`
                            : str;
                    })
                    .join(','),
            ),
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `query-results-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('CSV exported');
    }

    function handleViewDetail(q: CustomQuery) {
        void loadCustomQueriesItem(q.id ?? '');
        setDetailDialogOpen(true);
    }

    async function onCreateSubmit(values: CustomQueriesCreateInput) {
        await handleCreateCustomQueries({
            name: values.name,
            description: values.description ?? '',
            dataset_ids: createSelectedDatasetIds,
            filters: {},
            aggregations: {},
            joins: {},
            shared: values.shared === 1,
        } as CustomQueriesCreateParams);
        setCreateSelectedDatasetIds([]);
        setCreateDatasetSearchTerm('');
        createForm.reset();
    }

    function onEditSubmit(values: CustomQueriesUpdateInput) {
        if (!editCustomQueriesTarget?.id) return;
        handleUpdateCustomQueries({
            id: editCustomQueriesTarget.id,
            name: values.name ?? editCustomQueriesTarget.name ?? '',
            description: values.description ?? editCustomQueriesTarget.description ?? '',
            dataset_ids: editSelectedDatasetIds,
            filters: values.filters ?? {},
            aggregations: values.aggregations ?? {},
            joins: values.joins ?? {},
            shared: values.shared === 1,
        } as CustomQueriesUpdateParams);
    }

    const totalPages = Math.ceil(customQueriesTotal / customQueriesLimit) || 1;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-background">
            {/* Page Header */}
            <div className="mb-8 flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30 shadow-[0_0_12px_rgba(251,191,36,0.15)]">
                        <FlaskConical className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                            Custom Queries
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Compose and execute custom queries across all National Agricultural Data Hub datasets
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'builder' | 'templates')}>
                <div className="flex items-center justify-between mb-6">
                    <TabsList className="bg-card/60 border border-border/40 backdrop-blur-md">
                        <TabsTrigger value="builder" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Query Builder
                        </TabsTrigger>
                        <TabsTrigger value="templates" className="gap-2">
                            <Layers className="h-4 w-4" />
                            Saved Templates
                            {customQueriesTotal > 0 && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                    {customQueriesTotal}
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    <Button
                        onClick={() => setCreateCustomQueriesOpen(true)}
                        className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:bg-primary/10 transition-all duration-200"
                        variant="outline"
                    >
                        <Plus className="h-4 w-4" />
                        Save New Template
                    </Button>
                </div>

                {/* ─── QUERY BUILDER TAB ─── */}
                <TabsContent value="builder" className="space-y-6">
                    {/* Mode Toggle */}
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground">Mode:</span>
                        <div className="flex rounded-md border border-border/40 overflow-hidden">
                            <button
                                onClick={() => setQueryMode('visual')}
                                className={cn(
                                    'px-4 py-1.5 text-sm transition-colors duration-200',
                                    queryMode === 'visual'
                                        ? 'bg-primary/20 text-primary font-medium'
                                        : 'bg-card/40 text-muted-foreground hover:bg-card/70',
                                )}
                            >
                                Visual Builder
                            </button>
                            <button
                                onClick={() => setQueryMode('raw')}
                                className={cn(
                                    'px-4 py-1.5 text-sm transition-colors duration-200',
                                    queryMode === 'raw'
                                        ? 'bg-primary/20 text-primary font-medium'
                                        : 'bg-card/40 text-muted-foreground hover:bg-card/70',
                                )}
                            >
                                Raw Mode
                            </button>
                        </div>
                    </div>

                    {queryMode === 'visual' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Dataset Selector Card */}
                            <div className="lg:col-span-1 rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-primary" />
                                    <h2 className="font-heading text-base font-semibold">Select Datasets</h2>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Choose one or more datasets to query across weather, crop, soil, pest, and farm registry tables.
                                </p>

                                {/* Searchable dataset dropdown */}
                                <Popover open={datasetSelectorOpen} onOpenChange={setDatasetSelectorOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={datasetSelectorOpen}
                                            className="w-full justify-between bg-card/40 border-border/40 text-sm"
                                        >
                                            {loadingDataHub ? (
                                                <span className="text-muted-foreground">Loading datasets…</span>
                                            ) : (
                                                <span className="text-muted-foreground">Add dataset…</span>
                                            )}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search datasets…"
                                                value={datasetSearchTerm}
                                                onValueChange={setDatasetSearchTerm}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No datasets found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredDatasets.map((d) => (
                                                        <CommandItem
                                                            key={d.id}
                                                            value={d.id}
                                                            onSelect={() => {
                                                                setSelectedDatasetIds((prev) =>
                                                                    prev.includes(d.id ?? '')
                                                                        ? prev.filter((id) => id !== d.id)
                                                                        : [...prev, d.id ?? ''],
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedDatasetIds.includes(d.id ?? '')
                                                                        ? 'opacity-100 text-primary'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{d.name}</span>
                                                                <span className="text-xs text-muted-foreground">{d.category}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>

                                {/* Selected datasets chips */}
                                {selectedDatasetIds.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Selected ({selectedDatasetIds.length})
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedDatasetIds.map((id) => {
                                                const ds = dataHub.find((d) => d.id === id);
                                                return (
                                                    <Badge
                                                        key={id}
                                                        variant="secondary"
                                                        className="gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                                                        onClick={() =>
                                                            setSelectedDatasetIds((prev) => prev.filter((p) => p !== id))
                                                        }
                                                    >
                                                        {ds?.name ?? id}
                                                        <span className="text-xs">×</span>
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {loadingDataHub && (
                                    <div className="space-y-2">
                                        {[1, 2, 3].map((n) => (
                                            <Skeleton key={n} className="h-8 w-full rounded-md" />
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Query Config Card */}
                            <div className="lg:col-span-2 rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-5 space-y-4">
                                <div className="flex items-center gap-2">
                                    <BarChart2 className="h-4 w-4 text-primary" />
                                    <h2 className="font-heading text-base font-semibold">Filters & Aggregations</h2>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Define filter conditions and aggregation rules for your selected datasets.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Filter Conditions (JSON)
                                        </Label>
                                        <Textarea
                                            value={filtersJson}
                                            onChange={(e) => setFiltersJson(e.target.value)}
                                            className="font-mono text-xs bg-card/40 border-border/40 resize-none h-28"
                                            placeholder={'{\n  "region": "Northern Uganda",\n  "year": 2024\n}'}
                                        />
                                        {filtersJsonError && (
                                            <p className="text-xs text-destructive">{filtersJsonError}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Aggregation Config (JSON)
                                        </Label>
                                        <Textarea
                                            value={aggregationsJson}
                                            onChange={(e) => setAggregationsJson(e.target.value)}
                                            className="font-mono text-xs bg-card/40 border-border/40 resize-none h-28"
                                            placeholder={'{\n  "groupBy": ["district"],\n  "metrics": ["avg_rainfall"]\n}'}
                                        />
                                        {aggregationsJsonError && (
                                            <p className="text-xs text-destructive">{aggregationsJsonError}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-border/40 bg-card/40 hover:bg-card/70"
                                        onClick={() => {
                                            setSelectedDatasetIds([]);
                                            setExecuteResults(null);
                                        }}
                                    >
                                        Clear
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleRunQuery}
                                        disabled={executingQuery || selectedDatasetIds.length === 0}
                                        className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:bg-primary/10 transition-all duration-200"
                                        variant="outline"
                                    >
                                        {executingQuery ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Play className="h-4 w-4" />
                                        )}
                                        Run Query
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Raw Query Mode */
                        <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md p-5 space-y-4">
                            <div className="flex items-center gap-2">
                                <FlaskConical className="h-4 w-4 text-primary" />
                                <h2 className="font-heading text-base font-semibold">Raw Query Mode</h2>
                                <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                                    Advanced
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Write a structured query expression for advanced data retrieval across the National Agricultural Data Hub.
                            </p>

                            {/* Dataset selector for raw mode (reuses builder dataset state) */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Target Datasets
                                </Label>
                                <Popover open={datasetSelectorOpen} onOpenChange={setDatasetSelectorOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={datasetSelectorOpen}
                                            className="w-full justify-between bg-card/40 border-border/40 text-sm"
                                        >
                                            {selectedDatasetIds.length > 0
                                                ? `${selectedDatasetIds.length} dataset(s) selected`
                                                : loadingDataHub
                                                  ? 'Loading datasets…'
                                                  : 'Select datasets…'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[320px] p-0" align="start">
                                        <Command>
                                            <CommandInput
                                                placeholder="Search datasets…"
                                                value={datasetSearchTerm}
                                                onValueChange={setDatasetSearchTerm}
                                            />
                                            <CommandList>
                                                <CommandEmpty>No datasets found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredDatasets.map((d) => (
                                                        <CommandItem
                                                            key={d.id}
                                                            value={d.id}
                                                            onSelect={() => {
                                                                setSelectedDatasetIds((prev) =>
                                                                    prev.includes(d.id ?? '')
                                                                        ? prev.filter((id) => id !== d.id)
                                                                        : [...prev, d.id ?? ''],
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    selectedDatasetIds.includes(d.id ?? '')
                                                                        ? 'opacity-100 text-primary'
                                                                        : 'opacity-0',
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-medium">{d.name}</span>
                                                                <span className="text-xs text-muted-foreground">{d.category}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {selectedDatasetIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {selectedDatasetIds.map((id) => {
                                            const ds = dataHub.find((d) => d.id === id);
                                            return (
                                                <Badge
                                                    key={id}
                                                    variant="secondary"
                                                    className="gap-1 cursor-pointer hover:bg-destructive/20 hover:text-destructive transition-colors"
                                                    onClick={() =>
                                                        setSelectedDatasetIds((prev) => prev.filter((p) => p !== id))
                                                    }
                                                >
                                                    {ds?.name ?? id}
                                                    <span className="text-xs">×</span>
                                                </Badge>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <Textarea
                                value={rawQueryText}
                                onChange={(e) => setRawQueryText(e.target.value)}
                                className="font-mono text-sm bg-card/40 border-border/40 h-48 resize-none"
                                placeholder={`SELECT district, AVG(rainfall_mm) as avg_rain\nFROM weather_data\nWHERE year = 2024\nGROUP BY district\nORDER BY avg_rain DESC`}
                            />
                            <div className="flex items-center justify-end gap-3">
                                <Button
                                    size="sm"
                                    onClick={handleRunQuery}
                                    disabled={executingQuery || selectedDatasetIds.length === 0}
                                    className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:bg-primary/10 transition-all duration-200"
                                    variant="outline"
                                >
                                    {executingQuery ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Play className="h-4 w-4" />
                                    )}
                                    Execute
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Results Preview */}
                    {(executingQuery || executeResults) && (
                        <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md overflow-hidden">
                            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-primary" />
                                    <h2 className="font-heading text-base font-semibold">Query Results</h2>
                                    {executeResults?.total !== undefined && (
                                        <Badge variant="secondary" className="text-xs">
                                            {executeResults.total} rows
                                        </Badge>
                                    )}
                                </div>
                                {executeResults && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 border-border/40 bg-card/40 hover:bg-card/70 text-xs"
                                        onClick={handleExportCsv}
                                    >
                                        <FileDown className="h-3.5 w-3.5" />
                                        Export CSV
                                    </Button>
                                )}
                            </div>

                            {executingQuery ? (
                                <div className="p-6 space-y-3">
                                    {[1, 2, 3, 4].map((n) => (
                                        <Skeleton key={n} className="h-8 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : executeResults?.rows && executeResults.rows.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border/40 bg-muted/20 hover:bg-muted/30">
                                                {executeResults.columns?.map((col) => (
                                                    <TableHead key={col.name} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        {col.name}
                                                        {col.type && (
                                                            <span className="ml-1 font-normal normal-case opacity-60">
                                                                ({col.type})
                                                            </span>
                                                        )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {executeResults.rows.map((row, idx) => (
                                                <TableRow key={idx} className="border-border/40 hover:bg-muted/10 transition-colors duration-200">
                                                    {executeResults.columns?.map((col) => (
                                                        <TableCell key={col.name} className="text-sm py-2.5">
                                                            {String(row[col.name ?? ''] ?? '—')}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <BarChart2 className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                    <p className="text-sm font-medium text-muted-foreground">No results returned</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">
                                        Try adjusting your filters or selecting different datasets
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* ─── SAVED TEMPLATES TAB ─── */}
                <TabsContent value="templates" className="space-y-5">
                    {/* Search bar */}
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search templates…"
                            className="pl-9 bg-card/60 border-border/40 backdrop-blur-md"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* Templates Table */}
                    <div className="rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md overflow-hidden">
                        {loadingCustomQueries ? (
                            <div className="p-6 space-y-3">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Skeleton key={n} className="h-12 w-full rounded-md" />
                                ))}
                            </div>
                        ) : filteredQueries.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <Layers className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <p className="font-heading text-base font-medium text-muted-foreground">
                                    No saved templates yet
                                </p>
                                <p className="text-sm text-muted-foreground/70 mt-1 mb-4">
                                    Build a query in the Query Builder and save it as a template
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
                                    onClick={() => setActiveTab('builder')}
                                >
                                    <ArrowRight className="h-4 w-4" />
                                    Go to Builder
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow className="border-border/40 bg-muted/20 hover:bg-muted/30">
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                Template Name
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                                                Datasets
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                                                Created By
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">
                                                Shared
                                            </TableHead>
                                            <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">
                                                Updated
                                            </TableHead>
                                            <TableHead className="w-10" />
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredQueries.map((q) => (
                                            <TableRow
                                                key={q.id}
                                                className="border-border/40 hover:bg-muted/10 transition-colors duration-200 cursor-pointer"
                                            >
                                                <TableCell>
                                                    <div>
                                                        <p className="font-medium text-sm">{q.name}</p>
                                                        {q.description && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                                {q.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {(q.datasets_used ?? []).slice(0, 2).map((ds, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {ds}
                                                            </Badge>
                                                        ))}
                                                        {(q.datasets_used ?? []).length > 2 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{(q.datasets_used ?? []).length - 2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                                                    {q.created_by ?? '—'}
                                                </TableCell>
                                                <TableCell className="hidden lg:table-cell">
                                                    {q.shared ? (
                                                        <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                            <Share2 className="h-3 w-3 mr-1" />
                                                            Shared
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Private
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                                                    {q.updated_at
                                                        ? new Date(q.updated_at).toLocaleDateString('en-UG', {
                                                              day: '2-digit',
                                                              month: 'short',
                                                              year: 'numeric',
                                                          })
                                                        : '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                                                onClick={(e) => e.stopPropagation()}
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-44">
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer"
                                                                onClick={() => handleViewDetail(q)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                                View Detail
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer"
                                                                onClick={() => handleLoadTemplate(q)}
                                                            >
                                                                <Play className="h-4 w-4" />
                                                                Load in Builder
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer"
                                                                onClick={() => setEditCustomQueriesTarget(q)}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                                Edit Template
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                                                                onClick={() => setDeleteTarget(q)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
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
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/40">
                                        <p className="text-xs text-muted-foreground">
                                            Showing {(customQueriesPage - 1) * customQueriesLimit + 1}–
                                            {Math.min(customQueriesPage * customQueriesLimit, customQueriesTotal)} of{' '}
                                            {customQueriesTotal} templates
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 border-border/40"
                                                onClick={() => setCustomQueriesPage((p) => Math.max(1, p - 1))}
                                                disabled={customQueriesPage === 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" />
                                            </Button>
                                            <span className="text-xs text-muted-foreground">
                                                {customQueriesPage} / {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-8 w-8 border-border/40"
                                                onClick={() => setCustomQueriesPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={customQueriesPage === totalPages}
                                            >
                                                <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* ─── CREATE TEMPLATE DIALOG ─── */}
            <Dialog open={createCustomQueriesOpen} onOpenChange={setCreateCustomQueriesOpen}>
                <DialogContent className="max-w-lg bg-card/95 border-border/40 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-semibold flex items-center gap-2">
                            <Save className="h-5 w-5 text-primary" />
                            Save Query Template
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Give your current query configuration a name to save it for future reuse.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4 pt-2">
                            <FormField
                                control={createForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Template Name *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="e.g. Northern Uganda Rainfall 2024"
                                                className="bg-card/40 border-border/40"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={createForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                placeholder="Briefly describe what this query retrieves…"
                                                className="bg-card/40 border-border/40 resize-none h-20"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Dataset selection for create */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Datasets</Label>
                                <Popover open={createDatasetSelectorOpen} onOpenChange={setCreateDatasetSelectorOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between bg-card/40 border-border/40 text-sm"
                                        >
                                            {createSelectedDatasetIds.length > 0
                                                ? `${createSelectedDatasetIds.length} dataset(s) selected`
                                                : 'Select datasets…'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search datasets…" value={createDatasetSearchTerm} onValueChange={setCreateDatasetSearchTerm} />
                                            <CommandList>
                                                <CommandEmpty>No datasets found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredCreateDatasets.map((d) => (
                                                        <CommandItem
                                                            key={d.id}
                                                            value={d.id}
                                                            onSelect={() => {
                                                                setCreateSelectedDatasetIds((prev) =>
                                                                    prev.includes(d.id ?? '')
                                                                        ? prev.filter((id) => id !== d.id)
                                                                        : [...prev, d.id ?? ''],
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    createSelectedDatasetIds.includes(d.id ?? '') ? 'opacity-100 text-primary' : 'opacity-0',
                                                                )}
                                                            />
                                                            {d.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <FormField
                                control={createForm.control}
                                name="shared"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-md border border-border/40 px-4 py-3 bg-card/30">
                                        <div>
                                            <FormLabel className="text-sm font-medium">Share with colleagues</FormLabel>
                                            <p className="text-xs text-muted-foreground">
                                                Make this template visible to other researchers
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value === 1}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-border/40"
                                    onClick={() => {
                                        setCreateCustomQueriesOpen(false);
                                        setCreateSelectedDatasetIds([]);
                                        setCreateDatasetSearchTerm('');
                                        createForm.reset();
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:bg-primary/10"
                                    variant="outline"
                                    disabled={createForm.formState.isSubmitting}
                                >
                                    {createForm.formState.isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Save Template
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ─── EDIT TEMPLATE DIALOG ─── */}
            <Dialog open={!!editCustomQueriesTarget} onOpenChange={(o) => !o && setEditCustomQueriesTarget(null)}>
                <DialogContent className="max-w-lg bg-card/95 border-border/40 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-semibold flex items-center gap-2">
                            <Edit2 className="h-5 w-5 text-primary" />
                            Edit Template
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground">
                            Update the configuration of the saved query template.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-2">
                            <FormField
                                control={editForm.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Template Name</FormLabel>
                                        <FormControl>
                                            <Input {...field} className="bg-card/40 border-border/40" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={editForm.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                {...field}
                                                className="bg-card/40 border-border/40 resize-none h-20"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Edit dataset selection */}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Datasets</Label>
                                <Popover open={editDatasetSelectorOpen} onOpenChange={setEditDatasetSelectorOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            className="w-full justify-between bg-card/40 border-border/40 text-sm"
                                        >
                                            {editSelectedDatasetIds.length > 0
                                                ? `${editSelectedDatasetIds.length} dataset(s) selected`
                                                : 'Select datasets…'}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search datasets…" value={editDatasetSearchTerm} onValueChange={setEditDatasetSearchTerm} />
                                            <CommandList>
                                                <CommandEmpty>No datasets found.</CommandEmpty>
                                                <CommandGroup>
                                                    {filteredEditDatasets.map((d) => (
                                                        <CommandItem
                                                            key={d.id}
                                                            value={d.id}
                                                            onSelect={() => {
                                                                setEditSelectedDatasetIds((prev) =>
                                                                    prev.includes(d.id ?? '')
                                                                        ? prev.filter((id) => id !== d.id)
                                                                        : [...prev, d.id ?? ''],
                                                                );
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    editSelectedDatasetIds.includes(d.id ?? '') ? 'opacity-100 text-primary' : 'opacity-0',
                                                                )}
                                                            />
                                                            {d.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Filters & Aggregations */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={editForm.control}
                                    name="filters"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Filter Conditions (JSON)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    value={
                                                        field.value && typeof field.value === 'object' && Object.keys(field.value).length > 0
                                                            ? JSON.stringify(field.value, null, 2)
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        try {
                                                            field.onChange(e.target.value.trim() ? JSON.parse(e.target.value) : {});
                                                        } catch {
                                                            field.onChange(e.target.value);
                                                        }
                                                    }}
                                                    className="font-mono text-xs bg-card/40 border-border/40 resize-none h-24"
                                                    placeholder={'{\n  "region": "Northern Uganda"\n}'}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={editForm.control}
                                    name="aggregations"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                                Aggregation Config (JSON)
                                            </FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    value={
                                                        field.value && typeof field.value === 'object' && Object.keys(field.value).length > 0
                                                            ? JSON.stringify(field.value, null, 2)
                                                            : ''
                                                    }
                                                    onChange={(e) => {
                                                        try {
                                                            field.onChange(e.target.value.trim() ? JSON.parse(e.target.value) : {});
                                                        } catch {
                                                            field.onChange(e.target.value);
                                                        }
                                                    }}
                                                    className="font-mono text-xs bg-card/40 border-border/40 resize-none h-24"
                                                    placeholder={'{\n  "groupBy": ["district"]\n}'}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={editForm.control}
                                name="shared"
                                render={({ field }) => (
                                    <FormItem className="flex items-center justify-between rounded-md border border-border/40 px-4 py-3 bg-card/30">
                                        <div>
                                            <FormLabel className="text-sm font-medium">Share with colleagues</FormLabel>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value === 1}
                                                onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <DialogFooter className="pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-border/40"
                                    onClick={() => setEditCustomQueriesTarget(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(251,191,36,0.2)] hover:bg-primary/10"
                                    variant="outline"
                                    disabled={editForm.formState.isSubmitting}
                                >
                                    {editForm.formState.isSubmitting ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Save className="h-4 w-4" />
                                    )}
                                    Update Template
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ─── DETAIL DIALOG ─── */}
            <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
                <DialogContent className="max-w-lg bg-card/95 border-border/40 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg font-semibold flex items-center gap-2">
                            <Eye className="h-5 w-5 text-primary" />
                            Template Detail
                        </DialogTitle>
                    </DialogHeader>

                    {loadingCustomQueriesItem ? (
                        <div className="space-y-3 py-4">
                            {[1, 2, 3].map((n) => (
                                <Skeleton key={n} className="h-10 w-full rounded-md" />
                            ))}
                        </div>
                    ) : customQueriesItem ? (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Name</p>
                                    <p className="mt-1 font-medium">{customQueriesItem.name ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Created By</p>
                                    <p className="mt-1">{customQueriesItem.created_by ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Shared</p>
                                    <p className="mt-1">
                                        {customQueriesItem.shared ? (
                                            <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                                                <Share2 className="h-3 w-3 mr-1" />
                                                Shared
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary" className="text-xs">Private</Badge>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Created</p>
                                    <p className="mt-1">
                                        {customQueriesItem.created_at
                                            ? new Date(customQueriesItem.created_at).toLocaleDateString()
                                            : '—'}
                                    </p>
                                </div>
                            </div>

                            {customQueriesItem.description && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Description</p>
                                    <p className="text-sm">{customQueriesItem.description}</p>
                                </div>
                            )}

                            {(customQueriesItem.dataset_ids ?? []).length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Datasets</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {(customQueriesItem.dataset_ids ?? []).map((id, i) => (
                                            <Badge key={i} variant="secondary" className="text-xs">
                                                {id}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground py-4 text-center">No detail available.</p>
                    )}

                    <DialogFooter>
                        <Button variant="outline" className="border-border/40" onClick={() => setDetailDialogOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ─── DELETE CONFIRMATION ─── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
                <AlertDialogContent className="bg-card/95 border-border/40 backdrop-blur-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading">Delete Template?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete{' '}
                            <span className="font-semibold text-foreground">"{deleteTarget?.name}"</span>? This action
                            cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border/40">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                            onClick={() => {
                                if (deleteTarget?.id) {
                                    handleDeleteCustomQueries({ id: deleteTarget.id });
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
