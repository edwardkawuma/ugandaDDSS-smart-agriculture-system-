import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft,
    Calendar,
    Check,
    ChevronsUpDown,
    LandPlot,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    Send,
    Settings,
    Smartphone,
    Sprout,
    User,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
    farmersService,
    type FarmersDetailResponse,
    type FarmersUpdateParams,
} from '@/lib/api/farmersService';
import {
    farmersUpdateSchema,
    type FarmersUpdateInput,
} from '@/lib/api/farmersFormSchema';
import {
    advisoriesService,
    type AdvisoriesAssignParams,
    type AdvisoriesListResponse,
} from '@/lib/api/advisoriesService';
import {
    fieldVisitsService,
    type FieldVisitsCreateParams,
} from '@/lib/api/fieldVisitsService';
import {
    fieldVisitsCreateSchema,
    type FieldVisitsCreateInput,
} from '@/lib/api/fieldVisitsFormSchema';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Advisory = AdvisoriesListResponse['data'][number];
type Farmer = FarmersDetailResponse['data'];

export default function FarmerProfile() {
    const navigate = useNavigate();
    const { id = '' } = useParams<{ id: string }>();
    function goBack() { navigate('/extension/farmers'); }

    // Detail state — GET /farmers/detail
    const [farmersItem, setFarmersItem] = useState<FarmersDetailResponse['data'] | null>(null);
    const [loadingFarmersItem, setLoadingFarmersItem] = useState(true);
    // Create dialog state — POST /field-visits/create
    const [createFieldVisitsOpen, setCreateFieldVisitsOpen] = useState(false);
    // Edit dialog state — PUT /farmers/update
    const [editFarmersTarget, setEditFarmersTarget] = useState<Farmer | null>(null);

    useEffect(() => { if (id) void loadFarmersItem(); }, [id]);

    async function loadFarmersItem() {
        try {
            setLoadingFarmersItem(true);
            const res = await farmersService.detail({ id: id });
            setFarmersItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load detail');
            console.error('[loadFarmersItem]', err);
        } finally {
            setLoadingFarmersItem(false);
        }
    }
    async function handleCreateFieldVisits(data: FieldVisitsCreateParams) {
        try {
            await fieldVisitsService.create(data);
            toast.success('Created');
            setCreateFieldVisitsOpen(false);
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateFieldVisits]', err);
        }
    }
    // POST /advisories/assign
    async function handleAssign(data: AdvisoriesAssignParams) {
        try {
            await advisoriesService.assign(data);
            toast.success('Done');
        } catch (err) {
            toast.error('Action failed');
            console.error('[handleAssign]', err);
        }
    }
    async function handleUpdateFarmers(data: FarmersUpdateParams) {
        try {
            await farmersService.update(data);
            toast.success('Updated');
            setEditFarmersTarget(null);
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateFarmers]', err);
        }
    }

    /* ----- SCAFFOLD UI HINTS (page-builder agent: READ these, then replace the slot in the JSX below. This comment is guidance only and is never rendered.) -----
        PAGE: Farmer Profile
        DESCRIPTION: Displays the complete profile of a single registered farmer including personal details, all registered farms and fields with their Google Maps locations, crop types grown, full history of advisories received and compliance actions taken, all field visit logs from this and other extension workers, received weather and pest alerts, and current active alert status. Extension workers can log notes from phone or in-person interactions, schedule a new field visit, assign targeted advisories, and update the farmer's contact preferences for SMS and email notifications from this single profile page.

        AVAILABLE STATE & HANDLERS (already wired to real services — prefer these, but feel free to add more local state, derived values, or rename for clarity):
          - farmersItem (object or null)  — detail data, auto-loaded on mount from useParams.id
          - loadingFarmersItem (boolean)
          - loadFarmersItem() — call to (re)load
          - advisories (array)              — list data, auto-loaded on mount and on advisoriesPage change
          - loadingAdvisories (boolean)
          - advisoriesPage / setAdvisoriesPage  — pagination state
          - advisoriesTotal (number)         — total record count for pagination UI
          - loadAdvisories() — call to reload the list
          - createFieldVisitsOpen / setCreateFieldVisitsOpen  — wrap the create form in <Dialog open={createFieldVisitsOpen}>
          - handleCreateFieldVisits(data: FieldVisitsCreateParams) — call from create form submit
          - VALIDATION: import { fieldVisitsCreateSchema } from '@/lib/api/fieldVisitsFormSchema' and wire useForm({ resolver: zodResolver(fieldVisitsCreateSchema) }); it already encodes required fields — submit via handleSubmit so an incomplete form can't POST. Show errors.{field}?.message under each input.
          - handleAssign(data: AdvisoriesAssignParams) — POST /advisories/assign
          - editFarmersTarget / setEditFarmersTarget — set to the row being edited; wrap edit form in <Dialog open={!!editFarmersTarget}>
          - handleUpdateFarmers(data: FarmersUpdateParams) — call from edit form submit (include id)
          - VALIDATION: import { farmersUpdateSchema } from '@/lib/api/farmersFormSchema' and wire useForm({ resolver: zodResolver(farmersUpdateSchema), values: editFarmersTarget ?? undefined }); submit via handleSubmit.

        OUTGOING NAVIGATION (every edge below MUST be wired):
          - back_button -> /extension/farmers (back arrow / breadcrumb at top of Farmer Profile)
          Prefer the emitted `goto{TargetPageId}` helper for each edge (it wraps navigate + substitutes params); calling the `navigate` function directly is also fine. For row/card clicks pass the entity id into the route.

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
    return (
        <div className="p-6 md:p-8 space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={goBack} className="shrink-0 mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-heading tracking-tight">
                                {farmersItem?.full_name ?? 'Farmer Profile'}
                            </h1>
                            {farmersItem?.active_alert_status && (
                                <Badge variant={farmersItem.active_alert_status === 'active' ? 'destructive' : 'secondary'} className="uppercase">
                                    {farmersItem.active_alert_status}
                                </Badge>
                            )}
                        </div>
                        <p className="text-muted-foreground mt-1">
                            {farmersItem?.district ? `${farmersItem.district}` : 'Loading location…'}
                            {farmersItem?.sub_county ? `, ${farmersItem.sub_county}` : ''}
                            {farmersItem?.registered_at ? ` • Registered ${new Date(farmersItem.registered_at).toLocaleDateString()}` : ''}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setCreateFieldVisitsOpen(true)} className="rounded-md shadow-md hover:shadow-lg transition-all duration-200">
                        <Plus className="mr-2 h-4 w-4" />
                        Log Field Visit
                    </Button>
                    <Button onClick={() => setEditFarmersTarget(farmersItem)} variant="outline" className="rounded-md">
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit Preferences
                    </Button>
                </div>
            </div>

            {/* LOADING */}
            {loadingFarmersItem && !farmersItem && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-xl" />
                    <Skeleton className="h-64 rounded-xl lg:col-span-2" />
                </div>
            )}

            {/* TABBED CONTENT */}
            {farmersItem && (
                <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="grid w-full max-w-2xl grid-cols-5 bg-muted/40 backdrop-blur-sm">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="farms">Farms</TabsTrigger>
                        <TabsTrigger value="advisories">Advisory History</TabsTrigger>
                        <TabsTrigger value="visits">Field Visits</TabsTrigger>
                        <TabsTrigger value="settings">Settings</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-6 mt-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* PERSONAL INFO */}
                            <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl overflow-hidden">
                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                        <User className="h-5 w-5 text-primary" />
                                        Personal Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-center">
                                        <Avatar className="h-24 w-24 border-2 border-primary/20 shadow-md">
                                            <AvatarImage src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face" alt={farmersItem.full_name} loading="lazy" />
                                            <AvatarFallback className="text-lg bg-primary/10 text-primary font-heading">
                                                {farmersItem.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{farmersItem.phone_number || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground" />
                                            <span className="truncate">{farmersItem.email || '—'}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground" />
                                            <span>{farmersItem.sub_county ? `${farmersItem.sub_county}, ` : ''}{farmersItem.district}</span>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div>
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Notification Preferences</p>
                                        <div className="flex flex-wrap gap-2">
                                            <Badge variant={farmersItem.sms_enabled ? 'default' : 'outline'} className="gap-1">
                                                <Smartphone className="h-3 w-3" />
                                                SMS {farmersItem.sms_enabled ? 'On' : 'Off'}
                                            </Badge>
                                            <Badge variant={farmersItem.email_enabled ? 'default' : 'outline'} className="gap-1">
                                                <Mail className="h-3 w-3" />
                                                Email {farmersItem.email_enabled ? 'On' : 'Off'}
                                            </Badge>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* RIGHT COLUMN: Crops & Quick Stats */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Crops */}
                                <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                            <Sprout className="h-5 w-5 text-primary" />
                                            Crops Grown
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {farmersItem.crops && farmersItem.crops.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {farmersItem.crops.map((crop) => (
                                                    <Badge key={crop} variant="secondary" className="text-sm px-3 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20">
                                                        {crop}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">No crops registered.</p>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-heading font-bold text-primary">{farmersItem.farms?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Farms</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-heading font-bold text-primary">{farmersItem.advisory_history?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Advisories</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-heading font-bold text-primary">{farmersItem.field_visit_logs?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Visits</p>
                                        </CardContent>
                                    </Card>
                                    <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                                        <CardContent className="pt-6 text-center">
                                            <p className="text-3xl font-heading font-bold text-primary">{farmersItem.crops?.length ?? 0}</p>
                                            <p className="text-xs text-muted-foreground mt-1">Crops</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* FARMS TAB */}
                    <TabsContent value="farms" className="space-y-4 mt-6">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader className="pb-3">
                                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                    <LandPlot className="h-5 w-5 text-primary" />
                                    Registered Farms & Fields
                                </CardTitle>
                                <CardDescription>All farms owned by this farmer with location data.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {farmersItem.farms && farmersItem.farms.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {farmersItem.farms.map((farm) => (
                                            <div key={farm.id} className="rounded-lg border border-border/60 bg-background/60 backdrop-blur-sm p-4 hover:border-primary/40 transition-colors duration-200">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="font-medium">{farm.farm_name}</p>
                                                    <Badge variant="outline" className="shrink-0">{farm.area_hectares} ha</Badge>
                                                </div>
                                                <div className="aspect-video rounded-md overflow-hidden bg-muted/30 mb-2">
                                                    <img
                                                        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=400&h=225&fit=crop"
                                                        alt={farm.farm_name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>Google Maps location</span>
                                                    <Button variant="link" size="sm" className="h-auto p-0 ml-auto text-xs">
                                                        View map
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No farms registered for this farmer.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ADVISORIES TAB */}
                    <TabsContent value="advisories" className="space-y-4 mt-6">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader>
                                <CardTitle className="font-heading">Advisories Received</CardTitle>
                                <CardDescription>Full history of advisories sent to this farmer and their compliance status.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {farmersItem.advisory_history && farmersItem.advisory_history.length > 0 ? (
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-muted/30 hover:bg-muted/30">
                                                <TableHead className="font-heading">Title</TableHead>
                                                <TableHead className="font-heading">Received</TableHead>
                                                <TableHead className="font-heading">Compliance</TableHead>
                                                <TableHead className="text-right font-heading">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {farmersItem.advisory_history.map((row, idx) => (
                                                <TableRow key={row.advisory_id} className={idx % 2 === 0 ? 'bg-muted/10' : ''}>
                                                    <TableCell className="font-medium">{row.title}</TableCell>
                                                    <TableCell>{new Date(row.received_at).toLocaleDateString()}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            row.compliance_status === 'completed' ? 'default' :
                                                            row.compliance_status === 'pending' ? 'secondary' : 'outline'
                                                        }>
                                                            {row.compliance_status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleAssign({ farmer_id: farmersItem.id, advisory_id: row.advisory_id })}
                                                        >
                                                            <Send className="mr-2 h-4 w-4" />
                                                            Re-send
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No advisories sent yet.</p>
                                )}
                            </CardContent>
                        </Card>

                        {/* ASSIGN ADVISORY */}
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader>
                                <CardTitle className="font-heading">Assign Targeted Advisory</CardTitle>
                                <CardDescription>Send a specific advisory to this farmer from the available library.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <AssignAdvisoryForm
                                    onAssign={(advisory_id) => handleAssign({ farmer_id: farmersItem.id, advisory_id })}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* FIELD VISITS TAB */}
                    <TabsContent value="visits" className="space-y-4 mt-6">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader>
                                <CardTitle className="font-heading">Field Visit Logs</CardTitle>
                                <CardDescription>All field visits from this and other extension workers.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {farmersItem.field_visit_logs && farmersItem.field_visit_logs.length > 0 ? (
                                    <div className="space-y-3">
                                        {farmersItem.field_visit_logs.map((visit) => (
                                            <div key={visit.visit_id} className="rounded-lg border border-border/60 bg-background/60 p-4 hover:border-primary/30 transition-colors">
                                                <div className="flex items-start justify-between gap-3 mb-2">
                                                    <div>
                                                        <p className="font-medium flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            {new Date(visit.visit_date).toLocaleDateString()}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground mt-1">By {visit.extension_worker}</p>
                                                    </div>
                                                    <Badge variant="outline" className="shrink-0">Visit</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mt-2">{visit.summary}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-8">No field visits logged yet.</p>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="space-y-4 mt-6">
                        <Card className="backdrop-blur-md bg-card/80 border border-border/60 shadow-lg rounded-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 font-heading text-lg">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Contact Preferences
                                </CardTitle>
                                <CardDescription>Manage this farmer's contact details and notification settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Full Name</p>
                                        <p className="text-sm font-medium">{farmersItem.full_name}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Phone Number</p>
                                        <p className="text-sm font-medium">{farmersItem.phone_number || '—'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
                                        <p className="text-sm font-medium">{farmersItem.email || '—'}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Location</p>
                                        <p className="text-sm font-medium">{farmersItem.sub_county ? `${farmersItem.sub_county}, ` : ''}{farmersItem.district}</p>
                                    </div>
                                </div>
                                <Separator />
                                <div className="space-y-3">
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Notification Channels</p>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge variant={farmersItem.sms_enabled ? 'default' : 'outline'} className="gap-1 text-sm px-3 py-1.5">
                                            <Smartphone className="h-4 w-4" />
                                            SMS {farmersItem.sms_enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                        <Badge variant={farmersItem.email_enabled ? 'default' : 'outline'} className="gap-1 text-sm px-3 py-1.5">
                                            <Mail className="h-4 w-4" />
                                            Email {farmersItem.email_enabled ? 'Enabled' : 'Disabled'}
                                        </Badge>
                                    </div>
                                </div>
                                <Separator />
                                <Button onClick={() => setEditFarmersTarget(farmersItem)} className="rounded-md shadow-md hover:shadow-lg transition-all duration-200">
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit Preferences
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            )}

            {/* CREATE FIELD VISIT DIALOG */}
            <CreateFieldVisitDialog
                open={createFieldVisitsOpen}
                onOpenChange={setCreateFieldVisitsOpen}
                farmerId={farmersItem?.id ?? ''}
                farms={(farmersItem?.farms ?? []) as { id: string; farm_name: string }[]}
                onSubmit={handleCreateFieldVisits}
            />

            {/* EDIT FARMER PREFERENCES DIALOG */}
            <EditFarmerDialog
                farmer={editFarmersTarget}
                onOpenChange={(open) => !open && setEditFarmersTarget(null)}
                onSubmit={handleUpdateFarmers}
            />
        </div>
    );
}

/* ---------- Helper Components ---------- */

function CreateFieldVisitDialog({
    open,
    onOpenChange,
    farmerId,
    farms,
    onSubmit,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    farmerId: string;
    farms: { id: string; farm_name: string }[];
    onSubmit: (data: FieldVisitsCreateParams) => void;
}) {
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<FieldVisitsCreateInput>({
        resolver: zodResolver(fieldVisitsCreateSchema),
        defaultValues: { farmer_id: farmerId },
    });

    useEffect(() => {
        if (open) reset({ farmer_id: farmerId });
    }, [open, farmerId, reset]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Log New Field Visit</DialogTitle>
                    <DialogDescription>Record an in-person or phone interaction with observations and follow-ups.</DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={handleSubmit((data) => {
                        onSubmit({ ...data, farmer_id: farmerId } as FieldVisitsCreateParams);
                        reset({ farmer_id: farmerId });
                    })}
                    className="space-y-4"
                >
                    <input type="hidden" {...register('farmer_id')} value={farmerId} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="farm_id">Farm</Label>
                            <Controller
                                name="farm_id"
                                control={control}
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value ?? ''}>
                                        <SelectTrigger id="farm_id" className="bg-background">
                                            <SelectValue placeholder="Select farm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {farms.map((farm) => (
                                                <SelectItem key={farm.id} value={farm.id}>{farm.farm_name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.farm_id && <p className="text-xs text-destructive">{errors.farm_id.message}</p>}
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="visit_date">Visit Date <span className="text-destructive">*</span></Label>
                            <Input id="visit_date" type="date" {...register('visit_date')} className="bg-background" />
                            {errors.visit_date && <p className="text-xs text-destructive">{errors.visit_date.message}</p>}
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="observations">Observations</Label>
                            <Textarea id="observations" {...register('observations')} rows={3} placeholder="General observations during the visit" className="bg-background" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="pest_sightings">Pest Sightings</Label>
                            <Textarea id="pest_sightings" {...register('pest_sightings')} rows={2} placeholder="Any pests observed" className="bg-background" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="crop_condition">Crop Condition</Label>
                            <Input id="crop_condition" {...register('crop_condition')} placeholder="e.g. healthy, stressed" className="bg-background" />
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="soil_observations">Soil Observations</Label>
                            <Input id="soil_observations" {...register('soil_observations')} placeholder="e.g. moisture, compaction" className="bg-background" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="advisories_given">Advisories Given</Label>
                            <Textarea id="advisories_given" {...register('advisories_given')} rows={2} className="bg-background" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="follow_up_actions">Follow-up Actions</Label>
                            <Textarea id="follow_up_actions" {...register('follow_up_actions')} rows={2} className="bg-background" />
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                            <Label htmlFor="follow_up_due_date">Follow-up Due Date</Label>
                            <Input id="follow_up_due_date" type="date" {...register('follow_up_due_date')} className="bg-background" />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                            {isSubmitting ? 'Saving…' : 'Save Visit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function EditFarmerDialog({
    farmer,
    onOpenChange,
    onSubmit,
}: {
    farmer: Farmer | null;
    onOpenChange: (v: boolean) => void;
    onSubmit: (data: FarmersUpdateParams) => void;
}) {
    const { register, handleSubmit, control, formState: { errors, isSubmitting }, reset } = useForm<FarmersUpdateInput>({
        resolver: zodResolver(farmersUpdateSchema),
        values: farmer ? {
            full_name: farmer.full_name,
            phone_number: farmer.phone_number,
            email: farmer.email,
            district: farmer.district,
            sub_county: farmer.sub_county,
            sms_enabled: farmer.sms_enabled ? 1 : 0,
            email_enabled: farmer.email_enabled ? 1 : 0,
        } : undefined,
    });

    return (
        <Dialog open={!!farmer} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl backdrop-blur-xl bg-card/95">
                <DialogHeader>
                    <DialogTitle className="font-heading">Edit Contact Preferences</DialogTitle>
                    <DialogDescription>Update this farmer's contact details and notification preferences.</DialogDescription>
                </DialogHeader>
                {farmer && (
                    <form
                        onSubmit={handleSubmit((data) => {
                            onSubmit({
                                id: farmer.id,
                                full_name: data.full_name,
                                phone_number: data.phone_number,
                                email: data.email,
                                district: data.district,
                                sub_county: data.sub_county,
                                sms_enabled: !!data.sms_enabled,
                                email_enabled: !!data.email_enabled,
                            });
                            reset();
                        })}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5 md:col-span-2">
                                <Label htmlFor="edit_full_name">Full Name</Label>
                                <Input id="edit_full_name" {...register('full_name')} className="bg-background" />
                                {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_phone">Phone</Label>
                                <Input id="edit_phone" {...register('phone_number')} className="bg-background" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_email">Email</Label>
                                <Input id="edit_email" type="email" {...register('email')} className="bg-background" />
                                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_district">District</Label>
                                <Input id="edit_district" {...register('district')} className="bg-background" />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="edit_sub_county">Sub-County</Label>
                                <Input id="edit_sub_county" {...register('sub_county')} className="bg-background" />
                            </div>
                            <div className="md:col-span-2 space-y-3 pt-2 border-t border-border/40">
                                <p className="text-sm font-medium">Notification Channels</p>
                                <div className="flex items-center gap-6">
                                    <Controller
                                        name="sms_enabled"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <Checkbox
                                                    checked={!!field.value}
                                                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                                    id="edit_sms"
                                                />
                                                <Smartphone className="h-4 w-4 text-muted-foreground" />
                                                SMS notifications
                                            </label>
                                        )}
                                    />
                                    <Controller
                                        name="email_enabled"
                                        control={control}
                                        render={({ field }) => (
                                            <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                <Checkbox
                                                    checked={!!field.value}
                                                    onCheckedChange={(checked) => field.onChange(checked ? 1 : 0)}
                                                    id="edit_email"
                                                />
                                                <Mail className="h-4 w-4 text-muted-foreground" />
                                                Email notifications
                                            </label>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter className="gap-2">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                            <Button type="submit" disabled={isSubmitting} className="rounded-md shadow-md">
                                {isSubmitting ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AssignAdvisoryForm({
    onAssign,
}: {
    onAssign: (advisory_id: string) => void;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [options, setOptions] = useState<Advisory[]>([]);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const [selected, setSelected] = useState<Advisory | null>(null);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoadingOptions(true);
        advisoriesService
            .list({ page: 1, limit: 50, ...(debouncedSearch ? { search: debouncedSearch } : {}) })
            .then((res) => {
                if (!cancelled) setOptions(Array.isArray(res?.data) ? (res.data as Advisory[]) : []);
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoadingOptions(false); });
        return () => { cancelled = true; };
    }, [open, debouncedSearch]);

    return (
        <div className="flex flex-col sm:flex-row gap-3">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="bg-background flex-1 justify-between font-normal"
                    >
                        {selected ? selected.title : 'Choose an advisory to assign…'}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search advisories…"
                            value={search}
                            onValueChange={setSearch}
                        />
                        <CommandList>
                            {loadingOptions && (
                                <div className="p-2 space-y-1">
                                    <Skeleton className="h-8 w-full rounded" />
                                    <Skeleton className="h-8 w-full rounded" />
                                </div>
                            )}
                            {!loadingOptions && options.length === 0 && (
                                <CommandEmpty>No advisory found.</CommandEmpty>
                            )}
                            {!loadingOptions && options.length > 0 && (
                                <CommandGroup>
                                    {options.map((a) => (
                                        <CommandItem
                                            key={a.id}
                                            value={a.id ?? ''}
                                            onSelect={() => {
                                                setSelected(a);
                                                setOpen(false);
                                                setSearch('');
                                            }}
                                        >
                                            <Check className={cn('mr-2 h-4 w-4', selected?.id === a.id ? 'opacity-100' : 'opacity-0')} />
                                            <span>{a.title}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
            <Button
                onClick={() => { if (selected?.id) { onAssign(selected.id); setSelected(null); } }}
                disabled={!selected}
                className="rounded-md shadow-md"
            >
                <Send className="mr-2 h-4 w-4" />
                Assign
            </Button>
        </div>
    );
}
