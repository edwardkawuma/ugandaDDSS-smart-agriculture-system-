import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import {
    publicReportsService,
    type PublicReportsListParams,
    type PublicReportsListResponse,
} from '@/lib/api/publicReportsService';
import { cropsService } from '@/lib/api/cropsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    FileText, Download, Calendar, Filter, RefreshCw, Search,
    ChevronLeft, ChevronRight, BookOpen, Leaf, CloudSun, Bug,
    BarChart3, Globe, AlertCircle, Loader2, X, FileDown,
    Check, ChevronsUpDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type PublicReport = PublicReportsListResponse['data'][number];

const CATEGORIES = [
    'All Categories',
    'Seasonal Outlook',
    'Pest & Disease Surveillance',
    'Crop Production Digest',
    'Research Brief',
    'Programme Report',
    'Policy Brief',
    'Market Intelligence',
];

const SEASONS = ['All Seasons', 'Season A 2024', 'Season B 2024', 'Season A 2023', 'Season B 2023', 'Annual 2023'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    'Seasonal Outlook': <CloudSun className="w-4 h-4" />,
    'Pest & Disease Surveillance': <Bug className="w-4 h-4" />,
    'Crop Production Digest': <Leaf className="w-4 h-4" />,
    'Research Brief': <BookOpen className="w-4 h-4" />,
    'Programme Report': <Globe className="w-4 h-4" />,
    'Policy Brief': <BarChart3 className="w-4 h-4" />,
    'Market Intelligence': <BarChart3 className="w-4 h-4" />,
};

const CATEGORY_COLORS: Record<string, string> = {
    'Seasonal Outlook': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    'Pest & Disease Surveillance': 'bg-red-500/10 text-red-400 border-red-500/20',
    'Crop Production Digest': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Research Brief': 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    'Programme Report': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Policy Brief': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Market Intelligence': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

function formatFileSize(kb?: number): string {
    if (!kb) return '—';
    if (kb < 1024) return `${kb} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(dateStr?: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PublicReports() {
    // List state - GET /public-reports/list
    const [publicReports, setPublicReports] = useState<PublicReport[]>([]);
    const [loadingPublicReports, setLoadingPublicReports] = useState(true);
    const [publicReportsPage, setPublicReportsPage] = useState(1);
    const [publicReportsLimit] = useState(12);
    const [publicReportsTotal, setPublicReportsTotal] = useState(0);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All Categories');
    const [seasonFilter, setSeasonFilter] = useState('All Seasons');
    const [cropFilter, setCropFilter] = useState('');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [downloadingId, setDownloadingId] = useState<string | null>(null);

    // Crop combobox state
    const [cropOpen, setCropOpen] = useState(false);
    const [cropSearch, setCropSearch] = useState('');
    const [cropDebouncedSearch, setCropDebouncedSearch] = useState('');
    const [cropOptions, setCropOptions] = useState<Array<{ id?: string; name?: string }>>([]);
    const [loadingCropOptions, setLoadingCropOptions] = useState(false);

    // Debounce crop search
    useEffect(() => {
        const t = setTimeout(() => setCropDebouncedSearch(cropSearch), 300);
        return () => clearTimeout(t);
    }, [cropSearch]);

    // Load crop options when combobox opens or debounced search changes
    useEffect(() => {
        if (!cropOpen) return;
        let cancelled = false;
        setLoadingCropOptions(true);
        cropsService
            .list({ page: 1, limit: 50, search: cropDebouncedSearch || undefined })
            .then((res) => { if (!cancelled) setCropOptions(Array.isArray(res?.data) ? res.data : []); })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoadingCropOptions(false); });
        return () => { cancelled = true; };
    }, [cropOpen, cropDebouncedSearch]);

    useEffect(() => { void loadPublicReports(); }, [publicReportsPage, categoryFilter, seasonFilter, cropFilter, fromDate, toDate]);

    async function loadPublicReports() {
        try {
            setLoadingPublicReports(true);
            const params: PublicReportsListParams = {
                page: publicReportsPage,
                limit: publicReportsLimit,
                search: searchQuery || undefined,
                category: categoryFilter !== 'All Categories' ? categoryFilter : undefined,
                season: seasonFilter !== 'All Seasons' ? seasonFilter : undefined,
                crop: cropFilter || undefined,
                from_date: fromDate || undefined,
                to_date: toDate || undefined,
            };
            const res = await publicReportsService.list(params);
            setPublicReports(Array.isArray(res?.data) ? res.data : []);
            setPublicReportsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load reports');
            console.error('[loadPublicReports]', err);
        } finally {
            setLoadingPublicReports(false);
        }
    }

    function handleSearch() {
        setPublicReportsPage(1);
        void loadPublicReports();
    }

    function handleClearFilters() {
        setSearchQuery('');
        setCategoryFilter('All Categories');
        setSeasonFilter('All Seasons');
        setCropFilter('');
        setCropSearch('');
        setFromDate('');
        setToDate('');
        setPublicReportsPage(1);
    }

    function handleDownload(report: PublicReport) {
        if (!report.download_url) {
            toast.error('Download URL not available for this report');
            return;
        }
        setDownloadingId(report.id ?? null);
        try {
            window.open(report.download_url, '_blank', 'noopener,noreferrer');
            toast.success(`Downloading "${report.title}"`);
        } catch {
            toast.error('Failed to initiate download');
        } finally {
            setDownloadingId(null);
        }
    }

    const totalPages = Math.ceil(publicReportsTotal / publicReportsLimit);
    const hasFilters = categoryFilter !== 'All Categories' || seasonFilter !== 'All Seasons' || !!cropFilter || !!fromDate || !!toDate || !!searchQuery;

    return (
        <div className="p-6 md:p-8 min-h-screen space-y-8">

            {/* Page header */}
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <FileText className="w-6 h-6 text-amber-400" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl md:text-3xl font-semibold text-foreground tracking-tight">
                            Public Reports Library
                        </h1>
                        <p className="text-sm text-muted-foreground mt-0.5">
                            Official agricultural publications from MAAIF, NARO, and development partners
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {([
                    { label: 'Total Reports', value: publicReportsTotal || '—', icon: <FileText className="w-4 h-4 text-amber-400" />, bg: 'bg-amber-500/10 border-amber-500/20' },
                    { label: 'Categories', value: CATEGORIES.length - 1, icon: <BookOpen className="w-4 h-4 text-emerald-400" />, bg: 'bg-emerald-500/10 border-emerald-500/20' },
                    { label: 'Seasons Covered', value: SEASONS.length - 1, icon: <Calendar className="w-4 h-4 text-sky-400" />, bg: 'bg-sky-500/10 border-sky-500/20' },
                    { label: 'Publishers', value: '3+', icon: <Globe className="w-4 h-4 text-violet-400" />, bg: 'bg-violet-500/10 border-violet-500/20' },
                ] as const).map((stat) => (
                    <Card
                        key={stat.label}
                        className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg hover:bg-card/70"
                    >
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={cn('p-2 rounded-md border', stat.bg)}>
                                {stat.icon}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                                <p className="text-xl font-semibold text-foreground">{stat.value}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filters */}
            <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-heading flex items-center gap-2">
                            <Filter className="w-4 h-4 text-amber-400" />
                            Filter Reports
                        </CardTitle>
                        {hasFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-muted-foreground hover:text-foreground h-7 px-2 text-xs gap-1"
                            >
                                <X className="w-3 h-3" /> Clear all
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Search row */}
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                placeholder="Search reports by title, publisher, crop..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-9 bg-background/50 border-border/50 focus:border-amber-500/60"
                            />
                        </div>
                        <Button
                            onClick={handleSearch}
                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(245,158,11,0.25)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:bg-primary/10 transition-all duration-200"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Search
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => { setPublicReportsPage(1); void loadPublicReports(); }}
                            className="border-border/50 hover:border-amber-500/40 transition-colors duration-200"
                            title="Refresh"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Filter dropdowns */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Category</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={false}
                                        className="w-full justify-between bg-background/50 border-border/50 h-9 text-sm font-normal"
                                    >
                                        <span className="truncate">{categoryFilter}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[240px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search category..." />
                                        <CommandList>
                                            <CommandEmpty>No category found.</CommandEmpty>
                                            <CommandGroup>
                                                {CATEGORIES.map((c) => (
                                                    <CommandItem
                                                        key={c}
                                                        value={c}
                                                        onSelect={() => { setCategoryFilter(c); setPublicReportsPage(1); }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                categoryFilter === c ? 'opacity-100' : 'opacity-0',
                                                            )}
                                                        />
                                                        {c}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Season</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={false}
                                        className="w-full justify-between bg-background/50 border-border/50 h-9 text-sm font-normal"
                                    >
                                        <span className="truncate">{seasonFilter}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[240px] p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search season..." />
                                        <CommandList>
                                            <CommandEmpty>No season found.</CommandEmpty>
                                            <CommandGroup>
                                                {SEASONS.map((s) => (
                                                    <CommandItem
                                                        key={s}
                                                        value={s}
                                                        onSelect={() => { setSeasonFilter(s); setPublicReportsPage(1); }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                seasonFilter === s ? 'opacity-100' : 'opacity-0',
                                                            )}
                                                        />
                                                        {s}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Crop</Label>
                            <Popover open={cropOpen} onOpenChange={setCropOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={cropOpen}
                                        className="w-full justify-between bg-background/50 border-border/50 h-9 text-sm font-normal"
                                    >
                                        <span className="truncate">{cropFilter || 'All Crops'}</span>
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[240px] p-0" align="start">
                                    <Command>
                                        <CommandInput
                                            placeholder="Search crop..."
                                            value={cropSearch}
                                            onValueChange={setCropSearch}
                                        />
                                        <CommandList>
                                            {loadingCropOptions ? (
                                                <CommandEmpty>Loading...</CommandEmpty>
                                            ) : cropOptions.length === 0 ? (
                                                <CommandEmpty>No crop found.</CommandEmpty>
                                            ) : (
                                                <CommandGroup>
                                                    <CommandItem
                                                        value="__all__"
                                                        onSelect={() => { setCropFilter(''); setCropSearch(''); setCropOpen(false); setPublicReportsPage(1); }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', !cropFilter ? 'opacity-100' : 'opacity-0')} />
                                                        All Crops
                                                    </CommandItem>
                                                    {cropOptions.map((c) => (
                                                        <CommandItem
                                                            key={c.id}
                                                            value={c.name ?? ''}
                                                            onSelect={() => { setCropFilter(c.name ?? ''); setCropSearch(''); setCropOpen(false); setPublicReportsPage(1); }}
                                                        >
                                                            <Check className={cn('mr-2 h-4 w-4', cropFilter === c.name ? 'opacity-100' : 'opacity-0')} />
                                                            {c.name}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">From Date</Label>
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setPublicReportsPage(1); }}
                                className="bg-background/50 border-border/50 h-9 text-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">To Date</Label>
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setPublicReportsPage(1); }}
                                className="bg-background/50 border-border/50 h-9 text-sm"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Results header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {loadingPublicReports
                        ? 'Loading reports...'
                        : `Showing ${publicReports.length} of ${publicReportsTotal} report${publicReportsTotal !== 1 ? 's' : ''}`}
                </p>
                {hasFilters && (
                    <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-400 bg-amber-500/5">
                        Filters active
                    </Badge>
                )}
            </div>

            {/* Report cards grid */}
            {loadingPublicReports ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card key={i} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                            <CardHeader className="pb-3">
                                <Skeleton className="h-5 w-3/4" />
                                <Skeleton className="h-4 w-1/3 mt-1" />
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-5/6" />
                                <Skeleton className="h-4 w-2/3" />
                                <Skeleton className="h-9 w-full mt-2" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : publicReports.length === 0 ? (
                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                    <CardContent className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="p-4 rounded-full bg-muted/30 border border-border/30">
                            <FileText className="w-10 h-10 text-muted-foreground/50" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-base font-medium text-foreground">No reports found</p>
                            <p className="text-sm text-muted-foreground">
                                {hasFilters
                                    ? 'Try adjusting your filters or search terms to find relevant publications.'
                                    : 'No reports have been published yet. Check back soon.'}
                            </p>
                        </div>
                        {hasFilters && (
                            <Button variant="outline" size="sm" onClick={handleClearFilters} className="border-border/50 gap-2">
                                <X className="w-4 h-4" /> Clear filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {publicReports.map((report) => {
                        const catColor = CATEGORY_COLORS[report.category ?? ''] ?? 'bg-muted/20 text-muted-foreground border-border/20';
                        const catIcon = CATEGORY_ICONS[report.category ?? ''] ?? <FileText className="w-4 h-4" />;
                        const isDownloading = downloadingId === report.id;

                        return (
                            <Card
                                key={report.id}
                                className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md hover:shadow-lg hover:bg-card/70 hover:border-border/60 transition-all duration-200 flex flex-col"
                            >
                                <CardHeader className="pb-2">
                                    {/* Category badge + date */}
                                    <div className="flex items-start justify-between gap-2">
                                        <Badge
                                            variant="outline"
                                            className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border', catColor)}
                                        >
                                            {catIcon}
                                            {report.category ?? 'Report'}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                                            {formatDate(report.published_date)}
                                        </span>
                                    </div>

                                    {/* Title */}
                                    <CardTitle className="font-heading text-base leading-snug mt-2 text-foreground group-hover:text-amber-400 transition-colors duration-200 line-clamp-2">
                                        {report.title ?? 'Untitled Report'}
                                    </CardTitle>

                                    {/* Publisher */}
                                    {report.publisher && (
                                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                            <Globe className="w-3 h-3 shrink-0" />
                                            {report.publisher}
                                        </p>
                                    )}
                                </CardHeader>

                                <CardContent className="flex-1 flex flex-col gap-3">
                                    {/* Description */}
                                    {report.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                                            {report.description}
                                        </p>
                                    )}

                                    {/* Metadata chips */}
                                    <div className="flex flex-wrap gap-1.5">
                                        {report.season && (
                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15 text-amber-300">
                                                <Calendar className="w-3 h-3" />
                                                {report.season}
                                            </span>
                                        )}
                                        {(report.crop ?? []).slice(0, 2).map((c) => (
                                            <span key={c} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/15 text-emerald-300">
                                                <Leaf className="w-3 h-3" />
                                                {c}
                                            </span>
                                        ))}
                                        {(report.crop ?? []).length > 2 && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted/20 border border-border/20 text-muted-foreground">
                                                +{(report.crop ?? []).length - 2} more
                                            </span>
                                        )}
                                    </div>

                                    {/* Footer: file size + download */}
                                    <div className="mt-auto pt-2 flex items-center justify-between gap-3">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <FileDown className="w-3 h-3" />
                                            PDF &middot; {formatFileSize(report.file_size_kb)}
                                        </span>
                                        <Button
                                            size="sm"
                                            disabled={!report.download_url || isDownloading}
                                            onClick={() => handleDownload(report)}
                                            className="bg-transparent border border-primary text-primary shadow-[0_0_10px_rgba(245,158,11,0.2)] hover:shadow-[0_0_16px_rgba(245,158,11,0.4)] hover:bg-primary/10 transition-all duration-200 h-8 px-3 text-xs gap-1.5"
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <Loader2 className="w-3 h-3 animate-spin" />
                                                    Opening...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-3 h-3" />
                                                    Download
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loadingPublicReports && totalPages > 1 && (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page {publicReportsPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPublicReportsPage((p) => Math.max(1, p - 1))}
                            disabled={publicReportsPage === 1}
                            className="border-border/50 hover:border-amber-500/40 transition-colors duration-200 gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </Button>

                        <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let page: number;
                                if (totalPages <= 5) {
                                    page = i + 1;
                                } else if (publicReportsPage <= 3) {
                                    page = i + 1;
                                } else if (publicReportsPage >= totalPages - 2) {
                                    page = totalPages - 4 + i;
                                } else {
                                    page = publicReportsPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={page}
                                        variant={page === publicReportsPage ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setPublicReportsPage(page)}
                                        className={cn(
                                            'w-8 h-8 p-0 text-xs transition-all duration-200',
                                            page === publicReportsPage
                                                ? 'bg-amber-500 border-amber-500 text-black hover:bg-amber-400'
                                                : 'border-border/50 hover:border-amber-500/40',
                                        )}
                                    >
                                        {page}
                                    </Button>
                                );
                            })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPublicReportsPage((p) => Math.min(totalPages, p + 1))}
                            disabled={publicReportsPage === totalPages}
                            className="border-border/50 hover:border-amber-500/40 transition-colors duration-200 gap-1"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Info callout */}
            <Card className="backdrop-blur-md bg-card/60 border border-amber-500/20 rounded-lg shadow-md">
                <CardContent className="p-5 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0 mt-0.5">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">About This Library</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            All publications are produced using data from Uganda's National Agricultural Data Hub and are made available
                            in support of the government's transparency obligations under the UCSATP programme. For enquiries or to
                            request additional publications, contact MAAIF's Information Management Unit.
                        </p>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
