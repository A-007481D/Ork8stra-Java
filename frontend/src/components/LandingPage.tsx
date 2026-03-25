"use client";


import { motion } from "framer-motion";
import { Globe, BarChart3, Lock, LayoutGrid, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardPreview from "./DashboardPreview";
import CommandPalette from "./CommandPalette";
import Navbar from "./Navbar";

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />

            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-grid-white opacity-40 mix-blend-overlay" />
            </div>

            {/* ---------------------------------------------------------------------------
          HERO SECTION: COMMAND PALETTE FIRST
          --------------------------------------------------------------------------- */}
            <section className="relative pt-48 pb-32 px-6 max-w-[1200px] mx-auto flex flex-col items-center text-center z-10">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-500 text-[10px] font-bold tracking-widest uppercase mb-8">
                        The Cloud Platform for Professionals
                    </div>
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight text-white mb-8">
                        Deploy in <span className="text-slate-400">Seconds.</span>
                    </h1>
                    <p className="text-slate-500 text-lg max-w-xl mx-auto mb-16 leading-relaxed">
                        KubeLite is the infrastructure engine that automates the boring parts 
                        of Kubernetes, giving engineers their time back.
                    </p>
                </motion.div>

                {/* The Interactive Command Palette */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="w-full mb-32"
                >
                    <CommandPalette />
                </motion.div>
            </section>

            {/* ---------------------------------------------------------------------------
          SECTION 1: OCI-NATIVE BUILD ENGINE (KANIKO)
          --------------------------------------------------------------------------- */}
            <section className="relative py-32 px-6 max-w-[1200px] mx-auto z-10 border-t border-white/5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold tracking-widest uppercase">
                            Secure Build Pipeline
                        </div>
                        <h2 className="text-4xl font-bold">Daemon-less OCI <br />Build Engine.</h2>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            KubeLite uses Kaniko to build container images inside your cluster without 
                            requiring a privileged Docker daemon. This ensures maximum security 
                            and compatibility with standard OCI registries.
                        </p>
                        <div className="grid grid-cols-2 gap-4 pt-4">
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-blue-400 font-bold mb-1">Standard OCI</div>
                                <div className="text-xs text-slate-500 text-pretty">Builds standard images that run anywhere.</div>
                            </div>
                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="text-blue-400 font-bold mb-1">No Root Req.</div>
                                <div className="text-xs text-slate-500 text-pretty">Runs as an unprivileged user in Kubernetes.</div>
                            </div>
                        </div>
                    </div>
                    {/* Visual: Lightweight Build Flow */}
                    <div className="relative p-8 glass rounded-3xl border border-white/10 shadow-2xl overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 text-white/5 font-black text-4xl italic">KANIKO</div>
                        <div className="space-y-4 font-mono text-[11px]">
                            <div className="flex items-center gap-3 text-emerald-400">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span>[worker-01] Initializing build context...</span>
                            </div>
                            <div className="pl-5 space-y-2 text-slate-500">
                                <div>➜ Fetching repository: feature/auth-fix</div>
                                <div>➜ Resolving 12 base layers...</div>
                                <div className="text-blue-400">➜ Layer c3a4de1: CACHED</div>
                                <div className="text-blue-400">➜ Layer f92b821: CACHED</div>
                                <div className="flex gap-2">
                                    <span className="text-white">➜ RUN npm install</span>
                                    <motion.span 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ repeat: Infinity, duration: 1 }}
                                        className="text-white"
                                    >_</motion.span>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-between items-center text-[10px] border-t border-white/5">
                                <span className="text-slate-600 uppercase tracking-widest">Image: backend-api:latest</span>
                                <span className="text-slate-600">84.2 MB</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------------------
          SECTION 2: LIVE OBSERVABILITY (METRICS & LOGS)
          --------------------------------------------------------------------------- */}
            <section className="relative py-32 px-6 max-w-[1200px] mx-auto z-10">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-4xl font-bold">Deep Observability, <br />Zero Configuration.</h2>
                    <p className="text-slate-500 max-w-2xl mx-auto">
                        Real-time logging and metrics are baked in from day one. Monitor every 
                        deployment stage and pod health without installing third-party agents.
                    </p>
                </div>
                
                <div className="relative glass rounded-3xl border border-white/10 shadow-[0_0_100px_-20px_rgba(59,130,246,0.2)] overflow-hidden p-2">
                    <DashboardPreview />
                </div>
            </section>

            {/* ---------------------------------------------------------------------------
          SECTION 3: ENTERPRISE MULTI-TENANCY
          --------------------------------------------------------------------------- */}
            <section className="relative py-32 px-6 max-w-[1200px] mx-auto z-10 border-t border-white/5">
                <div className="flex flex-col lg:flex-row gap-16 items-center">
                    <div className="lg:w-1/3 space-y-6">
                        <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                            <Lock className="w-6 h-6" />
                        </div>
                        <h2 className="text-3xl font-bold">Multi-tenant <br />by Design.</h2>
                        <p className="text-slate-500 leading-relaxed">
                            Organize your entire organization into secure logical units. 
                            KubeLite's IAM layer ensures strict isolation between teams, 
                            projects, and environments.
                        </p>
                        <div className="space-y-4 pt-4">
                            {[
                                { title: 'Organizations', desc: 'Top-level isolation with billing and policies.' },
                                { title: 'Teams', desc: 'Collaborative spaces with RBAC-controlled access.' },
                                { title: 'Environments', desc: 'Stages for Dev, Staging, and Production.' }
                            ].map((item) => (
                                <div key={item.title} className="flex gap-4">
                                    <div className="w-1 h-auto bg-purple-500/20 rounded" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{item.title}</div>
                                        <div className="text-xs text-slate-500">{item.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="lg:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-8 glass rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <LayoutGrid className="w-6 h-6 text-blue-400 mb-4" />
                            <h4 className="text-lg font-bold mb-2 text-white uppercase tracking-tight">Project Scoping</h4>
                            <p className="text-slate-500 text-sm">Cluster resources are automatically partitioned using namespaces and network policies.</p>
                        </div>
                        <div className="p-8 glass rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <Shield className="w-6 h-6 text-emerald-400 mb-4" />
                            <h4 className="text-lg font-bold mb-2 text-white uppercase tracking-tight">Policy Enforcement</h4>
                            <p className="text-slate-500 text-sm">Define quotas and restrict sensitive operations at the organization level.</p>
                        </div>
                        <div className="p-8 glass rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <Globe className="w-6 h-6 text-purple-400 mb-4" />
                            <h4 className="text-lg font-bold mb-2 text-white uppercase tracking-tight">Edge Networking</h4>
                            <p className="text-slate-500 text-sm">Automated ingress reconciliation with TLS termination for every project.</p>
                        </div>
                        <div className="p-8 glass rounded-2xl border border-white/10 hover:border-white/20 transition-all">
                            <BarChart3 className="w-6 h-6 text-amber-400 mb-4" />
                            <h4 className="text-lg font-bold mb-2 text-white uppercase tracking-tight">Resource Quotas</h4>
                            <p className="text-slate-500 text-sm">Ensure fair distribution and prevent runaway costs with granular limit sets.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA SECTION: MINIMALIST */}
            <section className="py-48 px-6 text-center border-t border-white/5">
                <h2 className="text-5xl font-bold mb-8">Stop managing, <br />start building.</h2>
                <Link to="/register" className="px-12 py-5 rounded-2xl bg-white text-black font-black text-lg hover:scale-105 transition-transform inline-block">
                    Deploy Now
                </Link>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 max-w-[1200px] mx-auto opacity-50 text-xs flex justify-between items-center">
                <span>© 2026 KubeLite Inc. All rights reserved.</span>
                <div className="flex gap-8">
                    <Link to="#" className="hover:text-white transition-colors">Twitter</Link>
                    <Link to="#" className="hover:text-white transition-colors">GitHub</Link>
                    <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                </div>
            </footer>
        </div>
    );
}
