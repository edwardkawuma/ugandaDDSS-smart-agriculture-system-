import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    dataHubService,
    type DataHubDatasetsParams,
    type DataHubDatasetsResponse,
    type DataHubPreviewResponse,
} from '@/lib/api/dataHubService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Database,
    Search,
    Download,
    Eye,
    MoreVertical,
    RefreshCw,
    Cloud,
    Leaf,
    Bug,
    FlaskConical,
    TrendingUp,
    Users,
    BookOpen,
    MapPin,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Check,
    BarChart2,
    Settings,
    Brain,
    FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DataHub = DataHubDatasetsResponse['data'][number];

// Quick-navigation cards (CTAs derived from page.json navigation_outgoing)
type QuickNavItem = {
    label: string;
    icon: React.ReactNode;
    route: string;
    color: string;
};

const QUICK_NAV_ITEMS: QuickNavItem[] = [
    { label: 'AI Models', icon: <Brain className="h-4 w-4" />, route: '/researcher/ai-models', color: 'from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 text-violet-400' },
    { label: 'Statistical Analysis', icon: <BarChart2 className="h-4 w-4" />, route: '/researcher/statistical-analysis', color: 'from-sky-500/10 to-blue-500/10 border-sky-500/20 text-sky-400' },
    { label: 'Custom Queries', icon: <FileText className="h-4 w-4" />, route: '/researcher/queries', color: 'from-teal-500/10 to-emerald-500/10 border-teal-500/20 text-teal-400' },
    { label: 'Research Outputs', icon: <FlaskConical className="h-4 w-4" />, route: '/researcher/outputs', color: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 text-amber-400' },
    { label: 'Weather Data', icon: <Cloud className="h-4 w-4" />, route: '/researcher/weather-data', color: 'from-sky-400/10 to-indigo-500/10 border-sky-400/20 text-sky-300' },
    { label: 'Market Prices', icon: <TrendingUp className="h-4 w-4" />, route: '/farmer/market-prices', color: 'from-green-500/10 to-lime-500/10 border-green-500/20 text-green-400' },
    { label: 'Pest & Disease', icon: <Bug className="h-4 w-4" />, route: '/farmer/pest-disease', color: 'from-rose-500/10 to-red-500/10 border-rose-500/20 text-rose-400' },
    { label: 'Settings', icon: <Settings className="h-4 w-4" />, route: '/settings', color: 'from-slate-500/10 to-gray-500/10 border-slate-500/20 text-slate-400' },
];

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    weather: { icon: <Cloud className="h-4 w-4" />, color: 'text-sky-400', label: 'Weather' },
    crop_production: { icon: <Leaf className="h-4 w-4" />, color: 'text-emerald-400', label: 'Crop Production' },
    pest_disease: { icon: <Bug className="h-4 w-4" />, color: 'text-rose-400', label: 'Pest & Disease' },
    soil: { icon: <MapPin className="h-4 w-4" />, color: 'text-amber-400', label: 'Soil Data' },
    market_price: { icon: <TrendingUp className="h-4 w-4" />, color: 'text-violet-400', label: 'Market Prices' },
    farmer_registry: { icon: <Users className="h-4 w-4" />, color: 'text-orange-400', label: 'Farmer Registry' },
    advisory: { icon: <BookOpen className="h-4 w-4" />, color: 'text-teal-400', label: 'NAADS Advisory' },
    research: { icon: <FlaskConical className="h-4 w-4" />, color: 'text-fuchsia-400', label: 'Research Outputs' },
};

function getCategoryConfig(category?: string) {
    if (!category) return { icon: <Database className="h-4 w-4" />, color: 'text-amber-400', label: 'Uncategorized' };
    const key = category.toLowerCase().replace(/[^a-z_]/g, '_');
    return CATEGORY_CONFIG[key] ?? { icon: <Database className="h-4 w-4" />, color: 'text-amber-400', label: category };
}

export default function DataHub() {
    const navigate = useNavigate();
    const { user } = useAuth();

    // List state — GET /data-hub/datasets
    const [dataHub, setDataHub] = useState<DataHub[]>([]);
    const [loadingDataHub, setLoadingDataHub] = useState(true);
    const [dataHubPage, setDataHubPage] = useState(1);
    const [dataHubLimit] = useState(10);
    const [dataHubTotal, setDataHubTotal] = useState(0);
    // Detail state — GET /data-hub/preview
    const [dataHubItem, setDataHubItem] = useState<DataHubPreviewResponse['data'] | null>(null);
    const [loadingDataHubItem, setLoadingDataHubItem] = useState(false);
    // ↑ DataHub is the singular row type

    // Local UI state
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewDatasetName, setPreviewDatasetName] = useState('');

    useEffect(() => { void loadDataHub(); }, [dataHubPage]);

    async function loadDataHub(overrideSearch?: string, overrideCategory?: string) {
        try {
            setLoadingDataHub(true);
            const cat = overrideCategory ?? selectedCategory;
            const params: DataHubDatasetsParams = {
                page: dataHubPage,
                limit: dataHubLimit,
                search: (overrideSearch ?? searchText) || undefined,
                category: cat === 'all' ? undefined : cat,
            };
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
    async function loadDataHubItem(targetId: string, datasetName?: string) {
        try {
            setLoadingDataHubItem(true);
            setPreviewDatasetName(datasetName ?? 'Dataset Preview');
            setPreviewOpen(true);
            const res = await dataHubService.preview({ dataset_id: targetId, limit: 10 });
            setDataHubItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load preview');
            console.error('[loadDataHubItem]', err);
        } finally {
            setLoadingDataHubItem(false);
        }
    }

    function handleSearch() {
        setDataHubPage(1);
        void loadDataHub(searchText, selectedCategory);
    }

    function handleCategoryChange(cat: string) {
        setSelectedCategory(cat);
        setDataHubPage(1);
        void loadDataHub(searchText, cat);
    }

    const uniqueCategories = useMemo(() => {
        const cats = new Set(dataHub.map(d => d.category).filter(Boolean) as string[]);
        return Array.from(cats);
    }, [dataHub]);

    const totalPages = Math.max(1, Math.ceil(dataHubTotal / dataHubLimit));

    return (
        <div className="p-6 md:p-8 min-h-screen bg-background">
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Database className="h-6 w-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
                            National Agricultural Data Hub
                        </h1>
                        <p className="text-muted-foreground text-sm mt-0.5">
                            Centralized gateway to all integrated datasets for climate-smart agriculture in Uganda
                            {user?.name ? ` — Welcome, ${user.name}` : ''}
                        </p>
                    </div>
                </div>
            </div>

            {/* Quick Navigation Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
                {QUICK_NAV_ITEMS.map((item) => (
                    <button
                        key={item.route}
                        onClick={() => navigate(item.route)}
                        className={cn(
                            'group flex items-center gap-2.5 p-3 rounded-lg border bg-gradient-to-br backdrop-blur-md',
                            'hover:scale-[1.02] transition-all duration-200 ease-out text-left',
                            item.color
                        )}
                    >
                        <span className="shrink-0">{item.icon}</span>
                        <span className="text-xs font-medium truncate">{item.label}</span>
                    </button>
                ))}
            </div>

            {/* Dataset Catalog */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                {/* Catalog Header */}
                <div className="p-5 border-b border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                            <h2 className="font-heading text-xl font-semibold text-foreground">Dataset Catalog</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                {dataHubTotal} dataset{dataHubTotal !== 1 ? 's' : ''} available
                            </p>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadDataHub()}
                            className="gap-1.5 border-border/40 hover:border-primary/40 transition-colors duration-200"
                        >
                            <RefreshCw className={cn('h-3.5 w-3.5', loadingDataHub && 'animate-spin')} />
                            Refresh
                        </Button>
                    </div>

                    {/* Search & Filter Row */}
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search datasets by name or description..."
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9 bg-background/50 border-border/40 focus:border-primary/50 text-sm"
                            />
                        </div>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        'w-full sm:w-56 justify-between bg-background/50 border-border/40 text-sm font-normal',
                                        !selectedCategory || selectedCategory === 'all' ? 'text-muted-foreground' : 'text-foreground'
                                    )}
                                >
                                    {(() => {
                                        if (!selectedCategory || selectedCategory === 'all') return 'All Categories';
                                        const cfg = getCategoryConfig(selectedCategory);
                                        return (
                                            <span className={cn('flex items-center gap-1.5', cfg.color)}>
                                                {cfg.icon}
                                                <span className="text-foreground truncate">{cfg.label}</span>
                                            </span>
                                        );
                                    })()}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[240px] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search categories..." />
                                    <CommandList>
                                        <CommandEmpty>No category found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="all"
                                                onSelect={() => handleCategoryChange('all')}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', selectedCategory === 'all' ? 'opacity-100' : 'opacity-0')} />
                                                <span>All Categories</span>
                                            </CommandItem>
                                            {uniqueCategories.map((cat) => {
                                                const cfg = getCategoryConfig(cat);
                                                return (
                                                    <CommandItem
                                                        key={cat}
                                                        value={cat}
                                                        onSelect={() => handleCategoryChange(cat)}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', selectedCategory === cat ? 'opacity-100' : 'opacity-0')} />
                                                        <span className={cn('flex items-center gap-1.5', cfg.color)}>
                                                            {cfg.icon}
                                                            <span className="text-foreground">{cfg.label}</span>
                                                        </span>
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                        <Button
                            onClick={handleSearch}
                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:shadow-[0_0_18px_rgba(245,158,11,0.5)] hover:bg-primary/10 transition-all duration-200 gap-1.5"
                        >
                            <Search className="h-4 w-4" />
                            Search
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {loadingDataHub ? (
                        <div className="p-5 space-y-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full rounded-md" />
                            ))}
                        </div>
                    ) : dataHub.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                            <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                                <Database className="h-8 w-8 text-amber-400" />
                            </div>
                            <p className="font-heading text-lg font-semibold text-foreground">No datasets found</p>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {searchText || selectedCategory !== 'all'
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No datasets are currently available in the hub.'}
                            </p>
                            {(searchText || selectedCategory !== 'all') && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setSearchText(''); handleCategoryChange('all'); }}
                                    className="mt-1 border-border/40"
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/40 hover:bg-transparent">
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider pl-5">Dataset</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider">Category</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider hidden md:table-cell">Source</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Frequency</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Records</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider hidden xl:table-cell">Last Updated</TableHead>
                                    <TableHead className="text-muted-foreground font-medium text-xs uppercase tracking-wider hidden sm:table-cell">Format</TableHead>
                                    <TableHead className="w-10 pr-4" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dataHub.map((dataset, idx) => {
                                    const catCfg = getCategoryConfig(dataset.category);
                                    return (
                                        <TableRow
                                            key={dataset.id ?? idx}
                                            className="border-border/30 hover:bg-amber-500/5 transition-colors duration-150 group"
                                        >
                                            <TableCell className="pl-5 py-3.5">
                                                <div className="max-w-xs">
                                                    <p className="font-medium text-sm text-foreground leading-tight truncate">
                                                        {dataset.name ?? '—'}
                                                    </p>
                                                    {dataset.description && (
                                                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[220px]">
                                                            {dataset.description}
                                                        </p>
                                                    )}
                                                    {dataset.temporal_coverage && (
                                                        <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">
                                                            {dataset.temporal_coverage}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-3.5">
                                                <div className={cn('flex items-center gap-1.5 text-xs font-medium', catCfg.color)}>
                                                    {catCfg.icon}
                                                    <span>{catCfg.label}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell py-3.5">
                                                <span className="text-xs text-muted-foreground truncate max-w-[120px] block">
                                                    {dataset.source ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell py-3.5">
                                                {dataset.frequency ? (
                                                    <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground capitalize">
                                                        {dataset.frequency}
                                                    </Badge>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell py-3.5">
                                                <span className="text-xs font-mono text-foreground">
                                                    {dataset.record_count != null
                                                        ? dataset.record_count.toLocaleString()
                                                        : '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden xl:table-cell py-3.5">
                                                <span className="text-xs text-muted-foreground">
                                                    {dataset.last_updated
                                                        ? new Date(dataset.last_updated).toLocaleDateString('en-UG', { day: '2-digit', month: 'short', year: 'numeric' })
                                                        : '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell py-3.5">
                                                {dataset.format ? (
                                                    <Badge className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono">
                                                        {dataset.format}
                                                    </Badge>
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell className="py-3.5 pr-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-accent"
                                                        >
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            onClick={() => loadDataHubItem(dataset.id!, dataset.name)}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            Preview Data
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                toast.success(`Download initiated for "${dataset.name}"`);
                                                            }}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <Separator className="my-1" />
                                                        <DropdownMenuItem
                                                            onClick={() => navigate('/researcher/statistical-analysis')}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <BarChart2 className="h-3.5 w-3.5" />
                                                            Analyse
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => navigate('/researcher/queries')}
                                                            className="gap-2 cursor-pointer"
                                                        >
                                                            <FileText className="h-3.5 w-3.5" />
                                                            Custom Query
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Pagination */}
                {!loadingDataHub && dataHub.length > 0 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">
                            Showing {Math.min((dataHubPage - 1) * dataHubLimit + 1, dataHubTotal)}–{Math.min(dataHubPage * dataHubLimit, dataHubTotal)} of {dataHubTotal} datasets
                        </p>
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-border/40"
                                disabled={dataHubPage <= 1}
                                onClick={() => setDataHubPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </Button>
                            <span className="text-xs text-muted-foreground px-2">
                                {dataHubPage} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7 border-border/40"
                                disabled={dataHubPage >= totalPages}
                                onClick={() => setDataHubPage(p => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dataset Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={(open) => { setPreviewOpen(open); if (!open) { setDataHubItem(null); setPreviewDatasetName(''); } }}>
                <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader className="shrink-0">
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <Eye className="h-5 w-5 text-amber-400" />
                            {previewDatasetName || 'Dataset Preview'}
                        </DialogTitle>
                    </DialogHeader>

                    {loadingDataHubItem ? (
                        <div className="flex-1 p-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full rounded" />
                            ))}
                        </div>
                    ) : !dataHubItem ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Database className="h-10 w-10 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No preview data available.</p>
                        </div>
                    ) : (
                        <div className="flex-1 overflow-auto space-y-5 pr-1">
                            {/* Metadata */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div className="backdrop-blur-sm bg-background/40 rounded-lg p-3 border border-border/30">
                                    <p className="text-xs text-muted-foreground mb-0.5">Total Records</p>
                                    <p className="font-mono font-semibold text-foreground">
                                        {dataHubItem.total_records?.toLocaleString() ?? '—'}
                                    </p>
                                </div>
                                <div className="backdrop-blur-sm bg-background/40 rounded-lg p-3 border border-border/30">
                                    <p className="text-xs text-muted-foreground mb-0.5">Columns</p>
                                    <p className="font-mono font-semibold text-foreground">
                                        {dataHubItem.columns?.length ?? '—'}
                                    </p>
                                </div>
                                <div className="backdrop-blur-sm bg-background/40 rounded-lg p-3 border border-border/30">
                                    <p className="text-xs text-muted-foreground mb-0.5">Sample Rows</p>
                                    <p className="font-mono font-semibold text-foreground">
                                        {dataHubItem.sample_records?.length ?? '—'}
                                    </p>
                                </div>
                            </div>

                            {/* Column Schema */}
                            {dataHubItem.columns && dataHubItem.columns.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                        <Database className="h-4 w-4 text-amber-400" />
                                        Schema
                                    </h3>
                                    <div className="overflow-x-auto rounded-lg border border-border/30">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-border/30 hover:bg-transparent">
                                                    <TableHead className="text-xs pl-4">Column</TableHead>
                                                    <TableHead className="text-xs">Type</TableHead>
                                                    <TableHead className="text-xs">Description</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dataHubItem.columns.map((col, i) => (
                                                    <TableRow key={i} className="border-border/20 hover:bg-amber-500/5">
                                                        <TableCell className="pl-4 py-2 font-mono text-xs text-amber-400">{col.name}</TableCell>
                                                        <TableCell className="py-2">
                                                            <Badge variant="outline" className="text-xs border-border/40 text-muted-foreground font-mono">{col.type}</Badge>
                                                        </TableCell>
                                                        <TableCell className="py-2 text-xs text-muted-foreground">{col.description ?? '—'}</TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* Sample Records */}
                            {dataHubItem.sample_records && dataHubItem.sample_records.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                                        <FileText className="h-4 w-4 text-amber-400" />
                                        Sample Records
                                    </h3>
                                    <div className="overflow-x-auto rounded-lg border border-border/30">
                                        <Table>
                                            <TableHeader>
                                                <TableRow className="border-border/30 hover:bg-transparent">
                                                    {Object.keys(dataHubItem.sample_records[0]).map((key) => (
                                                        <TableHead key={key} className="text-xs font-mono text-muted-foreground whitespace-nowrap pl-4">{key}</TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {dataHubItem.sample_records.map((row, i) => (
                                                    <TableRow key={i} className="border-border/20 hover:bg-amber-500/5">
                                                        {Object.values(row).map((val, j) => (
                                                            <TableCell key={j} className="py-2 text-xs text-foreground pl-4 whitespace-nowrap font-mono">
                                                                {val == null ? <span className="text-muted-foreground/50">null</span> : String(val)}
                                                            </TableCell>
                                                        ))}
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}

                            {/* CTA */}
                            <div className="flex justify-end gap-2 pt-1 pb-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => { setPreviewOpen(false); navigate('/researcher/statistical-analysis'); }}
                                    className="gap-1.5 border-border/40"
                                >
                                    <BarChart2 className="h-3.5 w-3.5" />
                                    Analyse Dataset
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        toast.success(`Download initiated for "${dataHubItem.dataset_name ?? 'dataset'}"`);
                                    }}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.3)] hover:shadow-[0_0_18px_rgba(245,158,11,0.5)] hover:bg-primary/10 transition-all duration-200 gap-1.5"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Download
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
