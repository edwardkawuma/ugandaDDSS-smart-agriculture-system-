import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    fieldVisitsService,
    type FieldVisitsCreateParams,
    type FieldVisitsDeleteParams,
    type FieldVisitsDetailResponse,
    type FieldVisitsListResponse,
    type FieldVisitsUpdateParams,
} from '@/lib/api/fieldVisitsService';
import {
    farmersService,
    type FarmersListResponse,
} from '@/lib/api/farmersService';
import {
    fieldVisitsCreateSchema,
    fieldVisitsUpdateSchema,
} from '@/lib/api/fieldVisitsFormSchema';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Plus,
    Search,
    Filter,
    MapPin,
    Loader2,
    MoreVertical,
    Pencil,
    Eye,
    Trash2,
    ArrowLeft,
    ArrowRight,
    Download,
    Calendar,
    User,
    ClipboardList,
    AlertTriangle,
} from 'lucide-react';

type FieldVisit = FieldVisitsListResponse['data'][number];
type Farmer = FarmersListResponse['data'][number];

export default function FieldVisits() {


    // List state — GET /field-visits/list
    const [fieldVisits, setFieldVisits] = useState<FieldVisit[]>([]);
    const [loadingFieldVisits, setLoadingFieldVisits] = useState(true);
    const [fieldVisitsPage, setFieldVisitsPage] = useState(1);
    const [fieldVisitsLimit] = useState(10);
    const [fieldVisitsTotal, setFieldVisitsTotal] = useState(0);
    // Farmer combobox state — GET /farmers/list (debounced search)
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loadingFarmers, setLoadingFarmers] = useState(false);
    const [farmerSearch, setFarmerSearch] = useState('');
    const farmerDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Create dialog state — POST /field-visits/create
    const [createFieldVisitsOpen, setCreateFieldVisitsOpen] = useState(false);
    // Edit dialog state — PUT /field-visits/update
    const [editFieldVisitsTarget, setEditFieldVisitsTarget] = useState<FieldVisit | null>(null);
    // Detail state — GET /field-visits/detail
    const [detailItem, setDetailItem] = useState<FieldVisitsDetailResponse['data'] | null>(null);
    const [loadingDetailItem, setLoadingDetailItem] = useState(false);
    // Export state — GET /field-visits/export
    const [loadingExportItem, setLoadingExportItem] = useState(false);

    useEffect(() => { void loadFieldVisits(); }, [fieldVisitsPage]);

    async function loadFieldVisits() {
        try {
            setLoadingFieldVisits(true);
            const res = await fieldVisitsService.list({ page: fieldVisitsPage, limit: fieldVisitsLimit });
            setFieldVisits(Array.isArray(res?.data) ? res.data : []);
            setFieldVisitsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load fieldVisits');
            console.error('[loadFieldVisits]', err);
        } finally {
            setLoadingFieldVisits(false);
        }
    }
    const loadFarmers = useCallback(async (search: string) => {
        try {
            setLoadingFarmers(true);
            const res = await farmersService.list({ page: 1, limit: 20, search: search || undefined });
            setFarmers(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to load farmers');
            console.error('[loadFarmers]', err);
        } finally {
            setLoadingFarmers(false);
        }
    }, []);
    async function handleCreateFieldVisits(data: FieldVisitsCreateParams) {
        try {
            await fieldVisitsService.create(data);
            toast.success('Created');
            setCreateFieldVisitsOpen(false);
            void loadFieldVisits();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateFieldVisits]', err);
        }
    }
    async function handleUpdateFieldVisits(data: FieldVisitsUpdateParams) {
        try {
            await fieldVisitsService.update(data);
            toast.success('Updated');
            setEditFieldVisitsTarget(null);
            void loadFieldVisits();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateFieldVisits]', err);
        }
    }
    async function handleDeleteFieldVisits(params: FieldVisitsDeleteParams) {
        try {
            await fieldVisitsService.delete(params);
            toast.success('Deleted');
            void loadFieldVisits();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteFieldVisits]', err);
        }
    }
    async function loadDetailItem(targetId: string) {
        try {
            setLoadingDetailItem(true);
            const res = await fieldVisitsService.detail({ id: targetId });
            setDetailItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadDetailItem]', err);
        } finally {
            setLoadingDetailItem(false);
        }
    }
    // Local UI state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [detailDialogOpen, setDetailDialogOpen] = useState(false);

    // Create form (react-hook-form + zod)
    const createForm = useForm<FieldVisitsCreateParams>({
        resolver: zodResolver(fieldVisitsCreateSchema),
        defaultValues: {
            farmer_id: '',
            farm_id: '',
            visit_date: '',
            observations: '',
            pest_sightings: '',
            crop_condition: '',
            soil_observations: '',
            advisories_given: '',
            follow_up_actions: '',
            follow_up_due_date: '',
        },
    });

    // Edit form (react-hook-form + zod, values seeded from edit target)
    // Note: soil_observations is accepted by the API but absent from the generated
    // FieldVisitsUpdateParams type, so we use a widened local type here.
    type EditFormValues = FieldVisitsUpdateParams & { soil_observations?: string };
    const editForm = useForm<EditFormValues>({
        resolver: zodResolver(fieldVisitsUpdateSchema),
        values: editFieldVisitsTarget
            ? {
                  id: editFieldVisitsTarget.id ?? '',
                  observations: editFieldVisitsTarget.observations ?? '',
                  pest_sightings: (editFieldVisitsTarget as any).pest_sightings ?? '',
                  crop_condition: (editFieldVisitsTarget as any).crop_condition ?? '',
                  soil_observations: (editFieldVisitsTarget as any).soil_observations ?? '',
                  advisories_given: editFieldVisitsTarget.advisories_given ?? '',
                  follow_up_actions: editFieldVisitsTarget.follow_up_actions ?? '',
                  follow_up_due_date: editFieldVisitsTarget.follow_up_due_date ?? '',
                  status: editFieldVisitsTarget.status ?? '',
              }
            : undefined,
    });

    // Export form state
    const [exportFromDate, setExportFromDate] = useState('');
    const [exportToDate, setExportToDate] = useState('');
    const [exportFormat, setExportFormat] = useState('csv');

    // Derived: filtered visits list
    const filteredVisits = useMemo(() => {
        const term = searchTerm.trim().toLowerCase();
        return fieldVisits.filter((row) => {
            const matchesStatus = statusFilter === 'all' || row.status === statusFilter;
            const matchesTerm =
                !term ||
                (row.farmer_name ?? '').toLowerCase().includes(term) ||
                (row.farm_id ?? '').toLowerCase().includes(term) ||
                (row.observations ?? '').toLowerCase().includes(term);
            const matchesDateFrom = !dateFrom || (row.visit_date ?? '') >= dateFrom;
            const matchesDateTo = !dateTo || (row.visit_date ?? '') <= dateTo;
            return matchesStatus && matchesTerm && matchesDateFrom && matchesDateTo;
        });
    }, [fieldVisits, searchTerm, statusFilter, dateFrom, dateTo]);

    // Farmer combobox open state and delete target
    const [farmerComboboxOpen, setFarmerComboboxOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    // Debounced farmer search — fires on combobox open and on each keystroke
    function handleFarmerSearchChange(value: string) {
        setFarmerSearch(value);
        if (farmerDebounceRef.current) clearTimeout(farmerDebounceRef.current);
        farmerDebounceRef.current = setTimeout(() => {
            void loadFarmers(value);
        }, 300);
    }

    useEffect(() => {
        if (farmerComboboxOpen) {
            void loadFarmers(farmerSearch);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [farmerComboboxOpen]);

    async function handleExport() {
        try {
            setLoadingExportItem(true);
            const res = await fieldVisitsService.export({
                from_date: exportFromDate,
                to_date: exportToDate,
                format: exportFormat,
            });
            if (res?.data?.download_url) {
                window.open(res.data.download_url, '_blank');
                toast.success('NAADS report generated');
            }
            setExportDialogOpen(false);
        } catch (err) {
            toast.error('Failed to export report');
            console.error('[handleExport]', err);
        } finally {
            setLoadingExportItem(false);
        }
    }

    function openDetailDialog(visit: FieldVisit) {
        setDetailDialogOpen(true);
        void loadDetailItem(visit.id);
    }

    function statusColor(status: string | undefined) {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30';
            case 'scheduled':
                return 'bg-blue-500/15 text-blue-700 border-blue-500/30';
            case 'follow_up':
                return 'bg-amber-500/15 text-amber-700 border-amber-500/30';
            case 'cancelled':
                return 'bg-red-500/15 text-red-700 border-red-500/30';
            default:
                return 'bg-muted text-muted-foreground';
        }
    }

    return (
        <div className="p-6 md:p-8 space-y-8 font-sans">
            {/* Page hero */}
            <div className="relative overflow-hidden rounded-lg shadow-xl border border-border/40 bg-card/60 backdrop-blur-md">
                <img
                    src="https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80"
                    alt="Uganda farmland field visit"
                    className="absolute inset-0 w-full h-full object-cover opacity-30"
                    loading="lazy"
                />
                <div className="relative z-10 p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="font-heading text-3xl md:text-4xl font-semibold text-foreground tracking-tight">
                            Field Visits
                        </h1>
                        <p className="mt-2 text-muted-foreground max-w-2xl">
                            Schedule, log, and track field visits to farms in your assigned area.
                            Capture observations, advisories, and follow-up actions for NAADS reporting.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setExportDialogOpen(true)}
                            className="transition-all duration-200"
                        >
                            <Download className="mr-2 h-4 w-4" /> Export NAADS
                        </Button>
                        <Button
                            onClick={() => setCreateFieldVisitsOpen(true)}
                            className="transition-all duration-200 ease-out hover:shadow-[0_0_18px_rgba(74,222,128,0.55)] bg-primary text-primary-foreground"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Log Visit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Filters row */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-lg">
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Filters</span>
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-40 bg-background border-border focus:ring-primary">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="scheduled">Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="follow_up">Follow-up</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                    <div className="relative min-w-[200px] flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search farmer, farm, or observations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background border-border focus:ring-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="date-from" className="text-xs text-muted-foreground whitespace-nowrap">From</Label>
                        <Input
                            id="date-from"
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            className="w-36 bg-background border-border focus:ring-primary"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label htmlFor="date-to" className="text-xs text-muted-foreground whitespace-nowrap">To</Label>
                        <Input
                            id="date-to"
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            className="w-36 bg-background border-border focus:ring-primary"
                        />
                    </div>
                    <Badge variant="secondary" className="ml-auto font-medium">
                        {fieldVisitsTotal} total
                    </Badge>
                </CardContent>
            </Card>

            {/* Visits Table */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/40 rounded-lg shadow-xl overflow-hidden">
                <CardHeader className="border-b border-border/40">
                    <CardTitle className="font-heading text-xl">Visit History</CardTitle>
                    <CardDescription>
                        Your field visit records including observations, advisories, and follow-up actions.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {loadingFieldVisits ? (
                        <div className="p-12 flex flex-col items-center gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            <span>Loading field visits...</span>
                        </div>
                    ) : filteredVisits.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground">
                            <MapPin className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No field visits found</p>
                            <p className="text-sm mt-1">Log your first visit to start tracking advisory delivery.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur z-10">
                                    <TableRow>
                                        <TableHead className="font-heading">Farmer</TableHead>
                                        <TableHead>Farm</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Observations</TableHead>
                                        <TableHead>Advisories</TableHead>
                                        <TableHead>Follow-up</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredVisits.map((row, idx) => (
                                        <TableRow
                                            key={row.id}
                                            className={`cursor-pointer transition-colors hover:bg-muted/30 ${idx % 2 === 1 ? 'bg-muted/20' : ''}`}
                                            onClick={() => setEditFieldVisitsTarget(row)}
                                        >
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-primary shrink-0" />
                                                    <span>{row.farmer_name || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                    <MapPin className="h-3 w-3 shrink-0" />
                                                    <span>{row.farm_id || '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                                                    <span>{row.visit_date ? new Date(row.visit_date).toLocaleDateString() : '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="max-w-[180px]">
                                                <p className="text-sm truncate" title={row.observations || ''}>
                                                    {row.observations || '—'}
                                                </p>
                                            </TableCell>
                                            <TableCell className="max-w-[180px]">
                                                <p className="text-sm truncate" title={row.advisories_given || ''}>
                                                    {row.advisories_given || '—'}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                {row.follow_up_actions ? (
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                                                        <span className="truncate max-w-[120px]" title={row.follow_up_actions}>
                                                            {row.follow_up_actions}
                                                        </span>
                                                        {row.follow_up_due_date && (
                                                            <span className="text-xs text-muted-foreground ml-1">
                                                                ({new Date(row.follow_up_due_date).toLocaleDateString()})
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={statusColor(row.status)}>
                                                    {(row.status ?? 'unknown').replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-44">
                                                        <DropdownMenuItem onClick={() => setEditFieldVisitsTarget(row)}>
                                                            <Pencil className="mr-2 h-4 w-4" /> Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openDetailDialog(row)}>
                                                            <Eye className="mr-2 h-4 w-4" /> View detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                if (row.id) setDeleteTargetId(row.id);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            </Card>

            {/* Pagination */}
            {Math.max(1, Math.ceil(fieldVisitsTotal / fieldVisitsLimit)) > 1 && (
                <div className="flex items-center justify-between rounded-lg border border-border/40 bg-card/60 backdrop-blur-md px-4 py-3 shadow-md">
                    <span className="text-sm text-muted-foreground">
                        Page {fieldVisitsPage} of {Math.max(1, Math.ceil(fieldVisitsTotal / fieldVisitsLimit))}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFieldVisitsPage((p) => Math.max(1, p - 1))}
                            disabled={fieldVisitsPage <= 1}
                        >
                            <ArrowLeft className="mr-1 h-4 w-4" /> Prev
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFieldVisitsPage((p) => p + 1)}
                            disabled={fieldVisitsPage >= Math.ceil(fieldVisitsTotal / fieldVisitsLimit)}
                        >
                            Next <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Create Visit Dialog */}
            <Dialog open={createFieldVisitsOpen} onOpenChange={setCreateFieldVisitsOpen}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Log Field Visit</DialogTitle>
                        <DialogDescription>
                            Record a new field visit with observations, advisories given, and follow-up actions.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Farmer selector — searchable Combobox (Popover + Command) */}
                        <div>
                            <Label htmlFor="create_farmer_id" className="text-sm font-medium">Farmer *</Label>
                            <div className="mt-2">
                                <Popover open={farmerComboboxOpen} onOpenChange={setFarmerComboboxOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            id="create_farmer_id"
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={farmerComboboxOpen}
                                            className="w-full justify-between bg-background border-border focus:ring-primary font-normal"
                                        >
                                            <span className="truncate text-left">
                                                {(() => {
                                                    const selectedId = createForm.watch('farmer_id');
                                                    const selected = farmers.find((f) => f.id === selectedId);
                                                    return selected
                                                        ? `${selected.full_name} — ${selected.district} (${selected.phone_number})`
                                                        : 'Select a farmer...';
                                                })()}
                                            </span>
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                        <Command shouldFilter={false}>
                                            <CommandInput
                                                placeholder="Search farmers by name, phone, or district..."
                                                value={farmerSearch}
                                                onValueChange={handleFarmerSearchChange}
                                            />
                                            <CommandList>
                                                <CommandEmpty>
                                                    {loadingFarmers ? 'Searching...' : 'No farmer found.'}
                                                </CommandEmpty>
                                                <CommandGroup>
                                                    {farmers.map((f) => {
                                                        const isSelected = createForm.watch('farmer_id') === f.id;
                                                        return (
                                                            <CommandItem
                                                                key={f.id}
                                                                value={`${f.full_name ?? ''} ${f.phone_number ?? ''} ${f.district ?? ''}`}
                                                                onSelect={() => {
                                                                    createForm.setValue('farmer_id', f.id ?? '');
                                                                    setFarmerComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        isSelected ? 'opacity-100' : 'opacity-0',
                                                                    )}
                                                                />
                                                                <span className="truncate">
                                                                    {f.full_name} — {f.district} ({f.phone_number})
                                                                </span>
                                                            </CommandItem>
                                                        );
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                {createForm.formState.errors.farmer_id && (
                                    <p className="text-xs text-destructive mt-1">{createForm.formState.errors.farmer_id.message}</p>
                                )}
                            </div>
                        </div>

                        {/* Farm ID */}
                        <div>
                            <Label htmlFor="create_farm_id" className="text-sm font-medium">Farm ID</Label>
                            <Input
                                id="create_farm_id"
                                {...createForm.register('farm_id')}
                                placeholder="e.g. FARM-001"
                                className="mt-2 bg-background border-border focus:ring-primary"
                            />
                        </div>

                        {/* Visit date */}
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="create_visit_date" className="text-sm font-medium">Visit Date *</Label>
                                <Input
                                    id="create_visit_date"
                                    type="date"
                                    {...createForm.register('visit_date')}
                                    className="mt-2 bg-background border-border focus:ring-primary"
                                />
                                {createForm.formState.errors.visit_date && (
                                    <p className="text-xs text-destructive mt-1">{createForm.formState.errors.visit_date.message}</p>
                                )}
                            </div>
                            <div>
                                <Label htmlFor="create_follow_up_due_date" className="text-sm font-medium">Follow-up Due Date</Label>
                                <Input
                                    id="create_follow_up_due_date"
                                    type="date"
                                    {...createForm.register('follow_up_due_date')}
                                    className="mt-2 bg-background border-border focus:ring-primary"
                                />
                            </div>
                        </div>

                        {/* Observations */}
                        <div>
                            <Label htmlFor="create_observations" className="text-sm font-medium">Observations</Label>
                            <Textarea
                                id="create_observations"
                                {...createForm.register('observations')}
                                placeholder="General observations during the visit..."
                                rows={3}
                                className="mt-2 bg-background border-border focus:ring-primary resize-none"
                            />
                        </div>

                        {/* Detailed observations grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label htmlFor="create_pest_sightings" className="text-sm font-medium">Pest Sightings</Label>
                                <Textarea
                                    id="create_pest_sightings"
                                    {...createForm.register('pest_sightings')}
                                    placeholder="Any pests observed..."
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_crop_condition" className="text-sm font-medium">Crop Condition</Label>
                                <Textarea
                                    id="create_crop_condition"
                                    {...createForm.register('crop_condition')}
                                    placeholder="Crop health assessment..."
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="create_soil_observations" className="text-sm font-medium">Soil Observations</Label>
                                <Textarea
                                    id="create_soil_observations"
                                    {...createForm.register('soil_observations')}
                                    placeholder="Soil condition notes..."
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                        </div>

                        {/* Advisories & follow-up */}
                        <div>
                            <Label htmlFor="create_advisories_given" className="text-sm font-medium">Advisories Given</Label>
                            <Textarea
                                id="create_advisories_given"
                                {...createForm.register('advisories_given')}
                                placeholder="Recommendations provided to the farmer..."
                                rows={3}
                                className="mt-2 bg-background border-border focus:ring-primary resize-none"
                            />
                        </div>
                        <div>
                            <Label htmlFor="create_follow_up_actions" className="text-sm font-medium">Follow-up Actions</Label>
                            <Textarea
                                id="create_follow_up_actions"
                                {...createForm.register('follow_up_actions')}
                                placeholder="Actions to follow up on..."
                                rows={2}
                                className="mt-2 bg-background border-border focus:ring-primary resize-none"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateFieldVisitsOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={createForm.handleSubmit((data) => void handleCreateFieldVisits(data))}
                            className="transition-all duration-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.55)]"
                        >
                            <ClipboardList className="mr-2 h-4 w-4" /> Log Visit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Visit Dialog */}
            <Dialog open={!!editFieldVisitsTarget} onOpenChange={(o) => !o && setEditFieldVisitsTarget(null)}>
                <DialogContent className="max-w-2xl bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Edit Field Visit</DialogTitle>
                        <DialogDescription>
                            Update observations, advisories, follow-up actions, or visit status.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto pr-2">
                        {/* Status */}
                        <div>
                            <Label className="text-sm font-medium">Status</Label>
                            <Select
                                value={editForm.watch('status') || undefined}
                                onValueChange={(v) => editForm.setValue('status', v)}
                            >
                                <SelectTrigger className="mt-2 bg-background border-border focus:ring-primary">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="scheduled">Scheduled</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="follow_up">Follow-up</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Observations */}
                        <div>
                            <Label htmlFor="edit_observations" className="text-sm font-medium">Observations</Label>
                            <Textarea
                                id="edit_observations"
                                {...editForm.register('observations')}
                                rows={3}
                                className="mt-2 bg-background border-border focus:ring-primary resize-none"
                            />
                        </div>

                        {/* Detailed observations grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <Label htmlFor="edit_pest_sightings" className="text-sm font-medium">Pest Sightings</Label>
                                <Textarea
                                    id="edit_pest_sightings"
                                    {...editForm.register('pest_sightings')}
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit_crop_condition" className="text-sm font-medium">Crop Condition</Label>
                                <Textarea
                                    id="edit_crop_condition"
                                    {...editForm.register('crop_condition')}
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit_soil_observations" className="text-sm font-medium">Soil Observations</Label>
                                <Textarea
                                    id="edit_soil_observations"
                                    {...editForm.register('soil_observations')}
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                        </div>

                        {/* Advisories & follow-up */}
                        <div>
                            <Label htmlFor="edit_advisories_given" className="text-sm font-medium">Advisories Given</Label>
                            <Textarea
                                id="edit_advisories_given"
                                {...editForm.register('advisories_given')}
                                rows={3}
                                className="mt-2 bg-background border-border focus:ring-primary resize-none"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label htmlFor="edit_follow_up_actions" className="text-sm font-medium">Follow-up Actions</Label>
                                <Textarea
                                    id="edit_follow_up_actions"
                                    {...editForm.register('follow_up_actions')}
                                    rows={2}
                                    className="mt-2 bg-background border-border focus:ring-primary resize-none"
                                />
                            </div>
                            <div>
                                <Label htmlFor="edit_follow_up_due_date" className="text-sm font-medium">Follow-up Due Date</Label>
                                <Input
                                    id="edit_follow_up_due_date"
                                    type="date"
                                    {...editForm.register('follow_up_due_date')}
                                    className="mt-2 bg-background border-border focus:ring-primary"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditFieldVisitsTarget(null)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={editForm.handleSubmit((data) => {
                                if (!editFieldVisitsTarget) return;
                                void handleUpdateFieldVisits(data as FieldVisitsUpdateParams);
                            })}
                            className="transition-all duration-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.55)]"
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Detail Dialog */}
            <Dialog open={detailDialogOpen} onOpenChange={(o) => { if (!o) { setDetailDialogOpen(false); setDetailItem(null); } }}>
                <DialogContent className="max-w-xl bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Visit Detail</DialogTitle>
                        <DialogDescription>Full record for this field visit.</DialogDescription>
                    </DialogHeader>
                    {loadingDetailItem ? (
                        <div className="py-10 flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : detailItem ? (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Farmer</p>
                                    <p className="mt-1 text-base font-medium">{detailItem.farmer_name || '—'}</p>
                                </div>
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Visit Date</p>
                                    <p className="mt-1 text-base font-medium">
                                        {detailItem.visit_date ? new Date(detailItem.visit_date).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Observations</p>
                                <p className="mt-1 text-sm whitespace-pre-wrap">{detailItem.observations || '—'}</p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Pest Sightings</p>
                                    <p className="mt-1 text-sm">{detailItem.pest_sightings || '—'}</p>
                                </div>
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Crop Condition</p>
                                    <p className="mt-1 text-sm">{detailItem.crop_condition || '—'}</p>
                                </div>
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-3">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Soil Observations</p>
                                    <p className="mt-1 text-sm">{detailItem.soil_observations || '—'}</p>
                                </div>
                            </div>
                            <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Advisories Given</p>
                                <p className="mt-1 text-sm whitespace-pre-wrap">{detailItem.advisories_given || '—'}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Follow-up Actions</p>
                                    <p className="mt-1 text-sm whitespace-pre-wrap">{detailItem.follow_up_actions || '—'}</p>
                                </div>
                                <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Follow-up Due</p>
                                    <p className="mt-1 text-sm">
                                        {detailItem.follow_up_due_date ? new Date(detailItem.follow_up_due_date).toLocaleDateString() : '—'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Badge className={statusColor(detailItem.status)}>
                                    {(detailItem.status ?? 'unknown').replace('_', ' ')}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                    Created: {detailItem.created_at ? new Date(detailItem.created_at).toLocaleString() : '—'}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">No detail available.</p>
                    )}
                    <DialogFooter>
                        <Button onClick={() => { setDetailDialogOpen(false); setDetailItem(null); }}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export NAADS Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="max-w-md bg-card/95 backdrop-blur-md border-border/60 rounded-lg shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-2xl">Export NAADS Report</DialogTitle>
                        <DialogDescription>
                            Generate a structured field visit report in NAADS district reporting format.
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
                                    className="mt-2 bg-background border-border focus:ring-primary"
                                />
                            </div>
                            <div>
                                <Label htmlFor="export_to" className="text-sm font-medium">To Date</Label>
                                <Input
                                    id="export_to"
                                    type="date"
                                    value={exportToDate}
                                    onChange={(e) => setExportToDate(e.target.value)}
                                    className="mt-2 bg-background border-border focus:ring-primary"
                                />
                            </div>
                        </div>
                        <div>
                            <Label className="text-sm font-medium">Format</Label>
                            <Select value={exportFormat} onValueChange={setExportFormat}>
                                <SelectTrigger className="mt-2 bg-background border-border focus:ring-primary">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="csv">CSV</SelectItem>
                                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                                    <SelectItem value="pdf">PDF</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={() => void handleExport()}
                            disabled={loadingExportItem}
                            className="transition-all duration-200 hover:shadow-[0_0_18px_rgba(74,222,128,0.55)]"
                        >
                            {loadingExportItem ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Download className="mr-2 h-4 w-4" />
                            )}
                            Generate Report
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteTargetId} onOpenChange={(o) => { if (!o) setDeleteTargetId(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Field Visit</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this field visit record? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTargetId) {
                                    void handleDeleteFieldVisits({ id: deleteTargetId });
                                    setDeleteTargetId(null);
                                }
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
