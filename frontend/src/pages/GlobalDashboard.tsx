import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Box, TrendingUp, Activity, Server, Database, Globe, ArrowRight, Zap, ShieldCheck } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import type { Organization, Team, Project, Service } from "../types/index";
import { motion } from "framer-motion";

interface GlobalDashboardProps {
    org: Organization | null;
}

export default function GlobalDashboard({ org }: GlobalDashboardProps) {
    const navigate = useNavigate();
    const [token] = useState(localStorage.getItem("token") || "");
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
        if (!org) {
            setTeams([]);
            setProjects([]);
            setServices([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // 1. Get Teams for the active Org
            const teamsRes = await fetch("/api/v1/teams", {
                headers: { Authorization: `Bearer ${token}`, "X-Org-ID": org.id }
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
    }, [token, org]);

    useEffect(() => {
        fetchPlatformData();
    }, [fetchPlatformData]);

    const activeServicesCount = useMemo(() => services.length, [services]);

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-full w-full bg-[#050505] items-center justify-center">
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-t-2 border-emerald-500 animate-spin" />
                    <div className="absolute inset-2 rounded-full border-r-2 border-blue-500 animate-spin animation-delay-150" />
                    <div className="absolute inset-4 rounded-full border-b-2 border-purple-500 animate-spin animation-delay-300" />
                </div>
                <p className="text-[#888] font-mono text-xs mt-6 uppercase tracking-[0.2em] font-medium bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
                    Synchronizing Telemetry
                </p>
            </div>
        );
    }

    if (!org) {
        return (
            <div className="flex flex-col min-h-full w-full bg-[#050505] items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5" />
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative z-10 flex flex-col items-center max-w-lg"
                >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600/20 to-emerald-500/20 flex items-center justify-center mb-6 border border-white/5 shadow-2xl">
                        <Globe className="w-10 h-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight mb-3">Welcome to Ork8stra</h2>
                    <p className="text-[#888] text-lg leading-relaxed mb-8">
                        Your enterprise cloud orchestrator awaits. Initialize your first organization in the sidebar to begin provisioning infrastructure.
                    </p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-full w-full bg-[#050505] relative overflow-hidden">
            {/* Premium Animated Backgrounds */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wMykiLz48L3N2Zz4=')] opacity-50 pointer-events-none" />

            <div className="p-10 max-w-[1400px] mx-auto w-full space-y-10 relative z-10">
                {/* Header Sequence */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
                >
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)] flex items-center gap-1.5">
                                <ShieldCheck className="w-3 h-3" /> System Nominal
                            </span>
                            <span className="text-xs font-mono text-[#555]">{new Date().toISOString().split('T')[0]}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500 tracking-tight flex items-center gap-4">
                            {org?.name} Global Telemetry
                        </h1>
                        <p className="text-[#888] mt-2 text-sm max-w-2xl leading-relaxed">
                            Aggregated metrics and live operational status across all provisioned Kubernetes clusters, isolated teams, and active container workloads.
                        </p>
                    </div>
                    <button
                        onClick={fetchPlatformData}
                        className="group px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white font-medium transition-all flex items-center gap-2 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)] backdrop-blur-md"
                    >
                        <RefreshCwIcon className="w-4 h-4 text-emerald-400 group-hover:rotate-180 transition-transform duration-500" />
                        Synchronize Data
                    </button>
                </motion.div>

                {/* Primary Metric Ribbons */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
                >
                    <motion.div variants={itemVariants}>
                        <Card className="bg-white/[0.02] backdrop-blur-2xl border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                                        <Layers className="w-5 h-5" />
                                    </div>
                                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-400/20 flex items-center gap-1.5">
                                        <TrendingUp className="w-3 h-3" /> +12%
                                    </span>
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tight">{teams.length}</h3>
                                <p className="text-[#666] text-xs font-semibold uppercase tracking-[0.15em] mt-2">Active Teams</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="bg-white/[0.02] backdrop-blur-2xl border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                                        <Box className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tight">{projects.length}</h3>
                                <p className="text-[#666] text-xs font-semibold uppercase tracking-[0.15em] mt-2">Provisioned Projects</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="bg-white/[0.02] backdrop-blur-2xl border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <Server className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                        <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider">Live</span>
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tight">{activeServicesCount}</h3>
                                <p className="text-[#666] text-xs font-semibold uppercase tracking-[0.15em] mt-2">Running Applications</p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="bg-white/[0.02] backdrop-blur-2xl border-white/5 hover:border-white/10 transition-colors relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <CardContent className="p-6 relative z-10">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                                        <Database className="w-5 h-5" />
                                    </div>
                                </div>
                                <h3 className="text-4xl font-black text-white tracking-tight">1</h3>
                                <p className="text-[#666] text-xs font-semibold uppercase tracking-[0.15em] mt-2">Control Planes Active</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                </motion.div>

                {/* Secondary Analytics Layer */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                    {/* Graph Card */}
                    <Card className="lg:col-span-2 bg-white/[0.02] backdrop-blur-2xl border-white/5 overflow-hidden">
                        <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2.5">
                                    <Box className="w-4 h-4 text-emerald-400" />
                                    Application Density Topology
                                </CardTitle>
                                <button className="text-xs text-[#666] hover:text-white transition-colors flex items-center gap-1">
                                    View Full Tree <ArrowRight className="w-3 h-3" />
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            {projects.length === 0 ? (
                                <div className="h-[280px] flex flex-col items-center justify-center text-[#555]">
                                    <Box className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm italic font-medium">No clusters mapped to hierarchy.</p>
                                </div>
                            ) : (
                                <div className="space-y-6 min-h-[280px] flex flex-col pt-2">
                                    {projects.slice(0, 5).map(project => {
                                        const count = services.filter(s => s.project_id === project.id).length;
                                        const maxCount = Math.max(...projects.map(p => services.filter(s => s.project_id === p.id).length), 1);
                                        const percent = (count / maxCount) * 100;
                                        return (
                                            <div key={project.id} className="w-full relative group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-sm text-[#CCC] font-medium group-hover:text-white transition-colors">{project.name}</span>
                                                    <span className="text-xs text-[#666] font-mono group-hover:text-emerald-400 transition-colors">{count} Workloads</span>
                                                </div>
                                                <div className="w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${Math.max(percent, 2)}%` }}
                                                        transition={{ duration: 1, ease: "easeOut" }}
                                                        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full relative"
                                                    >
                                                        <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 translate-x-[-150%] animate-[shimmer_2s_infinite]" />
                                                    </motion.div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Activity Feed */}
                    <Card className="bg-white/[0.02] backdrop-blur-2xl border-white/5 overflow-hidden">
                        <CardHeader className="border-b border-white/[0.05] bg-white/[0.01] px-6 py-5">
                            <CardTitle className="text-sm font-bold text-white uppercase tracking-widest flex items-center gap-2.5">
                                <Zap className="w-4 h-4 text-orange-400" />
                                Live Engine Feed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {services.length === 0 ? (
                                <div className="h-[312px] flex flex-col items-center justify-center text-[#555]">
                                    <Activity className="w-8 h-8 mb-3 opacity-20" />
                                    <span className="text-xs uppercase tracking-widest font-semibold">Idle</span>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/[0.05]">
                                    {services.slice(0, 5).map((service, index) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 + (index * 0.1) }}
                                            key={service.id}
                                            className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-black/40 border border-white/10 flex items-center justify-center group-hover:border-emerald-500/50 transition-colors shadow-inner">
                                                    <Server className="w-4 h-4 text-[#888] group-hover:text-emerald-400 transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-[#E3E3E3] group-hover:text-white transition-colors">{service.name}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Layers className="w-3 h-3 text-[#555]" />
                                                        <p className="text-[10px] text-[#666] uppercase tracking-wider font-semibold">
                                                            {projects.find(p => p.id === service.project_id)?.name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-sm border border-emerald-500/20">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                                                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest">Healthy</span>
                                                </div>
                                                <span className="text-[10px] text-[#555] font-mono">Just now</span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

// Helper icon component since RefreshCw is used
const RefreshCwIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
        <path d="M3 3v5h5" />
    </svg>
);
