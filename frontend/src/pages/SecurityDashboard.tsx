import { useState, useEffect } from "react";
import { 
    Shield, Lock, AlertTriangle, ShieldCheck, 
    RefreshCw, Bell, Activity
} from "lucide-react";
import { Card } from "../components/ui/Card";
import type { Organization } from "../types/index";

export default function SecurityDashboard({ _org, _activeTab }: { _org: Organization | null, _activeTab: string }) {
    const [token] = useState(localStorage.getItem("token") || "");
    const [isLoading, setIsLoading] = useState(false);
    const [summary, setSummary] = useState<any>(null);
    const [policies, setPolicies] = useState<any[]>([]);

    const fetchData = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const [sumRes, polRes] = await Promise.all([
                fetch("/api/v1/security/summary", { headers: { Authorization: `Bearer ${token}` } }),
                fetch("/api/v1/security/policies", { headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            if (sumRes.ok) setSummary(await sumRes.json());
            if (polRes.ok) setPolicies(await polRes.json());
        } catch (e) {
            console.error("Security Fetch Error:", e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    return (
        <div className="flex flex-col min-h-full w-full bg-[#0A0A0A] p-8 space-y-8 overflow-y-auto">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-500" />
                        Governance & Security
                    </h1>
                    <p className="text-[#666] mt-1">Platform-wide policy compliance and automated risk assessment.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button 
                        onClick={fetchData}
                        className="p-2 bg-[#111] border border-[#222] rounded-md text-[#666] hover:text-white hover:border-[#333] transition-all"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Compliance: SOC2-READY</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {summary?.activeRisks?.map((risk: any, i: number) => (
                    <Card key={i} className={`bg-[#111] border-[#222] p-5 border-l-4 ${risk.severity === 'HIGH' ? 'border-l-red-500' : 'border-l-orange-500'}`}>
                        <div className="flex items-start justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className={`w-4 h-4 ${risk.severity === 'HIGH' ? 'text-red-500' : 'text-orange-500'}`} />
                                    <h3 className="text-sm font-bold text-white">{risk.title}</h3>
                                </div>
                                <p className="text-xs text-[#666] leading-relaxed">{risk.description}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${risk.severity === 'HIGH' ? 'bg-red-500/10 text-red-500' : 'bg-orange-500/10 text-orange-500'}`}>
                                {risk.severity}
                            </span>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-[#555] uppercase tracking-widest flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Active Policy Guardrails
                    </h2>
                    <div className="bg-[#111]/40 border border-[#222] rounded-xl overflow-hidden backdrop-blur-sm">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#222] bg-[#161616]/50">
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Policy Name</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest">Namespace</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#555] uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#222]">
                                {policies.map((policy: any, i: number) => (
                                    <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-sm font-bold text-[#E3E3E3]">{policy.name}</td>
                                        <td className="px-6 py-4 text-xs font-mono text-[#666]">{policy.namespace}</td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-bold">ENFORCED</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm font-bold text-[#555] uppercase tracking-widest flex items-center gap-2">
                        <Bell className="w-4 h-4" /> Security Advisory Feed
                    </h2>
                    <div className="space-y-3">
                        <AdvisoryItem 
                            title="RBAC Configuration Change" 
                            time="2h ago" 
                            desc="Global admin role was modified for user 'malik'."
                            type="info"
                        />
                        <AdvisoryItem 
                            title="Ingress Traffic Peak" 
                            time="5h ago" 
                            desc="Unusual volume of traffic detected from single IP to 'Mediahub' gateway." 
                            type="warning"
                        />
                        <AdvisoryItem 
                            title="New NetworkPolicy Added" 
                            time="1d ago" 
                            desc="Project 'Production' now has strict egress isolation enforced." 
                            type="success"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function AdvisoryItem({ title, time, desc, type }: any) {
    const icons: any = {
        info: <Activity className="w-4 h-4 text-blue-400" />,
        warning: <AlertTriangle className="w-4 h-4 text-orange-400" />,
        success: <ShieldCheck className="w-4 h-4 text-emerald-400" />
    };

    return (
        <div className="p-4 bg-[#111] border border-[#222] rounded-xl hover:border-[#333] transition-colors group">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    {icons[type]}
                    <h3 className="text-xs font-bold text-white group-hover:text-purple-400 transition-colors">{title}</h3>
                </div>
                <span className="text-[10px] text-[#444] font-mono">{time}</span>
            </div>
            <p className="text-xs text-[#666]">{desc}</p>
        </div>
    );
}
