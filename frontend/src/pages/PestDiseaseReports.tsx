import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import {
    pestReportsService,
    type PestReportsGenerateParams,
    type PestReportsListResponse,
    type PestReportsTrendsResponse,
} from '@/lib/api/pestReportsService';
import {
    cropsService,
    type CropsListResponse,
} from '@/lib/api/cropsService';
import {
    districtsService,
    type DistrictsListResponse,
} from '@/lib/api/districtsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
    Bug,
    AlertTriangle,
    AlertCircle,
    ShieldAlert,
    TrendingUp,
    Activity,
    MapPin,
    Leaf,
    RefreshCw,
    Download,
    FileText,
    ChevronLeft,
    ChevronRight,
    MoreVertical,
    Check,
    ChevronDown,
    XCircle,
    Clock,
    BarChart3,
    Eye,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type List = PestReportsListResponse['data'][number];
type Crop = CropsListResponse['data'][number];
type District = DistrictsListResponse['data'][number];
type Trend = PestReportsTrendsResponse['data'][number];

// Alert level config
const ALERT_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode; bgColor: string; borderColor: string }> = {
    watch: {
        label: 'Watch',
        color: 'text-amber-500',
        icon: <Eye className="h-3.5 w-3.5" />,
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/40',
    },
    warning: {
        label: 'Warning',
        color: 'text-orange-500',
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/40',
    },
    emergency: {
        label: 'Emergency',
        color: 'text-red-500',
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/40',
    },
};

function getAlertConfig(level?: string) {
    const key = (level ?? '').toLowerCase();
    return ALERT_CONFIG[key] ?? {
        label: level ?? 'Unknown',
        color: 'text-muted-foreground',
        icon: <Bug className="h-3.5 w-3.5" />,
        bgColor: 'bg-muted/20',
        borderColor: 'border-border/40',
    };
}

// Generate report form schema
const generateReportSchema = z.object({
    crop_ids: z.array(z.string()).min(1, 'Select at least one crop'),
    district_ids: z.array(z.string()).min(1, 'Select at least one district'),
    from_date: z.string().min(1, 'From date is required'),
    to_date: z.string().min(1, 'To date is required'),
    include_famews_format: z.boolean().default(false),
    output_format: z.string().min(1, 'Output format is required'),
});
type GenerateReportInput = z.infer<typeof generateReportSchema>;

export default function PestDiseaseReports() {
    const navigate = useNavigate();


    // List state — GET /pest-reports/list
    const [list, setList] = useState<List[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [listPage, setListPage] = useState(1);
    const [listLimit] = useState(10);
    const [listTotal, setListTotal] = useState(0);
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
    // List state — GET /pest-reports/trends
    const [trends, setTrends] = useState<Trend[]>([]);
    const [loadingTrends, setLoadingTrends] = useState(true);
    const [trendsPage, setTrendsPage] = useState(1);
    const [trendsLimit] = useState(10);
    const [trendsTotal, setTrendsTotal] = useState(0);

    // Local UI state
    const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
    const [filterAlertLevel, setFilterAlertLevel] = useState<string>('all');
    const [filterCropSearch, setFilterCropSearch] = useState('');
    const [filterDistrictSearch, setFilterDistrictSearch] = useState('');
    const [cropPickerOpen, setCropPickerOpen] = useState(false);
    const [districtPickerOpen, setDistrictPickerOpen] = useState(false);

    // Debounce refs for combobox lookup searches
    const cropSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const districtSearchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => { void loadList(); }, [listPage]);
    useEffect(() => { void loadList(); }, [filterAlertLevel]);
    useEffect(() => { void loadCrops(); }, [cropsPage]);
    useEffect(() => { if (cropPickerOpen) void loadCrops(); }, [cropPickerOpen]);
    useEffect(() => { void loadDistricts(); }, [districtsPage]);
    useEffect(() => { if (districtPickerOpen) void loadDistricts(); }, [districtPickerOpen]);
    useEffect(() => { void loadTrends(); }, [trendsPage]);

    async function loadList() {
        try {
            setLoadingList(true);
            const res = await pestReportsService.list({
                page: listPage,
                limit: listLimit,
                alert_level: filterAlertLevel === 'all' ? undefined : filterAlertLevel,
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
    async function loadCrops(searchOverride?: string) {
        try {
            setLoadingCrops(true);
            const res = await cropsService.list({
                page: cropsPage,
                limit: cropsLimit,
                search: (searchOverride !== undefined ? searchOverride : filterCropSearch) || undefined,
            });
            setCrops(Array.isArray(res?.data) ? res.data : []);
            setCropsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load crops');
            console.error('[loadCrops]', err);
        } finally {
            setLoadingCrops(false);
        }
    }
    async function loadDistricts(searchOverride?: string) {
        try {
            setLoadingDistricts(true);
            const res = await districtsService.list({
                page: districtsPage,
                limit: districtsLimit,
                search: (searchOverride !== undefined ? searchOverride : filterDistrictSearch) || undefined,
            });
            setDistricts(Array.isArray(res?.data) ? res.data : []);
            setDistrictsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districts');
            console.error('[loadDistricts]', err);
        } finally {
            setLoadingDistricts(false);
        }
    }
    async function loadTrends() {
        try {
            setLoadingTrends(true);
            const res = await pestReportsService.trends({ page: trendsPage, limit: trendsLimit });
            setTrends(Array.isArray(res?.data) ? res.data : []);
            setTrendsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load trends');
            console.error('[loadTrends]', err);
        } finally {
            setLoadingTrends(false);
        }
    }
    // Debounced crop search handler (300 ms)
    function handleCropSearchChange(value: string) {
        setFilterCropSearch(value);
        if (cropSearchDebounceRef.current) clearTimeout(cropSearchDebounceRef.current);
        cropSearchDebounceRef.current = setTimeout(() => {
            setCropsPage(1);
            void loadCrops(value);
        }, 300);
    }

    // Debounced district search handler (300 ms)
    function handleDistrictSearchChange(value: string) {
        setFilterDistrictSearch(value);
        if (districtSearchDebounceRef.current) clearTimeout(districtSearchDebounceRef.current);
        districtSearchDebounceRef.current = setTimeout(() => {
            setDistrictsPage(1);
            void loadDistricts(value);
        }, 300);
    }

    // POST /pest-reports/generate
    async function handleGenerate(data: PestReportsGenerateParams) {
        try {
            const res = await pestReportsService.generate(data);
            toast.success('Report generated successfully');
            if (res?.data?.download_url) {
                window.open(res.data.download_url, '_blank');
            }
            setGenerateDialogOpen(false);
            generateForm.reset();
        } catch (err) {
            toast.error('Failed to generate report');
            console.error('[handleGenerate]', err);
        }
    }

    // Generate report form
    const generateForm = useForm<GenerateReportInput>({
        resolver: zodResolver(generateReportSchema),
        defaultValues: {
            crop_ids: [],
            district_ids: [],
            from_date: '',
            to_date: '',
            include_famews_format: false,
            output_format: 'pdf',
        },
    });

    // Derived: stat counts
    const emergencyCount = list.filter(r => (r.alert_level ?? '').toLowerCase() === 'emergency').length;
    const warningCount = list.filter(r => (r.alert_level ?? '').toLowerCase() === 'warning').length;
    const watchCount = list.filter(r => (r.alert_level ?? '').toLowerCase() === 'watch').length;
    const coverageGapCount = list.filter(r => r.coverage_gap).length;

    // Derived: filtered list for display (server-side filter is applied via API; this is a defensive client-side filter for display)
    const filteredList = filterAlertLevel === 'all'
        ? list
        : list.filter(r => (r.alert_level ?? '').toLowerCase() === filterAlertLevel.toLowerCase());

    // Navigation helpers
    function gotoPage_5() { navigate('/farmer/alerts'); }
    function gotoPage_6() { navigate('/farmer/pest-disease'); }
    function gotoPage_7() { navigate('/farmer/recommendations'); }
    function gotoPage_8() { navigate('/farmer/my-farm'); }
    function gotoPage_9() { navigate('/farmer/market-prices'); }
    function gotoPage_10() { navigate('/extension/farm-management'); }
    function gotoPage_11() { navigate('/extension/advisory'); }
    function gotoPage_12() { navigate('/extension/farmers'); }
    function gotoPage_13() { navigate('/extension/field-visits'); }
    function gotoPage_14() { navigate('/extension/alerts-reports'); }
    function gotoPage_15() { navigate('/researcher/data-hub'); }
    function gotoPage_16() { navigate('/researcher/ai-models'); }
    function gotoPage_17() { navigate('/researcher/statistical-analysis'); }
    function gotoPage_18() { navigate('/researcher/queries'); }
    function gotoPage_19() { navigate('/researcher/outputs'); }
    function gotoPage_20() { navigate('/researcher/weather-data'); }
    function gotoPage_21() { navigate('/maaif/policy-dashboard'); }
    function gotoPage_22() { navigate('/maaif/statistics'); }
    function gotoPage_23() { navigate('/maaif/reports'); }
    function gotoPage_25() { navigate('/maaif/district-maps'); }
    function gotoPage_26() { navigate('/partner/monitoring'); }
    function gotoPage_27() { navigate('/partner/impact'); }
    function gotoPage_28() { navigate('/partner/kpis'); }
    function gotoPage_29() { navigate('/partner/beneficiaries'); }
    function gotoPage_30() { navigate('/reports'); }
    function gotoPage_31() { navigate('/settings'); }

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Back button */}
            <div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(-1)}
                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                >
                    <ChevronLeft className="h-4 w-4" /> Back
                </Button>
            </div>

            {/* Page heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
                        <Bug className="h-7 w-7 text-primary" />
                        Pest &amp; Disease Reports
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        National pest and disease surveillance intelligence — Department of Crop Protection, MAAIF Uganda
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { void loadList(); void loadTrends(); }}
                        className="border-border/50"
                    >
                        <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
                    </Button>
                    <Button
                        size="sm"
                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                        onClick={() => setGenerateDialogOpen(true)}
                    >
                        <FileText className="h-4 w-4 mr-1.5" /> Generate Report
                    </Button>
                </div>
            </div>

            {/* Summary stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {loadingList ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))
                ) : (
                    <>
                        <Card className="backdrop-blur-md bg-card/60 border border-red-500/40 rounded-lg shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-red-500 mb-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Emergency</span>
                                </div>
                                <p className="text-3xl font-heading font-bold">{emergencyCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active outbreaks</p>
                            </CardContent>
                        </Card>
                        <Card className="backdrop-blur-md bg-card/60 border border-orange-500/40 rounded-lg shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-orange-500 mb-2">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Warning</span>
                                </div>
                                <p className="text-3xl font-heading font-bold">{warningCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active outbreaks</p>
                            </CardContent>
                        </Card>
                        <Card className="backdrop-blur-md bg-card/60 border border-amber-500/40 rounded-lg shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-amber-500 mb-2">
                                    <Eye className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Watch</span>
                                </div>
                                <p className="text-3xl font-heading font-bold">{watchCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Active outbreaks</p>
                            </CardContent>
                        </Card>
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <ShieldAlert className="h-4 w-4" />
                                    <span className="text-xs font-medium uppercase tracking-wide">Coverage Gaps</span>
                                </div>
                                <p className="text-3xl font-heading font-bold">{coverageGapCount}</p>
                                <p className="text-xs text-muted-foreground mt-1">Districts with gaps</p>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Main tabbed content */}
            <Tabs defaultValue="outbreaks" className="space-y-4">
                <TabsList className="bg-card/60 backdrop-blur-md border border-border/40">
                    <TabsTrigger value="outbreaks" className="gap-1.5">
                        <Bug className="h-3.5 w-3.5" /> Active Outbreaks
                    </TabsTrigger>
                    <TabsTrigger value="trends" className="gap-1.5">
                        <TrendingUp className="h-3.5 w-3.5" /> Historical Trends
                    </TabsTrigger>
                </TabsList>

                {/* === OUTBREAKS TAB === */}
                <TabsContent value="outbreaks" className="space-y-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div>
                                    <CardTitle className="text-base font-heading flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" /> Outbreak Surveillance Feed
                                    </CardTitle>
                                    <CardDescription>National pest and disease outbreak summaries by crop and district</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Select value={filterAlertLevel} onValueChange={setFilterAlertLevel}>
                                        <SelectTrigger className="w-[150px] bg-background border-border/50 text-sm">
                                            <SelectValue placeholder="Alert level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All levels</SelectItem>
                                            <SelectItem value="emergency">Emergency</SelectItem>
                                            <SelectItem value="warning">Warning</SelectItem>
                                            <SelectItem value="watch">Watch</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {loadingList ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : filteredList.length === 0 ? (
                                <div className="text-center py-14 text-muted-foreground">
                                    <Bug className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No outbreaks found</p>
                                    <p className="text-sm mt-1">No records match the selected filter criteria.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="overflow-x-auto rounded-lg border border-border/40">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="bg-muted/40">
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Pest / Disease</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Crop</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">District</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Alert Level</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Response</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Coverage Gap</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Outbreak Date</th>
                                                    <th className="text-left py-3 px-4 font-heading font-semibold text-xs uppercase tracking-wide">Season</th>
                                                    <th className="py-3 px-4 w-10" />
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredList.map((item, idx) => {
                                                    const cfg = getAlertConfig(item.alert_level);
                                                    return (
                                                        <tr
                                                            key={item.id ?? idx}
                                                            className="border-t border-border/30 hover:bg-muted/20 transition-colors duration-150"
                                                        >
                                                            <td className="py-3 px-4 font-medium">
                                                                <div className="flex items-center gap-2">
                                                                    <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    {item.pest_name ?? '—'}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <Badge variant="secondary" className="rounded text-xs">
                                                                    <Leaf className="h-3 w-3 mr-1" />
                                                                    {item.crop ?? '—'}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                                                                    <MapPin className="h-3 w-3" />
                                                                    {item.district ?? '—'}
                                                                </div>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border',
                                                                        cfg.bgColor,
                                                                        cfg.borderColor,
                                                                        cfg.color,
                                                                    )}
                                                                >
                                                                    {cfg.icon}
                                                                    {cfg.label}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <span className={cn(
                                                                    'text-xs',
                                                                    item.response_status?.toLowerCase() === 'resolved'
                                                                        ? 'text-emerald-600 dark:text-emerald-400'
                                                                        : item.response_status?.toLowerCase() === 'ongoing'
                                                                            ? 'text-amber-600 dark:text-amber-400'
                                                                            : 'text-muted-foreground'
                                                                )}>
                                                                    {item.response_status ?? '—'}
                                                                </span>
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                {item.coverage_gap ? (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-red-500">
                                                                        <XCircle className="h-3.5 w-3.5" /> Gap
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                                                                        <Check className="h-3.5 w-3.5" /> Covered
                                                                    </span>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-4 text-xs text-muted-foreground">
                                                                {item.outbreak_date
                                                                    ? new Date(item.outbreak_date).toLocaleDateString()
                                                                    : '—'}
                                                            </td>
                                                            <td className="py-3 px-4 text-xs text-muted-foreground">
                                                                {item.season ?? '—'}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="icon" className="h-7 w-7">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        <DropdownMenuItem onClick={() => gotoPage_25()}>
                                                                            <MapPin className="h-3.5 w-3.5 mr-2" /> View on District Map
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => setGenerateDialogOpen(true)}>
                                                                            <FileText className="h-3.5 w-3.5 mr-2" /> Generate Report
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Outbreaks pagination */}
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {filteredList.length} of {listTotal} records
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setListPage(p => Math.max(1, p - 1))}
                                                disabled={listPage <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" /> Prev
                                            </Button>
                                            <span className="text-sm px-2">Page {listPage}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setListPage(p => p + 1)}
                                                disabled={list.length < listLimit}
                                            >
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* === TRENDS TAB === */}
                <TabsContent value="trends" className="space-y-4">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-heading flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-primary" /> Historical Outbreak Trends
                            </CardTitle>
                            <CardDescription>Season-by-season outbreak counts and response effectiveness metrics</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingTrends ? (
                                <div className="space-y-3">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Skeleton key={i} className="h-14 w-full rounded-lg" />
                                    ))}
                                </div>
                            ) : trends.length === 0 ? (
                                <div className="text-center py-14 text-muted-foreground">
                                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No trend data available</p>
                                    <p className="text-sm mt-1">Historical outbreak data will appear here once collected.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        {trends.map((trend, idx) => {
                                            const responseRate = trend.response_rate ?? 0;
                                            return (
                                                <div
                                                    key={`${trend.season}-${trend.crop}-${trend.pest_name}-${idx}`}
                                                    className="p-4 rounded-lg border border-border/40 bg-background/50 backdrop-blur-sm hover:bg-muted/10 transition-colors duration-200"
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                                        <div className="flex items-start gap-3">
                                                            <div className="flex-shrink-0 mt-0.5">
                                                                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
                                                                    <Bug className="h-4 w-4 text-primary" />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <h3 className="font-medium text-sm">{trend.pest_name ?? 'Unknown Pest'}</h3>
                                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                    <Badge variant="secondary" className="rounded text-xs">
                                                                        <Leaf className="h-3 w-3 mr-1" />{trend.crop ?? '—'}
                                                                    </Badge>
                                                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" />{trend.season ?? '—'}
                                                                    </span>
                                                                    {trend.districts_affected != null && (
                                                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" />{trend.districts_affected} districts
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-6 text-sm">
                                                            <div className="text-center">
                                                                <p className="text-xl font-heading font-bold">{trend.outbreak_count ?? 0}</p>
                                                                <p className="text-xs text-muted-foreground">Outbreaks</p>
                                                            </div>
                                                            <div className="text-center">
                                                                <p className="text-xl font-heading font-bold">{trend.avg_response_days ?? '—'}</p>
                                                                <p className="text-xs text-muted-foreground">Avg. Days</p>
                                                            </div>
                                                            <div className="min-w-[120px]">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-xs text-muted-foreground">Response Rate</span>
                                                                    <span className="text-xs font-medium">{responseRate}%</span>
                                                                </div>
                                                                <Progress
                                                                    value={responseRate}
                                                                    className={cn(
                                                                        'h-1.5',
                                                                        responseRate >= 80 ? '[&>div]:bg-emerald-500' :
                                                                        responseRate >= 50 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                                                                    )}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Trends pagination */}
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing {trends.length} of {trendsTotal} trend records
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setTrendsPage(p => Math.max(1, p - 1))}
                                                disabled={trendsPage <= 1}
                                            >
                                                <ChevronLeft className="h-4 w-4" /> Prev
                                            </Button>
                                            <span className="text-sm px-2">Page {trendsPage}</span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setTrendsPage(p => p + 1)}
                                                disabled={trends.length < trendsLimit}
                                            >
                                                Next <ChevronRight className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Generate Report Dialog */}
            <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
                <DialogContent className="max-w-xl backdrop-blur-md bg-card/90 border border-border/40 shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Generate Pest &amp; Disease Situation Report
                        </DialogTitle>
                        <DialogDescription>
                            Create a formal report for policy decisions. Optionally export in FAO FAMEWS format for Fall Armyworm reporting integration.
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...generateForm}>
                        <form
                            onSubmit={generateForm.handleSubmit(data => handleGenerate(data as PestReportsGenerateParams))}
                            className="space-y-4 mt-2"
                        >
                            {/* Crop IDs — multi-select searchable */}
                            <FormField
                                control={generateForm.control}
                                name="crop_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Crops</FormLabel>
                                        <FormControl>
                                            <Popover open={cropPickerOpen} onOpenChange={setCropPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between font-normal border-border/50"
                                                    >
                                                        {field.value.length > 0
                                                            ? `${field.value.length} crop(s) selected`
                                                            : 'Select crops…'}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search crops…"
                                                            value={filterCropSearch}
                                                            onValueChange={handleCropSearchChange}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingCrops ? 'Loading…' : 'No crops found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {crops
                                                                    .filter(c => !filterCropSearch || (c.name ?? '').toLowerCase().includes(filterCropSearch.toLowerCase()))
                                                                    .map(crop => (
                                                                        <CommandItem
                                                                            key={crop.id}
                                                                            value={crop.id ?? ''}
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

                            {/* District IDs — multi-select searchable */}
                            <FormField
                                control={generateForm.control}
                                name="district_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Districts</FormLabel>
                                        <FormControl>
                                            <Popover open={districtPickerOpen} onOpenChange={setDistrictPickerOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-between font-normal border-border/50"
                                                    >
                                                        {field.value.length > 0
                                                            ? `${field.value.length} district(s) selected`
                                                            : 'Select districts…'}
                                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-full p-0" align="start">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search districts…"
                                                            value={filterDistrictSearch}
                                                            onValueChange={handleDistrictSearchChange}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {districts
                                                                    .filter(d => !filterDistrictSearch || (d.name ?? '').toLowerCase().includes(filterDistrictSearch.toLowerCase()))
                                                                    .map(district => (
                                                                        <CommandItem
                                                                            key={district.id}
                                                                            value={district.id ?? ''}
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

                            {/* Date range */}
                            <div className="grid grid-cols-2 gap-3">
                                <FormField
                                    control={generateForm.control}
                                    name="from_date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>From Date</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} className="border-border/50" />
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
                                                <Input type="date" {...field} className="border-border/50" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Output format */}
                            <FormField
                                control={generateForm.control}
                                name="output_format"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Output Format</FormLabel>
                                        <FormControl>
                                            <Select value={field.value} onValueChange={field.onChange}>
                                                <SelectTrigger className="border-border/50">
                                                    <SelectValue placeholder="Select format" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pdf">PDF</SelectItem>
                                                    <SelectItem value="excel">Excel</SelectItem>
                                                    <SelectItem value="csv">CSV</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* FAMEWS toggle */}
                            <FormField
                                control={generateForm.control}
                                name="include_famews_format"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 p-3">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                id="famews-checkbox"
                                            />
                                        </FormControl>
                                        <div className="leading-tight">
                                            <FormLabel htmlFor="famews-checkbox" className="font-medium cursor-pointer">
                                                Include FAO FAMEWS Format
                                            </FormLabel>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Export Fall Armyworm data compatible with FAO FAMEWS reporting integration
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            <Separator className="opacity-40" />

                            <div className="flex justify-end gap-2 pt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => { setGenerateDialogOpen(false); generateForm.reset(); }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={generateForm.formState.isSubmitting}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.4)] hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                                >
                                    {generateForm.formState.isSubmitting ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> Generating…
                                        </>
                                    ) : (
                                        <>
                                            <Download className="h-4 w-4 mr-1.5" /> Generate &amp; Download
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
