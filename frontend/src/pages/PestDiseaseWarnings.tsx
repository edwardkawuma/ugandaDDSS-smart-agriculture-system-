import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    Activity,
    Bug,
    CalendarClock,
    CheckCircle2,
    Eye,
    MapPin,
    MoreVertical,
    Search,
    Share2,
    ShieldCheck,
    Sprout,
    Thermometer,
    XCircle,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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
} from '@/components/ui/alert-dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    pestAlertsService,
    type PestAlertsListParams,
    type PestAlertsListResponse,
} from '@/lib/api/pestAlertsService';
import {
    treatmentsService,
    type TreatmentsListParams,
    type TreatmentsListResponse,
} from '@/lib/api/treatmentsService';

type PestAlert = PestAlertsListResponse['data'][number];
type Treatment = TreatmentsListResponse['data'][number];

export default function PestDiseaseWarnings() {
    const navigate = useNavigate();

    // List state — GET /pest-alerts/list
    const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
    const [loadingPestAlerts, setLoadingPestAlerts] = useState(true);
    const [pestAlertsPage, setPestAlertsPage] = useState(1);
    const [pestAlertsLimit] = useState(10);
    const [pestAlertsTotal, setPestAlertsTotal] = useState(0);
    // List state — GET /treatments/list
    const [treatments, setTreatments] = useState<Treatment[]>([]);
    const [loadingTreatments, setLoadingTreatments] = useState(true);
    const [treatmentsPage, setTreatmentsPage] = useState(1);
    const [treatmentsLimit] = useState(10);
    const [treatmentsTotal, setTreatmentsTotal] = useState(0);

    useEffect(() => { void loadPestAlerts(); }, [pestAlertsPage]);
    useEffect(() => { void loadTreatments(); }, [treatmentsPage]);

    async function loadPestAlerts() {
        try {
            setLoadingPestAlerts(true);
            const res = await pestAlertsService.list({ page: pestAlertsPage, limit: pestAlertsLimit });
            setPestAlerts(Array.isArray(res?.data) ? res.data : []);
            setPestAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load pestAlerts');
            console.error('[loadPestAlerts]', err);
        } finally {
            setLoadingPestAlerts(false);
        }
    }
    async function loadTreatments() {
        try {
            setLoadingTreatments(true);
            const res = await treatmentsService.list({ page: treatmentsPage, limit: treatmentsLimit });
            setTreatments(Array.isArray(res?.data) ? res.data : []);
            setTreatmentsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load treatments');
            console.error('[loadTreatments]', err);
        } finally {
            setLoadingTreatments(false);
        }
    }

    function gotoPage_7() {
        navigate('/farmer/recommendations');
    }

    // Local UI state
    const [searchText, setSearchText] = useState('');
    const [cropFilter, setCropFilter] = useState('all');
    const [levelFilter, setLevelFilter] = useState('all');
    const [sortBy, setSortBy] = useState('severity');
    const [detailAlert, setDetailAlert] = useState<PestAlert | null>(null);
    const [dismissAlert, setDismissAlert] = useState<PestAlert | null>(null);

    const levelRank: Record<string, number> = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
    };

    function levelConfig(level: string | undefined) {
        const l = (level ?? '').toLowerCase();
        if (l === 'critical') {
            return {
                label: 'Critical',
                badge: 'bg-red-500/15 text-red-700 border-red-500/30',
                bg: 'bg-red-500/15',
                text: 'text-red-600',
                border: 'border-red-500/40',
                icon: AlertTriangle,
            };
        }
        if (l === 'high') {
            return {
                label: 'High',
                badge: 'bg-orange-500/15 text-orange-700 border-orange-500/30',
                bg: 'bg-orange-500/15',
                text: 'text-orange-600',
                border: 'border-orange-500/40',
                icon: AlertTriangle,
            };
        }
        if (l === 'medium') {
            return {
                label: 'Medium',
                badge: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
                bg: 'bg-amber-500/15',
                text: 'text-amber-600',
                border: 'border-amber-500/40',
                icon: Activity,
            };
        }
        return {
            label: 'Low',
            badge: 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30',
            bg: 'bg-emerald-500/15',
            text: 'text-emerald-600',
            border: 'border-emerald-500/40',
            icon: ShieldCheck,
        };
    }

    const filteredAlerts = useMemo(() => {
        let list = [...pestAlerts];
        if (cropFilter !== 'all') {
            list = list.filter((a) => (a.crop ?? '').toLowerCase() === cropFilter.toLowerCase());
        }
        if (levelFilter !== 'all') {
            list = list.filter((a) => (a.alert_level ?? '').toLowerCase() === levelFilter.toLowerCase());
        }
        if (searchText.trim()) {
            const q = searchText.toLowerCase();
            list = list.filter(
                (a) =>
                    (a.pest_name ?? '').toLowerCase().includes(q) ||
                    (a.crop ?? '').toLowerCase().includes(q) ||
                    (a.description ?? '').toLowerCase().includes(q),
            );
        }
        if (sortBy === 'severity') {
            list.sort((a, b) => (levelRank[b.alert_level ?? ''] ?? 0) - (levelRank[a.alert_level ?? ''] ?? 0));
        } else if (sortBy === 'recent') {
            list.sort(
                (a, b) =>
                    new Date(b.issued_at ?? 0).getTime() - new Date(a.issued_at ?? 0).getTime(),
            );
        } else if (sortBy === 'forecast') {
            list.sort(
                (a, b) => (b.forecast_days_ahead ?? 0) - (a.forecast_days_ahead ?? 0),
            );
        }
        return list;
    }, [pestAlerts, cropFilter, levelFilter, searchText, sortBy]);

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-lg shadow-md border border-border/40 bg-card/60 backdrop-blur-md">
                <div className="relative h-48 md:h-56 w-full">
                    <img
                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80"
                        alt="Crop field under pest monitoring"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/70 to-background/30" />
                </div>
                <div className="absolute inset-0 flex flex-col justify-center p-6 md:p-10">
                    <div className="flex items-center gap-2 mb-2">
                        <Bug className="h-5 w-5 text-primary" />
                        <span className="text-xs uppercase tracking-wider text-primary font-medium">
                            Climate-Smart Pest Intelligence
                        </span>
                    </div>
                    <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground">
                        Pest & Disease Warnings
                    </h1>
                    <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
                        Active and forecasted outbreaks correlated against weather thresholds,
                        historical outbreak records and the current seasonal position. Tailored to your
                        registered crops and district.
                    </p>
                </div>
            </div>

            {/* KPI summary strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-red-500/15 text-red-600 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Critical Alerts</p>
                            <p className="text-2xl font-heading font-semibold">
                                {pestAlerts.filter((a) => a.alert_level === 'critical' || a.alert_level === 'high').length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-amber-500/15 text-amber-600 flex items-center justify-center">
                            <Activity className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Active Threats</p>
                            <p className="text-2xl font-heading font-semibold">{pestAlerts.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-emerald-500/15 text-emerald-600 flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">MAAIF-Approved Treatments</p>
                            <p className="text-2xl font-heading font-semibold">
                                {treatments.filter((t) => t.maaif_approved).length}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-sky-500/15 text-sky-600 flex items-center justify-center">
                            <CalendarClock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Forecast Window</p>
                            <p className="text-2xl font-heading font-semibold">7 Days</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row gap-3 lg:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search pest, disease, or crop..."
                                className="pl-9"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                            />
                        </div>
                        <Select value={cropFilter} onValueChange={setCropFilter}>
                            <SelectTrigger className="lg:w-48">
                                <SelectValue placeholder="Crop" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Crops</SelectItem>
                                <SelectItem value="Coffee">Coffee</SelectItem>
                                <SelectItem value="Maize">Maize</SelectItem>
                                <SelectItem value="Beans">Beans</SelectItem>
                                <SelectItem value="Hass Avocado">Hass Avocado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={levelFilter} onValueChange={setLevelFilter}>
                            <SelectTrigger className="lg:w-48">
                                <SelectValue placeholder="Alert Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="lg:w-48">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="severity">Severity (high to low)</SelectItem>
                                <SelectItem value="recent">Most Recent</SelectItem>
                                <SelectItem value="forecast">Forecast Lead Time</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Active Alerts Grid */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="font-heading text-xl font-semibold">Active Threats</h2>
                    <Badge variant="outline" className="font-medium">
                        {filteredAlerts.length} alert{filteredAlerts.length === 1 ? '' : 's'}
                    </Badge>
                </div>

                {loadingPestAlerts ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                                <CardContent className="p-5 space-y-3">
                                    <Skeleton className="h-5 w-2/3" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                    <Skeleton className="h-9 w-1/3" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : filteredAlerts.length === 0 ? (
                    <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                        <CardContent className="p-10 text-center">
                            <ShieldCheck className="h-10 w-10 mx-auto text-emerald-500 mb-2" />
                            <p className="font-heading text-lg">No active threats detected</p>
                            <p className="text-sm text-muted-foreground">
                                Your registered crops are currently within safe thresholds. Stay vigilant
                                and check back weekly.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filteredAlerts.map((alert) => {
                            const cfg = levelConfig(alert.alert_level);
                            const Icon = cfg.icon;
                            return (
                                <Card
                                    key={alert.id}
                                    className={`bg-card/60 backdrop-blur-md border ${cfg.border} border-l-4 border-border/40 shadow-md rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`}
                                >
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-9 w-9 rounded-md ${cfg.bg} flex items-center justify-center`}>
                                                    <Icon className={`h-5 w-5 ${cfg.text}`} />
                                                </div>
                                                <div>
                                                    <CardTitle className="font-heading text-base leading-tight">
                                                        {alert.pest_name ?? 'Unknown Threat'}
                                                    </CardTitle>
                                                    <p className="text-xs text-muted-foreground">
                                                        {alert.type ?? 'Pest'} · {alert.crop ?? 'Multiple Crops'}
                                                    </p>
                                                </div>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => toast.info('Alert shared with extension worker')}>
                                                        <Share2 className="h-4 w-4 mr-2" /> Share with Extension
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setDetailAlert(alert)}>
                                                        <Eye className="h-4 w-4 mr-2" /> View Full Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => setDismissAlert(alert)}
                                                    >
                                                        <XCircle className="h-4 w-4 mr-2" /> Dismiss Alert
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <Badge className={`${cfg.badge} mt-2 w-fit`}>
                                            {cfg.label}
                                        </Badge>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <p className="text-sm text-muted-foreground line-clamp-3">
                                            {alert.description ?? 'No description available.'}
                                        </p>
                                        <div className="rounded-md bg-muted/40 p-3 space-y-2 text-xs">
                                            <div className="flex items-start gap-2">
                                                <MapPin className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                                                <span>{alert.district ?? 'District unknown'}</span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <Thermometer className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                                                <span className="line-clamp-2">
                                                    {alert.triggered_by ?? 'Weather threshold trigger'}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <CalendarClock className="h-3.5 w-3.5 mt-0.5 text-muted-foreground" />
                                                <span>
                                                    Issued{' '}
                                                    {alert.issued_at
                                                        ? new Date(alert.issued_at).toLocaleDateString()
                                                        : 'recently'}
                                                    {typeof alert.forecast_days_ahead === 'number' &&
                                                        ` · ${alert.forecast_days_ahead}d lead`}
                                                </span>
                                            </div>
                                        </div>

                                        {alert.scouting_action && (
                                            <div>
                                                <p className="text-xs font-medium text-foreground mb-1 flex items-center gap-1">
                                                    <Search className="h-3 w-3" /> Scout
                                                </p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {alert.scouting_action}
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => setDetailAlert(alert)}
                                            >
                                                <Eye className="h-3.5 w-3.5 mr-1" /> Details
                                            </Button>
                                            <Button
                                                size="sm"
                                                onClick={() => gotoPage_7()}
                                                className="flex-1 bg-transparent border border-primary text-primary hover:bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.35)] transition-all duration-200"
                                            >
                                                <Sprout className="h-3.5 w-3.5 mr-1" /> Recommendations
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Approved Treatments Table */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 shadow-md rounded-lg">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-heading text-xl flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" />
                                MAAIF-Approved Treatments
                            </CardTitle>
                            <CardDescription>
                                Recommended chemical, biological and cultural practices for active threats.
                            </CardDescription>
                        </div>
                        <Badge variant="secondary" className="font-medium">
                            {treatmentsTotal} total
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingTreatments ? (
                        <div className="space-y-2">
                            {Array.from({ length: 4 }).map((_, i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </div>
                    ) : treatments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <ShieldCheck className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No treatment records yet.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border border-border/40 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-muted/40 sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead className="font-medium">Pest / Disease</TableHead>
                                        <TableHead className="font-medium">Crop</TableHead>
                                        <TableHead className="font-medium">Scouting Action</TableHead>
                                        <TableHead className="font-medium">Treatment</TableHead>
                                        <TableHead className="font-medium text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {treatments.map((t, idx) => (
                                        <TableRow
                                            key={t.id ?? idx}
                                            className={`hover:bg-muted/30 transition-colors ${idx % 2 === 0 ? 'bg-muted/30' : ''}`}
                                        >
                                            <TableCell className="font-medium">
                                                {t.pest_name ?? '—'}
                                            </TableCell>
                                            <TableCell>{t.crop ?? '—'}</TableCell>
                                            <TableCell className="max-w-xs">
                                                <span className="line-clamp-2 text-sm text-muted-foreground">
                                                    {t.scouting_action ?? '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <div className="space-y-0.5 text-xs">
                                                    {t.chemical_treatment && (
                                                        <p>
                                                            <span className="text-muted-foreground">Chem:</span>{' '}
                                                            {t.chemical_treatment}
                                                        </p>
                                                    )}
                                                    {t.biological_treatment && (
                                                        <p>
                                                            <span className="text-muted-foreground">Bio:</span>{' '}
                                                            {t.biological_treatment}
                                                        </p>
                                                    )}
                                                    {t.cultural_practice && (
                                                        <p>
                                                            <span className="text-muted-foreground">Cultural:</span>{' '}
                                                            {t.cultural_practice}
                                                        </p>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {t.maaif_approved ? (
                                                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> Approved
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-amber-700 border-amber-500/30">
                                                        Pending
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Detail Dialog */}
            <Dialog open={!!detailAlert} onOpenChange={(open) => !open && setDetailAlert(null)}>
                <DialogContent className="max-w-2xl bg-card/80 backdrop-blur-md border border-border/40">
                    {detailAlert && (
                        <>
                            <DialogHeader>
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`h-10 w-10 rounded-md ${levelConfig(detailAlert.alert_level).bg} flex items-center justify-center`}
                                    >
                                        {(() => {
                                            const Icon = levelConfig(detailAlert.alert_level).icon;
                                            return <Icon className={`h-5 w-5 ${levelConfig(detailAlert.alert_level).text}`} />;
                                        })()}
                                    </div>
                                    <div>
                                        <DialogTitle className="font-heading">
                                            {detailAlert.pest_name}
                                        </DialogTitle>
                                        <DialogDescription>
                                            {detailAlert.type} · {detailAlert.crop}
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-4 mt-2">
                                <div>
                                    <h4 className="text-sm font-medium mb-1">Description</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {detailAlert.description ?? 'No description available.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="rounded-md bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">District</p>
                                        <p className="font-medium">{detailAlert.district ?? '—'}</p>
                                    </div>
                                    <div className="rounded-md bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">Alert Level</p>
                                        <Badge className={levelConfig(detailAlert.alert_level).badge}>
                                            {levelConfig(detailAlert.alert_level).label}
                                        </Badge>
                                    </div>
                                    <div className="rounded-md bg-muted/30 p-3 col-span-2">
                                        <p className="text-xs text-muted-foreground">Triggered By</p>
                                        <p className="font-medium">{detailAlert.triggered_by ?? '—'}</p>
                                    </div>
                                    <div className="rounded-md bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">Issued</p>
                                        <p className="font-medium">
                                            {detailAlert.issued_at
                                                ? new Date(detailAlert.issued_at).toLocaleString()
                                                : '—'}
                                        </p>
                                    </div>
                                    <div className="rounded-md bg-muted/30 p-3">
                                        <p className="text-xs text-muted-foreground">Forecast Lead</p>
                                        <p className="font-medium">
                                            {detailAlert.forecast_days_ahead ?? 0} days ahead
                                        </p>
                                    </div>
                                </div>
                                {detailAlert.scouting_action && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                                            <Search className="h-4 w-4" /> Scouting Action
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {detailAlert.scouting_action}
                                        </p>
                                    </div>
                                )}
                                {detailAlert.treatment_options && (
                                    <div>
                                        <h4 className="text-sm font-medium mb-1 flex items-center gap-1">
                                            <ShieldCheck className="h-4 w-4" /> Treatment Options
                                        </h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {detailAlert.treatment_options}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <DialogFooter className="mt-4">
                                <Button variant="ghost" onClick={() => setDetailAlert(null)}>
                                    Close
                                </Button>
                                <Button
                                    onClick={() => {
                                        setDetailAlert(null);
                                        gotoPage_7();
                                    }}
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10"
                                >
                                    <Sprout className="h-4 w-4 mr-2" /> View Crop Recommendations
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Dismiss Alert Confirmation */}
            <AlertDialog
                open={!!dismissAlert}
                onOpenChange={(open) => !open && setDismissAlert(null)}
            >
                <AlertDialogContent className="bg-card/80 backdrop-blur-md border border-border/40">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading">Dismiss this alert?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to dismiss the{' '}
                            <span className="font-medium text-foreground">
                                {dismissAlert?.alert_level ?? 'unknown'}
                            </span>{' '}
                            alert for{' '}
                            <span className="font-medium text-foreground">
                                {dismissAlert?.pest_name ?? 'this threat'}
                            </span>
                            {dismissAlert?.crop ? (
                                <>
                                    {' '}on{' '}
                                    <span className="font-medium text-foreground">
                                        {dismissAlert.crop}
                                    </span>
                                </>
                            ) : null}
                            . Dismissed alerts will be hidden from your active threats list until new
                            forecast data re-issues them.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDismissAlert(null)}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (dismissAlert) {
                                    setPestAlerts((prev) =>
                                        prev.filter((a) => a.id !== dismissAlert.id),
                                    );
                                    toast.success(
                                        `${dismissAlert.pest_name ?? 'Alert'} dismissed`,
                                    );
                                }
                                setDismissAlert(null);
                            }}
                        >
                            <XCircle className="h-4 w-4 mr-2" /> Dismiss Alert
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
