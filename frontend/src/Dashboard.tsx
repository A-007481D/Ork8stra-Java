import { useState, useEffect, useCallback } from "react";
import type { Project, Service, Deployment, ViewState, Team, Organization } from "./types/index";
import {
    Search, Plus, Bell, ChevronDown, ChevronRight,
    Inbox, Layers,
    Box, Filter, List as ListIcon,
    Terminal, Activity, ArrowUpRight, Server,
    GitBranch, RefreshCw, Play, Square, RotateCcw,
    Settings, Building2, Database, Layout as LayoutIcon, Cpu, Lock
} from "lucide-react";

import ServiceCatalogModal from "./components/ServiceCatalogModal";
import CreateProjectWizard from "./components/CreateProjectWizard";
import CreateProjectModal from "./components/CreateProjectModal";
import CreateTeamModal from "./components/CreateTeamModal";
import { ToastContainer, useToast } from "./components/Toast";
import { SkeletonServiceCard } from "./components/Skeleton";
import CreateOrganizationModal from "./components/CreateOrganizationModal";
import ServiceGraph from "./components/ServiceGraph";
import SettingsMembers from "./components/SettingsMembers";
import SettingsModal from "./components/SettingsModal";
import GlobalDashboard from "./pages/GlobalDashboard";
import { useAuth } from "./contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";

// UI Components
import { Badge } from "./components/ui/Badge";
import { Button } from "./components/ui/Button";
import { Card, CardHeader, CardTitle } from "./components/ui/Card";

const mapDeploymentStatusToUi = (status?: string | null): Service['status'] => {
    switch (status) {
        case 'HEALTHY':
            return 'live';
        case 'STOPPED':
            return 'stopped';
        case 'RESTARTING':
        case 'IN_PROGRESS':
            return 'restarting';
        case 'FAILED':
        case 'UNHEALTHY':
            return 'failed';
        default:
            return 'building';
    }
};

// --- COMPONENTS ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SidebarItem = ({ icon: Icon, label, active, hasSub, onClick, collapsed }: any) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-3 py-1.5 rounded-md text-sm transition-colors group ${active
            ? "bg-[#2C2C2C]/60 text-[#E3E3E3]"
            : "text-[#989898] hover:bg-[#2C2C2C]/30 hover:text-[#E3E3E3]"
            }`}
        title={collapsed ? label : undefined}
    >
        <div className={`flex items-center gap-2.5 ${collapsed ? 'justify-center w-full' : ''}`}>
            <Icon className={`w-4 h-4 transition-colors ${active ? "text-[#E3E3E3]" : "text-[#888] group-hover:text-[#AAA]"}`} />
            {!collapsed && <span className="font-medium whitespace-nowrap">{label}</span>}
        </div>
        {!collapsed && hasSub && <ChevronDown className="w-3 h-3 text-[#555]" />}
    </button>
);

const FilterDropdown = ({ filterMode, onSelect, onClose }: { filterMode: string, onSelect: (m: 'All' | 'Production' | 'Preview' | 'Live' | 'Failed') => void, onClose: () => void }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -5 }}
        className="absolute top-10 left-6 w-[240px] bg-[#141414] border border-[#2C2C2C] rounded-lg shadow-2xl z-50 overflow-hidden flex flex-col"
    >
        <div className="p-2 border-b border-[#242424]">
            <div className="flex items-center gap-2 px-2 py-1.5 bg-[#0F0F0F] border border-[#242424] rounded text-xs text-[#E3E3E3]">
                <span className="text-xs text-[#666]">Filter...</span>
                <span className="ml-auto text-[10px] text-[#444] border border-[#333] px-1 rounded">F</span>
            </div>
        </div>
        <div className="py-1">
            <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#1F1F1F] cursor-pointer group text-[#888] hover:text-[#E3E3E3]" onClick={() => { onSelect('All'); onClose(); }}>
                <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" />
                    <span className="text-xs">View All</span>
                </div>
                {filterMode === 'All' && <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3]" />}
            </div>
            <div className="h-[1px] bg-[#242424] my-1 mx-2" />

            {/* Environment Category */}
            <div className="px-3 py-1 text-[10px] font-semibold text-[#555] uppercase tracking-wider">Environment</div>
            <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#1F1F1F] cursor-pointer group text-[#888] hover:text-[#E3E3E3]" onClick={() => { onSelect('Production'); onClose(); }}>
                <div className="flex items-center gap-2">
                    <GitBranch className="w-3.5 h-3.5" />
                    <span className="text-xs">Production (Main)</span>
                </div>
                {filterMode === 'Production' && <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3]" />}
            </div>
            <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#1F1F1F] cursor-pointer group text-[#888] hover:text-[#E3E3E3]" onClick={() => { onSelect('Preview'); onClose(); }}>
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    <span className="text-xs">Preview</span>
                </div>
                {filterMode === 'Preview' && <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3]" />}
            </div>

            <div className="h-[1px] bg-[#242424] my-1 mx-2" />

            {/* Status Category */}
            <div className="px-3 py-1 text-[10px] font-semibold text-[#555] uppercase tracking-wider">Status</div>
            <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#1F1F1F] cursor-pointer group text-[#888] hover:text-[#E3E3E3]" onClick={() => { onSelect('Live'); onClose(); }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs">Live</span>
                </div>
                {filterMode === 'Live' && <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3]" />}
            </div>
            <div className="px-3 py-1.5 flex items-center justify-between hover:bg-[#1F1F1F] cursor-pointer group text-[#888] hover:text-[#E3E3E3]" onClick={() => { onSelect('Failed'); onClose(); }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs">Failed</span>
                </div>
                {filterMode === 'Failed' && <div className="w-1.5 h-1.5 rounded-full bg-[#E3E3E3]" />}
            </div>
        </div>
    </motion.div>
);

const ViewToolbar = ({ sortBy, onSortToggle, filterMode, onFilterChange, viewMode, onViewChange }: {
    sortBy: string,
    onSortToggle: () => void,
    filterMode: string,
    onFilterChange: (m: 'All' | 'Production' | 'Preview' | 'Live' | 'Failed') => void,
    viewMode: 'GRID' | 'GRAPH',
    onViewChange: (v: 'GRID' | 'GRAPH') => void
}) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <div className="px-6 py-3 flex items-center justify-between border-b border-[#242424]/40 mb-4 bg-[#0F0F0F]/50 backdrop-blur-sm sticky top-0 z-10 relative">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors text-xs font-medium ${filterMode !== 'All' ? 'bg-[#2C2C2C]/60 text-[#E3E3E3]' : 'text-[#888] hover:text-[#E3E3E3] hover:bg-[#1F1F1F]'
                        }`}
                >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filter: {filterMode}</span>
                </button>
                <div className="h-4 w-[1px] bg-[#2C2C2C]" />
                <button
                    onClick={onSortToggle}
                    className="flex items-center gap-1.5 text-[#888] hover:text-[#E3E3E3] px-2 py-1 rounded hover:bg-[#1F1F1F] transition-colors text-xs font-medium"
                >
                    <span>Sort by: {sortBy}</span>
                </button>
            </div>

            <AnimatePresence>
                {isFilterOpen && (
                    <FilterDropdown
                        filterMode={filterMode}
                        onSelect={onFilterChange}
                        onClose={() => setIsFilterOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onViewChange('GRID')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'GRID' ? 'text-[#E3E3E3] bg-[#1F1F1F]' : 'text-[#888] hover:text-[#E3E3E3] hover:bg-[#1F1F1F]'}`}
                >
                    <ListIcon className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onViewChange('GRAPH')}
                    className={`p-1.5 rounded transition-colors ${viewMode === 'GRAPH' ? 'text-[#E3E3E3] bg-[#1F1F1F]' : 'text-[#888] hover:text-[#E3E3E3] hover:bg-[#1F1F1F]'}`}
                >
                    <Activity className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

const Breadcrumbs = ({ viewState, onNavigate }: { viewState: ViewState, onNavigate: (v: ViewState) => void }) => {
    if (viewState.type === 'GLOBAL') {
        return (
            <div className="flex items-center gap-2 text-sm text-[#E3E3E3] h-full">
                <Building2 className="w-4 h-4 text-[#888]" />
                <span className="font-semibold tracking-wide">Platform Overview</span>
            </div>
        );
    }
    return (
        <div className="flex items-center gap-2 text-sm text-[#888] h-full">
            <div
                className="hover:text-[#E3E3E3] hover:bg-[#1F1F1F] px-2 py-1 rounded cursor-pointer transition-colors flex items-center gap-2"
                onClick={() => onNavigate({ type: 'ROOT' })}
            >
                <Layers className="w-3.5 h-3.5" />
                <span>Projects</span>
            </div>

            {viewState.type !== 'ROOT' && viewState.type !== 'SETTINGS' && (
                <>
                    <ChevronRight className="w-3.5 h-3.5 text-[#444]" />
                    <div
                        className={`px-2 py-1 rounded transition-colors flex items-center gap-2 ${viewState.type === 'PROJECT'
                            ? 'bg-[#1F1F1F] text-[#E3E3E3]'
                            : 'hover:text-[#E3E3E3] hover:bg-[#1F1F1F] cursor-pointer'
                            }`}
                        onClick={() => viewState.type === 'SERVICE' && onNavigate({ type: 'PROJECT', project: viewState.project })}
                    >
                        {viewState.type === 'PROJECT' ? <Box className="w-3.5 h-3.5" /> : null}
                        <span>{(viewState.type === 'PROJECT' || viewState.type === 'SERVICE') ? viewState.project.name : ''}</span>
                    </div>
                </>
            )}

            {viewState.type === 'SERVICE' && (
                <>
                    <ChevronRight className="w-3.5 h-3.5 text-[#444]" />
                    <div className="px-2 py-1 rounded bg-[#1F1F1F] text-[#E3E3E3] flex items-center gap-2">
                        <Server className="w-3.5 h-3.5" />
                        <span>{viewState.service.name}</span>
                    </div>
                </>
            )}
        </div>
    );
};

// --- VIEW COMPONENTS ---

const ProjectsGrid = ({ projects, onSelect }: { projects: Project[], onSelect: (p: Project) => void }) => (
    <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={p.id}
                    onClick={() => onSelect(p)}
                    className="group border border-[#2C2C2C] bg-[#141414] hover:border-[#3A3A3A] hover:bg-[#1A1A1A] rounded-lg p-5 cursor-pointer transition-all relative overflow-hidden shadow-sm hover:shadow-md"
                >
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-0 translate-x-2">
                        <ChevronRight className="w-4 h-4 text-[#666]" />
                    </div>
                    <div className="flex items-start justify-between mb-4">
                        <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#262626] to-[#111] border border-white/5 flex items-center justify-center text-[#E3E3E3] font-bold text-sm shadow-inner group-hover:border-[#333] transition-colors">
                            {p.name.substring(0, 2).toUpperCase()}
                        </div>
                    </div>
                    <h3 className="text-[#E3E3E3] font-medium text-[15px] mb-1 group-hover:text-white transition-colors">{p.name}</h3>
                    <p className="text-[#666] text-xs mb-6">Updated 2m ago</p>

                    <div className="flex items-center gap-2 mt-auto border-t border-[#222] pt-3">
                        <div className="flex -space-x-1.5">
                            <div className="w-5 h-5 rounded-full bg-[#333] border border-[#141414]" />
                            <div className="w-5 h-5 rounded-full bg-[#444] border border-[#141414]" />
                        </div>
                        <span className="text-[10px] text-[#666] ml-1">Team</span>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

const ServicesGrid = ({ services, loading, onSelect, onAdd }: { services: Service[], loading?: boolean, onSelect: (s: Service) => void, onAdd: () => void }) => (
    <div className="px-6 pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <button
                onClick={onAdd}
                className="border border-dashed border-[#2C2C2C] bg-[#141414]/50 hover:bg-[#1A1A1A] hover:border-[#444] rounded-lg p-5 flex flex-col items-center justify-center gap-3 transition-all h-[160px] group"
            >
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-[#666] group-hover:text-white group-hover:bg-[#333] transition-colors border border-[#333]">
                    <Plus className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-[#666] group-hover:text-[#999]">Add Service</span>
            </button>

            {loading ? (
                [1, 2, 3].map(i => <SkeletonServiceCard key={i} />)
            ) : services.map(s => (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className="group border border-[#2C2C2C] bg-[#141414] hover:border-[#3A3A3A] hover:bg-[#1A1A1A] rounded-lg p-5 cursor-pointer transition-all"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 rounded bg-[#222] text-[#AAA] border border-[#333]">
                                {s.type === 'database' ? <Database className="w-4 h-4" /> :
                                    s.type === 'frontend' ? <LayoutIcon className="w-4 h-4" /> :
                                        s.type === 'worker' ? <Cpu className="w-4 h-4" /> :
                                            <Server className="w-4 h-4" />}
                            </div>
                            <h3 className="text-[#E3E3E3] font-medium text-sm">{s.name}</h3>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                    </div>

                    <div className="space-y-2 mt-6 p-3 bg-[#111] rounded border border-[#222]">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[#555]">Branch</span>
                            <div className="flex items-center gap-1.5 text-[#888]">
                                <GitBranch className="w-3 h-3" />
                                <span className="font-mono">{s.branch}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-[#555]">Source</span>
                            <div className="flex items-center gap-1.5 text-[#888]">
                                <ArrowUpRight className="w-3 h-3" />
                                <span className="truncate max-w-[100px]">github.com</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    </div>
);

const ServiceDetail = ({ service, project, token, onUpdate, onDelete }: { service: Service, project: Project, token: string, onUpdate: () => void, onDelete: () => void }) => {
    const [logs, setLogs] = useState<string[]>([]);
    const [currentDeployment, setCurrentDeployment] = useState<Deployment | null>(null);
    const [deployments, setDeployments] = useState<Deployment[]>([]);
    const [runtimeStatus, setRuntimeStatus] = useState<Service['status']>(service.status || 'building');
    const [liveUrl, setLiveUrl] = useState<string | null>(service.live_url || null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [lifecycleLoading, setLifecycleLoading] = useState<'stop' | 'start' | 'restart' | null>(null);
    const [metrics, setMetrics] = useState<{ cpuMillicores: number; memoryMiB: number; podCount: number } | null>(null);
    const { toasts, addToast, removeToast } = useToast();

    const mapBuildStatusToUi = (status: string): 'building' | 'success' | 'failed' => {
        if (status === 'RUNNING' || status === 'PENDING') return 'building';
        if (status === 'SUCCESS') return 'success';
        if (status === 'FAILED' || status === 'CANCELLED') return 'failed';
        return 'building';
    };

    const fetchData = useCallback(async () => {
        try {
            const [buildRes, deploymentRes] = await Promise.all([
                fetch(`/api/v1/apps/${service.id}/build`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`/api/v1/apps/${service.id}/deployments`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (buildRes.ok) {
                const buildsData = await buildRes.json();
                const mappedBuilds = buildsData.map((b: any) => ({
                    id: b.id,
                    project_id: b.applicationId,
                    service_id: b.applicationId,
                    applicationId: b.applicationId,
                    imageTag: b.imageTag,
                    status: mapBuildStatusToUi(b.status),
                    created_at: b.startTime || new Date().toISOString(),
                    createdAt: b.startTime || new Date().toISOString(),
                    logs: '',
                    commit_hash: ''
                }));

                mappedBuilds.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                setDeployments(mappedBuilds);

                if (mappedBuilds.length > 0) {
                    setCurrentDeployment(prev => {
                        if (!prev) return mappedBuilds[0];
                        const updated = mappedBuilds.find((b: any) => b.id === prev.id);
                        return updated || mappedBuilds[0];
                    });
                }
            }

            if (deploymentRes.ok) {
                const deploymentData = await deploymentRes.json();
                const latest = deploymentData?.[0];
                if (latest) {
                    setRuntimeStatus(mapDeploymentStatusToUi(latest.status));
                    setLiveUrl(latest.liveUrl || null);
                }
            }
        } catch (e) { console.error(e); }
    }, [token, service.id]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s to see if build status changed
        return () => clearInterval(interval);
    }, [fetchData]);

    useEffect(() => {
        if (!currentDeployment || !service) return;

        setLogs([]);

        const url = `/api/v1/apps/${service.id}/build/${currentDeployment.id}/logs`;
        const eventSource = new EventSource(url);

        const appendLog = (line: string) => {
            setLogs((prev) => [...prev, line].slice(-200));
        };

        eventSource.addEventListener("log", (event: MessageEvent) => {
            appendLog(event.data);
        });

        eventSource.addEventListener("complete", (event: MessageEvent) => {
            appendLog(event.data);
            eventSource.close();
            fetchData();
        });

        eventSource.addEventListener("error", (event: MessageEvent) => {
            appendLog(`⚠️ ${event.data}`);
            eventSource.close();
        });

        eventSource.onerror = (error) => {
            console.error("SSE connection error:", error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [currentDeployment?.id, service?.id, fetchData]);

    const handleRedeploy = async () => {
        if (!token) return;
        try {
            const res = await fetch(`/api/v1/apps/${service.id}/build`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                const newDeployment: Deployment = {
                    id: data.id,
                    service_id: service.id,
                    applicationId: service.id,
                    project_id: service.project_id,
                    imageTag: "latest",
                    status: 'building',
                    created_at: data.startTime || new Date().toISOString(),
                    createdAt: data.startTime || new Date().toISOString(),
                    logs: '',
                    commit_hash: ''
                };
                setDeployments(prev => [newDeployment, ...prev]);
                setCurrentDeployment(newDeployment);
                fetchData();
            } else {
                console.error("Deploy failed with status:", res.status);
            }
        } catch (e) { console.error("Redeploy error", e); }
    };

    const handleLifecycleAction = async (action: 'stop' | 'start' | 'restart') => {
        if (!token) return;
        setLifecycleLoading(action);
        try {
            const res = await fetch(`/api/v1/apps/${service.id}/${action}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const message = action === 'restart' ? 'Restart requested' : `Application ${action}ed`;
                addToast(`${message} successfully`, 'success');
                setTimeout(() => fetchData(), 1500);
            } else {
                const errorText = await res.text();
                addToast(`Failed to ${action} application${errorText ? `: ${errorText}` : ''}`, 'error');
            }
        } catch (e) {
            addToast(`Failed to ${action} application`, 'error');
            console.error(`${action} error`, e);
        }
        finally { setLifecycleLoading(null); }
    };

    const handleRollback = async (buildId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!token) return;
        try {
            const res = await fetch(`/api/v1/apps/${service.id}/rollback/${buildId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                addToast('Rollback initiated successfully', 'success');
                fetchData();
            } else {
                addToast('Rollback failed', 'error');
            }
        } catch (err) {
            addToast('Rollback failed', 'error');
            console.error('Rollback error', err);
        }
    };

    useEffect(() => {
        const eventSource = new EventSource(`/api/v1/apps/${service.id}/metrics`);
        eventSource.addEventListener('metrics', (event: MessageEvent) => {
            try { setMetrics(JSON.parse(event.data)); } catch { /* ignore */ }
        });
        eventSource.onerror = () => eventSource.close();
        return () => eventSource.close();
    }, [service.id]);

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            {/* Header / Actions */}
            <div className="px-6 pb-4 pt-0 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold mb-0.5">Status</span>
                        <Badge variant={runtimeStatus === 'live' ? 'live' : 'secondary'} className="text-xs px-2 py-1 uppercase tracking-wider">
                            {runtimeStatus || currentDeployment?.status || "NO DEPLOYMENTS"}
                        </Badge>
                    </div>
                    <div className="h-6 w-[1px] bg-[#222]" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold mb-0.5">Commit</span>
                        <span className="text-xs text-[#999] font-mono">
                            {currentDeployment?.commit_hash?.substring(0, 7) || '---'}
                        </span>
                    </div>
                    <div className="h-6 w-[1px] bg-[#222]" />
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-[#666] font-semibold mb-0.5">Live URL</span>
                        {liveUrl ? (
                            <div onClick={() => window.open(liveUrl, '_blank')} className="flex items-center gap-1.5 cursor-pointer group hover:text-emerald-400 transition-colors">
                                <span className="text-xs text-[#E3E3E3] font-mono group-hover:text-emerald-400 underline decoration-white/20 underline-offset-2 truncate max-w-[260px]">
                                    {liveUrl}
                                </span>
                                <ArrowUpRight className="w-3 h-3 text-[#666] group-hover:text-emerald-400" />
                            </div>
                        ) : (
                            <span className="text-xs text-[#666] font-mono italic flex items-center gap-1">Not available yet</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        disabled={currentDeployment?.status === 'building'}
                        onClick={handleRedeploy}
                        title="Build new image and deploy it"
                        className="bg-[#222] border-[#333] hover:bg-[#333] text-[#CCC]"
                    >
                        {currentDeployment?.status === 'building' ? <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Play className="w-3.5 h-3.5 mr-2" />}
                        Build & Deploy
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLifecycleAction('stop')}
                        disabled={!!lifecycleLoading || runtimeStatus === 'stopped'}
                        title="Stop running pods (keeps current image)"
                        className="bg-[#222] border-[#333] hover:bg-red-900/40 hover:border-red-700 text-[#CCC] hover:text-red-400 transition-colors"
                    >
                        {lifecycleLoading === 'stop' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Square className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLifecycleAction('start')}
                        disabled={!!lifecycleLoading || runtimeStatus === 'live'}
                        title="Start pods from current deployed image"
                        className="bg-[#222] border-[#333] hover:bg-emerald-900/40 hover:border-emerald-700 text-[#CCC] hover:text-emerald-400 transition-colors"
                    >
                        {lifecycleLoading === 'start' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                    </Button>
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleLifecycleAction('restart')}
                        disabled={!!lifecycleLoading || runtimeStatus === 'stopped'}
                        title="Restart pods without creating a new build"
                        className="bg-[#222] border-[#333] hover:bg-amber-900/40 hover:border-amber-700 text-[#CCC] hover:text-amber-400 transition-colors"
                    >
                        {lifecycleLoading === 'restart' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    </Button>
                    <div className="h-6 w-[1px] bg-[#222]" />
                    <Button size="sm" variant="secondary" onClick={() => setIsSettingsOpen(true)} className="bg-[#222] border-[#333] hover:bg-[#333] text-[#CCC]">
                        <Settings className="w-3.5 h-3.5" />
                    </Button>
                </div>
            </div>

            {/* Content Split */}
            <div className="flex-1 overflow-hidden flex gap-6 px-6 pb-6">

                {/* Main Log Terminal */}
                <Card className="flex-1 bg-[#050505] border-[#222] shadow-2xl flex flex-col font-mono rounded-lg overflow-hidden">
                    <div className="px-4 py-2 border-b border-[#222] bg-[#0A0A0A] flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[#666]">
                            <Terminal className="w-3.5 h-3.5" />
                            <span>build_output.log</span>
                        </div>
                        {currentDeployment?.status === 'building' && (
                            <span className="text-[10px] text-amber-500 animate-pulse flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                STREAMING
                            </span>
                        )}
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-1 font-mono text-[11px] leading-relaxed">
                        {logs.length > 0 ? logs.map((log, i) => (
                            <div key={i} className={`break-all ${log.toLowerCase().includes('error') ? 'text-red-400' :
                                log.toLowerCase().includes('success') ? 'text-emerald-400' :
                                    'text-[#A0A0A0]'
                                }`}>
                                <span className="text-[#333] mr-3 select-none inline-block w-[60px]">{new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                {log}
                            </div>
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-[#333]">
                                <Box className="w-8 h-8 mb-2 opacity-30" />
                                <p className="text-xs">No logs available</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* History Sidebar */}
                <div className="w-[280px] flex flex-col gap-4">
                    <Card className="bg-[#0A0A0A] border-[#222] flex-1 flex flex-col overflow-hidden">
                        <CardHeader className="py-2.5 px-4 border-b border-[#222] bg-[#111]">
                            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">Deployment History</CardTitle>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto p-0">
                            {deployments.map(d => (
                                <div
                                    key={d.id}
                                    onClick={() => setCurrentDeployment(d)}
                                    className={`px-4 py-3 border-b border-[#1A1A1A] transition-colors flex items-center justify-between group cursor-pointer ${currentDeployment?.id === d.id ? 'bg-[#1A1A1A]' : 'hover:bg-[#151515]'}`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${d.status === 'live' ? 'bg-emerald-500' :
                                                d.status === 'failed' ? 'bg-red-500' :
                                                    d.status === 'building' ? 'bg-amber-500' : 'bg-slate-700'
                                                }`} />
                                            <span className="text-xs font-medium text-[#CCC] capitalize">{d.status}</span>
                                        </div>
                                        <span className="text-[10px] text-[#555]">{d.created_at ? new Date(d.created_at).toLocaleString() : ''}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {d.status === 'success' && (
                                            <button
                                                onClick={(e) => handleRollback(d.id, e)}
                                                title="Rollback to this version"
                                                className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#555] hover:text-amber-400 hover:bg-amber-900/30 transition-all"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                            </button>
                                        )}
                                        <span className="font-mono text-[10px] text-[#444] group-hover:text-[#666] transition-colors bg-[#111] px-1.5 py-0.5 rounded border border-[#222]">
                                            {d.id.substring(0, 4)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="bg-[#0A0A0A] border-[#222]">
                        <CardHeader className="py-2.5 px-4 border-b border-[#222] bg-[#111] flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">Live Metrics</CardTitle>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </CardHeader>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-[#666] flex items-center gap-1.5"><Cpu className="w-3 h-3" /> CPU</span>
                                <span className="text-[#E3E3E3] font-mono">{metrics ? `${metrics.cpuMillicores}m` : '---'}</span>
                            </div>
                            <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: metrics ? `${Math.min((metrics.cpuMillicores / 1000) * 100, 100)}%` : '0%' }} />
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-[#666] flex items-center gap-1.5"><Database className="w-3 h-3" /> Memory</span>
                                <span className="text-[#E3E3E3] font-mono">{metrics ? `${metrics.memoryMiB} MiB` : '---'}</span>
                            </div>
                            <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: metrics ? `${Math.min((metrics.memoryMiB / 512) * 100, 100)}%` : '0%' }} />
                            </div>
                            <div className="flex justify-between text-xs items-center pt-1">
                                <span className="text-[#666]">Pods</span>
                                <span className="text-[#E3E3E3] font-mono">{metrics?.podCount ?? '---'}</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-[#0A0A0A] border-[#222]">
                        <CardHeader className="py-2.5 px-4 border-b border-[#222] bg-[#111] flex flex-row items-center justify-between">
                            <CardTitle className="text-xs font-medium text-[#888] uppercase tracking-wider">Configuration</CardTitle>
                            <button onClick={() => setIsSettingsOpen(true)} className="text-[10px] text-[#666] hover:text-[#AAA]">EDIT</button>
                        </CardHeader>
                        <div className="p-4 space-y-3">
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-[#666]">Branch</span>
                                <span className="text-[#AAA] font-mono bg-[#151515] px-2 py-0.5 rounded border border-[#222]">{service.branch}</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-[#666]">Container Port</span>
                                <span className="text-[#AAA] font-mono bg-[#151515] px-2 py-0.5 rounded border border-[#222]">{service.port || 3000}</span>
                            </div>
                            <div className="flex justify-between text-xs items-center">
                                <span className="text-[#666]">Builder</span>
                                <span className="text-[#AAA] font-mono bg-[#151515] px-2 py-0.5 rounded border border-[#222]">nixpacks</span>
                            </div>
                            <div className="h-[1px] bg-[#222] my-1" />
                            <div className="space-y-1.5">
                                <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider flex items-center gap-1.5">
                                    <Lock className="w-2.5 h-2.5" />
                                    Public URL (HTTPS)
                                </span>
                                <a
                                    href={`https://${service.name.toLowerCase().replaceAll(/[^a-z0-9]/g, "")}.${project.name.toLowerCase().replaceAll(/[^a-z0-9]/g, "")}.local.kubelite.io`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 transition-colors group/link"
                                >
                                    <span className="truncate">{service.name.toLowerCase().replaceAll(/[^a-z0-9]/g, "")}.{project.name.toLowerCase().replaceAll(/[^a-z0-9]/g, "")}.local.kubelite.io</span>
                                    <ArrowUpRight className="w-3 h-3 shrink-0 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                                </a>
                            </div>
                        </div>
                    </Card>
                </div>
            </div >

            <AnimatePresence>
                {isSettingsOpen && (
                    <SettingsModal
                        isOpen={isSettingsOpen}
                        onClose={() => setIsSettingsOpen(false)}
                        service={service}
                        token={token}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                    />
                )}
            </AnimatePresence>
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div >
    );
};

// --- MAIN PAGE ---

export default function Dashboard() {
    const { token, logout } = useAuth();
    const [viewState, setViewState] = useState<ViewState>({ type: 'GLOBAL' });
    const [viewMode, setViewMode] = useState<'GRID' | 'GRAPH'>('GRID');
    const [showServiceWizard, setShowServiceWizard] = useState(false);
    const [showProjectModal, setShowProjectModal] = useState(false);
    const [showCreateTeam, setShowCreateTeam] = useState(false);
    const [showCreateOrg, setShowCreateOrg] = useState(false);
    const [isTeamDropdownOpen, setIsTeamDropdownOpen] = useState(false); // Used for Org Switcher now
    const [showServiceCatalog, setShowServiceCatalog] = useState(false); // Service Catalog State
    const [initialServiceType, setInitialServiceType] = useState<"backend" | "frontend" | "database" | "worker">("backend");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
    const [isTeamsOpen, setIsTeamsOpen] = useState(true);

    // Data
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [currentTeam, setCurrentTeam] = useState<Team | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<'Date' | 'Name'>('Date');
    const [filterMode, setFilterMode] = useState<'All' | 'Production' | 'Preview' | 'Live' | 'Failed'>('All');

    // Filtered Data
    const filteredProjects = projects
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => sortBy === 'Date'
            ? new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            : a.name.localeCompare(b.name));

    const filteredServices = services
        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(s => {
            if (filterMode === 'All') return true;
            if (filterMode === 'Production') return s.branch === 'main';
            if (filterMode === 'Preview') return s.branch !== 'main';
            if (filterMode === 'Live') return s.status === 'live';
            if (filterMode === 'Failed') return s.status === 'failed';
            return true;
        })
        .sort((a, b) => sortBy === 'Date'
            ? new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
            : a.name.localeCompare(b.name));

    // Auto-logout on 401/403 (expired or invalid token)
    const handleAuthError = useCallback((res: Response) => {
        if (res.status === 401 || res.status === 403) {
            console.warn(`Auth error ${res.status} — logging out`);
            logout();
            return true;
        }
        return false;
    }, [logout]);

    // Fetch Orgs
    const fetchOrgs = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch("/api/v1/orgs", { headers: { Authorization: `Bearer ${token}` } });
            if (handleAuthError(res)) return;
            if (res.ok) {
                const data = await res.json() || [];
                setOrgs(data);
                if (Array.isArray(data) && data.length > 0 && !currentOrg) {
                    setCurrentOrg(data[0]);
                }
            }
        } catch (e) { console.error(e); }
    }, [token, currentOrg, handleAuthError]);

    // Fetch Teams from backend using the current Organization ID
    const fetchTeams = useCallback(async () => {
        if (!token || !currentOrg) return;
        try {
            const res = await fetch(`/api/v1/teams`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "X-Org-ID": currentOrg.id
                }
            });
            if (handleAuthError(res)) return;
            if (res.ok) {
                const fetchedTeams: Team[] = await res.json();
                setTeams(fetchedTeams);

                // Select the first team if none is selected
                if (!currentTeam && fetchedTeams.length > 0) {
                    setCurrentTeam(fetchedTeams[0]);
                }
            }
        } catch (e) {
            console.error(e);
        }
    }, [token, currentOrg, currentTeam, handleAuthError]);

    // Fetch Projects using the current Team ID
    const fetchProjects = useCallback(async () => {
        if (!token || !currentTeam) return;
        try {
            const res = await fetch(`/api/v1/projects?teamId=${currentTeam.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (handleAuthError(res)) return;
            if (res.ok) setProjects(await res.json());
        } catch (e) { console.error(e); }
    }, [token, currentTeam, handleAuthError]);

    // Fetch Services (When in PROJECT view)
    const fetchServices = useCallback(async () => {
        if (!token || (viewState.type !== 'PROJECT' && viewState.type !== 'SERVICE')) return;
        const projectId = viewState.type === 'PROJECT' ? viewState.project.id : viewState.project.id;
        try {
            const res = await fetch(`/api/v1/projects/${projectId}/apps`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (handleAuthError(res)) return;
            if (res.ok) {
                const data: any[] = await res.json();

                const mappedServices: Service[] = data.map(app => ({
                    id: app.id,
                    project_id: app.projectId,
                    name: app.name,
                    status: mapDeploymentStatusToUi(app.deploymentStatus),
                    deployment_status: app.deploymentStatus || undefined,
                    live_url: app.liveUrl || undefined,
                    type: 'backend',
                    metrics: { cpu: 12, memory: 512 },
                    domains: [],
                    deployments: [],
                    env: app.envVars || {},
                    repo_url: app.gitRepoUrl,
                    branch: app.buildBranch,
                    created_at: new Date().toISOString()
                }));

                setServices(mappedServices);

                // If viewing a specific service, sync its state
                if (viewState.type === 'SERVICE') {
                    const updatedCurrent = mappedServices.find(s => s.id === viewState.service.id);
                    if (updatedCurrent) {
                        setViewState(prev => prev.type === 'SERVICE' && prev.service.id === updatedCurrent.id ? { ...prev, service: updatedCurrent } : prev);
                    }
                }
            }
        } catch (e) { console.error(e); }
    }, [token, viewState, handleAuthError]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrgs();
    }, [fetchOrgs]);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (currentOrg) fetchTeams();
    }, [fetchTeams, currentOrg]);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (currentTeam) fetchProjects();
    }, [fetchProjects, currentTeam]);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (viewState.type === 'PROJECT') fetchServices();
    }, [fetchServices, viewState.type, viewState]);

    // Handlers
    const handleProjectSelect = (p: Project) => {
        setViewState({ type: 'PROJECT', project: p });
    };

    const handleServiceSelect = (s: Service) => {
        if (viewState.type === 'PROJECT') {
            setViewState({ type: 'SERVICE', service: s, project: viewState.project });
        }
    };

    const handleWizardComplete = () => {
        setShowServiceWizard(false);
        fetchProjects(); // Refresh everything
        if (viewState.type === 'PROJECT') fetchServices();
    };

    const handleProjectComplete = () => {
        setShowProjectModal(false);
        fetchProjects();
    };

    const handleDeleteComplete = async () => {
        if (viewState.type !== 'SERVICE' || !token) return;
        try {
            const res = await fetch(`/api/v1/apps/${viewState.service.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                // Navigate back to project view and refresh list
                setViewState({ type: 'PROJECT', project: viewState.project });
                fetchServices();
            }
        } catch (e) {
            console.error("Failed to delete application", e);
        }
    };

    if (!token) return (
        <div className="min-h-screen bg-[#0F0F0F] flex items-center justify-center text-white font-mono">
            Loading Dashboard...
        </div>
    );

    return (
        <div className="h-screen w-screen bg-[#0F0F0F] text-[#E3E3E3] font-sans flex text-[13px] antialiased selection:bg-purple-500/30 overflow-hidden">

            {/* SIDEBAR */}
            <motion.div
                initial={false}
                animate={{ width: isSidebarOpen ? 240 : 60 }}
                onDoubleClick={() => setIsSidebarOpen(!isSidebarOpen)}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="h-full bg-[#141414] border-r border-[#242424] flex flex-col shrink-0 pt-3 relative z-30"
            >
                {/* Toggle Button */}
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute -right-3 top-3 w-6 h-6 bg-[#141414] border border-[#242424] rounded-full flex items-center justify-center text-[#666] hover:text-[#E3E3E3] z-50 shadow-sm transition-colors"
                >
                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${isSidebarOpen ? 'rotate-180' : '0'}`} />
                </button>
                {/* Sidebar Header - Organization Switcher */}
                <div className="p-4 border-b border-[#222]">
                    <div className="relative">
                        <button
                            onClick={() => setIsTeamDropdownOpen(!isTeamDropdownOpen)}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
                                    <Building2 className="w-4 h-4 text-white" />
                                </div>
                                {isSidebarOpen && (
                                    <div className="text-left">
                                        <h2 className="text-sm font-semibold text-[#E3E3E3] group-hover:text-white transition-colors">
                                            {currentOrg?.name || "Select Org"}
                                        </h2>
                                        <p className="text-[10px] text-[#666] uppercase tracking-wider font-medium">Organization</p>
                                    </div>
                                )}
                            </div>
                            {isSidebarOpen && <ChevronDown className={`w-4 h-4 text-[#666] transition-transform duration-200 ${isTeamDropdownOpen ? 'rotate-180' : ''}`} />}
                        </button>

                        <AnimatePresence>
                            {isTeamDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-[#333] rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-[#222]"
                                >
                                    <div className="py-1 max-h-48 overflow-y-auto">
                                        <div className="px-3 py-2 text-xs font-semibold text-[#666] uppercase tracking-wider">Organizations</div>
                                        {orgs.map((org, i) => (
                                            <button
                                                key={org.id || `org-${i}`}
                                                onClick={() => {
                                                    setCurrentOrg(org);
                                                    setCurrentTeam(null);
                                                    setProjects([]);
                                                    setViewState({ type: 'GLOBAL' });
                                                    setIsTeamDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-[#1A1A1A] transition-colors ${currentOrg?.id === org.id ? 'text-white bg-[#1A1A1A]' : 'text-[#888]'}`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 bg-[#222] rounded flex items-center justify-center text-[10px]">{org.name.charAt(0)}</span>
                                                    {org.name}
                                                </span>
                                                {currentOrg?.id === org.id && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-2 bg-[#141414]">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => { setShowCreateOrg(true); setIsTeamDropdownOpen(false); }}
                                            className="w-full justify-start text-[#888] hover:text-white border-[#333] hover:bg-[#222]"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-2" />
                                            Create Organization
                                        </Button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Sidebar Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-6">

                    {/* Navigation */}
                    <div className="space-y-0.5">
                        <SidebarItem icon={Building2} label="Platform Overview" active={viewState.type === 'GLOBAL'} collapsed={!isSidebarOpen} onClick={() => { setCurrentTeam(null); setViewState({ type: 'GLOBAL' }); }} />
                        <SidebarItem icon={Layers} label="Projects" active={viewState.type === 'ROOT' || viewState.type === 'PROJECT' || viewState.type === 'SERVICE'} collapsed={!isSidebarOpen} onClick={() => setViewState({ type: 'ROOT' })} />
                        <SidebarItem icon={Inbox} label="Notifications" collapsed={!isSidebarOpen} />
                        <SidebarItem icon={Activity} label="Activity" collapsed={!isSidebarOpen} />
                        <SidebarItem icon={Bell} label="Alerts" collapsed={!isSidebarOpen} />
                    </div>

                    {/* Project/Environment Scope */}
                    {isSidebarOpen && <div className="pt-2">
                        <div
                            className="px-3 mb-2 flex items-center justify-between group cursor-pointer"
                            onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
                        >
                            <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider group-hover:text-[#888] transition-colors">Workspace</span>
                            <ChevronDown className={`w-3 h-3 text-[#555] transition-transform ${isWorkspaceOpen ? 'rotate-180' : ''}`} />
                        </div>
                        <AnimatePresence initial={false}>
                            {isWorkspaceOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-0.5 overflow-hidden"
                                >
                                    <SidebarItem icon={Box} label="Active Environments" collapsed={false} />
                                    <SidebarItem icon={Server} label="Compute Nodes" collapsed={false} />
                                    <SidebarItem icon={Database} label="Storage Volumes" collapsed={false} />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>}

                    {/* Teams UI using sidebar logic */}
                    {isSidebarOpen && <div className="pt-2">
                        <div
                            className="px-3 mb-2 flex items-center justify-between group cursor-pointer"
                            onClick={() => setIsTeamsOpen(!isTeamsOpen)}
                        >
                            <span className="text-[10px] font-semibold text-[#666] uppercase tracking-wider group-hover:text-[#888] transition-colors">Teams</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowCreateTeam(true); }}
                                    className="p-1 hover:bg-[#2C2C2C] rounded text-[#888] hover:text-[#E3E3E3]"
                                    title="Create Team"
                                >
                                    <Plus className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {isTeamsOpen && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-0.5 overflow-hidden"
                                >
                                    {teams.length === 0 ? (
                                        <div className="px-3 py-2 text-xs text-[#555] italic">No teams in this org yet.</div>
                                    ) : (
                                        teams.map((t, i) => (
                                            <div
                                                key={t.id || `team-${i}`}
                                                onClick={() => {
                                                    setCurrentTeam(t);
                                                    setViewState({ type: 'ROOT' });
                                                }}
                                                className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-sm transition-colors cursor-pointer group ${currentTeam?.id === t.id ? "bg-[#2C2C2C]/60 text-[#E3E3E3]" : "text-[#888] hover:bg-[#2C2C2C]/30 hover:text-[#E3E3E3]"}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded bg-[#222] flex items-center justify-center text-[10px] border border-[#333] shadow-sm">
                                                        {t.name.substring(0, 1).toUpperCase()}
                                                    </div>
                                                    <span className="truncate max-w-[130px] font-medium">{t.name}</span>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Settings link inside Teams section */}
                                    <div className="mt-4 pt-4 border-t border-[#242424]">
                                        <SidebarItem
                                            icon={Settings}
                                            label="Org Settings"
                                            active={viewState.type === 'SETTINGS'}
                                            onClick={() => setViewState({ type: 'SETTINGS', view: 'MEMBERS' })}
                                            collapsed={!isSidebarOpen}
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>}
                </div>

                {/* User Profile */}
                <div className="p-4 border-t border-[#222]">
                    <div className="flex items-center gap-3 w-full p-2 hover:bg-[#1A1A1A] rounded-lg transition-colors cursor-pointer group">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white ring-2 ring-[#141414] shadow-lg shadow-purple-900/20 group-hover:ring-[#333] transition-all">
                            JD
                        </div>
                        {isSidebarOpen && (
                            <div className="flex-1 truncate">
                                <p className="text-sm font-medium text-[#E3E3E3] truncate">Jane Doe</p>
                                <p className="text-xs text-[#666] truncate hover:text-red-400 transition-colors cursor-pointer" onClick={logout}>Logout</p>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0A]">
                {/* Background ambient lighting */}
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#111111] to-transparent pointer-events-none" />
                <div className="absolute top-0 left-1/4 w-[500px] h-[300px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Top Sticky Header */}
                <header className="h-[64px] border-b border-[#242424]/60 bg-[#0A0A0A]/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40 relative">
                    <div className="flex items-center h-full">
                        <Breadcrumbs viewState={viewState} onNavigate={setViewState} />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group hidden sm:block">
                            <Search className="w-4 h-4 text-[#555] absolute left-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#E3E3E3] transition-colors" />
                            <input
                                type="text"
                                placeholder={`Search ${viewState.type === 'PROJECT' ? 'deployments' : 'projects'}...`}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="bg-[#141414] border border-[#2C2C2C] rounded-md pl-9 pr-3 py-1.5 text-sm w-[240px] focus:outline-none focus:border-[#444] focus:ring-1 focus:ring-[#444] transition-all text-[#E3E3E3] placeholder-[#555]"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-[#555] bg-[#111] border border-[#333] rounded">⌘</kbd>
                                <kbd className="hidden md:inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-mono text-[#555] bg-[#111] border border-[#333] rounded">K</kbd>
                            </div>
                        </div>

                        {(viewState.type === 'ROOT' || viewState.type === 'GLOBAL') && (
                            <Button onClick={() => setShowProjectModal(true)} size="sm" className="bg-white text-black hover:bg-white/90 shadow-md flex items-center gap-1.5 font-medium">
                                <Plus className="w-4 h-4" />
                                New Project
                            </Button>
                        )}
                        {viewState.type === 'PROJECT' && (
                            <Button onClick={() => setShowServiceCatalog(true)} size="sm" className="bg-white text-black hover:bg-white/90 shadow-md flex items-center gap-1.5 font-medium">
                                <Plus className="w-4 h-4" />
                                Add Service
                            </Button>
                        )}
                    </div>
                </header>

                {/* Scrollable Context Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {viewState.type === 'SETTINGS' ? (
                        <div className="max-w-4xl mx-auto py-8">
                            {currentOrg && <SettingsMembers org={currentOrg} token={token || ''} />}
                        </div>
                    ) : (
                        <>
                            {/* Toolbar (Only for Lists) */}
                            {viewState.type !== 'SERVICE' && viewState.type !== 'GLOBAL' && (
                                <ViewToolbar
                                    sortBy={sortBy}
                                    onSortToggle={() => setSortBy(s => s === 'Date' ? 'Name' : 'Date')}
                                    filterMode={filterMode}
                                    onFilterChange={setFilterMode}
                                    viewMode={viewMode}
                                    onViewChange={setViewMode}
                                />
                            )}

                            {/* Views */}
                            {viewState.type === 'GLOBAL' && viewMode === 'GRID' && (
                                <GlobalDashboard org={currentOrg} />
                            )}
                            {viewState.type === 'ROOT' && viewMode === 'GRID' && (
                                <ProjectsGrid projects={filteredProjects} onSelect={handleProjectSelect} />
                            )}
                            {viewState.type === 'PROJECT' && viewMode === 'GRID' && (
                                <ServicesGrid services={filteredServices} onSelect={handleServiceSelect} onAdd={() => setShowServiceCatalog(true)} />
                            )}

                            {/* Service Graph View */}
                            {((viewState.type === 'PROJECT' && viewMode === 'GRAPH') || (viewState.type === 'ROOT' && viewMode === 'GRAPH') || (viewState.type === 'GLOBAL' && viewMode === 'GRAPH')) && (
                                <div className="h-[calc(100vh-140px)] px-6 pb-6">
                                    <div className="w-full h-full border border-[#242424] rounded-lg overflow-hidden relative bg-[#0A0A0A]">
                                        <ServiceGraph
                                            services={filteredServices}
                                            onSelect={handleServiceSelect}
                                        />
                                    </div>
                                </div>
                            )}

                            {viewState.type === 'SERVICE' && (
                                <ServiceDetail service={viewState.service} project={viewState.project} token={token!} onUpdate={fetchServices} onDelete={handleDeleteComplete} />
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {showServiceCatalog && (
                    <ServiceCatalogModal
                        isOpen={showServiceCatalog}
                        onClose={() => setShowServiceCatalog(false)}
                        onSelectService={(type: "backend" | "frontend" | "database" | "worker") => {
                            setInitialServiceType(type);
                            setShowServiceCatalog(false);
                            setTimeout(() => setShowServiceWizard(true), 150);
                        }}
                    />
                )}
                {showServiceWizard && viewState.type === 'PROJECT' && (
                    <CreateProjectWizard
                        isOpen={showServiceWizard}
                        onClose={() => setShowServiceWizard(false)}
                        onComplete={handleWizardComplete}
                        token={token!}
                        teamId={currentTeam?.id || ''}
                        initialServiceType={initialServiceType}
                        initialProjectId={viewState.project.id}
                    />
                )}

                {showProjectModal && (
                    <CreateProjectModal
                        isOpen={showProjectModal}
                        onClose={() => setShowProjectModal(false)}
                        onComplete={handleProjectComplete}
                        teamID={currentTeam?.id || ''}
                    />
                )}

                {showCreateTeam && (
                    <CreateTeamModal
                        isOpen={showCreateTeam}
                        onClose={() => setShowCreateTeam(false)}
                        onCreated={() => {
                            setShowCreateTeam(false);
                            fetchTeams();
                        }}
                        token={token!}
                        orgID={currentOrg?.id || ''}
                    />
                )}

                {showCreateOrg && (
                    <CreateOrganizationModal
                        isOpen={showCreateOrg}
                        onClose={() => setShowCreateOrg(false)}
                        onCreated={() => {
                            setShowCreateOrg(false);
                            fetchOrgs();
                        }}
                        token={token!}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
