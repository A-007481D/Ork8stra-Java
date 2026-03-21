import { useState, useEffect } from "react";
import { 
    Server, Database, Globe, Layers, 
    Box, Cpu, Network, Layout,
    Search, RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardContent } from "../components/ui/Card";
import type { Organization } from "../types/index";

interface InfrastructureDashboardProps {
    org: Organization | null;
    activeTab: string;
}

export default function InfrastructureDashboard({ org, activeTab }: InfrastructureDashboardProps) {
    const [token] = useState(localStorage.getItem("token") || "");
    const [isLoading, setIsLoading] = useState(false);
    const [data, setData] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            let endpoint = "";
            switch (activeTab) {
                case 'nodes': endpoint = "/api/v1/observability/nodes"; break;
                case 'storage': endpoint = "/api/v1/infra/storage"; break;
                case 'network': endpoint = "/api/v1/infra/network"; break;
                case 'topology': endpoint = "/api/v1/infra/topology"; break;
                default: endpoint = "/api/v1/observability/nodes";
            }

            const res = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Failed to fetch infra data");
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error("Infra Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [activeTab, token]);

    return (
        <div className="flex flex-col min-h-full w-full bg-[#0A0A0A] p-8 space-y-8 overflow-y-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        {activeTab === 'nodes' && <Server className="w-8 h-8 text-emerald-400" />}
                        {activeTab === 'storage' && <Database className="w-8 h-8 text-blue-400" />}
                        {activeTab === 'network' && <Globe className="w-8 h-8 text-purple-400" />}
                        {activeTab === 'topology' && <Layers className="w-8 h-8 text-orange-400" />}
                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry
                    </h1>
                    <p className="text-[#666] mt-1">Real-time inventory and mapping of platform-wide resources.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-[#444] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="Filter resources..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-[#111] border border-[#222] rounded-md pl-9 pr-3 py-1.5 text-sm w-[240px] focus:outline-none focus:border-[#333] transition-all text-white"
                        />
                    </div>
                    <button 
                        onClick={fetchData}
                        className="p-2 bg-[#111] border border-[#222] rounded-md text-[#666] hover:text-white hover:border-[#333] transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </header>

            {isLoading && !data ? (
                <div className="flex-1 flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                        <span className="text-xs font-mono text-[#444] uppercase tracking-widest">Scanning Infrastructure...</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeTab === 'nodes' && <NodesView nodes={data} />}
                    {activeTab === 'storage' && <StorageView data={data} />}
                    {activeTab === 'network' && <NetworkView assets={data} />}
                    {activeTab === 'topology' && <TopologyView entries={data} />}
                </div>
            )}
        </div>
    );
}

function NodesView({ nodes }: { nodes: any[] }) {
    if (!nodes || nodes.length === 0) return <EmptyState label="No compute nodes discovered." icon={Server} />;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node, i) => (
                <Card key={i} className="bg-[#111]/50 border-[#222] hover:border-emerald-500/30 transition-all group overflow-hidden">
                    <CardHeader className="p-5 border-b border-[#222]/50">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <Server className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{node.name}</h3>
                                    <p className="text-[10px] text-[#555] font-mono">{node.kubeletVersion}</p>
                                </div>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${node.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                                {node.status}
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="p-5 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <p className="text-[10px] text-[#555] uppercase font-bold tracking-widest">OS / ARCH</p>
                                <p className="text-xs text-[#E3E3E3]">{node.osImage} / {node.architecture}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] text-[#555] uppercase font-bold tracking-widest">Address</p>
                                <p className="text-xs text-[#E3E3E3]">{node.internalIP}</p>
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-[#222]/50">
                            <div className="flex justify-between text-[10px]">
                                <span className="text-[#666]">SYSTEM INFO</span>
                                <span className="text-[#E3E3E3] font-mono">{node.containerRuntimeVersion}</span>
                            </div>
                            <div className="p-2 bg-black/40 rounded border border-[#222] text-[10px] text-[#888] font-mono">
                                Kernel: {node.kernelVersion}
                            </div>
                            <div className="flex justify-between text-[10px] items-center pt-2">
                                <span className="text-[#666]">CAPACITY</span>
                                <div className="flex items-center gap-3 text-[#E3E3E3] font-mono">
                                    <div className="flex items-center gap-1"><Cpu className="w-3 h-3 text-[#444]" /> {node.cpuCapacity}</div>
                                    <div className="flex items-center gap-1"><Database className="w-3 h-3 text-[#444]" /> {node.memoryCapacity}</div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

function StorageView({ data }: { data: any }) {
    if (!data || !data.pvcs || data.pvcs.length === 0) return <EmptyState label="No persistent storage volumes found." icon={Database} />;
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.storageClasses.map((sc: string, i: number) => (
                    <div key={i} className="p-4 bg-[#111] border border-[#222] rounded-xl flex items-center gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                            <Box className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-[#555] font-bold uppercase tracking-widest">Storage Class</p>
                            <p className="text-sm font-bold text-white tracking-tight">{sc}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-[#111]/40 border border-[#222] rounded-xl overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#222] bg-[#161616]/50">
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Volume Name</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Namespace</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Capacity</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Class</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest text-right">Age</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#222]">
                        {data.pvcs.map((pvc: any, i: number) => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <Database className="w-4 h-4 text-[#444] group-hover:text-blue-400 transition-colors" />
                                        <span className="text-sm font-bold text-[#E3E3E3]">{pvc.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-xs font-mono text-[#666]">{pvc.namespace}</td>
                                <td className="px-6 py-4 text-sm text-[#E3E3E3] font-mono">{pvc.capacity}</td>
                                <td className="px-6 py-4 text-xs text-[#888]">{pvc.storageClass}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${pvc.status === 'Bound' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-orange-500/10 text-orange-400'}`}>
                                        {pvc.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-[#555] font-mono text-right">{new Date(pvc.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function NetworkView({ assets }: { assets: any[] }) {
    if (!assets || assets.length === 0) return <EmptyState label="No ingress or service assets mapped." icon={Globe} />;
    return (
        <div className="bg-[#111]/40 border border-[#222] rounded-xl overflow-hidden">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-[#222] bg-[#161616]/50">
                        <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Asset Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Namespace</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Type</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Specification</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[#222]">
                    {assets.map((asset, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4 text-sm font-bold text-[#E3E3E3]">
                                <div className="flex items-center gap-3">
                                    {asset.type === 'Service' ? <Network className="w-4 h-4 text-purple-400" /> : <Globe className="w-4 h-4 text-blue-400" />}
                                    {asset.name}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono text-[#666]">{asset.namespace}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-[#888] uppercase tracking-widest">{asset.type}</td>
                            <td className="px-6 py-4 text-xs font-mono text-emerald-400/80 bg-emerald-500/5 rounded-md px-2 py-0.5 border border-emerald-500/10 w-fit">{asset.spec}</td>
                            <td className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">{asset.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function TopologyView({ entries }: { entries: any[] }) {
    if (!entries || entries.length === 0) return <EmptyState label="No logical topology mapped yet." icon={Layers} />;
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {entries.map((entry, i) => (
                <div key={i} className="p-6 bg-[#111] border border-[#222] rounded-2xl flex flex-col gap-4 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[40px] rounded-full translate-x-10 -translate-y-10 group-hover:bg-orange-500/10 transition-all" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                                <Layout className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">{entry.projectName}</h3>
                                <p className="text-xs text-[#555] font-mono">{entry.namespace}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20">
                            {entry.status}
                        </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-2 relative z-10">
                        <div className="p-3 bg-black/40 border border-[#222] rounded-xl text-center">
                            <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-1">Apps</p>
                            <p className="text-xl font-black text-white">{entry.appCount}</p>
                        </div>
                        <div className="p-3 bg-black/40 border border-[#222] rounded-xl text-center">
                            <p className="text-[10px] text-[#555] font-bold uppercase tracking-widest mb-1">Pods</p>
                            <p className="text-xl font-black text-white">{entry.podCount}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function EmptyState({ label, icon: Icon }: { label: string, icon: any }) {
    return (
        <div className="h-[400px] w-full flex flex-col items-center justify-center border-2 border-dashed border-[#222] rounded-3xl bg-[#111]/20">
            <Icon className="w-16 h-16 text-[#222] mb-6" />
            <p className="text-[#555] text-sm italic font-medium">{label}</p>
        </div>
    );
}
