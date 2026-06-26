import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from '@/lib/toast';
import { useAuth } from '@/contexts/AuthContext';
import {
    usersService,
    type UsersProfileParams,
    type UsersProfileResponse,
    type UsersPutProfileParams,
    type UsersPutProfileResponse,
} from '@/lib/api/usersService';
import {
    districtsService,
    type DistrictsListParams,
    type DistrictsListResponse,
} from '@/lib/api/districtsService';
import {
    notificationsService,
    type NotificationsPreferencesParams,
    type NotificationsPreferencesResponse,
} from '@/lib/api/notificationsService';
import {
    integrationsService,
    type IntegrationsListParams,
    type IntegrationsListResponse,
    type IntegrationsUpdateParams,
    type IntegrationsUpdateResponse,
} from '@/lib/api/integrationsService';
import { integrationsUpdateSchema } from '@/lib/api/integrationsFormSchema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
    User, Lock, Bell, Link2, MoreVertical, Check, ChevronsUpDown, KeyRound,
    ShieldCheck, CloudSun, Map, MessageSquare, Mail, RefreshCw, Loader2,
    CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type District = DistrictsListResponse['data'][number];
type Integration = IntegrationsListResponse['data'][number];

export default function Settings() {


    // Detail state — GET /users/profile
    const [usersItem, setUsersItem] = useState<UsersProfileResponse['data'] | null>(null);
    const [loadingUsersItem, setLoadingUsersItem] = useState(false);
    // ↑ User is the singular row type
    // List state — GET /districts/list
    const [districts, setDistricts] = useState<District[]>([]);
    const [loadingDistricts, setLoadingDistricts] = useState(true);
    const [districtsPage, setDistrictsPage] = useState(1);
    const [districtsLimit] = useState(10);
    const [districtsTotal, setDistrictsTotal] = useState(0);
    // List state — GET /integrations/list
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loadingIntegrations, setLoadingIntegrations] = useState(true);
    const [integrationsPage, setIntegrationsPage] = useState(1);
    const [integrationsLimit] = useState(10);
    const [integrationsTotal, setIntegrationsTotal] = useState(0);
    // Edit dialog state — PUT /integrations/update
    const [editIntegrationsTarget, setEditIntegrationsTarget] = useState<Integration | null>(null);

    useEffect(() => { void loadDistricts(); }, [districtsPage]);
    useEffect(() => { void loadIntegrations(); }, [integrationsPage]);

    async function loadUsersItem() {
        try {
            setLoadingUsersItem(true);
            const res = await usersService.profile();
            setUsersItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load profile');
            console.error('[loadUsersItem]', err);
        } finally {
            setLoadingUsersItem(false);
        }
    }
    async function loadDistricts() {
        try {
            setLoadingDistricts(true);
            const res = await districtsService.list({ page: districtsPage, limit: districtsLimit });
            setDistricts(Array.isArray(res?.data) ? res.data : []);
            setDistrictsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districts');
            console.error('[loadDistricts]', err);
        } finally {
            setLoadingDistricts(false);
        }
    }
    // PUT /users/profile
    async function handlePutProfile(data: UsersPutProfileParams) {
        try {
            await usersService.putProfile(data);
            toast.success('Done');
        } catch (err) {
            toast.error('Action failed');
            console.error('[handlePutProfile]', err);
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
    async function loadIntegrations() {
        try {
            setLoadingIntegrations(true);
            const res = await integrationsService.list({ page: integrationsPage, limit: integrationsLimit });
            setIntegrations(Array.isArray(res?.data) ? res.data : []);
            setIntegrationsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load integrations');
            console.error('[loadIntegrations]', err);
        } finally {
            setLoadingIntegrations(false);
        }
    }
    async function handleUpdateIntegrations(data: IntegrationsUpdateParams) {
        try {
            await integrationsService.update(data);
            toast.success('Updated');
            setEditIntegrationsTarget(null);
            void loadIntegrations();
        } catch (err) {
            toast.error('Failed to update');
            console.error('[handleUpdateIntegrations]', err);
        }
    }

    const { user } = useAuth();

    /* ---- derived admin check (researcher + maaif official see integrations) ---- */
    const isAdmin = useMemo(() => {
        const role = (user?.role ?? '').toLowerCase();
        return role === 'researcher' || role === 'maaif official';
    }, [user?.role]);

    /* ---- profile form schema ---- */
    const profileSchema = z.object({
        full_name: z.string().min(1, 'Full name is required'),
        email: z.string().email('Invalid email'),
        phone_number: z.string().min(7, 'Phone number is required'),
        district_id: z.string().min(1, 'District is required'),
        sub_county: z.string().min(1, 'Sub-county is required'),
        current_password: z.string().optional(),
        new_password: z.string().optional(),
    });
    type ProfileFormValues = z.infer<typeof profileSchema>;

    const profileForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone_number: '',
            district_id: '',
            sub_county: '',
            current_password: '',
            new_password: '',
        },
    });

    /* ---- notification preferences form schema ---- */
    const notifSchema = z.object({
        sms_enabled: z.boolean(),
        email_enabled: z.boolean(),
        in_app_enabled: z.boolean(),
        phone_number: z.string().min(7, 'Phone number is required'),
        email: z.string().email('Invalid email'),
        alert_types: z.array(z.string()),
    });
    type NotifFormValues = z.infer<typeof notifSchema>;

    const notifForm = useForm<NotifFormValues>({
        resolver: zodResolver(notifSchema),
        defaultValues: {
            sms_enabled: false,
            email_enabled: false,
            in_app_enabled: false,
            phone_number: '',
            email: '',
            alert_types: [],
        },
    });

    /* ---- integration edit form ---- */
    const integrationsForm = useForm<{ service_name?: string; api_key?: string }>({
        resolver: zodResolver(integrationsUpdateSchema),
        defaultValues: { service_name: '', api_key: '' },
    });

    /* ---- district searchable popover state ---- */
    const [districtOpen, setDistrictOpen] = useState(false);
    const [districtSearch, setDistrictSearch] = useState('');
    const [selectedDistrictName, setSelectedDistrictName] = useState('');

    /* ---- sync profile form when data loads ---- */
    useEffect(() => {
        if (usersItem) {
            const d = usersItem;
            profileForm.reset({
                full_name: d.full_name ?? '',
                email: d.email ?? '',
                phone_number: d.phone_number ?? '',
                district_id: d.district ?? '',
                sub_county: d.sub_county ?? '',
                current_password: '',
                new_password: '',
            });
            notifForm.reset({
                sms_enabled: d.sms_enabled ?? false,
                email_enabled: d.email_notifications_enabled ?? false,
                in_app_enabled: d.in_app_enabled ?? false,
                phone_number: d.phone_number ?? '',
                email: d.email ?? '',
                alert_types: [],
            });
            const match = districts.find((dist) => dist.id === d.district);
            setSelectedDistrictName(match?.name ?? d.district ?? '');
        }
        // profileForm/notifForm intentionally omitted — they are stable refs from useForm
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usersItem, districts]);

    /* ---- load profile on mount ---- */
    useEffect(() => {
        void loadUsersItem();
        // loadUsersItem intentionally omitted — stable handler
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* ---- sync integration edit form when target changes ---- */
    useEffect(() => {
        if (editIntegrationsTarget) {
            integrationsForm.reset({
                service_name: editIntegrationsTarget.service_name ?? '',
                api_key: '',
            });
        }
        // integrationsForm is a stable ref from useForm — omitted intentionally
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editIntegrationsTarget]);

    /* ---- profile form submit ---- */
    async function onProfileSubmit(data: ProfileFormValues) {
        await handlePutProfile({
            full_name: data.full_name,
            email: data.email,
            phone_number: data.phone_number,
            district_id: data.district_id,
            sub_county: data.sub_county,
            current_password: data.current_password ?? '',
            new_password: data.new_password ?? '',
        });
        toast.success('Profile updated successfully');
    }

    /* ---- notification form submit ---- */
    async function onNotifSubmit(data: NotifFormValues) {
        await handlePreferences(data as NotificationsPreferencesParams);
        toast.success('Notification preferences saved');
    }

    /* ---- integration form submit ---- */
    async function onIntegrationSubmit(data: { service_name?: string; api_key?: string }) {
        await handleUpdateIntegrations({
            service_name: data.service_name ?? '',
            api_key: data.api_key ?? '',
        });
    }

    /* ---- integration icon helper ---- */
    function IntegrationIcon({ name }: { name?: string }) {
        const lc = (name ?? '').toLowerCase();
        if (lc.includes('weather')) return <CloudSun className="h-5 w-5 text-amber-400" />;
        if (lc.includes('map') || lc.includes('google')) return <Map className="h-5 w-5 text-emerald-400" />;
        if (lc.includes('twilio') || lc.includes('sms')) return <MessageSquare className="h-5 w-5 text-sky-400" />;
        if (lc.includes('sendgrid') || lc.includes('email')) return <Mail className="h-5 w-5 text-violet-400" />;
        return <Link2 className="h-5 w-5 text-muted-foreground" />;
    }

    function IntegrationStatusBadge({ status }: { status?: string }) {
        const lc = (status ?? '').toLowerCase();
        if (lc === 'active') return (
            <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1">
                <CheckCircle2 className="h-3 w-3" /> Active
            </Badge>
        );
        if (lc === 'error' || lc === 'inactive') return (
            <Badge variant="outline" className="border-red-500/50 text-red-400 gap-1">
                <XCircle className="h-3 w-3" /> {status}
            </Badge>
        );
        return (
            <Badge variant="outline" className="border-amber-500/50 text-amber-400 gap-1">
                <AlertCircle className="h-3 w-3" /> {status ?? 'Unknown'}
            </Badge>
        );
    }

    const filteredDistricts = useMemo(
        () => districts.filter((d) => (d.name ?? '').toLowerCase().includes(districtSearch.toLowerCase())),
        [districts, districtSearch]
    );

    const ALERT_TYPE_OPTIONS = ['weather_alert', 'pest_disease', 'market_price', 'recommendation'];

    return (
        <div className="p-6 md:p-8 min-h-screen space-y-6">
            {/* Page Header */}
            <div className="space-y-1">
                <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                    Settings
                </h1>
                <p className="text-muted-foreground text-sm">
                    Manage your account, notifications, and system integrations for the Climate-Smart Agriculture platform.
                </p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList className="bg-card/60 backdrop-blur-md border border-border/40 p-1 h-auto flex flex-wrap gap-1">
                    <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <User className="h-4 w-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Lock className="h-4 w-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        <Bell className="h-4 w-4" /> Notifications
                    </TabsTrigger>
                    {isAdmin && (
                        <TabsTrigger value="integrations" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                            <Link2 className="h-4 w-4" /> Integrations
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ──────────────────── PROFILE TAB ──────────────────── */}
                <TabsContent value="profile">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader>
                            <CardTitle className="font-heading text-xl flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" /> Personal Information
                            </CardTitle>
                            <CardDescription>Update your name, contact details, and registered area.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingUsersItem ? (
                                <div className="space-y-4">
                                    {[...Array(5)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full rounded-md" />
                                    ))}
                                </div>
                            ) : (
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        {/* Full Name */}
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name">Full Name</Label>
                                            <Input
                                                id="full_name"
                                                placeholder="e.g. Amara Okello"
                                                {...profileForm.register('full_name')}
                                                className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                            />
                                            {profileForm.formState.errors.full_name && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.full_name.message}</p>
                                            )}
                                        </div>

                                        {/* Email */}
                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                {...profileForm.register('email')}
                                                className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                            />
                                            {profileForm.formState.errors.email && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.email.message}</p>
                                            )}
                                        </div>

                                        {/* Phone Number */}
                                        <div className="space-y-2">
                                            <Label htmlFor="phone_number">Phone Number</Label>
                                            <Input
                                                id="phone_number"
                                                placeholder="+256 7XX XXX XXX"
                                                {...profileForm.register('phone_number')}
                                                className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                            />
                                            {profileForm.formState.errors.phone_number && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.phone_number.message}</p>
                                            )}
                                        </div>

                                        {/* Sub County */}
                                        <div className="space-y-2">
                                            <Label htmlFor="sub_county">Sub-County</Label>
                                            <Input
                                                id="sub_county"
                                                placeholder="e.g. Nakawa"
                                                {...profileForm.register('sub_county')}
                                                className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                            />
                                            {profileForm.formState.errors.sub_county && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.sub_county.message}</p>
                                            )}
                                        </div>

                                        {/* District — searchable popover */}
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Registered District</Label>
                                            <Popover open={districtOpen} onOpenChange={setDistrictOpen}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={districtOpen}
                                                        className="w-full justify-between bg-background/50 border-border/50 hover:border-primary/50 transition-colors duration-200 font-normal"
                                                    >
                                                        {selectedDistrictName || (loadingDistricts ? 'Loading districts…' : 'Select district…')}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[320px] p-0 backdrop-blur-md bg-popover/90 border-border/50">
                                                    <Command>
                                                        <CommandInput
                                                            placeholder="Search districts…"
                                                            value={districtSearch}
                                                            onValueChange={setDistrictSearch}
                                                        />
                                                        <CommandList>
                                                            <CommandEmpty>
                                                                {loadingDistricts ? 'Loading…' : 'No districts found.'}
                                                            </CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredDistricts.map((dist) => (
                                                                    <CommandItem
                                                                        key={dist.id}
                                                                        value={dist.name ?? ''}
                                                                        onSelect={() => {
                                                                            profileForm.setValue('district_id', dist.id ?? '');
                                                                            setSelectedDistrictName(dist.name ?? '');
                                                                            setDistrictOpen(false);
                                                                            setDistrictSearch('');
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                'mr-2 h-4 w-4',
                                                                                profileForm.watch('district_id') === dist.id ? 'opacity-100 text-primary' : 'opacity-0'
                                                                            )}
                                                                        />
                                                                        <span>{dist.name}</span>
                                                                        {dist.region && (
                                                                            <span className="ml-auto text-xs text-muted-foreground">{dist.region}</span>
                                                                        )}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            {profileForm.formState.errors.district_id && (
                                                <p className="text-xs text-destructive">{profileForm.formState.errors.district_id.message}</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="submit"
                                            disabled={profileForm.formState.isSubmitting}
                                            className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] hover:bg-primary/10 transition-all duration-200 ease-out"
                                        >
                                            {profileForm.formState.isSubmitting ? (
                                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                            ) : 'Save Profile'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ──────────────────── SECURITY TAB ──────────────────── */}
                <TabsContent value="security">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader>
                            <CardTitle className="font-heading text-xl flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-primary" /> Change Password
                            </CardTitle>
                            <CardDescription>Keep your account secure by regularly updating your password.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-5 max-w-md">
                                <div className="space-y-2">
                                    <Label htmlFor="current_password">Current Password</Label>
                                    <Input
                                        id="current_password"
                                        type="password"
                                        placeholder="Enter current password"
                                        {...profileForm.register('current_password')}
                                        className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="new_password">New Password</Label>
                                    <Input
                                        id="new_password"
                                        type="password"
                                        placeholder="Enter new password"
                                        {...profileForm.register('new_password')}
                                        className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                    />
                                </div>
                                <div className="flex justify-start pt-2">
                                    <Button
                                        type="submit"
                                        disabled={profileForm.formState.isSubmitting}
                                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] hover:bg-primary/10 transition-all duration-200 ease-out"
                                    >
                                        {profileForm.formState.isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</>
                                        ) : (
                                            <><KeyRound className="mr-2 h-4 w-4" /> Update Password</>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ──────────────────── NOTIFICATIONS TAB ──────────────────── */}
                <TabsContent value="notifications">
                    <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                        <CardHeader>
                            <CardTitle className="font-heading text-xl flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" /> Notification Preferences
                            </CardTitle>
                            <CardDescription>
                                Control how you receive alerts — via SMS (Twilio), email (SendGrid), and in-app notifications.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={notifForm.handleSubmit(onNotifSubmit)} className="space-y-6">
                                {/* Delivery channels */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Delivery Channels</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        {/* SMS */}
                                        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 p-4">
                                            <div className="flex items-center gap-3">
                                                <MessageSquare className="h-5 w-5 text-sky-400" />
                                                <div>
                                                    <p className="text-sm font-medium">SMS Alerts</p>
                                                    <p className="text-xs text-muted-foreground">via Twilio</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={notifForm.watch('sms_enabled')}
                                                onCheckedChange={(v) => notifForm.setValue('sms_enabled', v)}
                                            />
                                        </div>
                                        {/* Email */}
                                        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 p-4">
                                            <div className="flex items-center gap-3">
                                                <Mail className="h-5 w-5 text-violet-400" />
                                                <div>
                                                    <p className="text-sm font-medium">Email Alerts</p>
                                                    <p className="text-xs text-muted-foreground">via SendGrid</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={notifForm.watch('email_enabled')}
                                                onCheckedChange={(v) => notifForm.setValue('email_enabled', v)}
                                            />
                                        </div>
                                        {/* In-app */}
                                        <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 p-4">
                                            <div className="flex items-center gap-3">
                                                <Bell className="h-5 w-5 text-amber-400" />
                                                <div>
                                                    <p className="text-sm font-medium">In-App</p>
                                                    <p className="text-xs text-muted-foreground">Platform notifications</p>
                                                </div>
                                            </div>
                                            <Switch
                                                checked={notifForm.watch('in_app_enabled')}
                                                onCheckedChange={(v) => notifForm.setValue('in_app_enabled', v)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Contact fields */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div className="space-y-2">
                                        <Label htmlFor="notif_phone">SMS Phone Number</Label>
                                        <Input
                                            id="notif_phone"
                                            placeholder="+256 7XX XXX XXX"
                                            {...notifForm.register('phone_number')}
                                            className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                        />
                                        {notifForm.formState.errors.phone_number && (
                                            <p className="text-xs text-destructive">{notifForm.formState.errors.phone_number.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="notif_email">Notification Email</Label>
                                        <Input
                                            id="notif_email"
                                            type="email"
                                            placeholder="you@example.com"
                                            {...notifForm.register('email')}
                                            className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                                        />
                                        {notifForm.formState.errors.email && (
                                            <p className="text-xs text-destructive">{notifForm.formState.errors.email.message}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Alert types */}
                                <div className="space-y-3">
                                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Alert Types</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {ALERT_TYPE_OPTIONS.map((type) => {
                                            const selected = notifForm.watch('alert_types').includes(type);
                                            return (
                                                <button
                                                    type="button"
                                                    key={type}
                                                    onClick={() => {
                                                        const current = notifForm.getValues('alert_types');
                                                        notifForm.setValue(
                                                            'alert_types',
                                                            selected ? current.filter((t) => t !== type) : [...current, type]
                                                        );
                                                    }}
                                                    className={cn(
                                                        'px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ease-out',
                                                        selected
                                                            ? 'bg-primary/20 border-primary/60 text-primary shadow-[0_0_8px_rgba(var(--primary),0.2)]'
                                                            : 'bg-background/30 border-border/40 text-muted-foreground hover:border-primary/40 hover:text-foreground'
                                                    )}
                                                >
                                                    {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button
                                        type="submit"
                                        disabled={notifForm.formState.isSubmitting}
                                        className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] hover:bg-primary/10 transition-all duration-200 ease-out"
                                    >
                                        {notifForm.formState.isSubmitting ? (
                                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                        ) : 'Save Preferences'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ──────────────────── INTEGRATIONS TAB (admin only) ──────────────────── */}
                {isAdmin && (
                    <TabsContent value="integrations">
                        <Card className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md">
                            <CardHeader className="flex flex-row items-start justify-between gap-4">
                                <div>
                                    <CardTitle className="font-heading text-xl flex items-center gap-2">
                                        <Link2 className="h-5 w-5 text-primary" /> API Integrations
                                    </CardTitle>
                                    <CardDescription>
                                        Manage API keys for OpenWeatherMap, Google Maps, Twilio, and SendGrid.
                                        Keys can be rotated here without any code deployments.
                                    </CardDescription>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => void loadIntegrations()}
                                    disabled={loadingIntegrations}
                                    className="shrink-0 text-muted-foreground hover:text-foreground"
                                >
                                    <RefreshCw className={cn('h-4 w-4', loadingIntegrations && 'animate-spin')} />
                                </Button>
                            </CardHeader>
                            <CardContent>
                                {loadingIntegrations ? (
                                    <div className="space-y-3">
                                        {[...Array(4)].map((_, i) => (
                                            <Skeleton key={i} className="h-16 w-full rounded-lg" />
                                        ))}
                                    </div>
                                ) : integrations.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                        <Link2 className="h-10 w-10 opacity-30" />
                                        <p className="text-sm">No integrations configured yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {integrations.map((integration) => (
                                            <div
                                                key={integration.id}
                                                className="flex items-center justify-between rounded-lg border border-border/40 bg-background/30 p-4 hover:bg-background/50 transition-colors duration-200 ease-out group"
                                            >
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-card/80 border border-border/40 flex items-center justify-center">
                                                        <IntegrationIcon name={integration.service_name} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate">{integration.service_name ?? '—'}</p>
                                                        <p className="text-xs text-muted-foreground font-mono truncate">
                                                            {integration.api_key_masked ?? '••••••••'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                                    <div className="hidden sm:flex flex-col items-end gap-1">
                                                        <IntegrationStatusBadge status={integration.status} />
                                                        {integration.last_verified && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Verified {new Date(integration.last_verified).toLocaleDateString()}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-muted-foreground hover:text-foreground opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200"
                                                            >
                                                                <MoreVertical className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="backdrop-blur-md bg-popover/90 border-border/50">
                                                            <DropdownMenuItem
                                                                onClick={() => setEditIntegrationsTarget(integration)}
                                                                className="cursor-pointer"
                                                            >
                                                                <KeyRound className="mr-2 h-4 w-4" /> Rotate API Key
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Pagination */}
                                {integrationsTotal > integrationsLimit && (
                                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-border/30">
                                        <p className="text-xs text-muted-foreground">
                                            Showing {integrations.length} of {integrationsTotal} integrations
                                        </p>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIntegrationsPage((p) => Math.max(1, p - 1))}
                                                disabled={integrationsPage === 1}
                                                className="border-border/50"
                                            >
                                                Previous
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setIntegrationsPage((p) => p + 1)}
                                                disabled={integrations.length < integrationsLimit}
                                                className="border-border/50"
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>

            {/* ──────────────────── INTEGRATIONS EDIT DIALOG ──────────────────── */}
            <Dialog open={!!editIntegrationsTarget} onOpenChange={(open) => { if (!open) setEditIntegrationsTarget(null); }}>
                <DialogContent className="backdrop-blur-md bg-card/80 border border-border/40 shadow-xl max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-heading text-lg flex items-center gap-2">
                            <KeyRound className="h-5 w-5 text-primary" />
                            Rotate API Key — {editIntegrationsTarget?.service_name}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={integrationsForm.handleSubmit(onIntegrationSubmit)} className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label htmlFor="edit_service_name">Service Name</Label>
                            <Input
                                id="edit_service_name"
                                readOnly
                                {...integrationsForm.register('service_name')}
                                className="bg-background/30 border-border/40 text-muted-foreground cursor-not-allowed"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit_api_key">New API Key</Label>
                            <Input
                                id="edit_api_key"
                                type="password"
                                placeholder="Paste new API key here…"
                                {...integrationsForm.register('api_key')}
                                className="bg-background/50 border-border/50 focus:border-primary/70 transition-colors duration-200"
                            />
                            {integrationsForm.formState.errors.api_key && (
                                <p className="text-xs text-destructive">{String(integrationsForm.formState.errors.api_key.message ?? '')}</p>
                            )}
                        </div>
                        <DialogFooter className="gap-2 pt-2">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="border-border/50"
                                    onClick={() => setEditIntegrationsTarget(null)}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={integrationsForm.formState.isSubmitting}
                                className="bg-transparent border border-primary text-primary shadow-[0_0_12px_rgba(var(--primary),0.3)] hover:bg-primary/10 transition-all duration-200 ease-out"
                            >
                                {integrationsForm.formState.isSubmitting ? (
                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</>
                                ) : (
                                    <><RefreshCw className="mr-2 h-4 w-4" /> Rotate Key</>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
