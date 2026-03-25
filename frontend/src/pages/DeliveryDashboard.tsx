import { useState, useEffect } from "react";
import { 
    Zap, CheckCircle2, XCircle, 
    RefreshCw, Search,
    TrendingUp, Activity, History, Play
} from "lucide-react";
import { Card } from "../components/ui/Card";
import type { Organization } from "../types/index";
import { motion, AnimatePresence } from "framer-motion";
import BuildDetailView from "../components/BuildDetailView";

export default function DeliveryDashboard({ _org, _activeTab }: { _org: Organization | null, _activeTab: string }) {
    const [token] = useState(localStorage.getItem("token") || "");
    const [isLoading, setIsLoading] = useState(false);
    const [builds, setBuilds] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedBuild, setSelectedBuild] = useState<any>(null);

    const fetchBuilds = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const res = await fetch("/api/v1/delivery/builds", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch delivery data");
            const json = await res.json();
            setBuilds(json);
        } catch (e) {
            console.error("Delivery Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBuilds();
        const interval = setInterval(fetchBuilds, 15000);
        return () => clearInterval(interval);
    }, [token]);

    const activePipelines = builds.filter(b => b.status === 'RUNNING' || b.status === 'PENDING');
    const filteredBuilds = builds.filter(b => 
        b.applicationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        total: builds.length,
        success: builds.filter(b => b.status === 'SUCCESS').length,
        failed: builds.filter(b => b.status === 'FAILED').length,
        running: activePipelines.length
    };

    return (
        <div className="flex flex-col min-h-full w-full bg-[#0A0A0A] p-8 space-y-8 overflow-y-auto relative">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Zap className="w-8 h-8 text-yellow-400" />
                        Delivery Center
                    </h1>
                    <p className="text-[#666] mt-1">Platform-wide CI/CD pipelines and artifact orchestration.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#444] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Search builds or apps..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#111] border border-[#222] rounded-md pl-9 pr-3 py-1.5 text-sm w-[240px] focus:outline-none focus:border-[#333] transition-all text-white"
                        />
                    </div>
                    <button 
                        onClick={fetchBuilds}
                        className="p-2 bg-[#111] border border-[#222] rounded-md text-[#666] hover:text-white hover:border-[#333] transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Total Builds" value={stats.total} icon={History} color="blue" />
                <StatCard label="Active Pipelines" value={stats.running} icon={Activity} color="yellow" animate={stats.running > 0} />
                <StatCard label="Success Rate" value={`${stats.total > 0 ? Math.round((stats.success / stats.total) * 100) : 100}%`} icon={CheckCircle2} color="emerald" />
                <StatCard label="Failed" value={stats.failed} icon={XCircle} color="red" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-bold text-[#555] uppercase tracking-widest flex items-center gap-2">
                        <Play className="w-4 h-4" /> Live Pipelines
                    </h2>
                    <div className="space-y-3">
                        {activePipelines.length === 0 ? (
                            <div className="p-8 border border-[#222] border-dashed rounded-2xl text-center">
                                <p className="text-xs text-[#444] italic">No active pipelines discovered.</p>
                            </div>
                        ) : (
                            activePipelines.map((pipeline, i) => (
                                <Card 
                                    key={i} 
                                    className="bg-[#111] border-[#222] border-l-yellow-500 border-l-2 cursor-pointer hover:bg-white/[0.02] transition-all group"
                                    onClick={() => setSelectedBuild(pipeline)}
                                >
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-white group-hover:text-yellow-400 transition-colors truncate max-w-[150px]">{pipeline.applicationName}</span>
                                            <span className="text-[10px] text-yellow-500 font-bold uppercase animate-pulse">{pipeline.status}</span>
                                        </div>
                                        <div className="h-1 bg-black/40 rounded-full overflow-hidden">
                                            <motion.div 
                                                className="h-full bg-yellow-500"
                                                initial={{ width: "0%" }}
                                                animate={{ width: "100%" }}
                                                transition={{ duration: 60, repeat: Infinity }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-[10px] text-[#555]">
                                            <span className="font-mono">#{pipeline.id.substring(0, 8)}</span>
                                            <span>{pipeline.projectName}</span>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-sm font-bold text-[#555] uppercase tracking-widest flex items-center gap-2">
                        <History className="w-4 h-4" /> Build History
                    </h2>
                    <div className="bg-[#111]/40 border border-[#222] rounded-xl overflow-hidden backdrop-blur-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222] bg-[#161616]/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Application</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Project</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Start Time</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest text-right">Duration</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {filteredBuilds.map((build, i) => {
                                    const duration = build.endTime 
                                        ? Math.floor((new Date(build.endTime).getTime() - new Date(build.startTime).getTime()) / 1000)
                                        : null;
                                    return (
                                        <tr 
                                            key={i} 
                                            className="hover:bg-white/[0.04] transition-colors group cursor-pointer"
                                            onClick={() => setSelectedBuild(build)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-[#E3E3E3] group-hover:text-blue-400 transition-colors">{build.applicationName}</span>
                                                    <span className="text-[10px] text-[#555] font-mono">#{build.id.substring(0, 8)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[#888]">{build.projectName}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {build.status === 'SUCCESS' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                                                    {build.status === 'FAILED' && <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                                    {build.status === 'RUNNING' && <Activity className="w-3.5 h-3.5 text-yellow-500 animate-spin" />}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                        build.status === 'SUCCESS' ? 'text-emerald-500' :
                                                        build.status === 'FAILED' ? 'text-red-500' :
                                                        'text-yellow-500'
                                                    }`}>
                                                        {build.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-[#666] font-mono">{new Date(build.startTime).toLocaleString()}</td>
                                            <td className="px-6 py-4 text-xs text-[#E3E3E3] font-mono text-right">
                                                {duration ? `${duration}s` : '--'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedBuild && (
                    <BuildDetailView 
                        deploymentId={selectedBuild.deploymentId || selectedBuild.id}
                        appId={selectedBuild.applicationId}
                        token={token}
                        onClose={() => setSelectedBuild(null)}
                        type={selectedBuild.deploymentId ? 'deployment' : 'build'}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

function StatCard({ label, value, icon: Icon, color, animate = false }: any) {
    const colors: any = {
        emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        red: "text-red-400 bg-red-500/10 border-red-500/20",
        blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
        yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    };

    return (
        <Card className={`bg-[#111] border-[#222] p-5 relative overflow-hidden group`}>
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full translate-x-8 -translate-y-8 opacity-10 blur-2xl ${colors[color].split(' ')[1]}`} />
            <div className="flex items-center justify-between relative z-10">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className={`w-5 h-5 ${animate ? 'animate-pulse' : ''}`} />
                </div>
                <TrendingUp className="w-4 h-4 text-[#222] group-hover:text-[#444] transition-colors" />
            </div>
            <div className="mt-4 relative z-10">
                <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest">{label}</p>
                <p className="text-2xl font-black text-white mt-1">{value}</p>
            </div>
        </Card>
    );
}
