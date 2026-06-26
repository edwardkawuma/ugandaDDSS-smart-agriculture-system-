import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    alertsService,
    type AlertsListParams,
    type AlertsListResponse,
} from '@/lib/api/alertsService';
import {
    advisoriesService,
    type AdvisoriesCoverageParams,
    type AdvisoriesCoverageResponse,
} from '@/lib/api/advisoriesService';
import {
    reportsService,
    type ReportsAlertsHistoryParams,
    type ReportsAlertsHistoryResponse,
} from '@/lib/api/reportsService';
import {
    districtsService,
    type DistrictsListResponse,
} from '@/lib/api/districtsService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import {
    AlertTriangle,
    Bell,
    Bug,
    CloudRain,
    ShieldCheck,
    ShieldAlert,
    CheckCircle2,
    PlusCircle,
    ChevronLeft,
    ChevronRight,
    BarChart3,
    FileText,
    Sprout,
    Download,
    Loader2,
    Check,
    ChevronsUpDown,
} from 'lucide-react';

type Alert = AlertsListResponse['data'][number];
type Advisory = AdvisoriesCoverageResponse['data'][number];
type DistrictOption = DistrictsListResponse['data'][number];

export default function AlertsReports() {
    const navigate = useNavigate();

    // List state — GET /alerts/list
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [alertsPage, setAlertsPage] = useState(1);
    const [alertsLimit] = useState(10);
    const [alertsTotal, setAlertsTotal] = useState(0);
    // List state — GET /advisories/coverage
    const [advisories, setAdvisories] = useState<Advisory[]>([]);
    const [loadingAdvisories, setLoadingAdvisories] = useState(true);
    const [advisoriesPage, setAdvisoriesPage] = useState(1);
    const [advisoriesLimit] = useState(10);
    const [advisoriesTotal, setAdvisoriesTotal] = useState(0);
    // Detail state — GET /reports/alerts-history
    const [reportsItem, setReportsItem] = useState<ReportsAlertsHistoryResponse['data'] | null>(null);
    const [loadingReportsItem, setLoadingReportsItem] = useState(false);

    const [alertLevelFilter, setAlertLevelFilter] = useState<string>('all');
    const [districtFilter, setDistrictFilter] = useState<string>('');
    const [seasonFilter, setSeasonFilter] = useState<string>('current');

    // District lookup state (searchable Combobox)
    const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
    const [districtOpen, setDistrictOpen] = useState(false);
    const [districtSearch, setDistrictSearch] = useState('');

    // Export dialog state
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [exportFromDate, setExportFromDate] = useState('');
    const [exportToDate, setExportToDate] = useState('');
    const [exportFormat, setExportFormat] = useState('csv');
    const [exporting, setExporting] = useState(false);

    useEffect(() => { void loadAlerts(); }, [alertsPage, alertLevelFilter, districtFilter]);
    useEffect(() => { void loadAdvisories(); }, [advisoriesPage, districtFilter, seasonFilter]);
    useEffect(() => { void loadReportsItem(); }, [districtFilter, seasonFilter]);

    // Debounced district lookup
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                const res = await districtsService.list({ page: 1, limit: 50, search: districtSearch || undefined });
                setDistrictOptions(Array.isArray(res?.data) ? res.data : []);
            } catch {
                // silently fail — district options stay as previously loaded
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [districtSearch]);

    async function loadAlerts() {
        try {
            setLoadingAlerts(true);
            const params: AlertsListParams = { page: alertsPage, limit: alertsLimit };
            if (alertLevelFilter !== 'all') params.alert_level = alertLevelFilter;
            if (districtFilter) params.district = districtFilter;
            const res = await alertsService.list(params);
            setAlerts(Array.isArray(res?.data) ? res.data : []);
            setAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load alerts');
            console.error('[loadAlerts]', err);
        } finally {
            setLoadingAlerts(false);
        }
    }

    async function loadAdvisories() {
        try {
            setLoadingAdvisories(true);
            const params: AdvisoriesCoverageParams = { page: advisoriesPage, limit: advisoriesLimit };
            if (districtFilter) params.district = districtFilter;
            if (seasonFilter) params.season = seasonFilter;
            const res = await advisoriesService.coverage(params);
            setAdvisories(Array.isArray(res?.data) ? res.data : []);
            setAdvisoriesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load advisories');
            console.error('[loadAdvisories]', err);
        } finally {
            setLoadingAdvisories(false);
        }
    }

    async function loadReportsItem() {
        try {
            setLoadingReportsItem(true);
            const params: ReportsAlertsHistoryParams = {};
            if (districtFilter) params.district = districtFilter;
            if (seasonFilter) params.season = seasonFilter;
            const res = await reportsService.alertsHistory(params);
            setReportsItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load alerts report');
            console.error('[loadReportsItem]', err);
        } finally {
            setLoadingReportsItem(false);
        }
    }

    // Navigate to Advisory Creation pre-filled with the alert_id of the alert
    // lacking an advisory response (page.json: button_click -> /extension/advisory)
    function gotoPage_11(alertId?: string) {
        const qs = alertId ? `?linked_alert_id=${encodeURIComponent(alertId)}` : '';
        navigate(`/extension/advisory${qs}`);
    }

    // Trigger a client-side report export (CSV download) from the consolidated
    // alert + advisory + coverage data — used for NAADS / MAAIF submissions.
    async function handleExport() {
        try {
            setExporting(true);
            const rows: string[] = [];
            rows.push([
                'district',
                'season',
                'total_alerts',
                'alerts_with_advisory',
                'advisory_coverage_rate',
                'farmer_compliance_rate',
            ].join(','));
            rows.push([
                reportsItem?.district ?? districtFilter ?? '',
                reportsItem?.season ?? seasonFilter ?? '',
                String(reportsItem?.total_alerts ?? 0),
                String(reportsItem?.alerts_with_advisory ?? 0),
                String(reportsItem?.advisory_coverage_rate ?? 0),
                String(reportsItem?.farmer_compliance_rate ?? 0),
            ].join(','));

            rows.push('');
            rows.push('alert_id,alert_title,alert_level,crop,has_advisory,advisory_id,advisory_status,issued_at');
            for (const adv of advisories) {
                rows.push([
                    adv.alert_id ?? '',
                    csvEscape(adv.alert_title ?? ''),
                    adv.alert_level ?? '',
                    adv.crop ?? '',
                    adv.has_advisory ? 'true' : 'false',
                    adv.advisory_id ?? '',
                    adv.advisory_status ?? '',
                    adv.issued_at ?? '',
                ].join(','));
            }

            rows.push('');
            rows.push('alert_id,alert_title,alert_level,type,district,issued_at,affected_crops');
            for (const a of alerts) {
                rows.push([
                    a.id ?? '',
                    csvEscape(a.title ?? ''),
                    a.alert_level ?? '',
                    a.type ?? '',
                    a.district ?? '',
                    a.issued_at ?? '',
                    (a.affected_crops ?? []).join('|'),
                ].join(','));
            }

            const blob = new Blob([rows.join('\n')], { type: exportFormat === 'csv' ? 'text/csv' : 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const ext = exportFormat === 'csv' ? 'csv' : 'txt';
            a.download = `alerts-report-${new Date().toISOString().slice(0, 10)}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success('Report exported');
            setExportDialogOpen(false);
        } catch (err) {
            toast.error('Failed to export report');
            console.error('[handleExport]', err);
        } finally {
            setExporting(false);
        }
    }

    function csvEscape(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    // Derived: map advisory coverage by alert_id for quick lookup
    const advisoryByAlertId = useMemo(() => {
        const map = new Map<string, Advisory>();
        for (const a of advisories) {
            if (a.alert_id) map.set(a.alert_id, a);
        }
        return map;
    }, [advisories]);

    // Derived: alert type icon helper
    function alertTypeIcon(type: string) {
        const t = (type ?? '').toLowerCase();
        if (t.includes('pest') || t.includes('disease')) return <Bug className="h-4 w-4" />;
        if (t.includes('weather') || t.includes('rain') || t.includes('flood')) return <CloudRain className="h-4 w-4" />;
        return <AlertTriangle className="h-4 w-4" />;
    }

    // Derived: severity border color
    function severityBorder(level: string): string {
        const l = (level ?? '').toLowerCase();
        if (l === 'critical' || l === 'severe') return 'border-l-destructive';
        if (l === 'warning' || l === 'high') return 'border-l-amber-500';
        if (l === 'moderate' || l === 'medium') return 'border-l-yellow-500';
        return 'border-l-blue-400';
    }

    // Derived: severity badge variant
    function severityBadgeVariant(level: string): 'destructive' | 'secondary' | 'outline' {
        const l = (level ?? '').toLowerCase();
        if (l === 'critical' || l === 'severe') return 'destructive';
        if (l === 'warning' || l === 'high') return 'secondary';
        return 'outline';
    }

    // Derived: summary stats from reports
    const totalAlerts = reportsItem?.total_alerts ?? alertsTotal;
    const advisoryCoverageRate = reportsItem?.advisory_coverage_rate ?? 0;
    const farmerComplianceRate = reportsItem?.farmer_compliance_rate ?? 0;
    const alertBreakdown = reportsItem?.alert_breakdown ?? [];

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Page heading */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
                        <Bell className="h-7 w-7 text-primary" />
                        Alerts &amp; Reports
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Monitor active pest, disease, and weather alerts in your district. Track advisory coverage and farmer compliance rates.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setExportDialogOpen(true)}
                    >
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            {/* Filters row */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-lg">
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Label className="text-xs text-muted-foreground whitespace-nowrap">District</Label>
                        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={districtOpen}
                                    className="w-48 justify-between bg-background border-border font-normal text-sm"
                                >
                                    {districtFilter
                                        ? (districtOptions.find((d) => (d.name ?? d.id) === districtFilter)?.name ?? districtFilter)
                                        : 'All districts'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput
                                        placeholder="Search districts…"
                                        value={districtSearch}
                                        onValueChange={setDistrictSearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>No district found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value="__all__"
                                                onSelect={() => {
                                                    setDistrictFilter('');
                                                    setDistrictOpen(false);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', districtFilter === '' ? 'opacity-100' : 'opacity-0')} />
                                                <span>All districts</span>
                                            </CommandItem>
                                            {districtOptions.map((d) => {
                                                const val = d.name ?? d.id ?? '';
                                                return (
                                                    <CommandItem
                                                        key={d.id ?? val}
                                                        value={`${d.name ?? ''} ${d.id ?? ''}`}
                                                        onSelect={() => {
                                                            setDistrictFilter(val);
                                                            setDistrictOpen(false);
                                                        }}
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', districtFilter === val ? 'opacity-100' : 'opacity-0')} />
                                                        <span>{d.name ?? d.id}</span>
                                                        {d.region && (
                                                            <span className="ml-auto text-xs text-muted-foreground">{d.region}</span>
                                                        )}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="filter_season" className="text-xs text-muted-foreground whitespace-nowrap">Season</Label>
                        <Select value={seasonFilter} onValueChange={setSeasonFilter}>
                            <SelectTrigger id="filter_season" className="w-40 bg-background border-border">
                                <SelectValue placeholder="Season" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="current">Current</SelectItem>
                                <SelectItem value="2025A">2025 Season A</SelectItem>
                                <SelectItem value="2024B">2024 Season B</SelectItem>
                                <SelectItem value="2024A">2024 Season A</SelectItem>
                                <SelectItem value="2023B">2023 Season B</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Select value={alertLevelFilter} onValueChange={setAlertLevelFilter}>
                        <SelectTrigger className="w-[160px] bg-background border-border text-sm">
                            <SelectValue placeholder="Alert level" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All levels</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="info">Info</SelectItem>
                        </SelectContent>
                    </Select>
                    <Badge variant="secondary" className="ml-auto font-medium">
                        {alertsTotal} alerts · {advisoriesTotal} covered
                    </Badge>
                </CardContent>
            </Card>

            {/* Summary stats cards */}
            {loadingReportsItem ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-32 w-full rounded-xl" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" /> Total Alerts
                            </CardDescription>
                            <CardTitle className="text-3xl font-heading">{totalAlerts}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs text-muted-foreground">
                                {reportsItem?.alerts_with_advisory ?? 0} with advisory response
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" /> Advisory Coverage
                            </CardDescription>
                            <CardTitle className="text-3xl font-heading">{advisoryCoverageRate}%</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Progress value={advisoryCoverageRate} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Alerts addressed with advisories</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-primary" /> Farmer Compliance
                            </CardDescription>
                            <CardTitle className="text-3xl font-heading">{farmerComplianceRate}%</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Progress value={farmerComplianceRate} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">Farmers following advisories</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Alert Breakdown by type and crop */}
            {!loadingReportsItem && alertBreakdown.length > 0 && (
                <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl">
                    <CardHeader>
                        <CardTitle className="text-base font-heading flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" /> Alert Breakdown
                        </CardTitle>
                        <CardDescription>Distribution of alerts by type and affected crop this season</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {alertBreakdown.map((item, idx) => (
                                <div
                                    key={`${item.alert_type}-${item.crop}-${idx}`}
                                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border/30"
                                >
                                    <span className="text-xs text-muted-foreground capitalize">{item.alert_type}</span>
                                    <Badge variant="secondary" className="rounded text-xs">
                                        <Sprout className="h-3 w-3 mr-1" /> {item.crop}
                                    </Badge>
                                    <span className="text-lg font-bold font-heading">{item.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alert Feed with Advisory Coverage */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <CardTitle className="text-base font-heading flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" /> Active Alert Feed
                            </CardTitle>
                            <CardDescription>Alerts for your district with advisory response status</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingAlerts ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-lg" />
                            ))}
                        </div>
                    ) : alerts.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No active alerts in your district.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.map((alert, idx) => {
                                const advisory = advisoryByAlertId.get(alert.id ?? '');
                                const hasAdvisory = !!advisory;
                                return (
                                    <div
                                        key={alert.id ?? idx}
                                        className={`relative flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm border-l-4 ${severityBorder(alert.alert_level)} hover:bg-muted/20 transition-colors duration-150`}
                                    >
                                        {/* Alert icon */}
                                        <div className="flex-shrink-0">
                                            {alertTypeIcon(alert.type)}
                                        </div>

                                        {/* Alert content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="font-medium text-sm">{alert.title ?? 'Untitled Alert'}</h3>
                                                <Badge variant={severityBadgeVariant(alert.alert_level)} className="rounded text-xs">
                                                    {alert.alert_level ?? 'unknown'}
                                                </Badge>
                                                <Badge variant="outline" className="rounded text-xs capitalize">
                                                    {alert.type ?? 'general'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {alert.description ?? 'No description available.'}
                                            </p>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                {(alert.affected_crops ?? []).length > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <Sprout className="h-3 w-3 text-muted-foreground" />
                                                        {(alert.affected_crops ?? []).map((c) => (
                                                            <Badge key={c} variant="secondary" className="rounded text-xs">
                                                                {c}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                )}
                                                {alert.district && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {alert.district}
                                                    </span>
                                                )}
                                                {alert.issued_at && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Issued {new Date(alert.issued_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {alert.expires_at && (
                                                    <span className="text-xs text-muted-foreground">
                                                        Expires {new Date(alert.expires_at).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Advisory status + action */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            {hasAdvisory ? (
                                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                                    <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                                                        Advisory issued
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                                                        <ShieldAlert className="h-4 w-4 text-amber-500" />
                                                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                                                            No advisory
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="h-8 text-xs"
                                                        onClick={() => gotoPage_11(alert.id)}
                                                    >
                                                        <PlusCircle className="h-3.5 w-3.5 mr-1" />
                                                        Create Advisory
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Alerts pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {alerts.length} of {alertsTotal} alerts
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAlertsPage((p) => Math.max(1, p - 1))}
                                disabled={alertsPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                            <span className="text-sm">Page {alertsPage}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setAlertsPage((p) => p + 1)}
                                disabled={alerts.length < alertsLimit}
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Advisory Coverage Table */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded-xl">
                <CardHeader>
                    <CardTitle className="text-base font-heading flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" /> Advisory Coverage Status
                    </CardTitle>
                    <CardDescription>Track which alerts have been addressed with advisories</CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingAdvisories ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-14 w-full rounded" />
                            ))}
                        </div>
                    ) : advisories.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No advisory coverage data available.</p>
                        </div>
                    ) : (
                        <>
                            <div className="rounded border border-border/50 overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-muted/40 backdrop-blur-sm">
                                            <th className="text-left py-3 px-4 font-heading font-medium">Alert</th>
                                            <th className="text-left py-3 px-4 font-heading font-medium">Level</th>
                                            <th className="text-left py-3 px-4 font-heading font-medium">Crop</th>
                                            <th className="text-left py-3 px-4 font-heading font-medium">Status</th>
                                            <th className="text-left py-3 px-4 font-heading font-medium">Advisory</th>
                                            <th className="text-left py-3 px-4 font-heading font-medium">Issued</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {advisories.map((adv, idx) => (
                                            <tr
                                                key={adv.alert_id ?? idx}
                                                className="border-t border-border/30 hover:bg-muted/20 transition-colors"
                                            >
                                                <td className="py-3 px-4 font-medium">{adv.alert_title ?? '—'}</td>
                                                <td className="py-3 px-4">
                                                    <Badge variant={severityBadgeVariant(adv.alert_level)} className="rounded text-xs">
                                                        {adv.alert_level ?? '—'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="secondary" className="rounded text-xs">
                                                        {adv.crop ?? '—'}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    {adv.has_advisory ? (
                                                        <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 className="h-3.5 w-3.5" /> Addressed
                                                        </span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                                                            <ShieldAlert className="h-3.5 w-3.5" /> Pending
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground text-xs">
                                                    {adv.advisory_title ?? '—'}
                                                </td>
                                                <td className="py-3 px-4 text-muted-foreground text-xs">
                                                    {adv.issued_at ? new Date(adv.issued_at).toLocaleDateString() : '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Advisories pagination */}
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing {advisories.length} of {advisoriesTotal} entries
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAdvisoriesPage((p) => Math.max(1, p - 1))}
                                        disabled={advisoriesPage <= 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" /> Previous
                                    </Button>
                                    <span className="text-sm">Page {advisoriesPage}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setAdvisoriesPage((p) => p + 1)}
                                        disabled={advisories.length < advisoriesLimit}
                                    >
                                        Next <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Export Dialog (NAADS / MAAIF submission) */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Export Alerts Report</DialogTitle>
                        <DialogDescription>
                            Generate a consolidated alerts, advisory coverage, and compliance report for NAADS or MAAIF submission.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="export_from" className="text-sm font-medium">From Date</Label>
                                <Input
                                    id="export_from"
                                    type="date"
                                    value={exportFromDate}
                                    onChange={(e) => setExportFromDate(e.target.value)}
                                    className="mt-2 bg-background border-border"
                                />
                            </div>
                            <div>
                                <Label htmlFor="export_to" className="text-sm font-medium">To Date</Label>
                                <Input
                                    id="export_to"
                                    type="date"
                                    value={exportToDate}
                                    onChange={(e) => setExportToDate(e.target.value)}
                                    className="mt-2 bg-background border-border"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Format</Label>
                            <Select value={exportFormat} onValueChange={setExportFormat}>
                                <SelectTrigger className="mt-2 bg-background border-border">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="txt">Plain Text</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            District: <span className="font-medium">{districtFilter || 'all assigned districts'}</span> · Season: <span className="font-medium">{seasonFilter}</span>
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleExport()}
                            disabled={exporting}
                        >
                            {exporting ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Generate Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}