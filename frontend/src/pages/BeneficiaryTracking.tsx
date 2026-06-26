import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    beneficiariesService,
    type BeneficiariesCreateParams,
    type BeneficiariesDeleteParams,
    type BeneficiariesListParams,
    type BeneficiariesListResponse,
    type BeneficiariesStatsResponse,
} from '@/lib/api/beneficiariesService';
import { beneficiariesCreateSchema, type BeneficiariesCreateInput } from '@/lib/api/beneficiariesFormSchema';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
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
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import { Check, ChevronsUpDown, Users, Activity, AlertTriangle, Search, PlusCircle, MoreVertical, Eye, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Beneficiary = BeneficiariesListResponse['data'][number];

// ── Helper badge components ──────────────────────────────────────────────────

function StatusBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-muted-foreground text-xs">—</span>;
    const map: Record<string, string> = {
        active: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        disengaged: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        pending: 'bg-blue-500/15 text-blue-700 dark:text-blue-300',
    };
    const cls = map[status.toLowerCase()] ?? 'bg-muted text-muted-foreground';
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
            {status}
        </span>
    );
}

function PracticeAdoptionBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-muted-foreground text-xs">—</span>;
    const map: Record<string, string> = {
        adopted: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
        partial: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
        'not adopted': 'bg-red-500/15 text-red-700 dark:text-red-300',
    };
    const cls = map[status.toLowerCase()] ?? 'bg-muted text-muted-foreground';
    return (
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>
            {status}
        </span>
    );
}

// ── Create Form ───────────────────────────────────────────────────────────────

interface CreateBeneficiaryFormProps {
    onSubmit: (data: BeneficiariesCreateParams) => Promise<void>;
    onCancel: () => void;
}

function CreateBeneficiaryForm({ onSubmit, onCancel }: CreateBeneficiaryFormProps) {
    const [submitting, setSubmitting] = useState(false);
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<BeneficiariesCreateInput>({
        resolver: zodResolver(beneficiariesCreateSchema),
    });

    async function onValid(data: BeneficiariesCreateInput) {
        setSubmitting(true);
        try {
            await onSubmit({
                full_name: data.full_name,
                phone_number: data.phone_number ?? '',
                district: data.district ?? '',
                sub_county: data.sub_county ?? '',
                programme_id: data.programme_id ?? '',
                crop_ids: data.crop_ids ?? [],
                enrolment_date: data.enrolment_date ?? '',
                intervention_type: data.intervention_type ?? '',
                gps_lat: data.gps_lat ?? 0,
                gps_lng: data.gps_lng ?? 0,
            });
            reset();
        } finally {
            setSubmitting(false);
        }
    }

    const fieldClass =
        'w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 placeholder:text-muted-foreground/60';
    const errorClass = 'mt-1 text-xs text-destructive';
    const labelClass = 'block text-sm font-medium text-foreground mb-1';

    return (
        <form onSubmit={handleSubmit(onValid)} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={labelClass}>Full Name <span className="text-destructive">*</span></label>
                    <input {...register('full_name')} className={fieldClass} placeholder="e.g. Amina Nakato" />
                    {errors.full_name && <p className={errorClass}>{errors.full_name.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>Phone Number</label>
                    <input {...register('phone_number')} className={fieldClass} placeholder="+256 700 000000" />
                    {errors.phone_number && <p className={errorClass}>{errors.phone_number.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>District</label>
                    <input {...register('district')} className={fieldClass} placeholder="e.g. Kampala" />
                    {errors.district && <p className={errorClass}>{errors.district.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>Sub-County</label>
                    <input {...register('sub_county')} className={fieldClass} placeholder="e.g. Nakawa" />
                    {errors.sub_county && <p className={errorClass}>{errors.sub_county.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>Programme ID</label>
                    <input {...register('programme_id')} className={fieldClass} placeholder="e.g. PROG-001" />
                    {errors.programme_id && <p className={errorClass}>{errors.programme_id.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>Intervention Type</label>
                    <select {...register('intervention_type')} className={fieldClass}>
                        <option value="">Select type…</option>
                        <option value="inputs">Agricultural Inputs</option>
                        <option value="training">Training</option>
                        <option value="advisory">Advisory</option>
                        <option value="finance">Finance</option>
                        <option value="infrastructure">Infrastructure</option>
                    </select>
                    {errors.intervention_type && <p className={errorClass}>{errors.intervention_type.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>Enrolment Date</label>
                    <input {...register('enrolment_date')} type="date" className={fieldClass} />
                    {errors.enrolment_date && <p className={errorClass}>{errors.enrolment_date.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>Crop IDs (comma-separated)</label>
                    <input
                        {...register('crop_ids', {
                            setValueAs: (v: string) =>
                                typeof v === 'string' && v.trim()
                                    ? v.split(',').map(s => s.trim()).filter(Boolean)
                                    : [],
                        })}
                        className={fieldClass}
                        placeholder="maize, beans, coffee"
                    />
                    {errors.crop_ids && <p className={errorClass}>{String(errors.crop_ids.message)}</p>}
                </div>
                <div>
                    <label className={labelClass}>GPS Latitude</label>
                    <input {...register('gps_lat')} type="number" step="any" className={fieldClass} placeholder="e.g. 0.3476" />
                    {errors.gps_lat && <p className={errorClass}>{errors.gps_lat.message}</p>}
                </div>
                <div>
                    <label className={labelClass}>GPS Longitude</label>
                    <input {...register('gps_lng')} type="number" step="any" className={fieldClass} placeholder="e.g. 32.5825" />
                    {errors.gps_lng && <p className={errorClass}>{errors.gps_lng.message}</p>}
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors duration-200"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.55)] transition-all duration-200 ease-out text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enrol Beneficiary
                </button>
            </div>
        </form>
    );
}

// ── Main Page Component ───────────────────────────────────────────────────────

export default function BeneficiaryTracking() {
    const navigate = useNavigate();

    // List state — GET /beneficiaries/list
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
    const [beneficiariesPage, setBeneficiariesPage] = useState(1);
    const [beneficiariesLimit] = useState(10);
    const [beneficiariesTotal, setBeneficiariesTotal] = useState(0);
    // Detail state — GET /beneficiaries/stats
    const [beneficiariesItem, setBeneficiariesItem] = useState<BeneficiariesStatsResponse['data'] | null>(null);
    const [loadingBeneficiariesItem, setLoadingBeneficiariesItem] = useState(true);
    // Create dialog state — POST /beneficiaries/create
    const [createBeneficiariesOpen, setCreateBeneficiariesOpen] = useState(false);
    // Delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    // Filter / search state
    const [searchText, setSearchText] = useState('');
    const [filterDistrict, setFilterDistrict] = useState('');
    const [filterCrop, setFilterCrop] = useState('');
    const [filterProgramme, setFilterProgramme] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterInterventionType, setFilterInterventionType] = useState('');
    const [filterEnrolmentFrom, setFilterEnrolmentFrom] = useState('');
    const [filterEnrolmentTo, setFilterEnrolmentTo] = useState('');
    // Combobox open state for searchable filters
    const [districtOpen, setDistrictOpen] = useState(false);
    const [cropOpen, setCropOpen] = useState(false);
    const [programmeOpen, setProgrammeOpen] = useState(false);

    useEffect(() => {
        void loadBeneficiaries();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [beneficiariesPage, searchText, filterDistrict, filterCrop, filterProgramme, filterInterventionType, filterEnrolmentFrom, filterEnrolmentTo]);

    useEffect(() => {
        void loadStats();
    }, []);

    async function loadStats() {
        try {
            setLoadingBeneficiariesItem(true);
            const res = await beneficiariesService.stats({});
            setBeneficiariesItem(res?.data ?? null);
        } catch (err) {
            console.error('[loadStats]', err);
        } finally {
            setLoadingBeneficiariesItem(false);
        }
    }

    async function loadBeneficiaries() {
        try {
            setLoadingBeneficiaries(true);
            const params: BeneficiariesListParams = {
                page: beneficiariesPage,
                limit: beneficiariesLimit,
            };
            if (searchText.trim()) params.search = searchText.trim();
            if (filterDistrict.trim()) params.district = filterDistrict.trim();
            if (filterCrop.trim()) params.crop = filterCrop.trim();
            if (filterProgramme.trim()) params.programme_id = filterProgramme.trim();
            if (filterInterventionType.trim()) params.intervention_type = filterInterventionType.trim();
            if (filterEnrolmentFrom.trim()) params.enrolment_from = filterEnrolmentFrom.trim();
            if (filterEnrolmentTo.trim()) params.enrolment_to = filterEnrolmentTo.trim();
            const res = await beneficiariesService.list(params);
            setBeneficiaries(Array.isArray(res?.data) ? res.data : []);
            setBeneficiariesTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load beneficiaries');
            console.error('[loadBeneficiaries]', err);
        } finally {
            setLoadingBeneficiaries(false);
        }
    }

    async function handleCreateBeneficiaries(data: BeneficiariesCreateParams) {
        await beneficiariesService.create(data);
        toast.success('Beneficiary enrolled successfully');
        setCreateBeneficiariesOpen(false);
        void loadBeneficiaries();
        void loadStats();
    }

    async function handleDeleteBeneficiaries(params: BeneficiariesDeleteParams) {
        try {
            await beneficiariesService.delete(params);
            toast.success('Beneficiary removed');
            void loadBeneficiaries();
            void loadStats();
        } catch (err) {
            toast.error('Failed to remove beneficiary');
            console.error('[handleDeleteBeneficiaries]', err);
        }
    }

    function gotoPage_29_sub_1(beneficiaryId: string | number) {
        navigate(`/partner/beneficiaries/${beneficiaryId}`);
    }

    // Derived: unique districts for the filter dropdown
    const districtOptions = useMemo(() => {
        const set = new Set<string>();
        beneficiaries.forEach(b => { if (b.district) set.add(b.district); });
        // Also include stats districts if available
        (beneficiariesItem?.by_district ?? []).forEach(d => { if (d.district) set.add(d.district); });
        return Array.from(set).sort();
    }, [beneficiaries, beneficiariesItem]);

    // Derived: client-side status filter (other filters are sent to API)
    const filteredBeneficiaries = useMemo(() => {
        if (!filterStatus) return beneficiaries;
        return beneficiaries.filter(b => (b.enrolment_status ?? '').toLowerCase() === filterStatus.toLowerCase());
    }, [beneficiaries, filterStatus]);

    return (
        <div className="p-6 md:p-8 space-y-6 min-h-screen bg-background">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight">
                        Beneficiary Tracking
                    </h1>
                    <p className="mt-1 text-muted-foreground text-sm">
                        Searchable registry of programme beneficiaries across Uganda's agricultural development initiatives
                    </p>
                </div>
                <button
                    onClick={() => setCreateBeneficiariesOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-transparent border border-primary text-primary shadow-[0_0_12px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_20px_hsl(var(--primary)/0.55)] transition-all duration-200 ease-out text-sm font-medium"
                >
                    <PlusCircle className="w-4 h-4" />
                    Enrol Beneficiary
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loadingBeneficiariesItem ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-8 w-16" />
                        </div>
                    ))
                ) : beneficiariesItem ? (
                    <>
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-primary/10">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Beneficiaries</p>
                                <p className="text-2xl font-bold text-foreground font-heading">{beneficiariesItem.total_beneficiaries ?? 0}</p>
                            </div>
                        </div>
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-emerald-500/10">
                                <Activity className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Active</p>
                                <p className="text-2xl font-bold text-emerald-500 font-heading">{beneficiariesItem.active ?? 0}</p>
                            </div>
                        </div>
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex items-center gap-4">
                            <div className="p-3 rounded-lg bg-amber-500/10">
                                <AlertTriangle className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wide">Disengaged</p>
                                <p className="text-2xl font-bold text-amber-500 font-heading">{beneficiariesItem.disengaged ?? 0}</p>
                            </div>
                        </div>
                    </>
                ) : null}
            </div>

            {/* Filters Bar */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4">
                <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Search</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search by name, district…"
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                            />
                        </div>
                    </div>
                    <div className="min-w-[170px]">
                        <label className="text-xs text-muted-foreground mb-1 block">District</label>
                        <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={districtOpen}
                                    className="w-full justify-between font-normal bg-background"
                                >
                                    {filterDistrict || 'All Districts'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search districts…" />
                                    <CommandList>
                                        <CommandEmpty>No district found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value=""
                                                onSelect={() => {
                                                    setFilterDistrict('');
                                                    setBeneficiariesPage(1);
                                                    setDistrictOpen(false);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', !filterDistrict ? 'opacity-100' : 'opacity-0')} />
                                                <span>All Districts</span>
                                            </CommandItem>
                                            {districtOptions.map(d => (
                                                <CommandItem
                                                    key={d}
                                                    value={d}
                                                    onSelect={() => {
                                                        const next = filterDistrict === d ? '' : d;
                                                        setFilterDistrict(next);
                                                        setBeneficiariesPage(1);
                                                        setDistrictOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', filterDistrict === d ? 'opacity-100' : 'opacity-0')} />
                                                    <span>{d}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="min-w-[170px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Crop</label>
                        <Popover open={cropOpen} onOpenChange={setCropOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={cropOpen}
                                    className="w-full justify-between font-normal bg-background"
                                >
                                    {filterCrop || 'All Crops'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search crops…" />
                                    <CommandList>
                                        <CommandEmpty>No crop found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value=""
                                                onSelect={() => {
                                                    setFilterCrop('');
                                                    setBeneficiariesPage(1);
                                                    setCropOpen(false);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', !filterCrop ? 'opacity-100' : 'opacity-0')} />
                                                <span>All Crops</span>
                                            </CommandItem>
                                            {(beneficiariesItem?.by_crop ?? []).map(c => (
                                                <CommandItem
                                                    key={c.crop ?? ''}
                                                    value={c.crop ?? ''}
                                                    onSelect={() => {
                                                        const next = filterCrop === c.crop ? '' : (c.crop ?? '');
                                                        setFilterCrop(next);
                                                        setBeneficiariesPage(1);
                                                        setCropOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', filterCrop === c.crop ? 'opacity-100' : 'opacity-0')} />
                                                    <span>{c.crop ?? '—'}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="min-w-[170px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Programme</label>
                        <Popover open={programmeOpen} onOpenChange={setProgrammeOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={programmeOpen}
                                    className="w-full justify-between font-normal bg-background"
                                >
                                    {filterProgramme || 'All Programmes'}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Search programmes…" />
                                    <CommandList>
                                        <CommandEmpty>No programme found.</CommandEmpty>
                                        <CommandGroup>
                                            <CommandItem
                                                value=""
                                                onSelect={() => {
                                                    setFilterProgramme('');
                                                    setBeneficiariesPage(1);
                                                    setProgrammeOpen(false);
                                                }}
                                            >
                                                <Check className={cn('mr-2 h-4 w-4', !filterProgramme ? 'opacity-100' : 'opacity-0')} />
                                                <span>All Programmes</span>
                                            </CommandItem>
                                            {(beneficiariesItem?.by_programme ?? []).map(p => (
                                                <CommandItem
                                                    key={p.programme ?? ''}
                                                    value={p.programme ?? ''}
                                                    onSelect={() => {
                                                        const next = filterProgramme === p.programme ? '' : (p.programme ?? '');
                                                        setFilterProgramme(next);
                                                        setBeneficiariesPage(1);
                                                        setProgrammeOpen(false);
                                                    }}
                                                >
                                                    <Check className={cn('mr-2 h-4 w-4', filterProgramme === p.programme ? 'opacity-100' : 'opacity-0')} />
                                                    <span>{p.programme ?? '—'}</span>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="min-w-[150px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Enrolment Status</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="disengaged">Disengaged</option>
                            <option value="pending">Pending</option>
                        </select>
                    </div>
                    <div className="min-w-[160px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Intervention Type</label>
                        <select
                            value={filterInterventionType}
                            onChange={e => { setFilterInterventionType(e.target.value); setBeneficiariesPage(1); }}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                            <option value="">All Types</option>
                            <option value="inputs">Agricultural Inputs</option>
                            <option value="training">Training</option>
                            <option value="advisory">Advisory</option>
                            <option value="finance">Finance</option>
                            <option value="infrastructure">Infrastructure</option>
                        </select>
                    </div>
                    <div className="min-w-[140px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Enrolled From</label>
                        <input
                            type="date"
                            value={filterEnrolmentFrom}
                            onChange={e => { setFilterEnrolmentFrom(e.target.value); setBeneficiariesPage(1); }}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <div className="min-w-[140px]">
                        <label className="text-xs text-muted-foreground mb-1 block">Enrolled To</label>
                        <input
                            type="date"
                            value={filterEnrolmentTo}
                            onChange={e => { setFilterEnrolmentTo(e.target.value); setBeneficiariesPage(1); }}
                            className="w-full px-3 py-2 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                        />
                    </div>
                    <button
                        onClick={() => {
                            setSearchText('');
                            setFilterDistrict('');
                            setFilterCrop('');
                            setFilterProgramme('');
                            setFilterStatus('');
                            setFilterInterventionType('');
                            setFilterEnrolmentFrom('');
                            setFilterEnrolmentTo('');
                            setBeneficiariesPage(1);
                        }}
                        className="px-4 py-2 rounded-md border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors duration-200"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Beneficiaries Table */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/40 bg-muted/30">
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">District</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Sub-County</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Crops</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Enrolment</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Practice Adoption</th>
                                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Last Outcome</th>
                                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loadingBeneficiaries ? (
                                Array.from({ length: 6 }).map((_, i) => (
                                    <tr key={i} className="border-b border-border/20">
                                        {Array.from({ length: 9 }).map((__, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton className="h-4 w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredBeneficiaries.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-4 py-16 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-3">
                                            <Users className="w-10 h-10 text-muted-foreground/40" />
                                            <p className="font-medium">No beneficiaries found</p>
                                            <p className="text-xs">Adjust your filters or enrol a new beneficiary.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredBeneficiaries.map(b => (
                                    <tr
                                        key={b.id}
                                        onClick={() => b.id && gotoPage_29_sub_1(b.id)}
                                        className="border-b border-border/20 hover:bg-primary/5 cursor-pointer transition-colors duration-200 ease-out group"
                                    >
                                        <td className="px-4 py-3 font-medium text-foreground group-hover:text-primary transition-colors duration-200">
                                            {b.full_name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{b.district ?? '—'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{b.sub_county ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {(b.crops ?? []).slice(0, 2).map(c => (
                                                    <span key={c} className="px-2 py-0.5 rounded-full text-xs bg-amber-500/15 text-amber-700 dark:text-amber-300 font-medium">{c}</span>
                                                ))}
                                                {(b.crops?.length ?? 0) > 2 && (
                                                    <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">+{(b.crops?.length ?? 0) - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {b.enrolment_date ? new Date(b.enrolment_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={b.enrolment_status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <PracticeAdoptionBadge status={b.practice_adoption_status} />
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            {b.last_outcome_date ? new Date(b.last_outcome_date).toLocaleDateString() : '—'}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors duration-200">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-44">
                                                    <DropdownMenuItem
                                                        onClick={() => b.id && gotoPage_29_sub_1(b.id)}
                                                        className="cursor-pointer"
                                                    >
                                                        <Eye className="w-4 h-4 mr-2" />
                                                        View Detail
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => b.id && setDeleteTarget(b.id)}
                                                        className="cursor-pointer text-destructive focus:text-destructive"
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        Remove
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {beneficiariesTotal > beneficiariesLimit && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                        <p className="text-xs text-muted-foreground">
                            Page {beneficiariesPage} of {Math.ceil(beneficiariesTotal / beneficiariesLimit)} &mdash; {beneficiariesTotal} beneficiaries
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled={beneficiariesPage <= 1}
                                onClick={() => setBeneficiariesPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Previous
                            </button>
                            <button
                                disabled={beneficiariesPage >= Math.ceil(beneficiariesTotal / beneficiariesLimit)}
                                onClick={() => setBeneficiariesPage(p => p + 1)}
                                className="px-3 py-1.5 text-xs rounded-md border border-border text-muted-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Beneficiary Dialog */}
            <Dialog open={createBeneficiariesOpen} onOpenChange={setCreateBeneficiariesOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-xl">Enrol New Beneficiary</DialogTitle>
                        <DialogDescription>
                            Register a new programme beneficiary with personal and farm details.
                        </DialogDescription>
                    </DialogHeader>
                    <CreateBeneficiaryForm onSubmit={handleCreateBeneficiaries} onCancel={() => setCreateBeneficiariesOpen(false)} />
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => { if (!open) setDeleteTarget(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Beneficiary</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this beneficiary from the registry? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (deleteTarget) {
                                    void handleDeleteBeneficiaries({ id: deleteTarget });
                                    setDeleteTarget(null);
                                }
                            }}
                        >
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
