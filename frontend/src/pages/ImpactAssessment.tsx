import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
    monitoringService,
    type MonitoringProgrammesListResponse,
} from '@/lib/api/monitoringService';
import {
    impactService,
    type ImpactAssessmentResultsResponse,
    type ImpactAssessmentRunParams,
    type ImpactBaselineListResponse,
} from '@/lib/api/impactService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    MoreVertical,
    TrendingUp,
    Users,
    BarChart3,
    Leaf,
    Play,
    Eye,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Search,
    Filter,
    Database,
    Activity,
    DollarSign,
    Target,
    Shield,
    Check,
    ChevronsUpDown,
    ArrowLeft,
} from 'lucide-react';

// ─── Assessment run form schema ───────────────────────────────────────────────
const assessmentRunSchema = z.object({
    programme_id: z.string().min(1, 'Programme is required'),
    baseline_dataset_id: z.string().min(1, 'Baseline dataset is required'),
    methodology: z.string().min(1, 'Methodology is required'),
    metric_types: z.array(z.string()).min(1, 'At least one metric type is required'),
    beneficiary_group_ids: z.array(z.string()).min(1, 'At least one beneficiary group is required'),
    comparison_period: z.string().min(1, 'Comparison period is required'),
});
type AssessmentRunFormValues = z.infer<typeof assessmentRunSchema>;

type Monitoring = MonitoringProgrammesListResponse['data'][number];
type Impact = ImpactBaselineListResponse['data'][number];

export default function ImpactAssessment() {
    const navigate = useNavigate();

    // List state — GET /monitoring/programmes/list
    const [monitoring, setMonitoring] = useState<Monitoring[]>([]);
    const [loadingMonitoring, setLoadingMonitoring] = useState(true);
    const [monitoringPage, setMonitoringPage] = useState(1);
    const [monitoringLimit] = useState(10);
    const [monitoringTotal, setMonitoringTotal] = useState(0);
    // Detail state — GET /impact/assessment/results
    const [impactItem, setImpactItem] = useState<ImpactAssessmentResultsResponse['data'] | null>(null);
    const [loadingImpactItem, setLoadingImpactItem] = useState(false);
    // ↑ Impact is the singular row type
    // List state — GET /impact/baseline/list
    const [impact, setImpact] = useState<Impact[]>([]);
    const [loadingImpact, setLoadingImpact] = useState(true);
    const [impactPage, setImpactPage] = useState(1);
    const [impactLimit] = useState(10);
    const [impactTotal, setImpactTotal] = useState(0);

    // Local UI state
    const [runDialogOpen, setRunDialogOpen] = useState(false);
    const [resultsSheetOpen, setResultsSheetOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [programmeSearch, setProgrammeSearch] = useState('');
    const [baselineSearch, setBaselineSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [activeTab, setActiveTab] = useState('programmes');
    const [runningAssessment, setRunningAssessment] = useState(false);

    // Assessment run form
    const assessmentForm = useForm<AssessmentRunFormValues>({
        resolver: zodResolver(assessmentRunSchema),
        defaultValues: {
            programme_id: '',
            baseline_dataset_id: '',
            methodology: 'difference_in_differences',
            metric_types: [],
            beneficiary_group_ids: [],
            comparison_period: 'annual',
        },
    });

    useEffect(() => { void loadMonitoring(); }, [monitoringPage]);
    useEffect(() => { void loadImpact(); }, [impactPage]);

    async function loadMonitoring() {
        try {
            setLoadingMonitoring(true);
            const res = await monitoringService.programmesList({ page: monitoringPage, limit: monitoringLimit });
            setMonitoring(Array.isArray(res?.data) ? res.data : []);
            setMonitoringTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load monitoring');
            console.error('[loadMonitoring]', err);
        } finally {
            setLoadingMonitoring(false);
        }
    }
    // POST /impact/assessment/run
    async function handleAssessmentRun(data: ImpactAssessmentRunParams) {
        try {
            setRunningAssessment(true);
            const res = await impactService.assessmentRun(data);
            toast.success('Assessment job queued successfully');
            setRunDialogOpen(false);
            assessmentForm.reset();
            if (res?.data?.job_id) {
                setSelectedJobId(res.data.job_id);
                void loadImpactItem(res.data.job_id);
                setResultsSheetOpen(true);
            }
        } catch (err) {
            toast.error('Failed to start assessment');
            console.error('[handleAssessmentRun]', err);
        } finally {
            setRunningAssessment(false);
        }
    }
    async function loadImpactItem(targetId: string) {
        try {
            setLoadingImpactItem(true);
            const res = await impactService.assessmentResults({ job_id: targetId });
            setImpactItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadImpactItem]', err);
        } finally {
            setLoadingImpactItem(false);
        }
    }
    async function loadImpact() {
        try {
            setLoadingImpact(true);
            const res = await impactService.baselineList({ page: impactPage, limit: impactLimit });
            setImpact(Array.isArray(res?.data) ? res.data : []);
            setImpactTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load impact');
            console.error('[loadImpact]', err);
        } finally {
            setLoadingImpact(false);
        }
    }

    // Derived filtered data
    const filteredMonitoring = monitoring.filter(p => {
        const matchSearch = !programmeSearch || (p.name ?? '').toLowerCase().includes(programmeSearch.toLowerCase()) || (p.funder ?? '').toLowerCase().includes(programmeSearch.toLowerCase());
        const matchStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchSearch && matchStatus;
    });
    const filteredBaselines = impact.filter(b =>
        !baselineSearch || (b.name ?? '').toLowerCase().includes(baselineSearch.toLowerCase()) || (b.crop ?? '').toLowerCase().includes(baselineSearch.toLowerCase()) || (b.district ?? '').toLowerCase().includes(baselineSearch.toLowerCase())
    );
    const monitoringTotalPages = Math.max(1, Math.ceil(monitoringTotal / monitoringLimit));
    const impactTotalPages = Math.max(1, Math.ceil(impactTotal / impactLimit));

    return (
        <div className="p-6 md:p-8 min-h-screen bg-background">
            {/* Back button */}
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/partner/monitoring')}
                className="mb-4 gap-1.5 text-xs"
            >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Monitoring
            </Button>

            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                            Impact Assessment
                        </h1>
                        <p className="mt-1.5 text-muted-foreground text-sm max-w-2xl">
                            Assess and document the agricultural and socioeconomic impact of funded programmes. Compare beneficiary outcomes against control baselines using OECD DAC-aligned attribution methodologies.
                        </p>
                    </div>
                    <Dialog open={runDialogOpen} onOpenChange={setRunDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary)/0.4)] hover:bg-primary/10 transition-all duration-200 ease-out gap-2"
                            >
                                <Play className="w-4 h-4" />
                                Run Assessment
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="backdrop-blur-md bg-card/80 border border-border/40 shadow-md max-w-lg">
                            <DialogHeader>
                                <DialogTitle className="font-heading text-xl font-semibold">Configure Impact Assessment</DialogTitle>
                            </DialogHeader>
                            <Form {...assessmentForm}>
                                <form onSubmit={assessmentForm.handleSubmit(handleAssessmentRun)} className="space-y-4 mt-2">
                                    {/* Programme */}
                                    <FormField
                                        control={assessmentForm.control}
                                        name="programme_id"
                                        render={({ field }) => {
                                            const selectedProgramme = monitoring.find(p => p.id === field.value);
                                            return (
                                                <FormItem>
                                                    <FormLabel>Programme</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    aria-expanded={false}
                                                                    className="w-full justify-between font-normal"
                                                                >
                                                                    <span className="truncate">
                                                                        {selectedProgramme ? (selectedProgramme.name ?? selectedProgramme.id) : 'Select a programme…'}
                                                                    </span>
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Search programmes…" />
                                                                <CommandList>
                                                                    <CommandEmpty>No programme found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {monitoring.map(p => (
                                                                            <CommandItem
                                                                                key={p.id ?? ''}
                                                                                value={`${p.name ?? ''} ${p.funder ?? ''}`}
                                                                                onSelect={() => field.onChange(p.id ?? '')}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        'mr-2 h-4 w-4',
                                                                                        field.value === p.id ? 'opacity-100' : 'opacity-0',
                                                                                    )}
                                                                                />
                                                                                <span className="truncate">{p.name ?? p.id}</span>
                                                                                {p.funder && <span className="ml-2 text-xs text-muted-foreground">{p.funder}</span>}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    {/* Baseline Dataset */}
                                    <FormField
                                        control={assessmentForm.control}
                                        name="baseline_dataset_id"
                                        render={({ field }) => {
                                            const selectedBaseline = impact.find(b => b.id === field.value);
                                            return (
                                                <FormItem>
                                                    <FormLabel>Baseline Dataset</FormLabel>
                                                    <Popover>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    aria-expanded={false}
                                                                    className="w-full justify-between font-normal"
                                                                >
                                                                    <span className="truncate">
                                                                        {selectedBaseline
                                                                            ? `${selectedBaseline.name ?? selectedBaseline.id}${selectedBaseline.crop ? ` (${selectedBaseline.crop})` : ''}`
                                                                            : 'Select a baseline…'}
                                                                    </span>
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Search baselines…" />
                                                                <CommandList>
                                                                    <CommandEmpty>No baseline found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {impact.map(b => (
                                                                            <CommandItem
                                                                                key={b.id ?? ''}
                                                                                value={`${b.name ?? ''} ${b.crop ?? ''} ${b.district ?? ''}`}
                                                                                onSelect={() => field.onChange(b.id ?? '')}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        'mr-2 h-4 w-4',
                                                                                        field.value === b.id ? 'opacity-100' : 'opacity-0',
                                                                                    )}
                                                                                />
                                                                                <span className="truncate">{b.name ?? b.id}</span>
                                                                                {b.crop && <span className="ml-2 text-xs text-muted-foreground">({b.crop})</span>}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            );
                                        }}
                                    />
                                    {/* Methodology */}
                                    <FormField
                                        control={assessmentForm.control}
                                        name="methodology"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Attribution Methodology</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="difference_in_differences">Difference-in-Differences</SelectItem>
                                                        <SelectItem value="propensity_score_matching">Propensity Score Matching</SelectItem>
                                                        <SelectItem value="regression_discontinuity">Regression Discontinuity</SelectItem>
                                                        <SelectItem value="randomised_control_trial">Randomised Control Trial</SelectItem>
                                                        <SelectItem value="before_after">Before-After Comparison</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Comparison Period */}
                                    <FormField
                                        control={assessmentForm.control}
                                        name="comparison_period"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Comparison Period</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="annual">Annual (12 months)</SelectItem>
                                                        <SelectItem value="seasonal">Seasonal (6 months)</SelectItem>
                                                        <SelectItem value="multi_year">Multi-Year (2–3 years)</SelectItem>
                                                        <SelectItem value="project_lifetime">Full Project Lifetime</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Metric Types */}
                                    <FormField
                                        control={assessmentForm.control}
                                        name="metric_types"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Metric Types</FormLabel>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {['yield_improvement', 'income_change', 'adoption_rate', 'resilience_score', 'crop_diversification', 'input_efficiency'].map(m => (
                                                        <label key={m} className={cn(
                                                            "flex items-center gap-2 px-3 py-2 rounded-md border text-xs cursor-pointer transition-colors duration-150",
                                                            field.value.includes(m) ? "border-primary bg-primary/10 text-primary" : "border-border/40 hover:border-primary/50"
                                                        )}>
                                                            <input
                                                                type="checkbox"
                                                                className="sr-only"
                                                                checked={field.value.includes(m)}
                                                                onChange={e => {
                                                                    if (e.target.checked) field.onChange([...field.value, m]);
                                                                    else field.onChange(field.value.filter((v: string) => v !== m));
                                                                }}
                                                            />
                                                            {m.replace(/_/g, ' ')}
                                                        </label>
                                                    ))}
                                                </div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    {/* Beneficiary Group IDs (manual entry as comma-separated) */}
                                    <FormField
                                        control={assessmentForm.control}
                                        name="beneficiary_group_ids"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Beneficiary Group IDs <span className="text-xs text-muted-foreground">(comma-separated)</span></FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="group-001, group-002…"
                                                        value={field.value.join(', ')}
                                                        onChange={e => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex gap-2 justify-end pt-2">
                                        <Button type="button" variant="outline" onClick={() => setRunDialogOpen(false)}>Cancel</Button>
                                        <Button
                                            type="submit"
                                            disabled={runningAssessment}
                                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary)/0.3)] hover:bg-primary/10 gap-2"
                                        >
                                            {runningAssessment ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                            {runningAssessment ? 'Running…' : 'Run Assessment'}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Summary KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {[
                        { label: 'Programmes Assessed', value: monitoringTotal, icon: BarChart3, colour: 'text-amber-400' },
                        { label: 'Baseline Datasets', value: impactTotal, icon: Database, colour: 'text-emerald-400' },
                        { label: 'Avg Yield Improvement', value: impactItem?.yield_improvement_pct != null ? `${impactItem.yield_improvement_pct.toFixed(1)}%` : '—', icon: TrendingUp, colour: 'text-sky-400' },
                        { label: 'Adoption Rate', value: impactItem?.adoption_rate_pct != null ? `${impactItem.adoption_rate_pct.toFixed(1)}%` : '—', icon: Target, colour: 'text-violet-400' },
                    ].map(kpi => (
                        <Card key={kpi.label} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className={cn("p-2 rounded-md bg-muted/50", kpi.colour)}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                                    <p className="text-xl font-bold font-heading">{typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="bg-muted/40 border border-border/40">
                    <TabsTrigger value="programmes" className="gap-1.5"><Activity className="w-3.5 h-3.5" />Programmes</TabsTrigger>
                    <TabsTrigger value="baselines" className="gap-1.5"><Database className="w-3.5 h-3.5" />Baselines</TabsTrigger>
                    {impactItem && (
                        <TabsTrigger value="results" className="gap-1.5"><TrendingUp className="w-3.5 h-3.5" />Latest Results</TabsTrigger>
                    )}
                </TabsList>

                {/* ── Programmes Tab ──────────────────────────────────────── */}
                <TabsContent value="programmes" className="space-y-4">
                    {/* Filters */}
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        className="pl-8 h-8 text-sm"
                                        placeholder="Search programmes or funders…"
                                        value={programmeSearch}
                                        onChange={e => setProgrammeSearch(e.target.value)}
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="h-8 text-sm w-36">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="completed">Completed</SelectItem>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="paused">Paused</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => loadMonitoring()} className="h-8 gap-1.5 text-xs">
                                    <RefreshCw className="w-3 h-3" /> Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Programmes Table */}
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                                <Activity className="w-4 h-4 text-amber-400" />
                                Funded Programmes
                                <Badge variant="secondary" className="ml-auto text-xs">{monitoringTotal} total</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingMonitoring ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : filteredMonitoring.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                    <BarChart3 className="w-10 h-10 opacity-30" />
                                    <p className="text-sm">No programmes found</p>
                                    <Button variant="outline" size="sm" onClick={() => { setProgrammeSearch(''); setStatusFilter('all'); }}>Clear filters</Button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border/40 hover:bg-transparent">
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Programme</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Funder</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Status</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Reach</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Disbursed</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Milestones</TableHead>
                                                <TableHead className="w-10" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredMonitoring.map(prog => (
                                                <TableRow key={prog.id} className="border-border/30 hover:bg-muted/20 transition-colors duration-150">
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">{prog.name ?? '—'}</p>
                                                            <p className="text-xs text-muted-foreground">{prog.districts?.slice(0, 2).join(', ')}{(prog.districts?.length ?? 0) > 2 ? ` +${(prog.districts?.length ?? 0) - 2}` : ''}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{prog.funder ?? '—'}</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn("text-xs capitalize border",
                                                                prog.status === 'active' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' :
                                                                prog.status === 'completed' ? 'border-sky-500/50 text-sky-400 bg-sky-500/10' :
                                                                prog.status === 'pending' ? 'border-amber-500/50 text-amber-400 bg-amber-500/10' :
                                                                'border-border/40 text-muted-foreground'
                                                            )}
                                                        >{prog.status ?? 'unknown'}</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs space-y-1">
                                                            <p className="text-muted-foreground">
                                                                {prog.farmers_reached?.toLocaleString() ?? '0'} / {prog.farmers_targeted?.toLocaleString() ?? '0'}
                                                            </p>
                                                            <Progress
                                                                value={prog.farmers_targeted ? ((prog.farmers_reached ?? 0) / prog.farmers_targeted) * 100 : 0}
                                                                className="h-1 w-20"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm font-medium">
                                                        ${((prog.disbursed_usd ?? 0) / 1_000_000).toFixed(1)}M
                                                        <p className="text-xs text-muted-foreground">of ${((prog.committed_usd ?? 0) / 1_000_000).toFixed(1)}M</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs space-y-1">
                                                            <p>{prog.milestones_achieved ?? 0}/{prog.milestone_count ?? 0}</p>
                                                            <Progress
                                                                value={prog.milestone_count ? ((prog.milestones_achieved ?? 0) / prog.milestone_count) * 100 : 0}
                                                                className="h-1 w-16"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-40">
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs"
                                                                    onClick={() => {
                                                                        assessmentForm.setValue('programme_id', prog.id ?? '');
                                                                        setRunDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Play className="w-3 h-3" /> Run Assessment
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs"
                                                                    onClick={() => navigate('/partner/monitoring')}
                                                                >
                                                                    <Eye className="w-3 h-3" /> Monitoring Dashboard
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs"
                                                                    onClick={() => navigate('/partner/kpis')}
                                                                >
                                                                    <Target className="w-3 h-3" /> Programme KPIs
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs"
                                                                    onClick={() => navigate('/partner/beneficiaries')}
                                                                >
                                                                    <Users className="w-3 h-3" /> Beneficiary Tracking
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                        {/* Pagination */}
                        {!loadingMonitoring && monitoringTotalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                                <p className="text-xs text-muted-foreground">
                                    Page {monitoringPage} of {monitoringTotalPages} ({monitoringTotal} records)
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={monitoringPage === 1} onClick={() => setMonitoringPage(p => Math.max(1, p - 1))}>
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={monitoringPage >= monitoringTotalPages} onClick={() => setMonitoringPage(p => Math.min(monitoringTotalPages, p + 1))}>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* ── Baselines Tab ──────────────────────────────────────── */}
                <TabsContent value="baselines" className="space-y-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardContent className="p-4">
                            <div className="flex flex-wrap gap-3 items-center">
                                <div className="relative flex-1 min-w-[200px]">
                                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                                    <Input
                                        className="pl-8 h-8 text-sm"
                                        placeholder="Search by name, crop, or district…"
                                        value={baselineSearch}
                                        onChange={e => setBaselineSearch(e.target.value)}
                                    />
                                </div>
                                <Button variant="ghost" size="sm" onClick={() => loadImpact()} className="h-8 gap-1.5 text-xs">
                                    <RefreshCw className="w-3 h-3" /> Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                                <Database className="w-4 h-4 text-emerald-400" />
                                Control Baseline Datasets
                                <Badge variant="secondary" className="ml-auto text-xs">{impactTotal} total</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {loadingImpact ? (
                                <div className="p-4 space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : filteredBaselines.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
                                    <Database className="w-10 h-10 opacity-30" />
                                    <p className="text-sm">No baseline datasets found</p>
                                    {baselineSearch && (
                                        <Button variant="outline" size="sm" onClick={() => setBaselineSearch('')}>Clear search</Button>
                                    )}
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-border/40 hover:bg-transparent">
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Dataset Name</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Crop</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">District</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Year</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Avg Yield (kg/ha)</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Avg Income (USD)</TableHead>
                                                <TableHead className="text-xs font-semibold text-muted-foreground">Source</TableHead>
                                                <TableHead className="w-10" />
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBaselines.map(baseline => (
                                                <TableRow key={baseline.id} className="border-border/30 hover:bg-muted/20 transition-colors duration-150">
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">{baseline.name ?? '—'}</p>
                                                            {baseline.description && (
                                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{baseline.description}</p>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-400 bg-emerald-500/5">
                                                            <Leaf className="w-2.5 h-2.5 mr-1" />{baseline.crop ?? '—'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">{baseline.district ?? '—'}</TableCell>
                                                    <TableCell className="text-sm font-medium">{baseline.year ?? '—'}</TableCell>
                                                    <TableCell className="text-sm">{baseline.avg_yield_kg_ha?.toLocaleString() ?? '—'}</TableCell>
                                                    <TableCell className="text-sm">${baseline.avg_income_usd?.toLocaleString() ?? '—'}</TableCell>
                                                    <TableCell className="text-xs text-muted-foreground">{baseline.source ?? '—'}</TableCell>
                                                    <TableCell>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                    <MoreVertical className="w-3.5 h-3.5" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-44">
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs"
                                                                    onClick={() => {
                                                                        assessmentForm.setValue('baseline_dataset_id', baseline.id ?? '');
                                                                        setRunDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Play className="w-3 h-3" /> Use as Baseline
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="gap-2 text-xs"
                                                                    onClick={() => navigate('/researcher/data-hub')}
                                                                >
                                                                    <Database className="w-3 h-3" /> Data Hub
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                        {!loadingImpact && impactTotalPages > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/30">
                                <p className="text-xs text-muted-foreground">
                                    Page {impactPage} of {impactTotalPages} ({impactTotal} records)
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={impactPage === 1} onClick={() => setImpactPage(p => Math.max(1, p - 1))}>
                                        <ChevronLeft className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="outline" size="icon" className="h-7 w-7" disabled={impactPage >= impactTotalPages} onClick={() => setImpactPage(p => Math.min(impactTotalPages, p + 1))}>
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                {/* ── Latest Results Tab ─────────────────────────────────── */}
                {impactItem && (
                    <TabsContent value="results" className="space-y-4">
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                            <CardHeader>
                                <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-sky-400" />
                                    Assessment Results
                                    <Badge
                                        variant="outline"
                                        className={cn("ml-auto text-xs capitalize border",
                                            impactItem.status === 'completed' ? 'border-emerald-500/50 text-emerald-400' : 'border-amber-500/50 text-amber-400'
                                        )}
                                    >
                                        {impactItem.status}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {loadingImpactItem ? (
                                    <div className="space-y-3">
                                        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
                                    </div>
                                ) : (
                                    <>
                                        {/* Metrics Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {[
                                                { label: 'Yield Improvement', value: impactItem.yield_improvement_pct != null ? `${impactItem.yield_improvement_pct.toFixed(1)}%` : '—', icon: TrendingUp, colour: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                                { label: 'Income Change', value: impactItem.income_change_usd != null ? `$${impactItem.income_change_usd.toLocaleString()}` : '—', icon: DollarSign, colour: 'text-amber-400', bg: 'bg-amber-500/10' },
                                                { label: 'Adoption Rate', value: impactItem.adoption_rate_pct != null ? `${impactItem.adoption_rate_pct.toFixed(1)}%` : '—', icon: Target, colour: 'text-violet-400', bg: 'bg-violet-500/10' },
                                                { label: 'Resilience Score', value: impactItem.resilience_score != null ? impactItem.resilience_score.toFixed(2) : '—', icon: Shield, colour: 'text-sky-400', bg: 'bg-sky-500/10' },
                                            ].map(metric => (
                                                <div key={metric.label} className={cn("rounded-lg p-4 border border-border/30", metric.bg)}>
                                                    <div className={cn("flex items-center gap-2 mb-1", metric.colour)}>
                                                        <metric.icon className="w-4 h-4" />
                                                        <span className="text-xs font-medium">{metric.label}</span>
                                                    </div>
                                                    <p className="text-2xl font-bold font-heading">{metric.value}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <Separator className="border-border/30" />

                                        {/* Meta Info */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Beneficiaries Assessed</p>
                                                <p className="font-semibold">{impactItem.beneficiaries_assessed?.toLocaleString() ?? '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Methodology</p>
                                                <p className="font-semibold capitalize">{impactItem.methodology?.replace(/_/g, ' ') ?? '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground mb-0.5">Completed At</p>
                                                <p className="font-semibold">{impactItem.completed_at ? new Date(impactItem.completed_at).toLocaleDateString() : '—'}</p>
                                            </div>
                                        </div>

                                        {/* Navigation links */}
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <Button variant="outline" size="sm" onClick={() => navigate('/partner/monitoring')} className="gap-1.5 text-xs">
                                                <Activity className="w-3 h-3" /> Monitoring Dashboard
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => navigate('/partner/kpis')} className="gap-1.5 text-xs">
                                                <Target className="w-3 h-3" /> Programme KPIs
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => navigate('/reports')} className="gap-1.5 text-xs">
                                                <Eye className="w-3 h-3" /> Public Reports
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            {/* Results Sheet — surfaces the queued assessment job */}
            <Sheet open={resultsSheetOpen} onOpenChange={setResultsSheetOpen}>
                <SheetContent className="backdrop-blur-md bg-card/80 border-l border-border/40 w-full sm:max-w-lg overflow-y-auto">
                    <SheetHeader className="pb-4 border-b border-border/30">
                        <SheetTitle className="font-heading text-lg font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-sky-400" />
                            Assessment Job
                        </SheetTitle>
                    </SheetHeader>
                    <div className="py-4 space-y-4">
                        {selectedJobId && (
                            <div className="text-xs text-muted-foreground">
                                Job ID: <span className="font-mono text-foreground">{selectedJobId}</span>
                            </div>
                        )}
                        {loadingImpactItem ? (
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Skeleton key={i} className="h-16 w-full rounded-md" />
                                ))}
                            </div>
                        ) : impactItem ? (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Badge
                                        variant="outline"
                                        className={cn("text-xs capitalize border",
                                            impactItem.status === 'completed' ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' : 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                                        )}
                                    >
                                        {impactItem.status}
                                    </Badge>
                                    <Button variant="outline" size="sm" onClick={() => { setActiveTab('results'); setResultsSheetOpen(false); }} className="gap-1.5 text-xs">
                                        <Eye className="w-3 h-3" /> Open Full View
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-md p-3 border border-border/30 bg-emerald-500/5">
                                        <p className="text-xs text-muted-foreground">Yield Improvement</p>
                                        <p className="text-lg font-bold font-heading text-emerald-400">
                                            {impactItem.yield_improvement_pct != null ? `${impactItem.yield_improvement_pct.toFixed(1)}%` : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-md p-3 border border-border/30 bg-amber-500/5">
                                        <p className="text-xs text-muted-foreground">Income Change</p>
                                        <p className="text-lg font-bold font-heading text-amber-400">
                                            {impactItem.income_change_usd != null ? `$${impactItem.income_change_usd.toLocaleString()}` : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-md p-3 border border-border/30 bg-violet-500/5">
                                        <p className="text-xs text-muted-foreground">Adoption Rate</p>
                                        <p className="text-lg font-bold font-heading text-violet-400">
                                            {impactItem.adoption_rate_pct != null ? `${impactItem.adoption_rate_pct.toFixed(1)}%` : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-md p-3 border border-border/30 bg-sky-500/5">
                                        <p className="text-xs text-muted-foreground">Resilience Score</p>
                                        <p className="text-lg font-bold font-heading text-sky-400">
                                            {impactItem.resilience_score != null ? impactItem.resilience_score.toFixed(2) : '—'}
                                        </p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Beneficiaries Assessed</p>
                                        <p className="font-semibold">{impactItem.beneficiaries_assessed?.toLocaleString() ?? '—'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Methodology</p>
                                        <p className="font-semibold capitalize">{impactItem.methodology?.replace(/_/g, ' ') ?? '—'}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No results yet.</p>
                        )}
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}
