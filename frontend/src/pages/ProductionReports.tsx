import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
    productionReportsService,
    type ProductionReportsGenerateParams,
    type ProductionReportsListResponse,
    type ProductionReportsScheduleParams,
    type ProductionReportsTemplatesResponse,
} from '@/lib/api/productionReportsService';
import {
    cropsService,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    districtsService,
    type DistrictsListResponse,
} from '@/lib/api/districtsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
    FileText, Download, Clock, Filter, RefreshCw,
    ChevronLeft, ChevronRight, MoreVertical, Plus, Send, BarChart3,
    Layers, Loader2, Check, ChevronDown, MapPin, Leaf,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

type Template = ProductionReportsTemplatesResponse['data'][number];
type Crop = CropsListResponse['data'][number];
type District = DistrictsListResponse['data'][number];
type List = ProductionReportsListResponse['data'][number];

// ─── Zod schemas ─────────────────────────────────────────────────────────────
const generateSchema = z.object({
    template_id: z.string().min(1, 'Template is required'),
    crop_ids: z.array(z.string()).min(1, 'Select at least one crop'),
    district_ids: z.array(z.string()).min(1, 'Select at least one district'),
    from_date: z.string().min(1, 'Start date is required'),
    to_date: z.string().min(1, 'End date is required'),
    season: z.string().min(1, 'Season is required'),
    comparison_baseline: z.string().optional().default(''),
    output_format: z.string().min(1, 'Output format is required'),
});
type GenerateInput = z.infer<typeof generateSchema>;

const scheduleSchema = z.object({
    template_id: z.string().min(1, 'Template is required'),
    crop_ids: z.array(z.string()).min(1, 'Select at least one crop'),
    district_ids: z.array(z.string()).min(1, 'Select at least one district'),
    frequency: z.string().min(1, 'Frequency is required'),
    next_run_date: z.string().min(1, 'Next run date is required'),
    output_format: z.string().min(1, 'Output format is required'),
    recipient_emails: z.string().min(1, 'At least one email is required'),
});
type ScheduleInput = z.infer<typeof scheduleSchema>;

const SEASONS = ['Season A', 'Season B', 'Annual'];
const BASELINES = ['National Average', 'Regional Benchmark', 'Previous Year', 'ASSP Targets'];
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Annually'];

export default function ProductionReports() {
    useAuth();

    // Modal state
    const [showGenerateDialog, setShowGenerateDialog] = useState(false);
    const [showScheduleSheet, setShowScheduleSheet] = useState(false);
    const [submittingGenerate, setSubmittingGenerate] = useState(false);
    const [submittingSchedule, setSubmittingSchedule] = useState(false);

    // Combobox open state
    const [genCropPickerOpen, setGenCropPickerOpen] = useState(false);
    const [genDistrictPickerOpen, setGenDistrictPickerOpen] = useState(false);
    const [schCropPickerOpen, setSchCropPickerOpen] = useState(false);
    const [schDistrictPickerOpen, setSchDistrictPickerOpen] = useState(false);

    // Local filter state
    const [reportTypeFilter, setReportTypeFilter] = useState('');
    const [cropSearch, setCropSearch] = useState('');
    const [districtSearch, setDistrictSearch] = useState('');

    // List state — GET /production-reports/templates
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(true);
    const [templatesPage, setTemplatesPage] = useState(1);
    const [templatesLimit] = useState(10);
    const [templatesTotal, setTemplatesTotal] = useState(0);
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
    // List state — GET /production-reports/list
    const [list, setList] = useState<List[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listPage, setListPage] = useState(1);
    const [listLimit] = useState(10);
    const [listTotal, setListTotal] = useState(0);

    // Debounce refs for lookup searches
    const cropDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const districtDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const debouncedLoadCrops = useCallback((search: string) => {
        if (cropDebounceRef.current) clearTimeout(cropDebounceRef.current);
        cropDebounceRef.current = setTimeout(() => { void loadCrops(search); }, 300);
    }, [cropsPage]); // eslint-disable-line react-hooks/exhaustive-deps

    const debouncedLoadDistricts = useCallback((search: string) => {
        if (districtDebounceRef.current) clearTimeout(districtDebounceRef.current);
        districtDebounceRef.current = setTimeout(() => { void loadDistricts(search); }, 300);
    }, [districtsPage]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { void loadTemplates(); }, [templatesPage]);
    useEffect(() => { debouncedLoadCrops(cropSearch); }, [cropsPage, cropSearch]);
    useEffect(() => { debouncedLoadDistricts(districtSearch); }, [districtsPage, districtSearch]);
    useEffect(() => { void loadList(); }, [listPage, reportTypeFilter]);

    async function loadTemplates() {
        try {
            setLoadingTemplates(true);
            const res = await productionReportsService.templates({ page: templatesPage, limit: templatesLimit });
            setTemplates(Array.isArray(res?.data) ? res.data : []);
            setTemplatesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load templates');
            console.error('[loadTemplates]', err);
        } finally {
            setLoadingTemplates(false);
        }
    }
    async function loadCrops(search?: string) {
        try {
            setLoadingCrops(true);
            const res = await cropsService.list({ page: cropsPage, limit: cropsLimit, search });
            setCrops(Array.isArray(res?.data) ? res.data : []);
            setCropsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load crops');
            console.error('[loadCrops]', err);
        } finally {
            setLoadingCrops(false);
        }
    }
    async function loadDistricts(search?: string) {
        try {
            setLoadingDistricts(true);
            const res = await districtsService.list({ page: districtsPage, limit: districtsLimit, search });
            setDistricts(Array.isArray(res?.data) ? res.data : []);
            setDistrictsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districts');
            console.error('[loadDistricts]', err);
        } finally {
            setLoadingDistricts(false);
        }
    }
    // POST /production-reports/generate
    async function handleGenerate(data: ProductionReportsGenerateParams) {
        try {
            setSubmittingGenerate(true);
            await productionReportsService.generate(data);
            toast.success('Report generation started — it will appear in your history shortly');
            setShowGenerateDialog(false);
            void loadList();
        } catch (err) {
            toast.error('Failed to generate report');
            console.error('[handleGenerate]', err);
        } finally {
            setSubmittingGenerate(false);
        }
    }
    async function loadList() {
        try {
            setLoadingList(true);
            const res = await productionReportsService.list({
                page: listPage,
                limit: listLimit,
                report_type: reportTypeFilter || undefined,
            });
            setList(Array.isArray(res?.data) ? res.data : []);
            setListTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load list');
            console.error('[loadList]', err);
        } finally {
            setLoadingList(false);
        }
    }
    // POST /production-reports/schedule
    async function handleSchedule(data: ProductionReportsScheduleParams) {
        try {
            setSubmittingSchedule(true);
            await productionReportsService.schedule(data);
            toast.success('Automated report schedule created successfully');
            setShowScheduleSheet(false);
        } catch (err) {
            toast.error('Failed to create schedule');
            console.error('[handleSchedule]', err);
        } finally {
            setSubmittingSchedule(false);
        }
    }

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: Production Reports
        DESCRIPTION: Enables MAAIF Officials to generate, configure, and export formal agricultural production reports for official policy communication and regulatory submissions. Pre-built report templates include seasonal production summaries, district performance comparison reports, crop-specific yield analysis reports, and comparative national assessments against regional benchmarks. Officials can customize report parameters including time range, districts, crop selections, and comparison baselines, schedule automated report generation for recurring submissions, and download final reports in PDF or Excel format suitable for Cabinet briefings, Parliamentary committee submissions, or development partner reporting obligations.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - templates (array)              — list data, auto-loaded on mount and on templatesPage change
          - loadingTemplates (boolean)
          - templatesPage / setTemplatesPage  — pagination state
          - templatesTotal (number)         — total record count for pagination UI
          - loadTemplates() — call to reload the list
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
          - handleGenerate(data: ProductionReportsGenerateParams) — POST /production-reports/generate
          - list (array)              — list data, auto-loaded on mount and on listPage change
          - loadingList (boolean)
          - listPage / setListPage  — pagination state
          - listTotal (number)         — total record count for pagination UI
          - loadList() — call to reload the list
          - handleSchedule(data: ProductionReportsScheduleParams) — POST /production-reports/schedule

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
    // ─── Derived / filtered data ─────────────────────────────────────────────
    const filteredCrops = useMemo(() =>
        crops.filter(c => !cropSearch || (c.name ?? '').toLowerCase().includes(cropSearch.toLowerCase())),
        [crops, cropSearch]
    );
    const filteredDistricts = useMemo(() =>
        districts.filter(d => !districtSearch || (d.name ?? '').toLowerCase().includes(districtSearch.toLowerCase())),
        [districts, districtSearch]
    );
    const filteredList = useMemo(() =>
        list.filter(r => !reportTypeFilter || r.report_type === reportTypeFilter),
        [list, reportTypeFilter]
    );
    const uniqueReportTypes = useMemo(() =>
        [...new Set(list.map(r => r.report_type).filter(Boolean))],
        [list]
    );

    // ─── Generate form ───────────────────────────────────────────────────────
    const generateForm = useForm<GenerateInput>({
        resolver: zodResolver(generateSchema),
        defaultValues: {
            template_id: '',
            crop_ids: [],
            district_ids: [],
            from_date: '',
            to_date: '',
            season: '',
            comparison_baseline: '',
            output_format: 'PDF',
        },
    });

    // ─── Schedule form ───────────────────────────────────────────────────────
    const scheduleForm = useForm<ScheduleInput>({
        resolver: zodResolver(scheduleSchema),
        defaultValues: {
            template_id: '',
            crop_ids: [],
            district_ids: [],
            frequency: '',
            next_run_date: '',
            output_format: 'PDF',
            recipient_emails: '',
        },
    });

    function onSubmitGenerate(values: GenerateInput) {
        void handleGenerate({
            ...values,
            comparison_baseline: values.comparison_baseline ?? '',
        } as ProductionReportsGenerateParams);
    }

    function onSubmitSchedule(values: ScheduleInput) {
        void handleSchedule({
            ...values,
            recipient_emails: values.recipient_emails.split(',').map(e => e.trim()).filter(Boolean),
        } as ProductionReportsScheduleParams);
    }

    // ─── UI helpers ─────────────────────────────────────────────────────────
    function formatDate(iso?: string) {
        if (!iso) return '—';
        return new Date(iso).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' });
    }

    function reportTypeBadge(type?: string) {
        const map: Record<string, string> = {
            seasonal: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            district: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            crop: 'bg-green-500/20 text-green-400 border-green-500/30',
            national: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        };
        const key = (type ?? '').toLowerCase();
        const cls = map[key] ?? 'bg-muted text-muted-foreground border-border/40';
        return <span className={cn('px-2 py-0.5 rounded text-xs border font-medium capitalize', cls)}>{type ?? 'Unknown'}</span>;
    }

    return (
        <div className="p-6 md:p-8 space-y-8 min-h-screen">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                        Production Reports
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground max-w-xl">
                        Generate, configure, and export formal agricultural production reports for policy communication and regulatory submissions.
                    </p>
                </div>
                <div className="flex gap-3 shrink-0">
                    <Button
                        variant="outline"
                        className="border-primary text-primary bg-transparent shadow-[0_0_12px_hsl(var(--primary)/0.25)] hover:bg-primary/10 transition-all duration-200"
                        onClick={() => { scheduleForm.reset(); setShowScheduleSheet(true); }}
                    >
                        <Clock className="h-4 w-4 mr-2" />
                        Schedule Report
                    </Button>
                    <Button
                        className="bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all duration-200"
                        onClick={() => { generateForm.reset(); setShowGenerateDialog(true); }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Generate Report
                    </Button>
                </div>
            </div>

            {/* ── Template Cards ── */}
            <section>
                <div className="flex items-center gap-2 mb-4">
                    <Layers className="h-5 w-5 text-primary" />
                    <h2 className="font-heading text-xl font-semibold">Report Templates</h2>
                </div>
                {loadingTemplates ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <Card key={i} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                                <CardContent className="p-5 space-y-3">
                                    <Skeleton className="h-5 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-2/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : templates.length === 0 ? (
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardContent className="flex flex-col items-center py-12 text-muted-foreground gap-3">
                            <FileText className="h-10 w-10 opacity-40" />
                            <p className="text-sm">No report templates found.</p>
                            <Button variant="ghost" size="sm" onClick={() => void loadTemplates()}>
                                <RefreshCw className="h-4 w-4 mr-2" /> Retry
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {templates.map((tpl) => (
                            <Card
                                key={tpl.id}
                                className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer group"
                                onClick={() => {
                                    generateForm.reset();
                                    generateForm.setValue('template_id', tpl.id ?? '');
                                    setShowGenerateDialog(true);
                                }}
                            >
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <BarChart3 className="h-5 w-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
                                        {reportTypeBadge(tpl.report_type)}
                                    </div>
                                    <CardTitle className="text-sm font-semibold font-heading leading-snug mt-2">
                                        {tpl.name ?? 'Unnamed Template'}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <p className="text-xs text-muted-foreground line-clamp-3">{tpl.description}</p>
                                    {tpl.output_formats && tpl.output_formats.length > 0 && (
                                        <div className="flex gap-1 mt-3 flex-wrap">
                                            {tpl.output_formats.map(fmt => (
                                                <span key={fmt} className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium border border-border/40">
                                                    {fmt}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </section>

            {/* ── Generated Reports History ── */}
            <section>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="font-heading text-xl font-semibold">Report History</h2>
                        {listTotal > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
                                {listTotal} reports
                            </span>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Select
                            value={reportTypeFilter || '__all__'}
                            onValueChange={v => setReportTypeFilter(v === '__all__' ? '' : v)}
                        >
                            <SelectTrigger className="w-44 h-9 bg-card/60 border-border/40 backdrop-blur-md text-sm">
                                <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                <SelectValue placeholder="Filter by type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">All Types</SelectItem>
                                {uniqueReportTypes.map(type => (
                                    <SelectItem key={type} value={type!}>{type}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => void loadList()}>
                            <RefreshCw className={cn('h-4 w-4', loadingList && 'animate-spin')} />
                        </Button>
                    </div>
                </div>

                <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md overflow-hidden">
                    {loadingList ? (
                        <div className="p-4 space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="flex gap-3 items-center">
                                    <Skeleton className="h-4 w-1/4" />
                                    <Skeleton className="h-4 w-1/5" />
                                    <Skeleton className="h-4 w-1/6" />
                                    <Skeleton className="h-4 w-1/6" />
                                    <Skeleton className="h-4 w-1/6 ml-auto" />
                                </div>
                            ))}
                        </div>
                    ) : filteredList.length === 0 ? (
                        <div className="flex flex-col items-center py-14 gap-3 text-muted-foreground">
                            <FileText className="h-10 w-10 opacity-30" />
                            <p className="text-sm">No reports generated yet.</p>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/40 text-primary hover:bg-primary/10 mt-1"
                                onClick={() => { generateForm.reset(); setShowGenerateDialog(true); }}
                            >
                                <Plus className="h-4 w-4 mr-2" /> Generate your first report
                            </Button>
                        </div>
                    ) : (
                        <>
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border/40 hover:bg-transparent">
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Report Name</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Type</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Format</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Generated</TableHead>
                                        <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Generated By</TableHead>
                                        <TableHead className="w-10" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredList.map((report) => (
                                        <TableRow key={report.id} className="border-border/40 hover:bg-primary/5 transition-colors duration-150">
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                                    <span className="font-medium text-sm">{report.name ?? '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{reportTypeBadge(report.report_type)}</TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono uppercase text-muted-foreground">
                                                    {report.output_format ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{formatDate(report.generated_at)}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{report.generated_by ?? '—'}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem
                                                            disabled={!report.download_url}
                                                            onClick={() => {
                                                                if (report.download_url) {
                                                                    window.open(report.download_url, '_blank');
                                                                    toast.success('Downloading report…');
                                                                }
                                                            }}
                                                        >
                                                            <Download className="h-4 w-4 mr-2" />
                                                            Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                generateForm.reset();
                                                                setShowGenerateDialog(true);
                                                            }}
                                                        >
                                                            <RefreshCw className="h-4 w-4 mr-2" />
                                                            Regenerate
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Pagination */}
                            {listTotal > listLimit && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                                    <p className="text-xs text-muted-foreground">
                                        Page {listPage} of {Math.ceil(listTotal / listLimit)}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={listPage <= 1}
                                            onClick={() => setListPage(p => Math.max(1, p - 1))}
                                            className="h-8"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            disabled={listPage >= Math.ceil(listTotal / listLimit)}
                                            onClick={() => setListPage(p => p + 1)}
                                            className="h-8"
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </Card>
            </section>

            {/* ── Generate Report Dialog ── */}
            <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogContent className="max-w-2xl backdrop-blur-md bg-card/90 border border-border/40 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Generate Production Report
                        </DialogTitle>
                        <DialogDescription>
                            Configure report parameters and generate a production report for official policy use.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...generateForm}>
                        <form onSubmit={generateForm.handleSubmit(onSubmitGenerate)} className="space-y-5">
                            {/* Template */}
                            <FormField
                                control={generateForm.control}
                                name="template_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Report Template</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/60 border-border/60">
                                                    <SelectValue placeholder={loadingTemplates ? 'Loading…' : 'Select a template'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {templates.map(tpl => (
                                                    <SelectItem key={tpl.id} value={tpl.id ?? ''}>
                                                        {tpl.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Date range */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={generateForm.control}
                                    name="from_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="bg-background/60 border-border/60" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={generateForm.control}
                                    name="to_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="bg-background/60 border-border/60" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Season & Baseline */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={generateForm.control}
                                    name="season"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Season</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/60 border-border/60">
                                                        <SelectValue placeholder="Select season" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {SEASONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={generateForm.control}
                                    name="comparison_baseline"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Comparison Baseline <span className="text-muted-foreground text-xs">(optional)</span></FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/60 border-border/60">
                                                        <SelectValue placeholder="Select baseline" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {BASELINES.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Crops — searchable Combobox */}
                            <FormField
                                control={generateForm.control}
                                name="crop_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crops</FormLabel>
                                        <FormControl>
                                            <Popover open={genCropPickerOpen} onOpenChange={setGenCropPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between font-normal bg-background/60 border-border/60"
                                                    >
                                                        {field.value.length > 0
                                                            ? `${field.value.length} crop(s) selected`
                                                            : 'Select crops…'}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search crops…"
                                                            value={cropSearch}
                                                            onValueChange={setCropSearch}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingCrops ? 'Loading…' : 'No crops found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredCrops.map(crop => (
                                                                    <CommandItem
                                                                        key={crop.id}
                                                                        value={crop.name ?? crop.id ?? ''}
                                                                        onSelect={() => {
                                                                            const id = crop.id ?? '';
                                                                            const next = field.value.includes(id)
                                                                                ? field.value.filter(v => v !== id)
                                                                                : [...field.value, id];
                                                                            field.onChange(next);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                field.value.includes(crop.id ?? '') ? 'opacity-100' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <Leaf className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                        {crop.name ?? crop.id}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Districts — searchable Combobox */}
                            <FormField
                                control={generateForm.control}
                                name="district_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Districts</FormLabel>
                                        <FormControl>
                                            <Popover open={genDistrictPickerOpen} onOpenChange={setGenDistrictPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between font-normal bg-background/60 border-border/60"
                                                    >
                                                        {field.value.length > 0
                                                            ? `${field.value.length} district(s) selected`
                                                            : 'Select districts…'}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search districts…"
                                                            value={districtSearch}
                                                            onValueChange={setDistrictSearch}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredDistricts.map(district => (
                                                                    <CommandItem
                                                                        key={district.id}
                                                                        value={district.name ?? district.id ?? ''}
                                                                        onSelect={() => {
                                                                            const id = district.id ?? '';
                                                                            const next = field.value.includes(id)
                                                                                ? field.value.filter(v => v !== id)
                                                                                : [...field.value, id];
                                                                            field.onChange(next);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                field.value.includes(district.id ?? '') ? 'opacity-100' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                        {district.name ?? district.id}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Output format */}
                            <FormField
                                control={generateForm.control}
                                name="output_format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Output Format</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/60 border-border/60">
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PDF">PDF</SelectItem>
                                                <SelectItem value="Excel">Excel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setShowGenerateDialog(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submittingGenerate}
                                    className="bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] transition-all duration-200"
                                >
                                    {submittingGenerate ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating…</>
                                    ) : (
                                        <><BarChart3 className="h-4 w-4 mr-2" /> Generate Report</>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ── Schedule Report Sheet ── */}
            <Sheet open={showScheduleSheet} onOpenChange={setShowScheduleSheet}>
                <SheetContent className="w-full sm:max-w-lg overflow-y-auto backdrop-blur-md bg-card/95 border-l border-border/40">
                    <SheetHeader className="pb-4">
                        <SheetTitle className="font-heading text-xl flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            Schedule Automated Report
                        </SheetTitle>
                        <SheetDescription>
                            Set up recurring report generation for periodic submission obligations (Cabinet, Parliament, development partners).
                        </SheetDescription>
                    </SheetHeader>
                    <Separator className="mb-5 opacity-40" />

                    <Form {...scheduleForm}>
                        <form onSubmit={scheduleForm.handleSubmit(onSubmitSchedule)} className="space-y-5">
                            {/* Template */}
                            <FormField
                                control={scheduleForm.control}
                                name="template_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Report Template</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/60 border-border/60">
                                                    <SelectValue placeholder={loadingTemplates ? 'Loading…' : 'Select a template'} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {templates.map(tpl => (
                                                    <SelectItem key={tpl.id} value={tpl.id ?? ''}>{tpl.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Frequency & Next run date */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={scheduleForm.control}
                                    name="frequency"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Frequency</FormLabel>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <FormControl>
                                                    <SelectTrigger className="bg-background/60 border-border/60">
                                                        <SelectValue placeholder="Select frequency" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {FREQUENCIES.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={scheduleForm.control}
                                    name="next_run_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Next Run Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="bg-background/60 border-border/60" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Crops — searchable Combobox */}
                            <FormField
                                control={scheduleForm.control}
                                name="crop_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crops</FormLabel>
                                        <FormControl>
                                            <Popover open={schCropPickerOpen} onOpenChange={setSchCropPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between font-normal bg-background/60 border-border/60"
                                                    >
                                                        {field.value.length > 0
                                                            ? `${field.value.length} crop(s) selected`
                                                            : 'Select crops…'}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search crops…"
                                                            value={cropSearch}
                                                            onValueChange={setCropSearch}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingCrops ? 'Loading…' : 'No crops found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredCrops.map(crop => (
                                                                    <CommandItem
                                                                        key={crop.id}
                                                                        value={crop.name ?? crop.id ?? ''}
                                                                        onSelect={() => {
                                                                            const id = crop.id ?? '';
                                                                            const next = field.value.includes(id)
                                                                                ? field.value.filter(v => v !== id)
                                                                                : [...field.value, id];
                                                                            field.onChange(next);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                field.value.includes(crop.id ?? '') ? 'opacity-100' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <Leaf className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                        {crop.name ?? crop.id}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Districts — searchable Combobox */}
                            <FormField
                                control={scheduleForm.control}
                                name="district_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Districts</FormLabel>
                                        <FormControl>
                                            <Popover open={schDistrictPickerOpen} onOpenChange={setSchDistrictPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between font-normal bg-background/60 border-border/60"
                                                    >
                                                        {field.value.length > 0
                                                            ? `${field.value.length} district(s) selected`
                                                            : 'Select districts…'}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search districts…"
                                                            value={districtSearch}
                                                            onValueChange={setDistrictSearch}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredDistricts.map(district => (
                                                                    <CommandItem
                                                                        key={district.id}
                                                                        value={district.name ?? district.id ?? ''}
                                                                        onSelect={() => {
                                                                            const id = district.id ?? '';
                                                                            const next = field.value.includes(id)
                                                                                ? field.value.filter(v => v !== id)
                                                                                : [...field.value, id];
                                                                            field.onChange(next);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                field.value.includes(district.id ?? '') ? 'opacity-100' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                        {district.name ?? district.id}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Output format */}
                            <FormField
                                control={scheduleForm.control}
                                name="output_format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Output Format</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/60 border-border/60">
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="PDF">PDF</SelectItem>
                                                <SelectItem value="Excel">Excel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Recipient emails */}
                            <FormField
                                control={scheduleForm.control}
                                name="recipient_emails"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Recipient Emails</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="email1@maaif.go.ug, email2@maaif.go.ug"
                                                className="bg-background/60 border-border/60"
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground">Separate multiple emails with commas</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <SheetFooter className="pt-2 gap-3">
                                <Button type="button" variant="ghost" onClick={() => setShowScheduleSheet(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={submittingSchedule}
                                    className="flex-1 bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.25)] hover:bg-primary/10 transition-all duration-200"
                                >
                                    {submittingSchedule ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scheduling…</>
                                    ) : (
                                        <><Send className="h-4 w-4 mr-2" /> Create Schedule</>
                                    )}
                                </Button>
                            </SheetFooter>
                        </form>
                    </Form>
                </SheetContent>
            </Sheet>
        </div>
    );
}
