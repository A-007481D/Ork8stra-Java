import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Layers, Box, TrendingUp, Activity, Server, Database, Globe } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import type { Organization, Team, Project, Service } from "../types/index";

export default function GlobalDashboard() {
    const navigate = useNavigate();
    const [token] = useState(localStorage.getItem("token") || "");
    const [orgs, setOrgs] = useState<Organization[]>([]);
    const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Initial Auth Check
    useEffect(() => {
        if (!token) navigate("/login");
    }, [token, navigate]);

    // Deep Fetch Sequence
    const fetchPlatformData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            // 1. Get Orgs
            const orgsRes = await fetch("/api/v1/orgs", { headers: { Authorization: `Bearer ${token}` } });
            if (!orgsRes.ok) throw new Error("Failed to fetch orgs");
            const orgsData = await orgsRes.json();
            setOrgs(orgsData);

            if (orgsData.length === 0) {
                setIsLoading(false);
                return;
            }
            const activeOrg = orgsData[0];
            setCurrentOrg(activeOrg);

            // 2. Get Teams
            const teamsRes = await fetch("/api/v1/teams", {
                headers: { Authorization: `Bearer ${token}`, "X-Org-ID": activeOrg.id }
            });
            if (!teamsRes.ok) throw new Error("Failed to fetch teams");
            const teamsData: Team[] = await teamsRes.json();
            setTeams(teamsData);

            // 3. Parallel Fetch Projects for all Teams
            const projectPromises = teamsData.map(t =>
                fetch(`/api/v1/projects?teamId=${t.id}`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
            );
            const projectsArrays = await Promise.all(projectPromises);
            const allProjects = projectsArrays.flat() as Project[];
            setProjects(allProjects);

            // 4. Parallel Fetch Services for all Projects
            const servicePromises = allProjects.map(p =>
                fetch(`/api/v1/projects/${p.id}/apps`, { headers: { Authorization: `Bearer ${token}` } })
                    .then(res => res.json())
            );
            const serviceArrays = await Promise.all(servicePromises);
            const allServices = serviceArrays.flat().map((app: any) => ({
                id: app.id,
                project_id: app.projectId,
                name: app.name,
                status: 'live',
                type: 'backend',
                created_at: new Date().toISOString()
            })) as Service[];
            setServices(allServices);

        } catch (e) {
            console.error("Platform Aggregation Error:", e);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchPlatformData();
    }, [fetchPlatformData]);

    const activeServicesCount = useMemo(() => services.length, [services]);

    if (isLoading) {
        return (
            <div className="flex-1 h-full bg-[#0A0A0A] flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-t-2 border-l-2 border-emerald-500 animate-spin" />
                <p className="text-[#666] font-mono text-xs mt-4 uppercase tracking-widest">Aggregating Cloud Resources...</p>
            </div>
        );
    }

    if (orgs.length === 0) {
        return (
            <div className="flex-1 h-full bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center">
                <Globe className="w-16 h-16 text-[#333] mb-4" />
                <h2 className="text-xl font-bold text-[#E3E3E3] mb-2">Welcome to KubeLite</h2>
                <p className="text-[#888] max-w-md">You don't belong to any organizations yet. Select an organization from the sidebar or create a new one to begin deploying infrastructure.</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-[#0A0A0A] relative overflow-y-auto custom-scrollbar">
            {/* Ambient Background */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none" />

            <div className="p-8 max-w-7xl mx-auto w-full space-y-8 relative z-10">
                {/* Header Sequence */}
                <div className="flex items-end justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ORG-LEVEL OVERVIEW
                            </span>
                        </div>
                        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-[#555]" />
                            {currentOrg?.name} Global Dashboard
                        </h1>
                        <p className="text-[#888] mt-2">Aggregate metrics for all clusters, teams, and active deployments.</p>
                    </div>
                    <button onClick={fetchPlatformData} className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#222] border border-[#333] rounded-md text-sm text-[#E3E3E3] font-medium transition-colors flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        Refresh Telemetry
                    </button>
                </div>

                {/* Primary Metric Ribbons */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="bg-[#111]/80 backdrop-blur border-[#222]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Active</span>
                            </div>
                            <h3 className="text-3xl font-bold text-white">{teams.length}</h3>
                            <p className="text-[#666] text-xs font-medium uppercase tracking-wider mt-1">Total Teams</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111]/80 backdrop-blur border-[#222]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
                                    <Box className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white">{projects.length}</h3>
                            <p className="text-[#666] text-xs font-medium uppercase tracking-wider mt-1">Provisioned Projects</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111]/80 backdrop-blur border-[#222]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                                    <Server className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white">{activeServicesCount}</h3>
                            <p className="text-[#666] text-xs font-medium uppercase tracking-wider mt-1">Live Applications</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111]/80 backdrop-blur border-[#222]">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                                    <Database className="w-5 h-5" />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-white">1</h3>
                            <p className="text-[#666] text-xs font-medium uppercase tracking-wider mt-1">Control Planes</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Application Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="bg-[#111]/80 backdrop-blur border-[#222] min-h-[300px]">
                        <CardHeader className="border-b border-[#222] pb-4">
                            <CardTitle className="text-sm font-semibold text-[#E3E3E3] flex items-center gap-2">
                                <Box className="w-4 h-4 text-[#888]" />
                                Application Distribution by Project
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            {projects.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[#555] text-sm italic">
                                    No data available to graph.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {projects.slice(0, 5).map(project => {
                                        const count = services.filter(s => s.project_id === project.id).length;
                                        const maxCount = Math.max(...projects.map(p => services.filter(s => s.project_id === p.id).length), 1);
                                        const percent = (count / maxCount) * 100;
                                        return (
                                            <div key={project.id} className="w-full">
                                                <div className="flex justify-between text-xs mb-1.5">
                                                    <span className="text-[#AAA] font-medium">{project.name}</span>
                                                    <span className="text-[#666] font-mono">{count} Apps</span>
                                                </div>
                                                <div className="w-full h-2 bg-[#222] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                                        style={{ width: `${Math.max(percent, 2)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-[#111]/80 backdrop-blur border-[#222] min-h-[300px]">
                        <CardHeader className="border-b border-[#222] pb-4">
                            <CardTitle className="text-sm font-semibold text-[#E3E3E3] flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#888]" />
                                Recent Deployments
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {services.length === 0 ? (
                                <div className="h-[240px] flex items-center justify-center text-[#555] text-sm italic">
                                    No deployments found.
                                </div>
                            ) : (
                                <div className="divide-y divide-[#222]">
                                    {services.slice(0, 5).map(service => (
                                        <div key={service.id} className="p-4 flex items-center justify-between hover:bg-[#1A1A1A] transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-[#222] border border-[#333] flex items-center justify-center">
                                                    <Server className="w-4 h-4 text-[#888]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-[#E3E3E3]">{service.name}</p>
                                                    <p className="text-[10px] text-[#666] uppercase tracking-wider mt-0.5">
                                                        {projects.find(p => p.id === service.project_id)?.name || 'Unknown Project'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                                <span className="text-xs text-[#888] font-mono">Live</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
