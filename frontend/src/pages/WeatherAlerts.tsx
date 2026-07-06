import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Bell,
    CalendarRange,
    Cloud,
    CloudOff,
    CloudRain,
    CloudSun,
    Droplets,
    RefreshCw,
    Settings,
    Siren,
    AlertTriangle,
    Sprout,
    Sun,
    Thermometer,
    Umbrella,
    Wind,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { toast } from '@/lib/toast';
import {
    weatherService,
    type WeatherCurrentResponse,
    type WeatherForecastResponse,
} from '@/lib/api/weatherService';
import {
    alertsService,
    type AlertsListResponse,
} from '@/lib/api/alertsService';
import {
    notificationsService,
    type NotificationsPreferencesParams,
} from '@/lib/api/notificationsService';

type Weather = WeatherForecastResponse['data'][number];
type AlertItem = AlertsListResponse['data'][number];

export default function WeatherAlerts() {
    const navigate = useNavigate();

    // Detail state — GET /weather/current
    const [weatherItem, setWeatherItem] = useState<WeatherCurrentResponse['data'] | null>(null);
    const [loadingWeatherItem, setLoadingWeatherItem] = useState(false);
    // ↑ Weather is the singular row type
    // List state — GET /weather/forecast
    const [weather, setWeather] = useState<Weather[]>([]);
    const [loadingWeather, setLoadingWeather] = useState(true);
    const [weatherLimit] = useState(10);
    // List state — GET /alerts/list
    const [alerts, setAlerts] = useState<AlertItem[]>([]);
    const [loadingAlerts, setLoadingAlerts] = useState(true);
    const [alertsPage, setAlertsPage] = useState(1);
    const [alertsLimit] = useState(10);
    const [alertsTotal, setAlertsTotal] = useState(0);

    useEffect(() => { void loadWeather(); }, []); // 10-day forecast fetched once
    useEffect(() => { void loadAlerts(); }, [alertsPage]);
    useEffect(() => { void loadWeatherItem(); }, []);

    // Local UI state
    const [prefsOpen, setPrefsOpen] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [inAppEnabled, setInAppEnabled] = useState(true);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [email, setEmail] = useState('');
    const [selectedAlertTypes, setSelectedAlertTypes] = useState<string[]>(['frost', 'drought', 'heavy_rain']);

    const ALERT_TYPES = ['frost', 'drought', 'heavy_rain', 'pest_outbreak', 'wind', 'heatwave'];

    // Derive season-position progress (visual only) based on current month
    const seasonProgress = useMemo(() => {
        const m = new Date().getMonth() + 1; // 1..12
        const first = m >= 3 && m <= 5 ? ((m - 2) / 3) * 100 : m === 6 ? 100 : 0;
        const dry = m >= 6 && m <= 9 ? ((m - 5) / 4) * 100 : m > 9 || m < 3 ? 100 : 0;
        const second = m >= 10 && m <= 12 ? ((m - 9) / 3) * 100 : m === 1 ? 33 : 0;
        return { first, dry, second };
    }, []);

    async function loadWeatherItem() {
        try {
            setLoadingWeatherItem(true);
            const res = await weatherService.current();
            setWeatherItem(res?.data ?? null);
        } catch (err) {
            toast.error('Failed to load current conditions');
            console.error('[loadWeatherItem]', err);
        } finally {
            setLoadingWeatherItem(false);
        }
    }
    async function loadWeather() {
        try {
            setLoadingWeather(true);
            const res = await weatherService.forecast({ limit: weatherLimit });
            setWeather(Array.isArray(res?.data) ? res.data : []);
        } catch (err) {
            toast.error('Failed to load forecast');
            console.error('[loadWeather]', err);
        } finally {
            setLoadingWeather(false);
        }
    }
    async function loadAlerts() {
        try {
            setLoadingAlerts(true);
            const res = await alertsService.list({ page: alertsPage, limit: alertsLimit });
            setAlerts(Array.isArray(res?.data) ? res.data : []);
            setAlertsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load alerts');
            console.error('[loadAlerts]', err);
        } finally {
            setLoadingAlerts(false);
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

    function gotoPage_6() {
        navigate('/farmer/pest-disease');
    }
    function gotoPage_7() {
        navigate('/farmer/recommendations');
    }

    return (
    <div className="p-6 md:p-8 space-y-8">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-lg border border-border/40 bg-card/60 backdrop-blur-md shadow-md">
        <img
          src="https://images.unsplash.com/photo-1602867741746-6df80f40b3f6?auto=format&fit=crop&w=1600&q=80"
          alt="Uganda maize field under weather monitoring"
          className="absolute inset-0 h-full w-full object-cover opacity-50"
          loading="lazy"
        />
        <div className="relative z-10 flex flex-col gap-4 p-8 md:p-10 bg-gradient-to-r from-background/85 via-background/60 to-transparent">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary backdrop-blur">
              Farmer Home
            </Badge>
            {weatherItem?.anomaly_flag && (
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/15 text-amber-600">
                Anomaly Detected
              </Badge>
            )}
            {weatherItem?.season_position && (
              <Badge variant="secondary" className="backdrop-blur">
                {weatherItem.season_position}
              </Badge>
            )}
          </div>
          <h1 className="font-heading text-4xl md:text-5xl tracking-tight">
            Weather Alerts
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Field-level real-time conditions, tiered alerts, and a 10-day outlook calibrated to your district and agro-ecological zone.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              className="border border-primary/40 bg-transparent text-primary shadow-[0_0_12px_hsl(var(--primary)/0.45)] hover:bg-primary/10"
              onClick={gotoPage_7}
            >
              <Sprout className="mr-2 h-4 w-4" /> View Recommendations
            </Button>
            <Button
              variant="outline"
              className="border-border/60 bg-card/70 backdrop-blur"
              onClick={() => { void loadWeather(); void loadAlerts(); }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Refresh
            </Button>
          </div>
        </div>
      </section>

      {/* CURRENT CONDITIONS */}
      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-2xl">Current Conditions</h2>
            <p className="text-sm text-muted-foreground">Live data from OpenWeatherMap</p>
          </div>
          {weatherItem?.recorded_at && (
            <span className="text-xs text-muted-foreground">
              Recorded {new Date(weatherItem.recorded_at).toLocaleString()}
            </span>
          )}
        </div>
        {loadingWeatherItem ? (
          <Skeleton className="h-40 w-full rounded-lg" />
        ) : weatherItem ? (
          <Card className="border-border/40 bg-card/70 backdrop-blur-md shadow-md">
            <CardContent className="grid grid-cols-2 gap-4 p-6 md:grid-cols-3 lg:grid-cols-6">
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">District</span>
                <span className="mt-1 font-heading text-xl">{weatherItem.district ?? '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Condition</span>
                <span className="mt-1 flex items-baseline gap-1 font-heading text-xl">
                  <CloudSun className="h-5 w-5 text-primary" />
                  {weatherItem.condition ?? '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Temperature</span>
                <span className="mt-1 flex items-baseline gap-1 font-heading text-2xl">
                  <Thermometer className="h-5 w-5 text-primary" />
                  {typeof weatherItem.temperature === 'number' ? `${weatherItem.temperature}°C` : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Rainfall</span>
                <span className="mt-1 flex items-baseline gap-1 font-heading text-2xl">
                  <CloudRain className="h-5 w-5 text-primary" />
                  {typeof weatherItem.rainfall === 'number' ? `${weatherItem.rainfall} mm` : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Humidity</span>
                <span className="mt-1 flex items-baseline gap-1 font-heading text-2xl">
                  <Droplets className="h-5 w-5 text-primary" />
                  {typeof weatherItem.humidity === 'number' ? `${weatherItem.humidity}%` : '—'}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Wind</span>
                <span className="mt-1 flex items-baseline gap-1 font-heading text-2xl">
                  <Wind className="h-5 w-5 text-primary" />
                  {typeof weatherItem.wind_speed === 'number' ? `${weatherItem.wind_speed} km/h` : '—'}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/40 bg-card/70 backdrop-blur-md">
            <CardContent className="flex flex-col items-center gap-2 p-10 text-center text-muted-foreground">
              <CloudSun className="h-10 w-10 opacity-50" />
              No current readings available for your district.
            </CardContent>
          </Card>
        )}
      </section>

      {/* ACTIVE ALERTS BANNER */}
      {alerts.some((a) => a.alert_level === 'emergency') && (
        <Alert className="border-l-4 border-l-red-500 border-border/40 bg-card/70 backdrop-blur-md shadow-md">
          <Siren className="h-5 w-5 text-red-500" />
          <AlertTitle className="font-heading text-red-600">Emergency Weather Alert</AlertTitle>
          <AlertDescription className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <span>
              {alerts.find((a) => a.alert_level === 'emergency')?.title ?? 'Take immediate protective action for your fields.'}
            </span>
            <Button
              size="sm"
              onClick={gotoPage_6}
              className="border border-primary/40 bg-transparent text-primary shadow-[0_0_12px_hsl(var(--primary)/0.45)] hover:bg-primary/10"
            >
              Open Pest & Disease Warnings <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {alerts.some((a) => a.alert_level === 'warning') && (
        <Alert className="border-l-4 border-l-amber-500 border-border/40 bg-card/70 backdrop-blur-md shadow-md">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          <AlertTitle className="font-heading text-amber-600">Weather Warning</AlertTitle>
          <AlertDescription>
            {alerts.find((a) => a.alert_level === 'warning')?.title ?? 'Heed advisories and prepare fields accordingly.'}
          </AlertDescription>
        </Alert>
      )}
      {alerts.some((a) => a.alert_level === 'watch') && (
        <Alert className="border-l-4 border-l-green-500 border-border/40 bg-card/70 backdrop-blur-md shadow-md">
          <Bell className="h-5 w-5 text-green-500" />
          <AlertTitle className="font-heading text-green-600">Weather Watch</AlertTitle>
          <AlertDescription>
            {alerts.find((a) => a.alert_level === 'watch')?.title ?? 'Conditions are being monitored. Stay tuned.'}
          </AlertDescription>
        </Alert>
      )}

      {/* TWO-COLUMN: FORECAST + ALERTS */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* FORECAST */}
        <Card className="lg:col-span-2 border-border/40 bg-card/70 backdrop-blur-md shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">10-Day Forecast</CardTitle>
              <CardDescription>Outlook for your district</CardDescription>
            </div>
            <CalendarRange className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            {loadingWeather ? (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-44 min-w-[180px] flex-shrink-0 rounded-lg" />
                ))}
              </div>
            ) : weather.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
                <CloudOff className="h-10 w-10 opacity-50" />
                No forecast data available.
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {weather.map((w, idx) => {
                  const isToday = idx === 0;
                  return (
                    <div
                      key={`${w.date ?? 'd'}-${idx}`}
                      className={`group relative min-w-[180px] flex-shrink-0 rounded-lg border backdrop-blur-md shadow-md transition hover:shadow-lg ${
                        isToday
                          ? 'border-primary/50 bg-card/80 shadow-[0_0_16px_hsl(var(--primary)/0.15)]'
                          : 'border-border/40 bg-card/60'
                      }`}
                    >
                      <div className="flex flex-col gap-2 p-4">
                        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {w.date
                            ? new Date(w.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
                            : '—'}
                        </span>
                        {isToday && (
                          <Badge variant="outline" className="w-fit border-primary/40 bg-primary/10 text-[10px] text-primary">
                            Today
                          </Badge>
                        )}
                        <span className="text-sm font-heading">{w.condition ?? '—'}</span>
                        <div className="mt-1 flex items-baseline gap-1">
                          <Thermometer className="h-4 w-4 text-primary" />
                          <span className="text-lg font-heading">
                            {typeof w.temperature_max === 'number' ? `${w.temperature_max}°` : '—'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            / {typeof w.temperature_min === 'number' ? `${w.temperature_min}°` : '—'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CloudRain className="h-3 w-3" />
                            {typeof w.rainfall === 'number' ? `${w.rainfall} mm` : '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Droplets className="h-3 w-3" />
                            {typeof w.humidity === 'number' ? `${w.humidity}%` : '—'}
                          </span>
                          <span className="flex items-center gap-1">
                            <Wind className="h-3 w-3" />
                            {typeof w.wind_speed === 'number' ? `${w.wind_speed} km/h` : '—'}
                          </span>
                        </div>
                      </div>
                      {isToday && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-b-lg bg-gradient-to-r from-primary/60 via-primary to-primary/60" />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {/* View Recommendations link from forecast panel */}
            <div className="mt-4 flex items-center justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={gotoPage_7}
                className="text-primary shadow-[0_0_10px_hsl(var(--primary)/0.35)] hover:bg-primary/10"
              >
                <Sprout className="mr-2 h-4 w-4" /> View Recommendations <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ALERTS LIST */}
        <Card className="border-border/40 bg-card/70 backdrop-blur-md shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-heading">Active Alerts</CardTitle>
              <CardDescription>{alertsTotal} on record</CardDescription>
            </div>
            <Dialog open={prefsOpen} onOpenChange={setPrefsOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Settings className="mr-2 h-4 w-4" /> Preferences
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading">Notification Preferences</DialogTitle>
                  <DialogDescription>
                    Choose how you receive time-sensitive field alerts.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 p-3">
                    <div>
                      <Label htmlFor="sms" className="text-sm font-medium">SMS Alerts</Label>
                      <p className="text-xs text-muted-foreground">Sent via Twilio to your phone</p>
                    </div>
                    <Switch id="sms" checked={smsEnabled} onCheckedChange={setSmsEnabled} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 p-3">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium">Email Alerts</Label>
                      <p className="text-xs text-muted-foreground">Daily digest and urgent bulletins</p>
                    </div>
                    <Switch id="email" checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                  </div>
                  <div className="flex items-center justify-between rounded-md border border-border/40 bg-background/40 p-3">
                    <div>
                      <Label htmlFor="inapp" className="text-sm font-medium">In-App Alerts</Label>
                      <p className="text-xs text-muted-foreground">Notifications inside this dashboard</p>
                    </div>
                    <Switch id="inapp" checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+256 700 000000"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emailaddr">Email Address</Label>
                    <Input
                      id="emailaddr"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Alert Types</Label>
                    <div className="flex flex-wrap gap-2">
                      {ALERT_TYPES.map((t) => {
                        const active = selectedAlertTypes.includes(t);
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() =>
                              setSelectedAlertTypes((prev) =>
                                active ? prev.filter((x) => x !== t) : [...prev, t]
                              )
                            }
                            className={`rounded-full border px-3 py-1 text-xs transition ${active ? 'border-primary bg-primary/15 text-primary shadow-[0_0_8px_hsl(var(--primary)/0.35)]' : 'border-border/50 bg-background/40 text-muted-foreground hover:bg-background/60'}`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setPrefsOpen(false)}>Cancel</Button>
                  <Button
                    onClick={() => {
                      void handlePreferences({
                        sms_enabled: smsEnabled,
                        email_enabled: emailEnabled,
                        in_app_enabled: inAppEnabled,
                        phone_number: phoneNumber,
                        email,
                        alert_types: selectedAlertTypes,
                      });
                      setPrefsOpen(false);
                    }}
                    className="border border-primary/40 bg-transparent text-primary shadow-[0_0_12px_hsl(var(--primary)/0.45)] hover:bg-primary/10"
                  >
                    Save Preferences
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingAlerts ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : alerts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
                <Bell className="h-10 w-10 opacity-50" />
                No active alerts. Conditions look good.
              </div>
            ) : (
              <ScrollArea className="max-h-[420px] pr-2">
                <ul className="space-y-3">
                  {alerts.map((a) => {
                    const level = (a.alert_level ?? 'watch').toLowerCase();
                    const borderClass =
                      level === 'emergency'
                        ? 'border-l-red-500'
                        : level === 'warning'
                        ? 'border-l-amber-500'
                        : 'border-l-green-500';
                    return (
                      <li
                        key={a.id}
                        className={`rounded-md border border-border/40 border-l-4 ${borderClass} bg-background/40 p-3 backdrop-blur`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-heading text-sm">{a.title ?? a.type ?? 'Alert'}</p>
                            <p className="text-xs text-muted-foreground">{a.description ?? ''}</p>
                          </div>
                          <Badge variant="outline" className="capitalize">{a.alert_level ?? 'watch'}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {a.district && <span>{a.district}</span>}
                          {a.agro_ecological_zone && <span>• {a.agro_ecological_zone}</span>}
                          {a.issued_at && <span>• {new Date(a.issued_at).toLocaleDateString()}</span>}
                        </div>
                        {a.affected_crops && a.affected_crops.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {a.affected_crops.map((c) => (
                              <Badge key={c} variant="secondary" className="text-[10px]">{c}</Badge>
                            ))}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </ScrollArea>
            )}
            {alertsTotal > alertsLimit && (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={alertsPage <= 1}
                  onClick={() => setAlertsPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" /> Prev
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {alertsPage} of {Math.max(1, Math.ceil(alertsTotal / alertsLimit))}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={alertsPage >= Math.ceil(alertsTotal / alertsLimit)}
                  onClick={() => setAlertsPage((p) => p + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* SEASON POSITION */}
      <section>
        <Card className="border-border/40 bg-card/70 backdrop-blur-md shadow-md">
          <CardHeader>
            <CardTitle className="font-heading">Season Position</CardTitle>
            <CardDescription>Where today falls in Uganda's agricultural calendar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-border/40 bg-background/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Sun className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-heading">First Rainy Season</p>
                      <p className="text-xs text-muted-foreground">March – May</p>
                    </div>
                  </div>
                  <Progress value={seasonProgress.first} className="mt-3" />
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-background/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Cloud className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-heading">Dry Season</p>
                      <p className="text-xs text-muted-foreground">June – September</p>
                    </div>
                  </div>
                  <Progress value={seasonProgress.dry} className="mt-3" />
                </CardContent>
              </Card>
              <Card className="border-border/40 bg-background/40">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Umbrella className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-heading">Second Rainy Season</p>
                      <p className="text-xs text-muted-foreground">October – December</p>
                    </div>
                  </div>
                  <Progress value={seasonProgress.second} className="mt-3" />
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
