import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import {
    monitoringService,
    type MonitoringProgrammesListParams,
    type MonitoringProgrammesListResponse,
    type MonitoringStatsResponse,
} from '@/lib/api/monitoringService';

type Monitoring = MonitoringProgrammesListResponse['data'][number];

export default function MonitoringDashboard() {
    const navigate = useNavigate();


    // Detail state — GET /monitoring/stats
    const [monitoringItem, setMonitoringItem] = useState<MonitoringStatsResponse['data'] | null>(null);
    const [loadingMonitoringItem, setLoadingMonitoringItem] = useState(false);
    // List state — GET /monitoring/programmes/list
    const [monitoring, setMonitoring] = useState<Monitoring[]>([]);
    const [loadingMonitoring, setLoadingMonitoring] = useState(true);
    const [monitoringPage, setMonitoringPage] = useState(1);
    const [monitoringLimit] = useState(10);
    const [monitoringTotal, setMonitoringTotal] = useState(0);

    // Local UI state
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState<string>('');

    // Load stats on mount
    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                setLoadingMonitoringItem(true);
                const res = await monitoringService.stats();
                if (!cancelled) setMonitoringItem(res?.data ?? null);
            } catch (err) {
                if (!cancelled) toast.error('Failed to load programme statistics');
                console.error('[loadStats]', err);
            } finally {
                if (!cancelled) setLoadingMonitoringItem(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    // Reload list when status filter, search, or page changes
    useEffect(() => {
        void loadMonitoringFiltered();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [monitoringPage, statusFilter, searchQuery]);

    async function loadMonitoringFiltered() {
        try {
            setLoadingMonitoring(true);
            const params: MonitoringProgrammesListParams = { page: monitoringPage, limit: monitoringLimit };
            if (statusFilter !== 'all') params.status = statusFilter;
            const trimmed = searchQuery.trim();
            if (trimmed) params.search = trimmed;
            const res = await monitoringService.programmesList(params);
            setMonitoring(Array.isArray(res?.data) ? res.data : []);
            setMonitoringTotal(typeof res?.total === 'number' ? res.total : 0);
        } catch (err) {
            toast.error('Failed to load programmes');
            console.error('[loadMonitoringFiltered]', err);
        } finally {
            setLoadingMonitoring(false);
        }
    }

    const stats = monitoringItem;
    const totalPages = Math.ceil(monitoringTotal / monitoringLimit);

    const disbursementPct = stats?.committed_budget && stats.committed_budget > 0
        ? Math.round(((stats.total_disbursement ?? 0) / stats.committed_budget) * 100)
        : 0;

    function getStatusBadge(status?: string) {
        if (!status) return null;
        const s = status.toLowerCase();
        if (s.includes('on track') || s === 'on_track') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    On Track
                </span>
            );
        }
        if (s.includes('behind') || s === 'behind_target') {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    Behind Target
                </span>
            );
        }
        if (s.includes('ahead')) {
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Ahead
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground border border-border/40">
                {status}
            </span>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8">
            {/* ── Page header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                        Monitoring Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Programme-level overview of agricultural development initiatives in Uganda
                    </p>
                </div>
                <button
                    onClick={() => { void loadMonitoringFiltered(); }}
                    className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-transparent border border-primary text-primary text-sm font-medium shadow-[0_0_12px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_18px_hsl(var(--primary)/0.45)] transition-all duration-200 ease-out"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
                    Refresh
                </button>
            </div>

            {/* ── KPI stats row ────────────────────────────────────────────── */}
            {loadingMonitoringItem ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-28 rounded-lg bg-card/60 border border-border/40 backdrop-blur-md animate-pulse" />
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Farmers Covered */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Farmers Covered</p>
                        <p className="font-heading text-2xl font-bold text-foreground">
                            {stats?.total_farmers_covered?.toLocaleString() ?? '—'}
                        </p>
                        <p className="text-xs text-amber-400 mt-1">Total beneficiaries</p>
                    </div>

                    {/* Districts Active */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Districts Active</p>
                        <p className="font-heading text-2xl font-bold text-foreground">
                            {stats?.districts_active ?? '—'}
                        </p>
                        <p className="text-xs text-amber-400 mt-1">Across Uganda</p>
                    </div>

                    {/* Crops Targeted */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Crops Targeted</p>
                        <p className="font-heading text-2xl font-bold text-foreground">
                            {stats?.crops_targeted ?? '—'}
                        </p>
                        <p className="text-xs text-amber-400 mt-1">Crop varieties</p>
                    </div>

                    {/* Total Programmes */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Programmes</p>
                        <p className="font-heading text-2xl font-bold text-foreground">
                            {stats?.total_programmes ?? '—'}
                        </p>
                        <p className="text-xs text-amber-400 mt-1">Active portfolio</p>
                    </div>

                    {/* On Track */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">On Track</p>
                        <p className="font-heading text-2xl font-bold text-emerald-400">
                            {stats?.programmes_on_track ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Programmes</p>
                    </div>

                    {/* Behind Target */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Behind Target</p>
                        <p className="font-heading text-2xl font-bold text-red-400">
                            {stats?.programmes_behind_target ?? '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Need attention</p>
                    </div>

                    {/* Disbursed */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Disbursed</p>
                        <p className="font-heading text-2xl font-bold text-foreground">
                            {stats?.total_disbursement != null
                                ? `$${(stats.total_disbursement / 1_000_000).toFixed(1)}M`
                                : '—'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">USD</p>
                    </div>

                    {/* Budget Utilisation */}
                    <div className="group backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md p-4 hover:shadow-[0_0_18px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Budget Utilisation</p>
                        <p className="font-heading text-2xl font-bold text-amber-400">
                            {disbursementPct}%
                        </p>
                        <div className="mt-2 w-full h-1.5 rounded-full bg-border/40 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-amber-400 transition-all duration-500"
                                style={{ width: `${Math.min(disbursementPct, 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ── Programmes table ─────────────────────────────────────────── */}
            <div className="backdrop-blur-md bg-card/60 border border-border/40 rounded-lg shadow-md overflow-hidden">
                {/* Table header / filter row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-border/40">
                    <div>
                        <h2 className="font-heading text-lg font-semibold text-foreground">Monitored Programmes</h2>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {monitoringTotal} programme{monitoringTotal !== 1 ? 's' : ''} in portfolio
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setMonitoringPage(1); }}
                                placeholder="Search programmes..."
                                className="text-xs rounded-md bg-background/60 border border-border/50 text-foreground pl-7 pr-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors duration-150 w-44"
                            />
                        </div>
                        <label className="text-xs text-muted-foreground">Status:</label>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value); setMonitoringPage(1); }}
                            className="text-xs rounded-md bg-background/60 border border-border/50 text-foreground px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-colors duration-150"
                        >
                            <option value="all">All Statuses</option>
                            <option value="on_track">On Track</option>
                            <option value="behind_target">Behind Target</option>
                            <option value="ahead">Ahead</option>
                        </select>
                    </div>
                </div>

                {loadingMonitoring ? (
                    <div className="divide-y divide-border/30">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4">
                                <div className="h-4 w-48 rounded bg-muted/40 animate-pulse" />
                                <div className="h-4 w-24 rounded bg-muted/40 animate-pulse ml-auto" />
                                <div className="h-4 w-20 rounded bg-muted/40 animate-pulse" />
                            </div>
                        ))}
                    </div>
                ) : monitoring.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/40"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                        <p className="text-sm text-muted-foreground">No programmes found for the selected filter.</p>
                        {statusFilter !== 'all' && (
                            <button
                                onClick={() => setStatusFilter('all')}
                                className="text-xs text-primary underline underline-offset-2 hover:no-underline"
                            >
                                Clear filter
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-muted/20 border-b border-border/30">
                                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Programme</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Funder</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Farmers Reached</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Disbursed (USD)</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Milestones</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">Districts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/20">
                                {monitoring.map((prog) => {
                                    const reachPct = prog.farmers_targeted && prog.farmers_targeted > 0
                                        ? Math.round(((prog.farmers_reached ?? 0) / prog.farmers_targeted) * 100)
                                        : 0;
                                    const milestonePct = prog.milestone_count && prog.milestone_count > 0
                                        ? Math.round(((prog.milestones_achieved ?? 0) / prog.milestone_count) * 100)
                                        : 0;
                                    return (
                                        <tr key={prog.id} className="hover:bg-muted/10 transition-colors duration-150 group">
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-foreground leading-tight line-clamp-2 max-w-xs">{prog.name ?? '—'}</p>
                                                {prog.crops && prog.crops.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-1">
                                                        {prog.crops.slice(0, 3).map((c) => (
                                                            <span key={c} className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">{c}</span>
                                                        ))}
                                                        {(prog.crops.length ?? 0) > 3 && (
                                                            <span className="text-[10px] text-muted-foreground">+{prog.crops.length - 3}</span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">{prog.funder ?? '—'}</td>
                                            <td className="px-4 py-4 hidden md:table-cell">{getStatusBadge(prog.status)}</td>
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-foreground">
                                                        {(prog.farmers_reached ?? 0).toLocaleString()} / {(prog.farmers_targeted ?? 0).toLocaleString()}
                                                    </span>
                                                    <div className="w-24 h-1.5 rounded-full bg-border/40 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-emerald-400 transition-all duration-300"
                                                            style={{ width: `${Math.min(reachPct, 100)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground">{reachPct}% reach</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-medium text-foreground">
                                                        ${((prog.disbursed_usd ?? 0) / 1000).toFixed(0)}K
                                                    </span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        of ${((prog.committed_usd ?? 0) / 1000).toFixed(0)}K
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 hidden xl:table-cell">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-xs text-foreground">
                                                        {prog.milestones_achieved ?? 0}/{prog.milestone_count ?? 0}
                                                    </span>
                                                    <div className="w-16 h-1.5 rounded-full bg-border/40 overflow-hidden">
                                                        <div
                                                            className="h-full rounded-full bg-primary transition-all duration-300"
                                                            style={{ width: `${Math.min(milestonePct, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 hidden xl:table-cell">
                                                {prog.districts && prog.districts.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
                                                        {prog.districts.slice(0, 2).map((d) => (
                                                            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30 text-muted-foreground border border-border/30">{d}</span>
                                                        ))}
                                                        {prog.districts.length > 2 && (
                                                            <span className="text-[10px] text-muted-foreground">+{prog.districts.length - 2}</span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3 border-t border-border/30 bg-muted/10">
                        <p className="text-xs text-muted-foreground">
                            Page {monitoringPage} of {totalPages} · {monitoringTotal} total
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={monitoringPage <= 1}
                                onClick={() => setMonitoringPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-md text-xs border border-border/50 text-foreground bg-background/60 hover:bg-muted/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                            >
                                ← Prev
                            </button>
                            <button
                                disabled={monitoringPage >= totalPages}
                                onClick={() => setMonitoringPage((p) => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-md text-xs border border-border/50 text-foreground bg-background/60 hover:bg-muted/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150"
                            >
                                Next →
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Quick navigation tiles ────────────────────────────────────── */}
            <div>
                <h2 className="font-heading text-lg font-semibold text-foreground mb-4">Quick Access</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {[
                        { label: 'Impact Assessment', route: '/partner/impact', icon: '📊' },
                        { label: 'Programme KPIs', route: '/partner/kpis', icon: '🎯' },
                        { label: 'Beneficiary Tracking', route: '/partner/beneficiaries', icon: '👥' },
                        { label: 'Public Reports', route: '/reports', icon: '📄' },
                        { label: 'District Maps', route: '/maaif/district-maps', icon: '🗺️' },
                        { label: 'Weather Alerts', route: '/farmer/alerts', icon: '🌦️' },
                        { label: 'Pest & Disease', route: '/farmer/pest-disease', icon: '🌿' },
                        { label: 'Settings', route: '/settings', icon: '⚙️' },
                    ].map(({ label, route, icon }) => (
                        <button
                            key={route}
                            type="button"
                            onClick={() => navigate(route)}
                            className="group flex items-center gap-3 p-3 rounded-lg backdrop-blur-md bg-card/50 border border-border/40 shadow-sm hover:border-primary/40 hover:shadow-[0_0_12px_hsl(var(--primary)/0.15)] transition-all duration-200 ease-out text-left w-full"
                        >
                            <span className="text-lg">{icon}</span>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-150">{label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
