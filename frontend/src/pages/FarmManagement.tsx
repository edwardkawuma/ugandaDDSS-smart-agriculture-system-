import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    farmManagementService,
    type FarmManagementStatsResponse,
} from '@/lib/api/farmManagementService';
import {
    farmersService,
    type FarmersListParams,
    type FarmersListResponse,
} from '@/lib/api/farmersService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
    Users,
    AlertTriangle,
    CalendarClock,
    ClipboardList,
    CheckCircle2,
    Search,
    ChevronLeft,
    ChevronRight,
    Eye,
    MoreVertical,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type Farmer = FarmersListResponse['data'][number];

export default function FarmManagement() {
    const navigate = useNavigate();

    function gotoFarmerProfile(farmerId: string | undefined) {
        if (!farmerId) return;
        navigate(`/farmer-directory/${farmerId}`);
    }


    // Detail state — GET /farm-management/stats
    const [farmManagementItem, setFarmManagementItem] = useState<FarmManagementStatsResponse['data'] | null>(null);
    const [loadingFarmManagementItem, setLoadingFarmManagementItem] = useState(false);
    // ↑ FarmManagement is the singular row type
    // List state — GET /farmers/list
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loadingFarmers, setLoadingFarmers] = useState(true);
    const [farmersPage, setFarmersPage] = useState(1);
    const [farmersLimit] = useState(10);
    const [farmersTotal, setFarmersTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [district, setDistrict] = useState('');
    const [crop, setCrop] = useState('');
    const [alertStatus, setAlertStatus] = useState('');
    const [lastVisitBefore, setLastVisitBefore] = useState('');
    const [complianceRateBelow, setComplianceRateBelow] = useState('');

    const districtSummary = useMemo(() => {
        const buckets = new Map<string, { total: number; alerts: number; avgCompliance: number; complianceCount: number }>();
        for (const farmer of farmers) {
            const districtName = (farmer.district || 'Unknown').trim() || 'Unknown';
            const current = buckets.get(districtName) ?? { total: 0, alerts: 0, avgCompliance: 0, complianceCount: 0 };
            current.total += 1;
            if ((farmer.active_alert_status ?? 'none') !== 'none') current.alerts += 1;
            const compliance = Number(farmer.advisory_compliance_rate ?? NaN);
            if (!Number.isNaN(compliance)) {
                current.avgCompliance += compliance;
                current.complianceCount += 1;
            }
            buckets.set(districtName, current);
        }
        return Array.from(buckets.entries())
            .map(([districtName, value]) => ({
                districtName,
                total: value.total,
                alerts: value.alerts,
                compliance: value.complianceCount > 0 ? Math.round(value.avgCompliance / value.complianceCount) : 0,
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 6);
    }, [farmers]);

    useEffect(() => { void loadFarmers(); }, [farmersPage, district, crop, alertStatus, lastVisitBefore, complianceRateBelow]);
    useEffect(() => { void loadFarmManagementItem(); }, []);

    async function loadFarmManagementItem() {
        try {
            setLoadingFarmManagementItem(true);
            const res = await farmManagementService.stats();
            setFarmManagementItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load KPIs');
            console.error('[loadFarmManagementItem]', err);
        } finally {
            setLoadingFarmManagementItem(false);
        }
    }
    async function loadFarmers() {
        try {
            setLoadingFarmers(true);
            const params: FarmersListParams = { page: farmersPage, limit: farmersLimit };
            if (search) params.search = search;
            if (district && district !== 'all') params.district = district;
            if (crop && crop !== 'all') params.crop = crop;
            if (alertStatus && alertStatus !== 'all') params.alert_status = alertStatus;
            if (lastVisitBefore) params.last_visit_before = lastVisitBefore;
            if (complianceRateBelow && complianceRateBelow !== 'any') {
                const n = Number(complianceRateBelow);
                if (!Number.isNaN(n)) params.compliance_rate_below = n;
            }
            const res = await farmersService.list(params);
            setFarmers(Array.isArray(res?.data) ? res.data : []);
            setFarmersTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load farmers');
            console.error('[loadFarmers]', err);
        } finally {
            setLoadingFarmers(false);
        }
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault();
        setFarmersPage(1);
        void loadFarmers();
    }

    return (
        <div className="p-6 md:p-8 space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/80 p-6 shadow-sm">
                <h1 className="text-2xl md:text-3xl font-heading font-bold">Extension Worker Dashboard</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Overview of registered farmers, pending visits, active alerts, and advisory compliance across your assigned district.
                </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" /> Total Farmers
                        </CardDescription>
                        <CardTitle className="text-4xl font-heading">
                            {loadingFarmManagementItem ? '—' : (farmManagementItem?.total_farmers ?? 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Registered in your area</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <CalendarClock className="h-4 w-4 text-primary" /> Pending Visits
                        </CardDescription>
                        <CardTitle className="text-4xl font-heading">
                            {loadingFarmManagementItem ? '—' : (farmManagementItem?.pending_visits ?? 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Scheduled field visits</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" /> Active Alerts
                        </CardDescription>
                        <CardTitle className="text-4xl font-heading">
                            {loadingFarmManagementItem ? '—' : (farmManagementItem?.active_alerts ?? 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            {farmManagementItem?.recent_alert_count ?? 0} in the last 7 days
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-primary" /> Outstanding Advisories
                        </CardDescription>
                        <CardTitle className="text-4xl font-heading">
                            {loadingFarmManagementItem ? '—' : (farmManagementItem?.outstanding_advisories ?? 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">Awaiting farmer response</p>
                    </CardContent>
                </Card>
                <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                    <CardHeader className="pb-2">
                        <CardDescription className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> Compliance Rate
                        </CardDescription>
                        <CardTitle className="text-4xl font-heading">
                            {loadingFarmManagementItem ? '—' : `${farmManagementItem?.advisory_compliance_rate ?? 0}%`}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Progress
                            value={farmManagementItem?.advisory_compliance_rate ?? 0}
                            className="h-2"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* District-level breakdown */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border/60 shadow-sm rounded-xl">
                <CardHeader>
                    <CardTitle className="font-heading">District-Level Breakdown</CardTitle>
                    <CardDescription>Top districts by active farmer records in your current view.</CardDescription>
                </CardHeader>
                <CardContent>
                    {districtSummary.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No district data available for breakdown.</p>
                    ) : (
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {districtSummary.map((row) => (
                                <div key={row.districtName} className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="font-semibold">{row.districtName}</p>
                                        <Badge variant="outline">{row.total} farmers</Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Alerts</span>
                                            <span>{row.alerts}</span>
                                        </div>
                                        <Progress value={Math.min(100, row.alerts * 10)} className="h-1.5" />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Avg. compliance</span>
                                            <span>{row.compliance}%</span>
                                        </div>
                                        <Progress value={row.compliance} className="h-1.5" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Filters */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                <CardHeader>
                    <CardTitle className="font-heading">Farmers in Your Coverage Area</CardTitle>
                    <CardDescription>Filter and prioritize farms that need immediate attention.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-7 gap-3 mb-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name or phone"
                                className="pl-9 bg-background border-border focus:ring-primary"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <Input
                            placeholder="Filter by district"
                            className="bg-background border-border"
                            value={district}
                            onChange={(e) => { setDistrict(e.target.value); setFarmersPage(1); }}
                        />
                        <Select value={crop} onValueChange={(v) => { setCrop(v); setFarmersPage(1); }}>
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Crop type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All crops</SelectItem>
                                <SelectItem value="coffee">Coffee</SelectItem>
                                <SelectItem value="maize">Maize</SelectItem>
                                <SelectItem value="beans">Beans</SelectItem>
                                <SelectItem value="hass_avocado">Hass Avocado</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={alertStatus} onValueChange={(v) => { setAlertStatus(v); setFarmersPage(1); }}>
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Alert status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="none">No active alert</SelectItem>
                                <SelectItem value="weather">Weather alert</SelectItem>
                                <SelectItem value="pest">Pest / disease</SelectItem>
                                <SelectItem value="advisory">Advisory pending</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={complianceRateBelow} onValueChange={(v) => { setComplianceRateBelow(v); setFarmersPage(1); }}>
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Compliance" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="any">Any compliance</SelectItem>
                                <SelectItem value="25">Below 25%</SelectItem>
                                <SelectItem value="50">Below 50%</SelectItem>
                                <SelectItem value="75">Below 75%</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="relative">
                            <Input
                                type="date"
                                placeholder="Last visit before"
                                aria-label="Last visit before"
                                className="bg-background border-border"
                                value={lastVisitBefore}
                                onChange={(e) => { setLastVisitBefore(e.target.value); setFarmersPage(1); }}
                            />
                        </div>
                        <Button type="submit" variant="default" className="w-full md:col-span-1">
                            <Search className="h-4 w-4 mr-2" /> Apply
                        </Button>
                    </form>

                    {/* Table */}
                    {loadingFarmers ? (
                        <div className="space-y-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : farmers.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                            <p>No farmers registered in your assigned area yet.</p>
                        </div>
                    ) : (
                        <div className="rounded border border-border/50 overflow-hidden">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="font-heading">Farmer</TableHead>
                                        <TableHead className="font-heading">District</TableHead>
                                        <TableHead className="font-heading">Crops</TableHead>
                                        <TableHead className="font-heading">Alert Status</TableHead>
                                        <TableHead className="font-heading">Last Visit</TableHead>
                                        <TableHead className="font-heading text-right">Compliance</TableHead>
                                        <TableHead className="font-heading w-10">
                                            <span className="sr-only">Actions</span>
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {farmers.map((f, idx) => (
                                        <TableRow
                                            key={f.id ?? idx}
                                            className="cursor-pointer hover:bg-muted/30 transition-colors duration-150"
                                            onClick={() => gotoFarmerProfile(f.id)}
                                        >
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{f.full_name ?? '—'}</span>
                                                    <span className="text-xs text-muted-foreground">{f.phone_number ?? ''}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{f.district ?? '—'}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(f.crops ?? []).map((c) => (
                                                        <Badge key={c} variant="secondary" className="rounded text-xs">
                                                            {c}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={f.active_alert_status && f.active_alert_status !== 'none' ? 'destructive' : 'outline'}
                                                    className="rounded"
                                                >
                                                    {f.active_alert_status ?? 'none'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {f.last_visit_date ?? 'Never'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">{f.advisory_compliance_rate ?? 0}%</span>
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => gotoFarmerProfile(f.id)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Profile
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

                    {/* Pagination */}
                    <div className="flex items-center justify-between mt-4">
                        <p className="text-sm text-muted-foreground">
                            Showing {farmers.length} of {farmersTotal} farmers
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFarmersPage((p) => Math.max(1, p - 1))}
                                disabled={farmersPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4" /> Previous
                            </Button>
                            <span className="text-sm">Page {farmersPage}</span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setFarmersPage((p) => p + 1)}
                                disabled={farmers.length < farmersLimit}
                            >
                                Next <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
