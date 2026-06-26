import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from '@/lib/toast';
import {
    farmersService,
    type FarmersCreateParams,
    type FarmersDeleteParams,
    type FarmersListParams,
    type FarmersListResponse,
} from '@/lib/api/farmersService';
import { farmersCreateSchema } from '@/lib/api/farmersFormSchema';
import { cropsService, type CropsListResponse } from '@/lib/api/cropsService';
import { districtsService, type DistrictsListResponse } from '@/lib/api/districtsService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Plus, Search, MapPin, Bell, Users, MoreVertical, Eye, Trash2, ChevronLeft, ChevronRight, Phone, Sprout } from 'lucide-react';

type Farmer = FarmersListResponse['data'][number];
type CropOption = CropsListResponse['data'][number];
type DistrictOption = DistrictsListResponse['data'][number];

export default function FarmerDirectory() {
    const navigate = useNavigate();

    // Filter / search state (declared before useEffect that depends on them)
    const [searchTerm, setSearchTerm] = useState('');
    const [cropFilter, setCropFilter] = useState('all');
    const [alertFilter, setAlertFilter] = useState('all');

    // List state — GET /farmers/list
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loadingFarmers, setLoadingFarmers] = useState(true);
    const [farmersPage, setFarmersPage] = useState(1);
    const [farmersLimit] = useState(10);
    const [farmersTotal, setFarmersTotal] = useState(0);
    // Create dialog state — POST /farmers/create
    const [createFarmersOpen, setCreateFarmersOpen] = useState(false);
    // Delete confirmation state
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    // Lookup option caches
    const [cropOptions, setCropOptions] = useState<CropOption[]>([]);
    const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);

    useEffect(() => { void loadFarmers(); }, [farmersPage, searchTerm, cropFilter, alertFilter]);

    useEffect(() => {
        // Preload lookup options for the create form
        void (async () => {
            try {
                const [cropsRes, districtsRes] = await Promise.all([
                    cropsService.list({ page: 1, limit: 100 }).catch(() => null),
                    districtsService.list({ page: 1, limit: 100 }).catch(() => null),
                ]);
                if (cropsRes && Array.isArray(cropsRes.data)) setCropOptions(cropsRes.data);
                if (districtsRes && Array.isArray(districtsRes.data)) setDistrictOptions(districtsRes.data);
            } catch (err) {
                console.error('[loadLookups]', err);
            }
        })();
    }, []);

    async function loadFarmers() {
        try {
            setLoadingFarmers(true);
            const params: FarmersListParams = { page: farmersPage, limit: farmersLimit };
            if (searchTerm) params.search = searchTerm;
            if (cropFilter !== 'all') params.crop = cropFilter;
            if (alertFilter !== 'all') params.alert_status = alertFilter;
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
    async function handleCreateFarmers(data: FarmersCreateParams) {
        try {
            await farmersService.create(data);
            toast.success('Created');
            setCreateFarmersOpen(false);
            createForm.reset();
            void loadFarmers();
        } catch (err) {
            toast.error('Failed to create');
            console.error('[handleCreateFarmers]', err);
        }
    }
    async function handleDeleteFarmers(params: FarmersDeleteParams) {
        try {
            await farmersService.delete(params);
            toast.success('Deleted');
            setPendingDeleteId(null);
            void loadFarmers();
        } catch (err) {
            toast.error('Failed to delete');
            console.error('[handleDeleteFarmers]', err);
        }
    }

    function gotoPage_12_sub_1(farmerId: string | number) {
        navigate(`/extension/farmers/${farmerId}`);
    }

    // Server-filtered farmers (filters are sent as query params in loadFarmers)
    const filteredFarmers = farmers;

    // Create form (zod validation)
    const createForm = useForm<FarmersCreateParams>({
        resolver: zodResolver(farmersCreateSchema),
        defaultValues: {
            full_name: '',
            phone_number: '',
            email: '',
            district: '',
            sub_county: '',
            crop_ids: [],
            sms_enabled: false,
            email_enabled: false,
        },
    });

    const farmersTotalPages = Math.ceil(farmersTotal / farmersLimit);

    const pendingDeleteFarmer = pendingDeleteId
        ? farmers.find((f) => f.id === pendingDeleteId)
        : null;

    return (
        <div className="p-6 md:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold flex items-center gap-2">
                        <Users className="h-7 w-7 text-primary" />
                        Farmer Directory
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Searchable registry of all farmers in your assigned district.
                    </p>
                </div>
                <Button onClick={() => setCreateFarmersOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Register Farmer
                </Button>
            </div>

            {/* Search & Filters */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, phone, or district..."
                                className="pl-9 bg-background border-border"
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setFarmersPage(1); }}
                            />
                        </div>
                        <Select value={cropFilter} onValueChange={(v) => { setCropFilter(v); setFarmersPage(1); }}>
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Filter by crop" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Crops</SelectItem>
                                {cropOptions.map((c) => (
                                    <SelectItem key={c.id ?? c.name ?? ''} value={c.id ?? ''}>
                                        {c.name ?? c.id ?? ''}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={alertFilter} onValueChange={(v) => { setAlertFilter(v); setFarmersPage(1); }}>
                            <SelectTrigger className="bg-background border-border">
                                <SelectValue placeholder="Filter by alert status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="none">No Active Alert</SelectItem>
                                <SelectItem value="weather">Weather Alert</SelectItem>
                                <SelectItem value="pest">Pest / Disease</SelectItem>
                                <SelectItem value="advisory">Advisory Pending</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Farmer Table */}
            <Card className="bg-card/60 backdrop-blur-md border border-border/50 shadow-lg rounded">
                <CardContent className="pt-6">
                    {loadingFarmers ? (
                        <div className="space-y-2">
                            {Array.from({ length: 7 }).map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredFarmers.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-lg font-medium">No farmers found</p>
                            <p className="text-sm mt-1">
                                {searchTerm || cropFilter !== 'all' || alertFilter !== 'all'
                                    ? 'Try adjusting your search or filters.'
                                    : 'Register your first farmer to get started.'}
                            </p>
                        </div>
                    ) : (
                        <div className="rounded border border-border/50 overflow-x-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-muted/40 backdrop-blur-sm">
                                    <TableRow>
                                        <TableHead className="font-heading">Name</TableHead>
                                        <TableHead className="font-heading">Phone</TableHead>
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
                                    {filteredFarmers.map((f, idx) => (
                                        <TableRow
                                            key={f.id ?? idx}
                                            className="cursor-pointer hover:bg-muted/30 transition-colors duration-150"
                                            onClick={() => gotoPage_12_sub_1(f.id)}
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                                                        {(f.full_name ?? '?')[0]?.toUpperCase()}
                                                    </div>
                                                    <span className="font-medium">{f.full_name ?? '—'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {f.phone_number ?? '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1.5 text-sm">
                                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {f.district ?? '—'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {(f.crops ?? []).length > 0 ? (
                                                        f.crops.map((c) => (
                                                            <Badge key={c} variant="secondary" className="rounded text-xs">
                                                                {c}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {f.active_alert_status && f.active_alert_status !== 'none' ? (
                                                    <Badge variant="destructive" className="rounded gap-1">
                                                        <Bell className="h-3 w-3" />
                                                        {f.active_alert_status}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="rounded text-muted-foreground">
                                                        none
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
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
                                                        <DropdownMenuItem onClick={() => gotoPage_12_sub_1(f.id)}>
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setPendingDeleteId(f.id ?? null)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete Farmer
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
                    {!loadingFarmers && filteredFarmers.length > 0 && (
                        <div className="flex items-center justify-between mt-4">
                            <p className="text-sm text-muted-foreground">
                                Page {farmersPage} of {farmersTotalPages} &middot; {farmersTotal} total farmers
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFarmersPage((p) => Math.max(1, p - 1))}
                                    disabled={farmersPage <= 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                                <span className="text-sm font-medium px-2">
                                    {farmersPage}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setFarmersPage((p) => p + 1)}
                                    disabled={farmersPage >= farmersTotalPages}
                                >
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Create Farmer Dialog */}
            <Dialog open={createFarmersOpen} onOpenChange={(o) => {
                setCreateFarmersOpen(o);
                if (!o) createForm.reset();
            }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-heading flex items-center gap-2">
                            <Sprout className="h-5 w-5 text-primary" />
                            Register New Farmer
                        </DialogTitle>
                        <DialogDescription>
                            Add a new farmer to your district directory. Fill in their details below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(handleCreateFarmers)} className="space-y-4">
                            <FormField
                                control={createForm.control}
                                name="full_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Full Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. John Mukasa" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="phone_number"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Phone Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="+256 7XX XXX XXX" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email (optional)</FormLabel>
                                            <FormControl>
                                                <Input type="email" placeholder="farmer@example.com" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={createForm.control}
                                    name="district"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>District</FormLabel>
                                            <DistrictCombobox
                                                value={field.value ?? ''}
                                                onChange={field.onChange}
                                                options={districtOptions}
                                            />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="sub_county"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sub-County</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g. Busukuma" {...field} value={field.value ?? ''} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={createForm.control}
                                name="crop_ids"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Registered Crops</FormLabel>
                                        <CropMultiCombobox
                                            value={Array.isArray(field.value) ? field.value : []}
                                            onChange={field.onChange}
                                            options={cropOptions}
                                        />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <FormField
                                    control={createForm.control}
                                    name="sms_enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded border border-border/50 p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm">SMS Notifications</FormLabel>
                                                <p className="text-xs text-muted-foreground">Send SMS advisories</p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={Boolean(field.value)}
                                                    onCheckedChange={(checked) => field.onChange(checked)}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={createForm.control}
                                    name="email_enabled"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center justify-between rounded border border-border/50 p-3">
                                            <div className="space-y-0.5">
                                                <FormLabel className="text-sm">Email Notifications</FormLabel>
                                                <p className="text-xs text-muted-foreground">Send email advisories</p>
                                            </div>
                                            <FormControl>
                                                <Switch
                                                    checked={Boolean(field.value)}
                                                    onCheckedChange={(checked) => field.onChange(checked)}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <DialogFooter className="pt-2">
                                <Button type="button" variant="outline" onClick={() => setCreateFarmersOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                                    {createForm.formState.isSubmitting ? 'Creating...' : 'Create Farmer'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <AlertDialog open={Boolean(pendingDeleteId)} onOpenChange={(o) => !o && setPendingDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this farmer?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove
                            {pendingDeleteFarmer?.full_name ? (
                                <> <span className="font-semibold">{pendingDeleteFarmer.full_name}</span></>
                            ) : (
                                ' this farmer'
                            )}
                            {' '}from the directory. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => {
                                if (pendingDeleteId) {
                                    void handleDeleteFarmers({ id: pendingDeleteId });
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

// Single-select Combobox for districts (backed by GET /districts/list)
function DistrictCombobox({
    value,
    onChange,
    options,
}: {
    value: string;
    onChange: (v: string) => void;
    options: DistrictOption[];
}) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.id === value);
    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="bg-background w-full justify-between font-normal"
                >
                    {selected ? (selected.name ?? selected.id) : 'Select district…'}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search districts…" />
                    <CommandList>
                        <CommandEmpty>No district found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((d) => (
                                <CommandItem
                                    key={d.id}
                                    value={`${d.name ?? ''} ${d.id ?? ''}`}
                                    onSelect={() => {
                                        onChange(d.id ?? '');
                                        setOpen(false);
                                    }}
                                >
                                    <Check className={cn('mr-2 h-4 w-4', value === d.id ? 'opacity-100' : 'opacity-0')} />
                                    <span>{d.name ?? d.id}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

// Multi-select Combobox for crops (backed by GET /crops/list)
function CropMultiCombobox({
    value,
    onChange,
    options,
}: {
    value: string[];
    onChange: (v: string[]) => void;
    options: CropOption[];
}) {
    const [open, setOpen] = useState(false);
    const selectedSet = useMemo(() => new Set(value), [value]);
    const selectedOptions = options.filter((o) => o.id && selectedSet.has(o.id));

    function toggle(id: string) {
        if (selectedSet.has(id)) {
            onChange(value.filter((v) => v !== id));
        } else {
            onChange([...value, id]);
        }
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="bg-background w-full min-h-10 h-auto py-2 justify-between font-normal"
                >
                    <div className="flex flex-wrap gap-1 items-center text-left">
                        {selectedOptions.length === 0 && (
                            <span className="text-muted-foreground">Select crops…</span>
                        )}
                        {selectedOptions.map((c) => (
                            <Badge key={c.id} variant="secondary" className="rounded gap-1">
                                {c.name ?? c.id}
                                <span
                                    role="button"
                                    aria-label={`Remove ${c.name ?? c.id}`}
                                    className="ml-1 cursor-pointer hover:text-destructive"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (c.id) toggle(c.id);
                                    }}
                                >
                                    <X className="h-3 w-3" />
                                </span>
                            </Badge>
                        ))}
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                <Command>
                    <CommandInput placeholder="Search crops…" />
                    <CommandList>
                        <CommandEmpty>No crop found.</CommandEmpty>
                        <CommandGroup>
                            {options.map((c) => {
                                const id = c.id ?? '';
                                const isSelected = selectedSet.has(id);
                                return (
                                    <CommandItem
                                        key={id}
                                        value={`${c.name ?? ''} ${id}`}
                                        onSelect={() => toggle(id)}
                                    >
                                        <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                                        <span>{c.name ?? id}</span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
