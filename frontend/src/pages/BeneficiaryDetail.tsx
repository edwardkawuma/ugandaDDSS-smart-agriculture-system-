import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/formatCurrency';
import { cn } from '@/lib/utils';
import {
    ArrowLeft,
    User,
    MapPin,
    Phone,
    Leaf,
    Package,
    GraduationCap,
    TrendingUp,
    ClipboardList,
    Flag,
    Link2,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ChevronsUpDown,
    Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { beneficiariesUpdateSchema, type BeneficiariesUpdateInput } from '@/lib/api/beneficiariesFormSchema';
import {
    beneficiariesService,
    type BeneficiariesDetailResponse,
    type BeneficiariesUpdateParams,
} from '@/lib/api/beneficiariesService';
import {
    impactService,
    type ImpactAssessmentListResponse,
    type ImpactBeneficiaryLinkParams,
} from '@/lib/api/impactService';

type Impact = ImpactAssessmentListResponse['data'][number];
type Beneficiary = BeneficiariesDetailResponse['data'];

export default function BeneficiaryDetail() {
    const navigate = useNavigate();
    const { id = '' } = useParams<{ id: string }>();
    function goBack() { navigate(-1); }

    // Detail state — GET /beneficiaries/detail
    const [beneficiariesItem, setBeneficiariesItem] = useState<BeneficiariesDetailResponse['data'] | null>(null);
    const [loadingBeneficiariesItem, setLoadingBeneficiariesItem] = useState(true);
    // ↑ Beneficiary is the singular row type
    // List state — GET /impact/assessment/list
    const [impact, setImpact] = useState<Impact[]>([]);
    const [loadingImpact, setLoadingImpact] = useState(true);
    const [impactPage, setImpactPage] = useState(1);
    const [impactLimit] = useState(10);
    const [impactTotal, setImpactTotal] = useState(0);
    // Edit dialog state — PUT /beneficiaries/update
    const [editBeneficiariesTarget, setEditBeneficiariesTarget] = useState<Beneficiary | null>(null);
    // Link to impact assessment dialog state
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState('');
    const [selectedAssessmentLabel, setSelectedAssessmentLabel] = useState('');
    const [assessmentComboboxOpen, setAssessmentComboboxOpen] = useState(false);
    const [assessmentSearch, setAssessmentSearch] = useState('');
    const [assessmentOptions, setAssessmentOptions] = useState<Impact[]>([]);
    const [loadingAssessmentOptions, setLoadingAssessmentOptions] = useState(false);
    const assessmentDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [linkPreYield, setLinkPreYield] = useState('');
    const [linkPostYield, setLinkPostYield] = useState('');
    const [linkPreIncome, setLinkPreIncome] = useState('');
    const [linkPostIncome, setLinkPostIncome] = useState('');
    const [linkNotes, setLinkNotes] = useState('');
    const [submittingLink, setSubmittingLink] = useState(false);

    useEffect(() => { if (id) void loadBeneficiariesItem(); }, [id]);
    useEffect(() => { void loadImpact(); }, [impactPage]);

    async function loadBeneficiariesItem() {
        try {
            setLoadingBeneficiariesItem(true);
            const res = await beneficiariesService.detail({ id: id });
            setBeneficiariesItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadBeneficiariesItem]', err);
        } finally {
            setLoadingBeneficiariesItem(false);
        }
    }
    async function loadImpact() {
        try {
            setLoadingImpact(true);
            const res = await impactService.assessmentList({ page: impactPage, limit: impactLimit });
            setImpact(Array.isArray(res?.data) ? res.data : []);
            setImpactTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load impact');
            console.error('[loadImpact]', err);
        } finally {
            setLoadingImpact(false);
        }
    }
    async function handleUpdateBeneficiaries(data: BeneficiariesUpdateParams) {
        try {
            await beneficiariesService.update(data);
            toast.success('Updated');
            setEditBeneficiariesTarget(null);
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateBeneficiaries]', err);
        }
    }
    // POST /impact/beneficiary/link
    async function handleBeneficiaryLink(data: ImpactBeneficiaryLinkParams) {
        try {
            await impactService.beneficiaryLink(data);
            toast.success('Done');
        } catch (err) {
            toast.error('Action failed');
            console.error('[handleBeneficiaryLink]', err);
        }
    }

    // Debounced search for assessment combobox
    function handleAssessmentSearchChange(value: string) {
        setAssessmentSearch(value);
        if (assessmentDebounceRef.current) clearTimeout(assessmentDebounceRef.current);
        assessmentDebounceRef.current = setTimeout(async () => {
            try {
                setLoadingAssessmentOptions(true);
                const res = await impactService.assessmentList({
                    page: 1,
                    limit: 20,
                    ...(beneficiariesItem?.programme_id ? { programme_id: beneficiariesItem.programme_id } : {}),
                });
                setAssessmentOptions(Array.isArray(res?.data) ? res.data : []);
            } catch {
                // silently ignore
            } finally {
                setLoadingAssessmentOptions(false);
            }
        }, 300);
    }

    function openAssessmentCombobox() {
        setAssessmentComboboxOpen(true);
        // Load initial options when combobox opens
        void (async () => {
            try {
                setLoadingAssessmentOptions(true);
                const res = await impactService.assessmentList({
                    page: 1,
                    limit: 20,
                    ...(beneficiariesItem?.programme_id ? { programme_id: beneficiariesItem.programme_id } : {}),
                });
                setAssessmentOptions(Array.isArray(res?.data) ? res.data : []);
            } catch {
                // silently ignore
            } finally {
                setLoadingAssessmentOptions(false);
            }
        })();
    }

    // Edit form
    const editForm = useForm<BeneficiariesUpdateInput>({
        resolver: zodResolver(beneficiariesUpdateSchema),
        values: editBeneficiariesTarget
            ? {
                notes: '',
                flagged_for_followup: undefined,
                practice_adoption_status: editBeneficiariesTarget.enrolment_status ?? '',
                enrolment_status: editBeneficiariesTarget.enrolment_status ?? '',
              }
            : undefined,
    });

    async function onEditSubmit(formData: BeneficiariesUpdateInput) {
        if (!editBeneficiariesTarget?.id) return;
        await handleUpdateBeneficiaries({
            id: editBeneficiariesTarget.id,
            notes: formData.notes ?? '',
            flagged_for_followup: Boolean(formData.flagged_for_followup),
            practice_adoption_status: formData.practice_adoption_status ?? '',
            enrolment_status: formData.enrolment_status ?? '',
        });
        void loadBeneficiariesItem();
    }

    async function handleSubmitLink() {
        if (!selectedAssessmentId) { toast.error('Please select an assessment'); return; }
        try {
            setSubmittingLink(true);
            await handleBeneficiaryLink({
                beneficiary_id: id,
                assessment_id: selectedAssessmentId,
                pre_intervention_yield: Number(linkPreYield) || 0,
                post_intervention_yield: Number(linkPostYield) || 0,
                pre_intervention_income: Number(linkPreIncome) || 0,
                post_intervention_income: Number(linkPostIncome) || 0,
                notes: linkNotes,
            });
            setLinkDialogOpen(false);
            setSelectedAssessmentId('');
            setSelectedAssessmentLabel('');
            setAssessmentSearch('');
            setLinkPreYield(''); setLinkPostYield('');
            setLinkPreIncome(''); setLinkPostIncome('');
            setLinkNotes('');
        } finally {
            setSubmittingLink(false);
        }
    }

    function gotoPage_29() {
        navigate('/partner/beneficiaries');
    }

    const b = beneficiariesItem;
    const statusColor: Record<string, string> = {
        active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        enrolled: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        disengaged: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    };
    const getStatusClass = (s?: string) =>
        statusColor[s?.toLowerCase() ?? ''] ?? 'bg-muted/50 text-muted-foreground border-border/40';

    return (
        <div className="p-6 md:p-8 min-h-screen">
            {/* Back button + breadcrumb */}
            <div className="flex items-center gap-3 mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground transition-colors duration-200"
                    onClick={gotoPage_29}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Beneficiary Tracking
                </Button>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium text-foreground font-heading">
                    {loadingBeneficiariesItem ? 'Loading…' : (b?.full_name ?? 'Beneficiary Detail')}
                </span>
            </div>

            {/* Header card */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-6 mb-6 transition-all duration-200">
                {loadingBeneficiariesItem ? (
                    <div className="flex items-start gap-4">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                ) : !b ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <AlertTriangle className="w-10 h-10 mb-2 text-amber-400" />
                        <p className="font-medium">Beneficiary not found.</p>
                        <Button variant="link" onClick={gotoPage_29} className="mt-2">Return to list</Button>
                    </div>
                ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                        <div className="flex-shrink-0 w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                            <User className="w-8 h-8 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-1">
                                <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
                                    {b.full_name}
                                </h1>
                                <Badge className={cn('text-xs border', getStatusClass(b.enrolment_status))}>
                                    {b.enrolment_status ?? 'Unknown'}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mt-1">
                                {b.phone_number && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                                        {b.phone_number}
                                    </span>
                                )}
                                {(b.district || b.sub_county) && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                                        {[b.sub_county, b.district].filter(Boolean).join(', ')}
                                    </span>
                                )}
                                {b.enrolment_date && (
                                    <span className="flex items-center gap-1.5">
                                        <ClipboardList className="w-3.5 h-3.5 text-amber-400" />
                                        Enrolled {new Date(b.enrolment_date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            {Array.isArray(b.crops) && b.crops.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {b.crops.map((c) => (
                                        <span key={c} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">
                                            <Leaf className="w-3 h-3" /> {c}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2 flex-shrink-0">
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] hover:shadow-[0_0_18px_rgba(var(--primary),0.5)] transition-all duration-200"
                                onClick={() => setEditBeneficiariesTarget(b)}
                            >
                                <Edit2 className="w-4 h-4" />
                                Annotate
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 bg-transparent border border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] transition-all duration-200"
                                onClick={() => setLinkDialogOpen(true)}
                            >
                                <Link2 className="w-4 h-4" />
                                Link to Assessment
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Main tabbed content */}
            {!loadingBeneficiariesItem && b && (
                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg p-1 h-auto flex-wrap gap-1">
                        <TabsTrigger value="overview" className="gap-1.5 text-xs sm:text-sm">
                            <User className="w-3.5 h-3.5" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="farms" className="gap-1.5 text-xs sm:text-sm">
                            <MapPin className="w-3.5 h-3.5" /> Farms
                        </TabsTrigger>
                        <TabsTrigger value="inputs" className="gap-1.5 text-xs sm:text-sm">
                            <Package className="w-3.5 h-3.5" /> Inputs
                        </TabsTrigger>
                        <TabsTrigger value="training" className="gap-1.5 text-xs sm:text-sm">
                            <GraduationCap className="w-3.5 h-3.5" /> Training
                        </TabsTrigger>
                        <TabsTrigger value="outcomes" className="gap-1.5 text-xs sm:text-sm">
                            <TrendingUp className="w-3.5 h-3.5" /> Outcomes
                        </TabsTrigger>
                        <TabsTrigger value="assessments" className="gap-1.5 text-xs sm:text-sm">
                            <ClipboardList className="w-3.5 h-3.5" /> Assessments
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview tab */}
                    <TabsContent value="overview">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                                <h2 className="font-heading text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                                    <User className="w-4 h-4 text-amber-400" /> Personal Details
                                </h2>
                                <dl className="space-y-3 text-sm">
                                    {[
                                        { label: 'Full Name', value: b.full_name },
                                        { label: 'Phone', value: b.phone_number },
                                        { label: 'District', value: b.district },
                                        { label: 'Sub-County', value: b.sub_county },
                                        { label: 'Programme ID', value: b.programme_id },
                                        { label: 'Enrolment Date', value: b.enrolment_date ? new Date(b.enrolment_date).toLocaleDateString() : undefined },
                                    ].map(({ label, value }) => value ? (
                                        <div key={label} className="flex justify-between gap-4">
                                            <dt className="text-muted-foreground shrink-0">{label}</dt>
                                            <dd className="font-medium text-right text-foreground">{value}</dd>
                                        </div>
                                    ) : null)}
                                </dl>
                            </div>
                            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                                <h2 className="font-heading text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                                    <Leaf className="w-4 h-4 text-green-400" /> Practice Adoption
                                </h2>
                                {b.practice_adoption_evidence ? (
                                    <p className="text-sm text-muted-foreground leading-relaxed">{b.practice_adoption_evidence}</p>
                                ) : (
                                    <p className="text-sm text-muted-foreground italic">No practice adoption evidence recorded.</p>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Farms tab */}
                    <TabsContent value="farms">
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                            <h2 className="font-heading text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-amber-400" /> Farm Registrations
                            </h2>
                            {!Array.isArray(b.farm_registrations) || b.farm_registrations.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <MapPin className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm">No farm registrations recorded.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {b.farm_registrations.map((farm) => (
                                        <div key={farm.farm_id} className="bg-muted/30 border border-border/30 rounded-lg p-4 space-y-2">
                                            <p className="font-medium text-sm text-foreground">{farm.farm_name ?? 'Unnamed Farm'}</p>
                                            <p className="text-xs text-muted-foreground font-mono">ID: {farm.farm_id}</p>
                                            {(farm.gps_lat != null && farm.gps_lng != null) && (
                                                <p className="text-xs text-amber-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" />
                                                    {farm.gps_lat.toFixed(5)}, {farm.gps_lng.toFixed(5)}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Inputs tab */}
                    <TabsContent value="inputs">
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                            <h2 className="font-heading text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                                <Package className="w-4 h-4 text-amber-400" /> Inputs & Support Received
                            </h2>
                            {!Array.isArray(b.inputs_received) || b.inputs_received.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <Package className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm">No inputs recorded.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/40">
                                                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Input Type</th>
                                                <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Quantity</th>
                                                <th className="text-right py-2 text-muted-foreground font-medium">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {b.inputs_received.map((inp, i) => (
                                                <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors duration-200">
                                                    <td className="py-2.5 pr-4 text-foreground">{inp.input_type ?? '—'}</td>
                                                    <td className="py-2.5 pr-4 text-right text-foreground">{inp.quantity ?? '—'}</td>
                                                    <td className="py-2.5 text-right text-muted-foreground">
                                                        {inp.date ? new Date(inp.date).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Training tab */}
                    <TabsContent value="training">
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                            <h2 className="font-heading text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-amber-400" /> Training Sessions & Assessments
                            </h2>
                            {!Array.isArray(b.training_sessions) || b.training_sessions.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <GraduationCap className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm">No training sessions recorded.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {b.training_sessions.map((session, i) => (
                                        <div key={i} className="flex items-start gap-3 bg-muted/20 border border-border/30 rounded-lg p-4">
                                            <div className="flex-shrink-0 mt-0.5">
                                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-sm text-foreground">{session.title ?? 'Untitled Session'}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {session.date ? new Date(session.date).toLocaleDateString() : 'Date not set'}
                                                </p>
                                            </div>
                                            {session.assessment_result && (
                                                <Badge className={cn('text-xs shrink-0', getStatusClass(session.assessment_result))}>
                                                    {session.assessment_result}
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Outcomes tab */}
                    <TabsContent value="outcomes">
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                            <h2 className="font-heading text-base font-semibold mb-4 text-foreground flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-amber-400" /> Longitudinal Outcome Measurements
                            </h2>
                            {!Array.isArray(b.outcome_measurements) || b.outcome_measurements.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm">No outcome measurements recorded yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border/40">
                                                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Season</th>
                                                <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Yield (kg/ha)</th>
                                                <th className="text-right py-2 pr-4 text-muted-foreground font-medium">Income</th>
                                                <th className="text-right py-2 text-muted-foreground font-medium">Recorded</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {b.outcome_measurements.map((om, i) => (
                                                <tr key={i} className="border-b border-border/20 hover:bg-muted/20 transition-colors duration-200">
                                                    <td className="py-2.5 pr-4 font-medium text-foreground">{om.season ?? '—'}</td>
                                                    <td className="py-2.5 pr-4 text-right text-amber-400 font-semibold">
                                                        {om.yield_kg_ha != null ? om.yield_kg_ha.toLocaleString() : '—'}
                                                    </td>
                                                    <td className="py-2.5 pr-4 text-right text-green-400 font-semibold">
                                                        {om.income_usd != null ? formatCurrency(om.income_usd) : '—'}
                                                    </td>
                                                    <td className="py-2.5 text-right text-muted-foreground text-xs">
                                                        {om.recorded_at ? new Date(om.recorded_at).toLocaleDateString() : '—'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Assessments tab */}
                    <TabsContent value="assessments">
                        <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-heading text-base font-semibold text-foreground flex items-center gap-2">
                                    <ClipboardList className="w-4 h-4 text-amber-400" /> Available Impact Assessments
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-1.5 text-muted-foreground hover:text-foreground"
                                    onClick={() => void loadImpact()}
                                    disabled={loadingImpact}
                                >
                                    <RefreshCw className={cn('w-3.5 h-3.5', loadingImpact && 'animate-spin')} />
                                    Refresh
                                </Button>
                            </div>
                            {loadingImpact ? (
                                <div className="space-y-3">
                                    {[1, 2, 3].map((n) => <Skeleton key={n} className="h-14 w-full rounded-lg" />)}
                                </div>
                            ) : impact.length === 0 ? (
                                <div className="flex flex-col items-center py-10 text-muted-foreground">
                                    <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                                    <p className="text-sm">No impact assessments found.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2">
                                        {impact.map((ia) => (
                                            <div key={ia.id} className="flex items-center justify-between gap-3 bg-muted/20 border border-border/30 rounded-lg p-3 hover:bg-muted/30 transition-colors duration-200">
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm text-foreground truncate">{ia.programme_name ?? ia.programme_id ?? 'Assessment'}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {ia.methodology && <span className="mr-2">Method: {ia.methodology}</span>}
                                                        {ia.completed_at && <span>Completed: {new Date(ia.completed_at).toLocaleDateString()}</span>}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <Badge className={cn('text-xs border', getStatusClass(ia.status))}>
                                                        {ia.status ?? 'Unknown'}
                                                    </Badge>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-xs gap-1 bg-transparent border-amber-500/50 text-amber-400 hover:border-amber-500 transition-all duration-200"
                                                        onClick={() => {
                                                            setSelectedAssessmentId(ia.id ?? '');
                                                            setSelectedAssessmentLabel(ia.programme_name ?? ia.id ?? '');
                                                            setLinkDialogOpen(true);
                                                        }}
                                                    >
                                                        <Link2 className="w-3 h-3" />
                                                        Link
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {/* Pagination */}
                                    {impactTotal > impactLimit && (
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                            <p className="text-xs text-muted-foreground">
                                                Showing {((impactPage - 1) * impactLimit) + 1}–{Math.min(impactPage * impactLimit, impactTotal)} of {impactTotal}
                                            </p>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="sm" disabled={impactPage <= 1} onClick={() => setImpactPage((p) => p - 1)}>
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="sm" disabled={impactPage * impactLimit >= impactTotal} onClick={() => setImpactPage((p) => p + 1)}>
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            )}

            {/* Edit / Annotate Dialog */}
            <Dialog open={!!editBeneficiariesTarget} onOpenChange={(open) => { if (!open) setEditBeneficiariesTarget(null); }}>
                <DialogContent className="sm:max-w-md backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <Edit2 className="w-4 h-4 text-amber-400" /> Annotate Beneficiary
                        </DialogTitle>
                    </DialogHeader>
                    <Form {...editForm}>
                        <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                            <FormField
                                control={editForm.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Add annotation notes…"
                                                rows={3}
                                                className="bg-background/50 border-border/50"
                                                {...field}
                                                value={field.value ?? ''}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="enrolment_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Enrolment Status</FormLabel>
                                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-border/50">
                                                    <SelectValue placeholder="Select status…" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="enrolled">Enrolled</SelectItem>
                                                <SelectItem value="disengaged">Disengaged</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={editForm.control}
                                name="practice_adoption_status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Practice Adoption Status</FormLabel>
                                        <Select value={field.value ?? ''} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-border/50">
                                                    <SelectValue placeholder="Select adoption status…" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="adopted">Adopted</SelectItem>
                                                <SelectItem value="partial">Partial</SelectItem>
                                                <SelectItem value="not_adopted">Not Adopted</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex items-center gap-3">
                                <FormField
                                    control={editForm.control}
                                    name="flagged_for_followup"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-2 space-y-0">
                                            <FormControl>
                                                <Switch
                                                    checked={Boolean(field.value)}
                                                    onCheckedChange={(v) => field.onChange(v ? 1 : 0)}
                                                />
                                            </FormControl>
                                            <Label className="text-sm cursor-pointer flex items-center gap-1.5">
                                                <Flag className="w-3.5 h-3.5 text-rose-400" />
                                                Flag for follow-up
                                            </Label>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setEditBeneficiariesTarget(null)}>Cancel</Button>
                                <Button
                                    type="submit"
                                    className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] hover:shadow-[0_0_18px_rgba(var(--primary),0.5)] transition-all duration-200"
                                    disabled={editForm.formState.isSubmitting}
                                >
                                    {editForm.formState.isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Save Annotation
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Link to Impact Assessment Dialog */}
            <Dialog open={linkDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setLinkDialogOpen(false);
                    setAssessmentComboboxOpen(false);
                    setAssessmentSearch('');
                }
            }}>
                <DialogContent className="sm:max-w-md backdrop-blur-md bg-card/90 border border-border/40">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <Link2 className="w-4 h-4 text-amber-400" /> Link to Impact Assessment
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Assessment</Label>
                            <Popover open={assessmentComboboxOpen} onOpenChange={(open) => {
                                if (open) { openAssessmentCombobox(); } else { setAssessmentComboboxOpen(false); }
                            }}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={assessmentComboboxOpen}
                                        className="w-full justify-between bg-background/50 border-border/50 font-normal"
                                    >
                                        {selectedAssessmentLabel || 'Search assessment…'}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-full p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search assessments…"
                                            value={assessmentSearch}
                                            onValueChange={handleAssessmentSearchChange}
                                        />
                                        <CommandList>
                                            {loadingAssessmentOptions ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                                </div>
                                            ) : (
                                                <>
                                                    <CommandEmpty>No assessments found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {assessmentOptions.map((ia) => (
                                                            <CommandItem
                                                                key={ia.id}
                                                                value={ia.id ?? ''}
                                                                onSelect={() => {
                                                                    setSelectedAssessmentId(ia.id ?? '');
                                                                    setSelectedAssessmentLabel(ia.programme_name ?? ia.id ?? '');
                                                                    setAssessmentComboboxOpen(false);
                                                                }}
                                                            >
                                                                <Check className={cn('mr-2 h-4 w-4', selectedAssessmentId === ia.id ? 'opacity-100' : 'opacity-0')} />
                                                                <div className="min-w-0">
                                                                    <p className="text-sm font-medium truncate">{ia.programme_name ?? ia.programme_id ?? 'Assessment'}</p>
                                                                    {ia.methodology && <p className="text-xs text-muted-foreground">{ia.methodology}</p>}
                                                                </div>
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </>
                                            )}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label>Pre-Yield (kg/ha)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-background/50 border-border/50"
                                    value={linkPreYield}
                                    onChange={(e) => setLinkPreYield(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Post-Yield (kg/ha)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-background/50 border-border/50"
                                    value={linkPostYield}
                                    onChange={(e) => setLinkPostYield(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Pre-Income (USD)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-background/50 border-border/50"
                                    value={linkPreIncome}
                                    onChange={(e) => setLinkPreIncome(e.target.value)}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Post-Income (USD)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-background/50 border-border/50"
                                    value={linkPostIncome}
                                    onChange={(e) => setLinkPostIncome(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes</Label>
                            <Textarea
                                placeholder="Attribution notes…"
                                rows={2}
                                className="bg-background/50 border-border/50"
                                value={linkNotes}
                                onChange={(e) => setLinkNotes(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                        <Button
                            onClick={() => void handleSubmitLink()}
                            disabled={submittingLink}
                            className="bg-transparent border border-amber-500 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] hover:shadow-[0_0_18px_rgba(245,158,11,0.4)] transition-all duration-200"
                        >
                            {submittingLink ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Link2 className="w-4 h-4 mr-2" />}
                            Link Beneficiary
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
