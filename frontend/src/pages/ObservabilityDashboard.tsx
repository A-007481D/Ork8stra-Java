import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
    Activity, Server, Cpu, AlertTriangle, CheckCircle2, 
    XCircle, Clock, ArrowUpRight, ArrowDownRight, RotateCcw,
    Shield, Lock, Container, Gauge,
    ExternalLink, RefreshCw, AlertCircle
} from "lucide-react";
import type { Organization, Team, Project } from "../types/index";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts";

interface ObservabilityDashboardProps {
    org: Organization | null;
    activeTab: string;
}

// Tooltip styling
const tooltipStyle = {
    contentStyle: { backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '8px', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' },
    itemStyle: { color: '#E3E3E3' },
    labelStyle: { color: '#888', marginBottom: '4px', fontWeight: 600 }
};

// ===== Shared UI Components =====
const MetricCard = ({ label, value, unit, trend, trendUp, icon: Icon, color }: any) => (
    <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl p-5 flex flex-col gap-3 hover:border-[#444] transition-all">
        <div className="flex items-center justify-between">
            <span className="text-xs text-[#888] font-medium uppercase tracking-wider">{label}</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                <Icon className="w-4 h-4" style={{ color }} />
            </div>
        </div>
        <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-[#E3E3E3]">{value}</span>
            {unit && <span className="text-sm text-[#888]">{unit}</span>}
        </div>
        {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trendUp ? 'text-emerald-400' : 'text-red-400'}`}>
                {trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {trend}
            </div>
        )}
    </div>
);

const ChartPanel = ({ title, subtitle, children }: any) => (
    <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden hover:border-[#444] transition-all flex flex-col h-[300px]">
        <div className="px-5 py-4 border-b border-[#2C2C2C]">
            <h3 className="text-sm font-semibold text-[#E3E3E3]">{title}</h3>
            {subtitle && <p className="text-xs text-[#888] mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-4 flex-1 min-h-0 min-w-0">
            {children}
        </div>
    </div>
);

const EmptyState = ({ icon: Icon, message }: any) => (
    <div className="flex flex-col items-center justify-center py-16 text-[#555]">
        <Icon className="w-8 h-8 mb-3 opacity-30" />
        <span className="text-sm">{message}</span>
    </div>
);

const SectionHeader = ({ title, count }: { title: string; count?: number }) => (
    <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[#E3E3E3]">{title}</h2>
        {count !== undefined && <span className="text-xs text-[#888] bg-[#1A1A1A] px-2 py-1 rounded-md border border-[#2C2C2C]">{count} total</span>}
    </div>
);

export default function ObservabilityDashboard({ org, activeTab }: ObservabilityDashboardProps) {
    const navigate = useNavigate();
    const [token] = useState(localStorage.getItem("token") || "");

    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    const headers = { Authorization: `Bearer ${token}`, "X-Org-ID": org?.id || "" };

    return (
        <div className="flex flex-col min-h-full w-full bg-[#0A0A0A] p-6 lg:p-8 overflow-y-auto custom-scrollbar">
            {activeTab === 'overview' && <OverviewTab token={token} org={org} headers={headers} />}
            {activeTab === 'logs' && <ServiceLogsTab token={token} headers={headers} />}
            {activeTab === 'insights' && <ClusterInsightsTab token={token} org={org} headers={headers} />}
            {activeTab === 'alerts' && <AlertsTab token={token} org={org} headers={headers} />}
            {activeTab === 'deployments' && <DeploymentsTab token={token} headers={headers} />}
            {activeTab === 'resources' && <ResourceMetricsTab token={token} org={org} headers={headers} />}
            {activeTab === 'nodes' && <NodeHealthTab token={token} headers={headers} />}
            {activeTab === 'audit' && <AuditTrailTab token={token} headers={headers} />}
            {activeTab === 'network' && <NetworkPoliciesTab token={token} headers={headers} />}
        </div>
    );
}

// ===== TAB 1: OVERVIEW =====
function OverviewTab({ token, org, headers }: any) {
    const [isLoading, setIsLoading] = useState(true);
    const [allApps, setAllApps] = useState<any[]>([]);
    const [cpuTimeSeries, setCpuTimeSeries] = useState<any[]>([]);
    const [memTimeSeries, setMemTimeSeries] = useState<any[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [totalPods, setTotalPods] = useState(0);
    const [healthyPods, setHealthyPods] = useState(0);
    const [totalRestarts, setTotalRestarts] = useState(0);
    const [avgCpu, setAvgCpu] = useState(0);

    const fetchData = useCallback(async () => {
        if (!token || !org) return;
        try {
            const teamsRes = await fetch("/api/v1/teams", { headers });
            const teamsData: Team[] = await teamsRes.json();
            const projectPromises = teamsData.map(t =>
                fetch(`/api/v1/projects?teamId=${t.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
            );
            const allProjects = (await Promise.all(projectPromises)).flat() as Project[];

            let combinedApps: any[] = [], podCount = 0, healthy = 0, restarts = 0, cpuTotal = 0;
            const cpuS: Record<string, number> = {}, memS: Record<string, number> = {};
            const combinedEvents: any[] = [];

            for (const p of allProjects) {
                const [metricsRes, sparklinesRes, eventsRes] = await Promise.all([
                    fetch(`/api/v1/apps/projects/${p.id}/metrics`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null),
                    fetch(`/api/v1/apps/projects/${p.id}/sparklines`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : ({} as Record<string, any[]>)),
                    fetch(`/api/v1/apps/projects/${p.id}/events`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : [])
                ]);
                if (metricsRes) {
                    for (const app of metricsRes.appBreakdown) {
                        podCount += (app.pods || 0) + (app.errorPods || 0);
                        healthy += app.pods || 0;
                        restarts += app.restartCount || 0;
                        cpuTotal += app.cpu || 0;
                        combinedApps.push({ ...app, projectName: p.name });
                        const series = sparklinesRes[app.appId] || [];
                        for (const s of series) {
                            const t = new Date(s.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            cpuS[t] = (cpuS[t] || 0) + (s.cpu || 0);
                            memS[t] = (memS[t] || 0) + (s.memory || 0);
                        }
                    }
                }
                combinedEvents.push(...eventsRes);
            }

            setTotalPods(podCount); setHealthyPods(healthy); setTotalRestarts(restarts);
            setAvgCpu(combinedApps.length > 0 ? cpuTotal / combinedApps.length : 0);
            const toArr = (d: Record<string, number>, s = 1) => Object.keys(d).sort().map(t => ({ time: t, value: Math.round(d[t] * s * 100) / 100 }));
            setCpuTimeSeries(toArr(cpuS, 100));
            setMemTimeSeries(toArr(memS, 1 / (1024 * 1024)));
            combinedApps.sort((a, b) => (b.restartCount || 0) - (a.restartCount || 0));
            setAllApps(combinedApps);
            combinedEvents.sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setEvents(combinedEvents);
        } catch (e) { console.error("Overview Fetch Error:", e); }
        finally { setIsLoading(false); }
    }, [token, org]);

    useEffect(() => { setIsLoading(true); fetchData(); const i = setInterval(fetchData, 10000); return () => clearInterval(i); }, [fetchData]);

    const availability = totalPods > 0 ? ((healthyPods / totalPods) * 100) : 100;

    if (isLoading && allApps.length === 0) return <LoadingSpinner text="Loading overview..." />;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Fleet Availability" value={availability === 100 ? '100' : availability.toFixed(1)} unit="%" trend={availability >= 99 ? "Within SLO" : "SLO breach"} trendUp={availability >= 99} icon={Activity} color={availability >= 99 ? '#10B981' : '#EF4444'} />
                <MetricCard label="Total Pods" value={totalPods} unit={`${healthyPods} healthy`} icon={Server} color="#3B82F6" />
                <MetricCard label="Avg CPU" value={(avgCpu * 100).toFixed(1)} unit="%" trend={avgCpu > 0.8 ? "High utilization" : "Normal"} trendUp={avgCpu <= 0.8} icon={Cpu} color="#F59E0B" />
                <MetricCard label="Restart Count" value={totalRestarts} unit="across fleet" trend={totalRestarts > 5 ? "Instability detected" : "Stable"} trendUp={totalRestarts <= 5} icon={RotateCcw} color={totalRestarts > 5 ? '#EF4444' : '#10B981'} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="CPU Utilization" subtitle="Aggregated across all services (%)">
                    {cpuTimeSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={cpuTimeSeries}>
                                <defs><linearGradient id="cpuG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/><stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} width={35} />
                                <Tooltip {...tooltipStyle} /><Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={2} fill="url(#cpuG)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <EmptyState icon={Cpu} message="No CPU data yet" />}
                </ChartPanel>
                <ChartPanel title="Memory Consumption" subtitle="Aggregated across all services (MB)">
                    {memTimeSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={memTimeSeries}>
                                <defs><linearGradient id="memG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient></defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" />
                                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#666', fontSize: 10 }} width={35} />
                                <Tooltip {...tooltipStyle} /><Area type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} fill="url(#memG)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : <EmptyState icon={Cpu} message="No memory data yet" />}
                </ChartPanel>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-[#2C2C2C] flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[#E3E3E3]">Service Health</h3>
                        <span className="text-xs text-[#888]">{allApps.length} services</span>
                    </div>
                    <div className="overflow-y-auto max-h-[360px] custom-scrollbar">
                        <table className="w-full text-left text-xs">
                            <thead className="sticky top-0 bg-[#141414] z-10 border-b border-[#2C2C2C]">
                                <tr className="text-[#888] uppercase tracking-wider">
                                    <th className="px-5 py-3 font-medium">Service</th><th className="px-5 py-3 font-medium">Project</th>
                                    <th className="px-5 py-3 font-medium text-center">Status</th><th className="px-5 py-3 font-medium text-right">CPU</th>
                                    <th className="px-5 py-3 font-medium text-right">Pods</th><th className="px-5 py-3 font-medium text-right">Restarts</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#2C2C2C]/50">
                                {allApps.map((app) => (
                                    <tr key={app.appId} className="hover:bg-[#1A1A1A] transition-colors">
                                        <td className="px-5 py-3 font-medium text-[#E3E3E3]">{app.appName}</td>
                                        <td className="px-5 py-3 text-[#888]">{app.projectName}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                app.status?.toUpperCase() === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                app.status?.toUpperCase() === 'DEGRADED' || app.status?.toUpperCase() === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                                {app.status?.toUpperCase() === 'HEALTHY' ? <CheckCircle2 className="w-3 h-3" /> : 
                                                 app.status?.toUpperCase() === 'DEGRADED' || app.status?.toUpperCase() === 'IN_PROGRESS' ? <AlertCircle className="w-3 h-3" /> :
                                                 <XCircle className="w-3 h-3" />} {app.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-right font-mono text-[#E3E3E3]">{(app.cpu * 100).toFixed(1)}%</td>
                                        <td className="px-5 py-3 text-right font-mono text-[#E3E3E3]">{app.pods || 0}</td>
                                        <td className="px-5 py-3 text-right"><span className={`font-mono ${(app.restartCount || 0) > 0 ? 'text-amber-400' : 'text-[#888]'}`}>{app.restartCount || 0}</span></td>
                                    </tr>
                                ))}
                                {allApps.length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center text-[#555] text-sm">No services deployed yet.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-[#2C2C2C]"><h3 className="text-sm font-semibold text-[#E3E3E3]">Cluster Events</h3></div>
                    <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar">
                        {events.length === 0 ? <EmptyState icon={Clock} message="Watching for events..." /> : (
                            <ul className="divide-y divide-[#2C2C2C]/50">
                                {events.slice(0, 30).map((ev: any, i: number) => {
                                    const isWarn = ev.type === 'Warning' || (ev.reason || '').toLowerCase().includes('fail');
                                    return (
                                        <li key={i} className="px-5 py-3 hover:bg-[#1A1A1A] transition-colors">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${isWarn ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${isWarn ? 'text-amber-400' : 'text-emerald-400'}`}>{ev.reason}</span>
                                                        <span className="text-[10px] text-[#555]">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    </div>
                                                    <p className="text-xs text-[#AAA] truncate">{ev.message}</p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== TAB 2: SERVICE LOGS =====
function ServiceLogsTab({ token }: any) {
    const [services, setServices] = useState<any[]>([]);
    const [selectedService, setSelectedService] = useState<any>(null);
    const [logs, setLogs] = useState<string>("");
    const [logMeta, setLogMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [tailLines, setTailLines] = useState(200);

    useEffect(() => {
        fetch("/api/v1/observability/services", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(setServices).catch(console.error);
    }, [token]);

    const fetchLogs = useCallback(async (appId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/v1/observability/logs/${appId}?tailLines=${tailLines}`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setLogs(data.logs || "");
            setLogMeta(data);
        } catch (e) { setLogs("Error fetching logs."); }
        finally { setIsLoading(false); }
    }, [token, tailLines]);

    return (
        <div className="space-y-4">
            <SectionHeader title="Service Logs" count={services.length} />
            <div className="flex items-center gap-3">
                <select
                    className="bg-[#141414] border border-[#2C2C2C] rounded-lg px-3 py-2 text-sm text-[#E3E3E3] focus:outline-none focus:border-[#444] min-w-[250px]"
                    value={selectedService?.appId || ""}
                    onChange={(e) => {
                        const svc = services.find((s: any) => s.appId === e.target.value);
                        setSelectedService(svc);
                        if (svc) fetchLogs(svc.appId);
                    }}
                >
                    <option value="">Select a service...</option>
                    {services.map((s: any) => (
                        <option key={s.appId} value={s.appId}>{s.projectName} / {s.appName}</option>
                    ))}
                </select>
                <select className="bg-[#141414] border border-[#2C2C2C] rounded-lg px-3 py-2 text-sm text-[#888] focus:outline-none focus:border-[#444]"
                    value={tailLines} onChange={(e) => setTailLines(Number(e.target.value))}
                >
                    <option value={50}>Last 50 lines</option>
                    <option value={200}>Last 200 lines</option>
                    <option value={500}>Last 500 lines</option>
                    <option value={1000}>Last 1000 lines</option>
                </select>
                {selectedService && (
                    <button onClick={() => fetchLogs(selectedService.appId)} className="flex items-center gap-1.5 px-3 py-2 bg-[#141414] border border-[#2C2C2C] rounded-lg text-sm text-[#888] hover:text-[#E3E3E3] hover:border-[#444] transition-colors">
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                )}
            </div>

            {logMeta && (
                <div className="flex items-center gap-4 text-xs text-[#888]">
                    <span>Pod: <span className="text-[#E3E3E3] font-mono">{logMeta.podName}</span></span>
                    <span>Namespace: <span className="text-[#E3E3E3] font-mono">{logMeta.namespace}</span></span>
                </div>
            )}

            <div className="bg-[#0D0D0D] border border-[#2C2C2C] rounded-xl overflow-hidden">
                <pre className="p-4 text-xs font-mono text-[#D1D5DB] overflow-auto max-h-[600px] custom-scrollbar whitespace-pre-wrap leading-relaxed">
                    {isLoading ? "Loading logs..." : (logs || "Select a service to view its pod logs.")}
                </pre>
            </div>
        </div>
    );
}

// ===== TAB 3: CLUSTER INSIGHTS =====
function ClusterInsightsTab({ token, org, headers }: any) {
    const [allApps, setAllApps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!org) return;
        (async () => {
            try {
                const teamsRes = await fetch("/api/v1/teams", { headers });
                const teams: Team[] = await teamsRes.json();
                const projPromises = teams.map(t => fetch(`/api/v1/projects?teamId=${t.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()));
                const projects = (await Promise.all(projPromises)).flat() as Project[];
                const apps: any[] = [];
                for (const p of projects) {
                    const mRes = await fetch(`/api/v1/apps/projects/${p.id}/metrics`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null);
                    if (mRes) for (const a of mRes.appBreakdown) apps.push({ ...a, projectName: p.name });
                }
                setAllApps(apps);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, [token, org]);

    if (isLoading) return <LoadingSpinner text="Analyzing cluster..." />;

    const totalCpu = allApps.reduce((s, a) => s + (a.cpu || 0), 0);
    const totalMem = allApps.reduce((s, a) => s + (a.memory || 0), 0);
    const topByCpu = [...allApps].sort((a, b) => b.cpu - a.cpu).slice(0, 10);
    const topByMem = [...allApps].sort((a, b) => b.memory - a.memory).slice(0, 10);

    return (
        <div className="space-y-6">
            <SectionHeader title="Cluster Insights" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard label="Total Services" value={allApps.length} icon={Container} color="#3B82F6" />
                <MetricCard label="Fleet CPU" value={(totalCpu * 100).toFixed(1)} unit="%" icon={Cpu} color="#F59E0B" />
                <MetricCard label="Fleet Memory" value={Math.round(totalMem / (1024*1024))} unit="MB" icon={Gauge} color="#8B5CF6" />
                <MetricCard label="Unhealthy" value={allApps.filter(a => a.status !== 'Healthy').length} unit="services" icon={AlertTriangle} color="#EF4444" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartPanel title="Top CPU Consumers">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topByCpu.map(a => ({ name: a.appName, cpu: Math.round(a.cpu * 10000) / 100 }))} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" /><XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
                            <Tooltip {...tooltipStyle} /><Bar dataKey="cpu" fill="#F59E0B" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartPanel>
                <ChartPanel title="Top Memory Consumers">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={topByMem.map(a => ({ name: a.appName, mem: Math.round(a.memory / (1024*1024)) }))} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#1F1F1F" /><XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={false} tickLine={false} unit=" MB" />
                            <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 10 }} width={100} axisLine={false} tickLine={false} />
                            <Tooltip {...tooltipStyle} /><Bar dataKey="mem" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </ChartPanel>
            </div>
        </div>
    );
}

// ===== TAB 4: ALERTS & RULES =====
function AlertsTab({ token }: any) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/observability/events", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => {
                setEvents(data.filter((e: any) => e.type === 'Warning'));
                setIsLoading(false);
            }).catch(() => setIsLoading(false));
    }, [token]);

    if (isLoading) return <LoadingSpinner text="Loading alerts..." />;

    return (
        <div className="space-y-4">
            <SectionHeader title="Active Alerts" count={events.length} />
            {events.length === 0 ? <EmptyState icon={CheckCircle2} message="No active alerts. All systems operating normally." /> : (
                <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden">
                    <div className="divide-y divide-[#2C2C2C]/50">
                        {events.map((ev: any, i: number) => (
                            <div key={i} className="px-5 py-4 hover:bg-[#1A1A1A] transition-colors flex items-start gap-4">
                                <div className="mt-1"><AlertTriangle className="w-4 h-4 text-amber-400" /></div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-sm font-semibold text-[#E3E3E3]">{ev.reason}</span>
                                        <span className="text-[10px] text-[#888] bg-[#1A1A1A] px-2 py-0.5 rounded border border-[#2C2C2C]">{ev.objectName}</span>
                                    </div>
                                    <p className="text-xs text-[#AAA]">{ev.message}</p>
                                    <span className="text-[10px] text-[#555] mt-1 block">{new Date(ev.timestamp).toLocaleString()}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== TAB 5: DEPLOYMENTS =====
function DeploymentsTab({ token }: any) {
    const [deployments, setDeployments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/observability/deployments", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => { setDeployments(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, [token]);

    if (isLoading) return <LoadingSpinner text="Loading deployments..." />;

    const statusColor = (s: string) => {
        const status = s?.toUpperCase();
        if (status === 'HEALTHY' || status === 'DEPLOYED' || status === 'SUCCESS') return 'bg-emerald-500/10 text-emerald-400';
        if (status === 'IN_PROGRESS' || status === 'RESTARTING' || status === 'DEGRADED') return 'bg-amber-500/10 text-amber-400';
        if (status === 'FAILED' || status === 'UNHEALTHY' || status === 'ERROR') return 'bg-red-500/10 text-red-400';
        return 'bg-[#333]/20 text-[#888]';
    };

    return (
        <div className="space-y-4">
            <SectionHeader title="Fleet Deployments" count={deployments.length} />
            {deployments.length === 0 ? <EmptyState icon={Container} message="No deployments found." /> : (
                <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#141414] z-10 border-b border-[#2C2C2C]">
                            <tr className="text-[#888] uppercase tracking-wider">
                                <th className="px-5 py-3 font-medium">Service</th><th className="px-5 py-3 font-medium">Project</th>
                                <th className="px-5 py-3 font-medium">Image Tag</th><th className="px-5 py-3 font-medium text-center">Replicas</th>
                                <th className="px-5 py-3 font-medium text-center">Status</th><th className="px-5 py-3 font-medium">URL</th>
                                <th className="px-5 py-3 font-medium text-right">Deployed</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2C2C2C]/50">
                            {deployments.map((d: any) => (
                                <tr key={d.id} className="hover:bg-[#1A1A1A] transition-colors">
                                    <td className="px-5 py-3 font-medium text-[#E3E3E3]">{d.appName}</td>
                                    <td className="px-5 py-3 text-[#888]">{d.projectName}</td>
                                    <td className="px-5 py-3 font-mono text-[#AAA]">{d.imageTag}</td>
                                    <td className="px-5 py-3 text-center font-mono text-[#E3E3E3]">{d.replicas}</td>
                                    <td className="px-5 py-3 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColor(d.status)}`}>
                                            {d.status?.toUpperCase() === 'HEALTHY' ? <CheckCircle2 className="w-3 h-3" /> : 
                                             d.status?.toUpperCase() === 'IN_PROGRESS' || d.status?.toUpperCase() === 'RESTARTING' ? <Clock className="w-3 h-3 animate-spin-slow" /> :
                                             <XCircle className="w-3 h-3" />}
                                            {d.status}
                                        </div>
                                    </td>
                                    <td className="px-5 py-3">
                                        {d.liveUrl ? <a href={d.liveUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1 text-xs"><ExternalLink className="w-3 h-3" />{d.liveUrl}</a> : <span className="text-[#555]">—</span>}
                                    </td>
                                    <td className="px-5 py-3 text-right text-[#888]">{d.deployedAt ? new Date(d.deployedAt).toLocaleString() : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ===== TAB 6: RESOURCE METRICS =====
function ResourceMetricsTab({ token, org, headers }: any) {
    const [allApps, setAllApps] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!org) return;
        (async () => {
            try {
                const teamsRes = await fetch("/api/v1/teams", { headers });
                const teams: Team[] = await teamsRes.json();
                const projPromises = teams.map(t => fetch(`/api/v1/projects?teamId=${t.id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()));
                const projects = (await Promise.all(projPromises)).flat() as Project[];
                const apps: any[] = [];
                for (const p of projects) {
                    const mRes = await fetch(`/api/v1/apps/projects/${p.id}/metrics`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null);
                    if (mRes) for (const a of mRes.appBreakdown) apps.push({ ...a, projectName: p.name });
                }
                setAllApps(apps);
            } catch (e) { console.error(e); }
            finally { setIsLoading(false); }
        })();
    }, [token, org]);

    if (isLoading) return <LoadingSpinner text="Loading resource metrics..." />;

    return (
        <div className="space-y-4">
            <SectionHeader title="Resource Metrics" count={allApps.length} />
            {allApps.length === 0 ? <EmptyState icon={Gauge} message="No resource data available." /> : (
                <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#141414] z-10 border-b border-[#2C2C2C]">
                            <tr className="text-[#888] uppercase tracking-wider">
                                <th className="px-5 py-3 font-medium">Service</th><th className="px-5 py-3 font-medium">Project</th>
                                <th className="px-5 py-3 font-medium">CPU Usage</th><th className="px-5 py-3 font-medium">Memory</th>
                                <th className="px-5 py-3 font-medium text-center">Pods</th><th className="px-5 py-3 font-medium text-center">Restarts</th>
                                <th className="px-5 py-3 font-medium text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2C2C2C]/50">
                            {allApps.map((app) => {
                                const cpuPct = app.cpu * 100;
                                const memMB = Math.round(app.memory / (1024 * 1024));
                                return (
                                    <tr key={app.appId} className="hover:bg-[#1A1A1A] transition-colors">
                                        <td className="px-5 py-3 font-medium text-[#E3E3E3]">{app.appName}</td>
                                        <td className="px-5 py-3 text-[#888]">{app.projectName}</td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-[#1F1F1F] rounded-full overflow-hidden max-w-[120px]">
                                                    <div className={`h-full rounded-full ${cpuPct > 80 ? 'bg-red-500' : cpuPct > 50 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{width: `${Math.min(cpuPct, 100)}%`}} />
                                                </div>
                                                <span className="text-[#E3E3E3] font-mono text-[11px]">{cpuPct.toFixed(1)}%</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-[#1F1F1F] rounded-full overflow-hidden max-w-[120px]">
                                                    <div className="h-full bg-purple-500 rounded-full" style={{width: `${Math.min(memMB / 5, 100)}%`}} />
                                                </div>
                                                <span className="text-[#E3E3E3] font-mono text-[11px]">{memMB} MB</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 text-center font-mono text-[#E3E3E3]">{app.pods || 0}</td>
                                        <td className="px-5 py-3 text-center"><span className={`font-mono ${(app.restartCount || 0) > 0 ? 'text-amber-400' : 'text-[#888]'}`}>{app.restartCount || 0}</span></td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                                app.status?.toUpperCase() === 'HEALTHY' ? 'bg-emerald-500/10 text-emerald-400' : 
                                                app.status?.toUpperCase() === 'DEGRADED' || app.status?.toUpperCase() === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400' :
                                                'bg-red-500/10 text-red-400'
                                            }`}>
                                                {app.status?.toUpperCase() === 'HEALTHY' ? <CheckCircle2 className="w-3 h-3" /> : 
                                                 app.status?.toUpperCase() === 'DEGRADED' || app.status?.toUpperCase() === 'IN_PROGRESS' ? <AlertCircle className="w-3 h-3" /> :
                                                 <XCircle className="w-3 h-3" />} {app.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ===== TAB 7: NODE HEALTH =====
function NodeHealthTab({ token }: any) {
    const [nodes, setNodes] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/observability/nodes", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => { setNodes(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, [token]);

    if (isLoading) return <LoadingSpinner text="Scanning nodes..." />;

    return (
        <div className="space-y-4">
            <SectionHeader title="Node Health" count={nodes.length} />
            {nodes.length === 0 ? <EmptyState icon={Server} message="No node data available." /> : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {nodes.map((node: any) => (
                        <div key={node.name} className="bg-[#141414] border border-[#2C2C2C] rounded-xl p-5 hover:border-[#444] transition-all space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Server className="w-5 h-5 text-[#888]" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-[#E3E3E3]">{node.name}</h3>
                                        <p className="text-[10px] text-[#888]">{node.kubeletVersion} • {node.os}/{node.arch}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${node.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{node.status}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-[#888] uppercase tracking-wider">CPU</span>
                                        <span className="text-xs font-mono text-[#E3E3E3]">{node.cpuUsagePercent}%</span>
                                    </div>
                                    <div className="h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${node.cpuUsagePercent > 80 ? 'bg-red-500' : node.cpuUsagePercent > 50 ? 'bg-amber-400' : 'bg-blue-500'}`} style={{width: `${Math.min(node.cpuUsagePercent, 100)}%`}} />
                                    </div>
                                    <span className="text-[10px] text-[#555] mt-1 block">{node.cpuCapacity}</span>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-[10px] text-[#888] uppercase tracking-wider">Memory</span>
                                        <span className="text-xs font-mono text-[#E3E3E3]">{node.memoryUsagePercent}%</span>
                                    </div>
                                    <div className="h-2 bg-[#1F1F1F] rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${node.memoryUsagePercent > 80 ? 'bg-red-500' : node.memoryUsagePercent > 50 ? 'bg-amber-400' : 'bg-purple-500'}`} style={{width: `${Math.min(node.memoryUsagePercent, 100)}%`}} />
                                    </div>
                                    <span className="text-[10px] text-[#555] mt-1 block">{node.memoryCapacity}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-[#888] pt-2 border-t border-[#2C2C2C]">
                                <span>{node.podCount} pods • {node.containerRuntime}</span>
                                <span>Created {new Date(node.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ===== TAB 8: AUDIT TRAIL =====
function AuditTrailTab({ token }: any) {
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/observability/events", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => { setEvents(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, [token]);

    if (isLoading) return <LoadingSpinner text="Loading audit trail..." />;

    const categorize = (reason: string, msg: string) => {
        const raw = ((reason || '') + ' ' + (msg || '')).toLowerCase();
        if (raw.includes('scale') || raw.includes('hpa')) return { label: 'Scaling', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
        if (raw.includes('pull') || raw.includes('start') || raw.includes('create')) return { label: 'Deployment', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
        if (raw.includes('unhealthy') || raw.includes('backoff') || raw.includes('fail') || raw.includes('kill')) return { label: 'Health Failure', color: 'bg-red-500/10 text-red-400 border-red-500/20' };
        if (raw.includes('config') || raw.includes('secret') || raw.includes('update')) return { label: 'Config Change', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' };
        return { label: 'System', color: 'bg-[#333]/20 text-[#888] border-[#444]' };
    };

    return (
        <div className="space-y-4">
            <SectionHeader title="System Audit Trail" count={events.length} />
            {events.length === 0 ? <EmptyState icon={Shield} message="No audit events recorded." /> : (
                <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden">
                    <div className="divide-y divide-[#2C2C2C]/50 max-h-[600px] overflow-y-auto custom-scrollbar">
                        {events.map((ev: any, i: number) => {
                            const cat = categorize(ev.reason, ev.message);
                            return (
                                <div key={i} className="px-5 py-3 hover:bg-[#1A1A1A] transition-colors flex items-center gap-4">
                                    <span className="text-[10px] text-[#555] font-mono w-[140px] shrink-0">{new Date(ev.timestamp).toLocaleString()}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-bold uppercase tracking-wider w-[110px] text-center shrink-0 ${cat.color}`}>{cat.label}</span>
                                    <span className="text-xs text-[#AAA] font-mono w-[180px] shrink-0 truncate">{ev.objectName}</span>
                                    <span className="text-xs text-[#D1D5DB] flex-1 truncate">{ev.message}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ===== TAB 9: NETWORK POLICIES =====
function NetworkPoliciesTab({ token }: any) {
    const [policies, setPolicies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch("/api/v1/observability/network-policies", { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json()).then(data => { setPolicies(data); setIsLoading(false); })
            .catch(() => setIsLoading(false));
    }, [token]);

    if (isLoading) return <LoadingSpinner text="Scanning network policies..." />;

    return (
        <div className="space-y-4">
            <SectionHeader title="Network Policies" count={policies.length} />
            {policies.length === 0 ? <EmptyState icon={Lock} message="No network policies found in project namespaces." /> : (
                <div className="bg-[#141414] border border-[#2C2C2C] rounded-xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                        <thead className="sticky top-0 bg-[#141414] z-10 border-b border-[#2C2C2C]">
                            <tr className="text-[#888] uppercase tracking-wider">
                                <th className="px-5 py-3 font-medium">Policy Name</th>
                                <th className="px-5 py-3 font-medium">Namespace</th>
                                <th className="px-5 py-3 font-medium">Pod Selector</th>
                                <th className="px-5 py-3 font-medium text-center">Ingress Rules</th>
                                <th className="px-5 py-3 font-medium text-center">Egress Rules</th>
                                <th className="px-5 py-3 font-medium text-right">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#2C2C2C]/50">
                            {policies.map((p: any, i: number) => (
                                <tr key={i} className="hover:bg-[#1A1A1A] transition-colors">
                                    <td className="px-5 py-3 font-medium text-[#E3E3E3] flex items-center gap-2"><Shield className="w-3.5 h-3.5 text-[#3B82F6]" />{p.name}</td>
                                    <td className="px-5 py-3 text-[#888] font-mono">{p.namespace}</td>
                                    <td className="px-5 py-3 text-[#AAA] font-mono text-[10px]">{p.podSelector}</td>
                                    <td className="px-5 py-3 text-center font-mono text-[#E3E3E3]">{p.ingressRules}</td>
                                    <td className="px-5 py-3 text-center font-mono text-[#E3E3E3]">{p.egressRules}</td>
                                    <td className="px-5 py-3 text-right text-[#888]">{new Date(p.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

// ===== HELPERS =====
const LoadingSpinner = ({ text }: { text: string }) => (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-6 h-6 border-2 border-[#333] border-t-[#E3E3E3] rounded-full animate-spin" />
        <span className="text-sm text-[#888]">{text}</span>
    </div>
);
