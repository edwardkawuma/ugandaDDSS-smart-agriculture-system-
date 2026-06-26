import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    policyService,
    type PolicyAlertsSummaryResponse,
    type PolicyDistrictMapResponse,
    type PolicySeasonTrendsResponse,
    type PolicyStatsResponse,
} from '@/lib/api/policyService';

type DistrictMap = PolicyDistrictMapResponse['data'][number];
type SeasonTrend = PolicySeasonTrendsResponse['data'][number];

export default function PolicyDashboard() {
    const navigate = useNavigate();

    // Detail state — GET /policy/stats
    const [statsItem, setStatsItem] = useState<PolicyStatsResponse['data'] | null>(null);
    const [loadingStatsItem, setLoadingStatsItem] = useState(false);
    // Detail state — GET /policy/alerts-summary
    const [alertsSummaryItem, setAlertsSummaryItem] = useState<PolicyAlertsSummaryResponse['data'] | null>(null);
    const [loadingAlertsSummaryItem, setLoadingAlertsSummaryItem] = useState(false);
    // List state — GET /policy/district-map
    const [districtMap, setDistrictMap] = useState<DistrictMap[]>([]);
    const [loadingDistrictMap, setLoadingDistrictMap] = useState(true);
    const [districtMapPage, setDistrictMapPage] = useState(1);
    const [districtMapLimit] = useState(10);
    const [districtMapTotal, setDistrictMapTotal] = useState(0);
    // List state — GET /policy/season-trends
    const [seasonTrends, setSeasonTrends] = useState<SeasonTrend[]>([]);
    const [loadingSeasonTrends, setLoadingSeasonTrends] = useState(true);
    const [seasonTrendsPage, setSeasonTrendsPage] = useState(1);
    const [seasonTrendsLimit] = useState(10);
    const [seasonTrendsTotal, setSeasonTrendsTotal] = useState(0);

    useEffect(() => { void loadDistrictMap(); }, [districtMapPage]);
    useEffect(() => { void loadSeasonTrends(); }, [seasonTrendsPage]);

    async function loadDistrictMap() {
        try {
            setLoadingDistrictMap(true);
            const res = await policyService.districtMap({ page: districtMapPage, limit: districtMapLimit });
            setDistrictMap(Array.isArray(res?.data) ? res.data : []);
            setDistrictMapTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load districtMap');
            console.error('[loadDistrictMap]', err);
        } finally {
            setLoadingDistrictMap(false);
        }
    }
    async function loadSeasonTrends() {
        try {
            setLoadingSeasonTrends(true);
            const res = await policyService.seasonTrends({ page: seasonTrendsPage, limit: seasonTrendsLimit });
            setSeasonTrends(Array.isArray(res?.data) ? res.data : []);
            setSeasonTrendsTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load seasonTrends');
            console.error('[loadSeasonTrends]', err);
        } finally {
            setLoadingSeasonTrends(false);
        }
    }

    function gotoPage_22() {
        navigate('/maaif/statistics');
    }
    function gotoPage_23() {
        navigate('/maaif/reports');
    }
    function gotoPage_24() {
        navigate('/maaif/pest-disease-reports');
    }
    function gotoPage_25() {
        navigate('/maaif/district-maps');
    }

    // Load stats and alerts summary on mount
    useEffect(() => {
        void (async () => {
            try {
                setLoadingStatsItem(true);
                const res = await policyService.stats({});
                setStatsItem(res?.data ?? null);
            } catch (err) {
                toast.error('Failed to load national statistics');
                console.error('[loadStats]', err);
            } finally {
                setLoadingStatsItem(false);
            }
        })();
    }, []);

    useEffect(() => {
        void (async () => {
            try {
                setLoadingAlertsSummaryItem(true);
                const res = await policyService.alertsSummary({});
                setAlertsSummaryItem(res?.data ?? null);
            } catch (err) {
                toast.error('Failed to load alerts summary');
                console.error('[loadAlertsSummary]', err);
            } finally {
                setLoadingAlertsSummaryItem(false);
            }
        })();
    }, []);

    // Derived KPI values
    const totalProduction = statsItem?.total_national_production_mt ?? 0;
    const activePestAlerts = statsItem?.active_pest_alerts ?? 0;
    const advisoryCoverage = statsItem?.extension_advisory_coverage_rate ?? 0;
    const benchmarkAchievement = statsItem?.benchmark_achievement_pct ?? 0;
    const currentSeason = statsItem?.season ?? '—';
    const districtsWithAlerts = statsItem?.districts_with_alerts ?? 0;

    const emergencyAlerts = alertsSummaryItem?.emergency ?? 0;
    const warningAlerts = alertsSummaryItem?.warning ?? 0;
    const watchAlerts = alertsSummaryItem?.watch ?? 0;

    return (
        <div className="p-6 md:p-8 min-h-screen bg-background">
            {/* Page header */}
            <div className="mb-8">
                <h1 className="font-heading text-3xl font-bold text-foreground tracking-tight mb-1">
                    Policy Dashboard
                </h1>
                <p className="text-muted-foreground text-sm">
                    National agricultural sector executive summary &mdash; Season: <span className="text-amber-500 font-medium">{currentSeason}</span>
                </p>
            </div>

            {/* Headline KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                {/* Total Production */}
                <div className="relative backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-2 transition-all duration-200 ease-out hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">National Production</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/10 text-amber-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z"/><path d="M12 6v6l4 2"/></svg>
                        </span>
                    </div>
                    {loadingStatsItem ? (
                        <div className="h-8 w-32 bg-muted/50 rounded animate-pulse" />
                    ) : (
                        <span className="font-heading text-2xl font-bold text-foreground">
                            {totalProduction.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">MT</span>
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">Total crop yield this season</span>
                </div>

                {/* Active Pest Alerts */}
                <div className="relative backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-2 transition-all duration-200 ease-out hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Pest &amp; Disease Alerts</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-500/10 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </span>
                    </div>
                    {loadingStatsItem ? (
                        <div className="h-8 w-20 bg-muted/50 rounded animate-pulse" />
                    ) : (
                        <span className="font-heading text-2xl font-bold text-foreground">{activePestAlerts}</span>
                    )}
                    <span className="text-xs text-muted-foreground">{districtsWithAlerts} districts affected</span>
                </div>

                {/* Advisory Coverage */}
                <div className="relative backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-2 transition-all duration-200 ease-out hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Advisory Coverage</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </span>
                    </div>
                    {loadingStatsItem ? (
                        <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
                    ) : (
                        <span className="font-heading text-2xl font-bold text-foreground">
                            {advisoryCoverage.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">%</span>
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">Extension service reach rate</span>
                </div>

                {/* Benchmark Achievement */}
                <div className="relative backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-2 transition-all duration-200 ease-out hover:shadow-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">NADP Target</span>
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                        </span>
                    </div>
                    {loadingStatsItem ? (
                        <div className="h-8 w-24 bg-muted/50 rounded animate-pulse" />
                    ) : (
                        <span className="font-heading text-2xl font-bold text-foreground">
                            {benchmarkAchievement.toFixed(1)}<span className="text-sm font-normal text-muted-foreground">%</span>
                        </span>
                    )}
                    <span className="text-xs text-muted-foreground">Benchmark achievement vs plan</span>
                </div>
            </div>

            {/* Alerts severity breakdown + district-level alerts table */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Alert severity breakdown */}
                <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-4">
                    <h2 className="font-heading text-lg font-semibold text-foreground">Alert Severity Breakdown</h2>
                    {loadingAlertsSummaryItem ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                                    <span className="text-sm font-medium text-foreground">Emergency</span>
                                </div>
                                <span className="font-heading text-xl font-bold text-red-500">{emergencyAlerts}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <span className="text-sm font-medium text-foreground">Warning</span>
                                </div>
                                <span className="font-heading text-xl font-bold text-amber-500">{warningAlerts}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <div className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                                    <span className="text-sm font-medium text-foreground">Watch</span>
                                </div>
                                <span className="font-heading text-xl font-bold text-blue-400">{watchAlerts}</span>
                            </div>
                        </div>
                    )}

                    {/* Alerts by crop */}
                    {!loadingAlertsSummaryItem && alertsSummaryItem?.by_crop && alertsSummaryItem.by_crop.length > 0 && (
                        <div className="mt-2">
                            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">By Crop</h3>
                            <div className="space-y-1.5">
                                {alertsSummaryItem.by_crop.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-foreground truncate max-w-[120px]">{item.crop}</span>
                                        <span className="font-medium text-muted-foreground">{item.count} alerts</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* District alerts table */}
                <div className="lg:col-span-2 backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 flex flex-col gap-4">
                    <h2 className="font-heading text-lg font-semibold text-foreground">Districts with Active Alerts</h2>
                    {loadingAlertsSummaryItem ? (
                        <div className="space-y-2">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                            ))}
                        </div>
                    ) : alertsSummaryItem?.by_district && alertsSummaryItem.by_district.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/40">
                                        <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">District</th>
                                        <th className="text-center text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Alerts</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Highest Severity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {alertsSummaryItem.by_district.slice(0, 8).map((d, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors duration-150">
                                            <td className="py-2.5 pr-4 font-medium text-foreground">{d.district}</td>
                                            <td className="py-2.5 text-center text-muted-foreground">{d.count}</td>
                                            <td className="py-2.5 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                    d.highest_severity === 'emergency' ? 'bg-red-500/15 text-red-500' :
                                                    d.highest_severity === 'warning' ? 'bg-amber-500/15 text-amber-500' :
                                                    'bg-blue-400/15 text-blue-400'
                                                }`}>
                                                    {d.highest_severity}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                            <span className="text-sm">No district alert data available</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Season trends table */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground">Season Trends vs 5-Year Baseline</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Current season performance benchmarked against historical averages</p>
                    </div>
                    <button
                        onClick={() => void loadSeasonTrends()}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                        Refresh
                    </button>
                </div>

                {loadingSeasonTrends ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : seasonTrends.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/40">
                                        <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Crop</th>
                                        <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Season</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Current (MT)</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">5-Yr Avg (MT)</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Variance</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Year</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {seasonTrends.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-muted/20 transition-colors duration-150">
                                            <td className="py-2.5 pr-4 font-medium text-foreground">{row.crop ?? '—'}</td>
                                            <td className="py-2.5 pr-4 text-muted-foreground">{row.season ?? '—'}</td>
                                            <td className="py-2.5 text-right text-foreground">{row.current_production_mt?.toLocaleString() ?? '—'}</td>
                                            <td className="py-2.5 text-right text-muted-foreground">{row.five_year_avg_mt?.toLocaleString() ?? '—'}</td>
                                            <td className="py-2.5 text-right">
                                                {row.variance_pct != null ? (
                                                    <span className={`inline-flex items-center gap-0.5 font-medium ${row.variance_pct >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                                        {row.variance_pct >= 0 ? '+' : ''}{row.variance_pct.toFixed(1)}%
                                                    </span>
                                                ) : '—'}
                                            </td>
                                            <td className="py-2.5 text-right text-muted-foreground">{row.year ?? '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {seasonTrendsTotal > seasonTrends.length && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                <span className="text-xs text-muted-foreground">
                                    Page {seasonTrendsPage} &mdash; {seasonTrends.length} of {seasonTrendsTotal} records
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSeasonTrendsPage(p => Math.max(1, p - 1))}
                                        disabled={seasonTrendsPage === 1}
                                        className="px-3 py-1.5 text-xs border border-border/50 rounded bg-transparent text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setSeasonTrendsPage(p => p + 1)}
                                        disabled={seasonTrends.length < 10}
                                        className="px-3 py-1.5 text-xs border border-border/50 rounded bg-transparent text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                        <span className="text-sm">No season trend data available</span>
                    </div>
                )}
            </div>

            {/* District map data overview */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground">District Overview</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Production volumes and advisory coverage by district</p>
                    </div>
                    <button
                        onClick={() => void loadDistrictMap()}
                        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-200"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>
                        Refresh
                    </button>
                </div>

                {loadingDistrictMap ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : districtMap.length > 0 ? (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/40">
                                        <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">District</th>
                                        <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Agro-Eco Zone</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Production (MT)</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Farmers</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Alerts</th>
                                        <th className="text-right text-xs uppercase tracking-wider text-muted-foreground pb-2 font-medium">Coverage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {districtMap.map((d, idx) => (
                                        <tr key={d.district_id ?? idx} className="hover:bg-muted/20 transition-colors duration-150">
                                            <td className="py-2.5 pr-4 font-medium text-foreground">{d.district_name ?? '—'}</td>
                                            <td className="py-2.5 pr-4 text-muted-foreground text-xs">{d.agro_ecological_zone ?? '—'}</td>
                                            <td className="py-2.5 text-right text-foreground">{d.production_volume?.toLocaleString() ?? '—'}</td>
                                            <td className="py-2.5 text-right text-muted-foreground">{d.farmer_count?.toLocaleString() ?? '—'}</td>
                                            <td className="py-2.5 text-right">
                                                {(d.active_alerts ?? 0) > 0 ? (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-500/15 text-red-500">
                                                        {d.active_alerts}
                                                    </span>
                                                ) : (
                                                    <span className="text-muted-foreground">0</span>
                                                )}
                                            </td>
                                            <td className="py-2.5 text-right">
                                                <span className={`font-medium ${(d.advisory_coverage_rate ?? 0) >= 70 ? 'text-emerald-500' : (d.advisory_coverage_rate ?? 0) >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                                                    {d.advisory_coverage_rate != null ? `${d.advisory_coverage_rate.toFixed(1)}%` : '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Pagination */}
                        {districtMapTotal > districtMap.length && (
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/30">
                                <span className="text-xs text-muted-foreground">
                                    Page {districtMapPage} &mdash; {districtMap.length} of {districtMapTotal} records
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setDistrictMapPage(p => Math.max(1, p - 1))}
                                        disabled={districtMapPage === 1}
                                        className="px-3 py-1.5 text-xs border border-border/50 rounded bg-transparent text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setDistrictMapPage(p => p + 1)}
                                        disabled={districtMap.length < 10}
                                        className="px-3 py-1.5 text-xs border border-border/50 rounded bg-transparent text-muted-foreground hover:text-foreground hover:border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                        <span className="text-sm">No district data available</span>
                    </div>
                )}
            </div>

            {/* Uganda choropleth-style district map */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-5 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground">Uganda District Choropleth</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">Production volume by district — darker fill = higher output</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>Low</span>
                        <span className="inline-block w-24 h-2 rounded-full bg-gradient-to-r from-blue-400/30 via-amber-400/60 to-red-500/80" />
                        <span>High</span>
                    </div>
                </div>

                {loadingDistrictMap ? (
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                        {Array.from({ length: 24 }).map((_, i) => (
                            <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
                        ))}
                    </div>
                ) : districtMap.length > 0 ? (
                    (() => {
                        const maxProd = Math.max(...districtMap.map(d => d.production_volume ?? 0), 1);
                        const severityFor = (alerts?: number) => {
                            if (!alerts) return 'bg-emerald-500/20 border-emerald-500/30 text-emerald-500';
                            if (alerts >= 5) return 'bg-red-500/40 border-red-500/50 text-red-500';
                            if (alerts >= 2) return 'bg-amber-500/40 border-amber-500/50 text-amber-500';
                            return 'bg-blue-400/30 border-blue-400/40 text-blue-400';
                        };
                        return (
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                {districtMap.map((d, idx) => {
                                    const intensity = Math.min(1, (d.production_volume ?? 0) / maxProd);
                                    const baseOpacity = 0.15 + intensity * 0.7;
                                    return (
                                        <button
                                            key={d.district_id ?? idx}
                                            onClick={() => navigate('/maaif/district-maps')}
                                            title={`${d.district_name ?? 'District'} — ${(d.production_volume ?? 0).toLocaleString()} MT, ${d.active_alerts ?? 0} alerts`}
                                            className={`relative h-14 rounded border ${severityFor(d.active_alerts)} hover:ring-2 hover:ring-primary/50 transition-all duration-150 flex flex-col items-center justify-center text-[10px] font-medium px-1`}
                                            style={{ backgroundColor: `rgba(234, 179, 8, ${baseOpacity})` }}
                                        >
                                            <span className="truncate w-full text-center text-foreground/90">{d.district_name ?? '—'}</span>
                                            <span className="text-[9px] text-muted-foreground">{Math.round(intensity * 100)}%</span>
                                        </button>
                                    );
                                })}
                            </div>
                        );
                    })()
                ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                        <span className="text-sm">No district map data available</span>
                    </div>
                )}
            </div>

            {/* Quick-access navigation tiles */}
            <div className="mb-2">
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Quick Access</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* National Statistics */}
                    <button
                        onClick={gotoPage_22}
                        className="group flex flex-col items-start gap-3 p-5 bg-transparent border border-primary/60 text-primary rounded-lg shadow-[0_0_12px_rgba(var(--primary-rgb,234,179,8),0.15)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb,234,179,8),0.3)] hover:bg-primary/5 transition-all duration-200 ease-out"
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
                        </span>
                        <div className="text-left">
                            <p className="font-heading font-semibold text-sm">National Statistics</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Aggregate crop & production data</p>
                        </div>
                    </button>

                    {/* Production Reports */}
                    <button
                        onClick={gotoPage_23}
                        className="group flex flex-col items-start gap-3 p-5 bg-transparent border border-primary/60 text-primary rounded-lg shadow-[0_0_12px_rgba(var(--primary-rgb,234,179,8),0.15)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb,234,179,8),0.3)] hover:bg-primary/5 transition-all duration-200 ease-out"
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        </span>
                        <div className="text-left">
                            <p className="font-heading font-semibold text-sm">Production Reports</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Seasonal yield & harvest analysis</p>
                        </div>
                    </button>

                    {/* Pest & Disease Reports */}
                    <button
                        onClick={gotoPage_24}
                        className="group flex flex-col items-start gap-3 p-5 bg-transparent border border-primary/60 text-primary rounded-lg shadow-[0_0_12px_rgba(var(--primary-rgb,234,179,8),0.15)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb,234,179,8),0.3)] hover:bg-primary/5 transition-all duration-200 ease-out"
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                        </span>
                        <div className="text-left">
                            <p className="font-heading font-semibold text-sm">Pest &amp; Disease Reports</p>
                            <p className="text-xs text-muted-foreground mt-0.5">National threat monitoring data</p>
                        </div>
                    </button>

                    {/* District Maps */}
                    <button
                        onClick={gotoPage_25}
                        className="group flex flex-col items-start gap-3 p-5 bg-transparent border border-primary/60 text-primary rounded-lg shadow-[0_0_12px_rgba(var(--primary-rgb,234,179,8),0.15)] hover:shadow-[0_0_20px_rgba(var(--primary-rgb,234,179,8),0.3)] hover:bg-primary/5 transition-all duration-200 ease-out"
                    >
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>
                        </span>
                        <div className="text-left">
                            <p className="font-heading font-semibold text-sm">District Maps</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Interactive choropleth district view</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
