import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    programmeKpisService,
    type ProgrammeKpisCreateParams,
    type ProgrammeKpisDeleteParams,
    type ProgrammeKpisDetailResponse,
    type ProgrammeKpisListResponse,
    type ProgrammeKpisUpdateParams,
} from '@/lib/api/programmeKpisService';
import {
    notificationsService,
    type NotificationsPreferencesParams,
} from '@/lib/api/notificationsService';
import {
    programmeKpisCreateSchema,
    programmeKpisUpdateSchema,
    type ProgrammeKpisCreateInput,
    type ProgrammeKpisUpdateInput,
} from '@/lib/api/programmeKpisFormSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
    MoreVertical,
    Plus,
    Download,
    Target,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Activity,
    RefreshCw,
    Bell,
    Eye,
    Pencil,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ProgrammeKpi = ProgrammeKpisListResponse['data'][number];

export default function ProgrammeKPIs() {
    // Local UI state
    const [activeTab, setActiveTab] = useState<'scorecards' | 'table' | 'alerts'>('scorecards');
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<ProgrammeKpi | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);

    // List state — GET /programme-kpis/list
    const [programmeKpis, setProgrammeKpis] = useState<ProgrammeKpi[]>([]);
    const [loadingProgrammeKpis, setLoadingProgrammeKpis] = useState(true);
    const [programmeKpisPage, setProgrammeKpisPage] = useState(1);
    const [programmeKpisLimit] = useState(10);
    const [programmeKpisTotal, setProgrammeKpisTotal] = useState(0);
    // Edit dialog state — PUT /programme-kpis/update
    const [editProgrammeKpisTarget, setEditProgrammeKpisTarget] = useState<ProgrammeKpi | null>(null);
    // Detail state — GET /programme-kpis/detail
    const [programmeKpisItem, setProgrammeKpisItem] = useState<ProgrammeKpisDetailResponse['data'] | null>(null);
    const [loadingProgrammeKpisItem, setLoadingProgrammeKpisItem] = useState(false);
    // ↑ ProgrammeKpi is the singular row type
    // Create dialog state — POST /programme-kpis/create
    const [createProgrammeKpisOpen, setCreateProgrammeKpisOpen] = useState(false);

    useEffect(() => { void loadProgrammeKpis(); }, [programmeKpisPage]);

    async function loadProgrammeKpis() {
        try {
            setLoadingProgrammeKpis(true);
            const res = await programmeKpisService.list({ page: programmeKpisPage, limit: programmeKpisLimit });
            setProgrammeKpis(Array.isArray(res?.data) ? res.data : []);
            setProgrammeKpisTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load programmeKpis');
            console.error('[loadProgrammeKpis]', err);
        } finally {
            setLoadingProgrammeKpis(false);
        }
    }
    async function handleUpdateProgrammeKpis(data: ProgrammeKpisUpdateParams) {
        try {
            await programmeKpisService.update(data);
            toast.success('Updated');
            setEditProgrammeKpisTarget(null);
            void loadProgrammeKpis();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateProgrammeKpis]', err);
        }
    }
    async function loadProgrammeKpisItem(targetId: string) {
        try {
            setLoadingProgrammeKpisItem(true);
            const res = await programmeKpisService.detail({ id: targetId });
            setProgrammeKpisItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadProgrammeKpisItem]', err);
        } finally {
            setLoadingProgrammeKpisItem(false);
        }
    }
    async function handleCreateProgrammeKpis(data: ProgrammeKpisCreateParams) {
        try {
            await programmeKpisService.create(data);
            toast.success('Created');
            setCreateProgrammeKpisOpen(false);
            void loadProgrammeKpis();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateProgrammeKpis]', err);
        }
    }
    async function handleDeleteProgrammeKpis(params: ProgrammeKpisDeleteParams) {
        try {
            await programmeKpisService.delete(params);
            toast.success('Deleted');
            void loadProgrammeKpis();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteProgrammeKpis]', err);
        }
    }
    // PUT /notifications/preferences
    async function handlePreferences(data: NotificationsPreferencesParams) {
        try {
            await notificationsService.preferences(data);
            toast.success('Done');
        } catch (err) {
            toast.error('Action failed');
            console.error('[handlePreferences]', err);
        }
    }

    // ---- export ----
    function handleExportCSV() {
        if (programmeKpis.length === 0) {
            toast.error('No KPI data to export');
            return;
        }
        const headers = ['KPI Name', 'Category', 'Current Value', 'Target Value', 'Unit', 'Achievement (%)', 'Status', 'Threshold Alert (%)', 'Last Updated'];
        const rows = programmeKpis.map((k) => [
            k.kpi_name ?? '',
            k.kpi_category ?? '',
            k.current_value ?? '',
            k.target_value ?? '',
            k.unit ?? '',
            (k.achievement_pct ?? 0).toFixed(1),
            k.status ?? '',
            k.threshold_alert ?? '',
            k.last_updated ? new Date(k.last_updated).toLocaleDateString() : '',
        ]);
        const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `programme-kpis-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('KPI progress table exported');
    }

    // ---- derived ----
    const totalPages = Math.ceil(programmeKpisTotal / programmeKpisLimit);
    const filteredKpis = programmeKpis.filter((k) => {
        const matchSearch = !searchQuery || (k.kpi_name ?? '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchCat = !categoryFilter || k.kpi_category === categoryFilter;
        return matchSearch && matchCat;
    });
    const categories = Array.from(new Set(programmeKpis.map((k) => k.kpi_category).filter(Boolean)));

    function statusBadge(status?: string, pct?: number) {
        if (status === 'on_track' || (pct ?? 0) >= 80) return <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40">On Track</Badge>;
        if (status === 'at_risk' || ((pct ?? 0) >= 50 && (pct ?? 0) < 80)) return <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/40">At Risk</Badge>;
        return <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/40">Off Track</Badge>;
    }

    function pctColor(pct?: number) {
        if ((pct ?? 0) >= 80) return 'bg-emerald-500';
        if ((pct ?? 0) >= 50) return 'bg-amber-500';
        return 'bg-rose-500';
    }

    // ---- create form ----
    const createForm = useForm<ProgrammeKpisCreateInput>({
        resolver: zodResolver(programmeKpisCreateSchema),
        defaultValues: { programme_id: '', kpi_name: '', kpi_category: '', target_value: undefined, unit: '', threshold_alert: undefined, email_alert_enabled: undefined },
    });

    // ---- edit form ----
    const editForm = useForm<ProgrammeKpisUpdateInput>({
        resolver: zodResolver(programmeKpisUpdateSchema),
        values: editProgrammeKpisTarget ? {
            kpi_name: editProgrammeKpisTarget.kpi_name ?? '',
            target_value: editProgrammeKpisTarget.target_value,
            unit: editProgrammeKpisTarget.unit ?? '',
            threshold_alert: editProgrammeKpisTarget.threshold_alert,
            email_alert_enabled: undefined,
        } : undefined,
    });

    // ---- notification form ----
    const notifForm = useForm<NotificationsPreferencesParams>({
        defaultValues: { email_enabled: true, sms_enabled: false, in_app_enabled: true, phone_number: '', email: '', alert_types: ['kpi_threshold'] },
    });

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">Programme KPIs</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Track logframe targets and real-time delivery performance for climate-smart agriculture programmes.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border/60 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        onClick={() => void loadProgrammeKpis()}
                    >
                        <RefreshCw className="h-4 w-4 mr-1.5" />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border/60 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        onClick={handleExportCSV}
                        disabled={loadingProgrammeKpis}
                    >
                        <Download className="h-4 w-4 mr-1.5" />
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="border-border/60 text-muted-foreground hover:text-foreground transition-colors duration-200"
                        onClick={() => setNotifOpen(true)}
                    >
                        <Bell className="h-4 w-4 mr-1.5" />
                        Alert Settings
                    </Button>
                    <Button
                        size="sm"
                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10 transition-all duration-200"
                        onClick={() => setCreateProgrammeKpisOpen(true)}
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Add KPI
                    </Button>
                </div>
            </div>

            {/* Summary scorecards */}
            {loadingProgrammeKpis ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-28 rounded-lg" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total KPIs', value: programmeKpisTotal, icon: Target, color: 'text-primary' },
                        { label: 'On Track', value: programmeKpis.filter((k) => (k.achievement_pct ?? 0) >= 80).length, icon: CheckCircle2, color: 'text-emerald-400' },
                        { label: 'At Risk', value: programmeKpis.filter((k) => (k.achievement_pct ?? 0) >= 50 && (k.achievement_pct ?? 0) < 80).length, icon: AlertTriangle, color: 'text-amber-400' },
                        { label: 'Off Track', value: programmeKpis.filter((k) => (k.achievement_pct ?? 0) < 50).length, icon: TrendingDown, color: 'text-rose-400' },
                    ].map((card) => (
                        <div key={card.label} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex items-center gap-4 transition-all duration-200 hover:shadow-lg">
                            <div className={cn('p-2.5 rounded-md bg-background/50', card.color)}>
                                <card.icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-foreground font-heading">{card.value}</p>
                                <p className="text-xs text-muted-foreground">{card.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Main content tabs */}
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <TabsList className="bg-background/50 border border-border/40">
                        <TabsTrigger value="scorecards" className="text-xs">Scorecards</TabsTrigger>
                        <TabsTrigger value="table" className="text-xs">Table View</TabsTrigger>
                        <TabsTrigger value="alerts" className="text-xs">Threshold Alerts</TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="Search KPIs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 w-52 text-sm bg-background/50 border-border/60"
                        />
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="h-8 px-2 text-sm rounded-md border border-border/60 bg-background/50 text-foreground"
                        >
                            <option value="">All categories</option>
                            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {/* ---- Scorecards tab ---- */}
                <TabsContent value="scorecards" className="mt-4">
                    {loadingProgrammeKpis ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-44 rounded-lg" />)}
                        </div>
                    ) : filteredKpis.length === 0 ? (
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-12 text-center">
                            <Activity className="h-10 w-10 mx-auto text-muted-foreground mb-3 opacity-50" />
                            <p className="text-muted-foreground font-medium">No KPIs found</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">Add KPIs to your programme logframe to start tracking performance.</p>
                            <Button
                                size="sm"
                                className="mt-4 bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10"
                                onClick={() => setCreateProgrammeKpisOpen(true)}
                            >
                                <Plus className="h-4 w-4 mr-1.5" />
                                Add First KPI
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredKpis.map((kpi) => (
                                <div
                                    key={kpi.id}
                                    className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-3 transition-all duration-200 hover:shadow-lg hover:border-border/70"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-heading font-semibold text-foreground text-sm leading-snug truncate">{kpi.kpi_name ?? 'Unnamed KPI'}</p>
                                            {kpi.kpi_category && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{kpi.kpi_category}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                            {statusBadge(kpi.status, kpi.achievement_pct)}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem onClick={() => { void loadProgrammeKpisItem(kpi.id ?? ''); setDetailOpen(true); }}>
                                                        <Eye className="h-4 w-4 mr-2" /> View Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditProgrammeKpisTarget(kpi)}>
                                                        <Pencil className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(kpi)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>Progress</span>
                                            <span className="font-semibold text-foreground">{(kpi.achievement_pct ?? 0).toFixed(1)}%</span>
                                        </div>
                                        <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                            <div className={cn('h-full rounded-full transition-all', pctColor(kpi.achievement_pct))} style={{ width: `${Math.min(kpi.achievement_pct ?? 0, 100)}%` }} />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 pt-1">
                                        <div className="bg-background/40 rounded-md p-2 text-center">
                                            <p className="text-xs text-muted-foreground">Current</p>
                                            <p className="font-bold text-foreground text-sm">{kpi.current_value ?? '—'} <span className="text-xs font-normal text-muted-foreground">{kpi.unit}</span></p>
                                        </div>
                                        <div className="bg-background/40 rounded-md p-2 text-center">
                                            <p className="text-xs text-muted-foreground">Target</p>
                                            <p className="font-bold text-foreground text-sm">{kpi.target_value ?? '—'} <span className="text-xs font-normal text-muted-foreground">{kpi.unit}</span></p>
                                        </div>
                                    </div>

                                    {kpi.last_updated && (
                                        <p className="text-xs text-muted-foreground/60">Updated {new Date(kpi.last_updated).toLocaleDateString()}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ---- Table tab ---- */}
                <TabsContent value="table" className="mt-4">
                    <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border/40">
                                    <TableHead>KPI Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Current</TableHead>
                                    <TableHead>Target</TableHead>
                                    <TableHead>Achievement</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Updated</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingProgrammeKpis ? (
                                    [...Array(5)].map((_, i) => (
                                        <TableRow key={i} className="border-border/40">
                                            {[...Array(8)].map((__, j) => (
                                                <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : filteredKpis.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                                            No KPI records found. Adjust your filters or add a new KPI.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredKpis.map((kpi) => (
                                    <TableRow key={kpi.id} className="border-border/40 hover:bg-muted/20 transition-colors duration-150">
                                        <TableCell className="font-medium text-foreground">{kpi.kpi_name ?? '—'}</TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{kpi.kpi_category ?? '—'}</TableCell>
                                        <TableCell className="text-foreground">{kpi.current_value ?? '—'} <span className="text-xs text-muted-foreground">{kpi.unit}</span></TableCell>
                                        <TableCell className="text-foreground">{kpi.target_value ?? '—'} <span className="text-xs text-muted-foreground">{kpi.unit}</span></TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-20 rounded-full bg-secondary overflow-hidden">
                                                    <div className={cn('h-full rounded-full transition-all', pctColor(kpi.achievement_pct))} style={{ width: `${Math.min(kpi.achievement_pct ?? 0, 100)}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{(kpi.achievement_pct ?? 0).toFixed(0)}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>{statusBadge(kpi.status, kpi.achievement_pct)}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">{kpi.last_updated ? new Date(kpi.last_updated).toLocaleDateString() : '—'}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem onClick={() => { void loadProgrammeKpisItem(kpi.id ?? ''); setDetailOpen(true); }}>
                                                        <Eye className="h-4 w-4 mr-2" /> View Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => setEditProgrammeKpisTarget(kpi)}>
                                                        <Pencil className="h-4 w-4 mr-2" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(kpi)}>
                                                        <Trash2 className="h-4 w-4 mr-2" /> Delete
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
                            <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                                <p className="text-xs text-muted-foreground">
                                    Page {programmeKpisPage} of {totalPages} &middot; {programmeKpisTotal} records
                                </p>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={programmeKpisPage <= 1}
                                        onClick={() => setProgrammeKpisPage((p) => p - 1)}
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={programmeKpisPage >= totalPages}
                                        onClick={() => setProgrammeKpisPage((p) => p + 1)}
                                    >
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* ---- Threshold Alerts tab ---- */}
                <TabsContent value="alerts" className="mt-4">
                    <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-6 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-amber-400" />
                            <h2 className="font-heading font-semibold text-foreground">KPIs Below Threshold</h2>
                        </div>
                        {loadingProgrammeKpis ? (
                            [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-lg" />)
                        ) : programmeKpis.filter((k) => k.threshold_alert !== undefined && (k.achievement_pct ?? 0) < (k.threshold_alert ?? 0)).length === 0 ? (
                            <div className="text-center py-10">
                                <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3 opacity-70" />
                                <p className="text-muted-foreground font-medium">All KPIs above alert thresholds</p>
                                <p className="text-sm text-muted-foreground/60 mt-1">Configure thresholds when editing individual KPI targets.</p>
                            </div>
                        ) : (
                            programmeKpis
                                .filter((k) => k.threshold_alert !== undefined && (k.achievement_pct ?? 0) < (k.threshold_alert ?? 0))
                                .map((kpi) => (
                                    <div key={kpi.id} className="flex items-center justify-between rounded-lg bg-rose-500/10 border border-rose-500/30 p-4 gap-4">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
                                            <div>
                                                <p className="font-medium text-foreground text-sm">{kpi.kpi_name}</p>
                                                <p className="text-xs text-muted-foreground">{kpi.kpi_category} · Achievement {(kpi.achievement_pct ?? 0).toFixed(1)}% &lt; threshold {kpi.threshold_alert}%</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                                            onClick={() => setEditProgrammeKpisTarget(kpi)}
                                        >
                                            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Configure
                                        </Button>
                                    </div>
                                ))
                        )}

                        <Separator className="bg-border/40" />
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-foreground text-sm">Email Notification Preferences</p>
                                <p className="text-xs text-muted-foreground mt-0.5">Configure SendGrid email alerts for underperforming KPIs.</p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-primary/40 text-primary hover:bg-primary/10"
                                onClick={() => setNotifOpen(true)}
                            >
                                <Bell className="h-3.5 w-3.5 mr-1.5" /> Configure Alerts
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>

            {/* ===== Create KPI Dialog ===== */}
            <Dialog open={createProgrammeKpisOpen} onOpenChange={setCreateProgrammeKpisOpen}>
                <DialogContent className="max-w-lg bg-card/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg">Add New KPI</DialogTitle>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form
                            onSubmit={createForm.handleSubmit((data) => {
                                void handleCreateProgrammeKpis({
                                    programme_id: data.programme_id,
                                    kpi_name: data.kpi_name,
                                    kpi_category: data.kpi_category ?? '',
                                    target_value: data.target_value as number,
                                    unit: data.unit ?? '',
                                    threshold_alert: data.threshold_alert as number,
                                    email_alert_enabled: !!data.email_alert_enabled,
                                });
                            })}
                            className="space-y-4 mt-1"
                        >
                            <FormField control={createForm.control} name="programme_id" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Programme ID</FormLabel>
                                    <FormControl><Input placeholder="e.g. PROG-001" {...field} className="bg-background/50" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={createForm.control} name="kpi_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>KPI Name</FormLabel>
                                    <FormControl><Input placeholder="e.g. Farmer Training Completion Rate" {...field} className="bg-background/50" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={createForm.control} name="kpi_category" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl><Input placeholder="e.g. Training, Land Use, Adoption" {...field} className="bg-background/50" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={createForm.control} name="target_value" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Value</FormLabel>
                                        <FormControl><Input type="number" placeholder="0" {...field} className="bg-background/50" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={createForm.control} name="unit" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <FormControl><Input placeholder="e.g. %, ha, farmers" {...field} className="bg-background/50" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={createForm.control} name="threshold_alert" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alert Threshold (%)</FormLabel>
                                    <FormControl><Input type="number" placeholder="e.g. 60" {...field} className="bg-background/50" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={createForm.control} name="email_alert_enabled" render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <FormControl>
                                        <Switch
                                            checked={!!field.value}
                                            onCheckedChange={(v) => field.onChange(v ? 1 : 0)}
                                        />
                                    </FormControl>
                                    <FormLabel className="!mt-0 font-normal">Enable email alerts for this KPI</FormLabel>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateProgrammeKpisOpen(false)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10"
                                    disabled={createForm.formState.isSubmitting}
                                >
                                    {createForm.formState.isSubmitting ? 'Saving...' : 'Add KPI'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ===== Edit KPI Dialog ===== */}
            <Dialog open={!!editProgrammeKpisTarget} onOpenChange={(open) => { if (!open) setEditProgrammeKpisTarget(null); }}>
                <DialogContent className="max-w-lg bg-card/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg">Edit KPI</DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form
                            onSubmit={editForm.handleSubmit((data) => {
                                if (!editProgrammeKpisTarget?.id) return;
                                void handleUpdateProgrammeKpis({
                                    id: editProgrammeKpisTarget.id,
                                    kpi_name: data.kpi_name ?? editProgrammeKpisTarget.kpi_name ?? '',
                                    target_value: data.target_value as number,
                                    unit: data.unit ?? '',
                                    threshold_alert: data.threshold_alert as number,
                                    email_alert_enabled: !!data.email_alert_enabled,
                                });
                            })}
                            className="space-y-4 mt-1"
                        >
                            <FormField control={editForm.control} name="kpi_name" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>KPI Name</FormLabel>
                                    <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <div className="grid grid-cols-2 gap-3">
                                <FormField control={editForm.control} name="target_value" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Value</FormLabel>
                                        <FormControl><Input type="number" {...field} className="bg-background/50" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={editForm.control} name="unit" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Unit</FormLabel>
                                        <FormControl><Input {...field} className="bg-background/50" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                            <FormField control={editForm.control} name="threshold_alert" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Alert Threshold (%)</FormLabel>
                                    <FormControl><Input type="number" {...field} className="bg-background/50" /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={editForm.control} name="email_alert_enabled" render={({ field }) => (
                                <FormItem className="flex items-center gap-3">
                                    <FormControl>
                                        <Switch
                                            checked={!!field.value}
                                            onCheckedChange={(v) => field.onChange(v ? 1 : 0)}
                                        />
                                    </FormControl>
                                    <FormLabel className="!mt-0 font-normal">Enable email alerts</FormLabel>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setEditProgrammeKpisTarget(null)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10"
                                    disabled={editForm.formState.isSubmitting}
                                >
                                    {editForm.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* ===== Detail Dialog ===== */}
            <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
                <DialogContent className="max-w-lg bg-card/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg">KPI Detail</DialogTitle>
                    </DialogHeader>
                    {loadingProgrammeKpisItem ? (
                        <div className="space-y-3 py-4">
                            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-6 w-full" />)}
                        </div>
                    ) : programmeKpisItem ? (
                        <div className="space-y-4 py-2">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-background/40 rounded-md p-3">
                                    <p className="text-xs text-muted-foreground">KPI Name</p>
                                    <p className="font-semibold text-foreground text-sm mt-0.5">{programmeKpisItem.kpi_name ?? '—'}</p>
                                </div>
                                <div className="bg-background/40 rounded-md p-3">
                                    <p className="text-xs text-muted-foreground">Category</p>
                                    <p className="font-semibold text-foreground text-sm mt-0.5">{programmeKpisItem.kpi_category ?? '—'}</p>
                                </div>
                                <div className="bg-background/40 rounded-md p-3">
                                    <p className="text-xs text-muted-foreground">Current Value</p>
                                    <p className="font-semibold text-foreground text-sm mt-0.5">{programmeKpisItem.current_value ?? '—'} {programmeKpisItem.unit}</p>
                                </div>
                                <div className="bg-background/40 rounded-md p-3">
                                    <p className="text-xs text-muted-foreground">Target Value</p>
                                    <p className="font-semibold text-foreground text-sm mt-0.5">{programmeKpisItem.target_value ?? '—'} {programmeKpisItem.unit}</p>
                                </div>
                                <div className="bg-background/40 rounded-md p-3">
                                    <p className="text-xs text-muted-foreground">Achievement</p>
                                    <p className="font-semibold text-foreground text-sm mt-0.5">{(programmeKpisItem.achievement_pct ?? 0).toFixed(1)}%</p>
                                </div>
                                <div className="bg-background/40 rounded-md p-3">
                                    <p className="text-xs text-muted-foreground">Alert Threshold</p>
                                    <p className="font-semibold text-foreground text-sm mt-0.5">{programmeKpisItem.threshold_alert ?? '—'}%</p>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Achievement Progress</p>
                                <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                                    <div className={cn('h-full rounded-full transition-all', pctColor(programmeKpisItem.achievement_pct))} style={{ width: `${Math.min(programmeKpisItem.achievement_pct ?? 0, 100)}%` }} />
                                </div>
                            </div>
                            {programmeKpisItem.history && programmeKpisItem.history.length > 0 && (
                                <div>
                                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">History</p>
                                    <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                                        {programmeKpisItem.history.map((h, i) => (
                                            <div key={i} className="flex items-center justify-between text-xs bg-background/30 rounded px-3 py-1.5">
                                                <span className="text-muted-foreground">{h.date ? new Date(h.date).toLocaleDateString() : '—'}</span>
                                                <span className="font-medium text-foreground">{h.value ?? '—'} {programmeKpisItem.unit}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex items-center justify-between text-xs pt-1">
                                <span className="text-muted-foreground">Email alerts: <span className={programmeKpisItem.email_alert_enabled ? 'text-emerald-400' : 'text-muted-foreground'}>{programmeKpisItem.email_alert_enabled ? 'Enabled' : 'Disabled'}</span></span>
                                <span className="text-muted-foreground">Last updated: {programmeKpisItem.last_updated ? new Date(programmeKpisItem.last_updated).toLocaleString() : '—'}</span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm py-6 text-center">No detail available.</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDetailOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ===== Delete Confirmation ===== */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent className="bg-card/95 backdrop-blur-md border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading">Delete KPI?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove <strong>{deleteTarget?.kpi_name ?? 'this KPI'}</strong> from the programme logframe? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTarget?.id) void handleDeleteProgrammeKpis({ id: deleteTarget.id });
                                setDeleteTarget(null);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ===== Notification Preferences Dialog ===== */}
            <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/50">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg">Alert Notification Preferences</DialogTitle>
                    </DialogHeader>
                    <form
                        onSubmit={notifForm.handleSubmit((data) => {
                            void handlePreferences(data);
                            setNotifOpen(false);
                        })}
                        className="space-y-4 mt-1"
                    >
                        <div className="flex items-center justify-between py-2 border-b border-border/40">
                            <Label className="text-sm">Email Notifications</Label>
                            <Switch
                                checked={notifForm.watch('email_enabled')}
                                onCheckedChange={(v) => notifForm.setValue('email_enabled', v)}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border/40">
                            <Label className="text-sm">SMS Notifications</Label>
                            <Switch
                                checked={notifForm.watch('sms_enabled')}
                                onCheckedChange={(v) => notifForm.setValue('sms_enabled', v)}
                            />
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-border/40">
                            <Label className="text-sm">In-App Notifications</Label>
                            <Switch
                                checked={notifForm.watch('in_app_enabled')}
                                onCheckedChange={(v) => notifForm.setValue('in_app_enabled', v)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Email Address</Label>
                            <Input
                                type="email"
                                placeholder="your@email.com"
                                className="bg-background/50"
                                {...notifForm.register('email')}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm">Phone Number</Label>
                            <Input
                                type="tel"
                                placeholder="+256 700 000 000"
                                className="bg-background/50"
                                {...notifForm.register('phone_number')}
                            />
                        </div>
                        <DialogFooter className="pt-2">
                            <Button type="button" variant="outline" onClick={() => setNotifOpen(false)}>Cancel</Button>
                            <Button
                                type="submit"
                                className="bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:bg-primary/10"
                            >
                                Save Preferences
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
