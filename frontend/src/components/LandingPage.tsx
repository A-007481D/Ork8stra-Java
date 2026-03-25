"use client";


import { motion } from "framer-motion";
import { ArrowRight, GithubIcon, Globe, BarChart3, Lock, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import DashboardPreview from "./DashboardPreview";
import CommandPalette from "./CommandPalette";
import BentoGrid from "./BentoGrid";
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
          BENTO GRID SECTION
          --------------------------------------------------------------------------- */}
            <BentoGrid />

            {/* ---------------------------------------------------------------------------
          BENTO CONTENT: HIGH DENSITY FEATURES (Integration of original elements)
          --------------------------------------------------------------------------- */}
            <section className="relative pb-40 px-6 max-w-[1200px] mx-auto z-10">
                <div className="grid grid-cols-12 gap-6">
                    
                    {/* Big Card: Git Engine */}
                    <div className="col-span-12 lg:col-span-8 glass rounded-3xl p-10 overflow-hidden relative group border border-white/10 shadow-2xl">
                        <div className="relative z-10 max-w-md">
                            <div className="w-12 h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                <GithubIcon className="w-6 h-6" />
                            </div>
                            <h3 className="text-2xl font-bold mb-4">Git-First Workflows.</h3>
                            <p className="text-slate-500 leading-relaxed mb-8">
                                Push code, we handle the rest. Our build engine produces OCI-compliant 
                                images and rolls them out to your production cluster with zero downtime.
                            </p>
                            <div className="flex gap-4">
                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">GitHub</div>
                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">GitLab</div>
                                <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">Webhooks</div>
                            </div>
                        </div>
                        {/* Visual element */}
                        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] opacity-20 group-hover:opacity-40 transition-opacity">
                            <DashboardPreview />
                        </div>
                    </div>

                    {/* Small Card: Regional Edge */}
                    <div className="col-span-12 lg:col-span-4 glass rounded-3xl p-10 flex flex-col justify-between group border border-white/10 shadow-2xl">
                        <div>
                            <Globe className="w-8 h-8 text-emerald-400 mb-6 group-hover:rotate-12 transition-transform" />
                            <h3 className="text-2xl font-bold mb-4">Global Edge.</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Automatic anycast routing and global CDN integration. Serve users from 
                                the closest node with <span className="text-emerald-400 font-bold tracking-tighter">12ms latency</span>.
                            </p>
                        </div>
                        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Regions</span>
                            <div className="flex -space-x-2">
                                {[...Array(4)].map((_, i) => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#050505] bg-emerald-500/20 flex items-center justify-center">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Wide Card: Observability */}
                    <div className="col-span-12 lg:col-span-12 glass rounded-3xl p-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center group border border-white/10 shadow-2xl">
                        <div>
                            <div className="w-10 h-10 rounded-lg bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                                <BarChart3 className="w-5 h-5" />
                            </div>
                            <h3 className="text-3xl font-bold mb-4">Smart Observability.</h3>
                            <p className="text-slate-500 leading-relaxed mb-6">
                                Integrated metrics, logging, and tracing. No extra agents required. 
                                We monitor everything from pod resource usage to ingress error rates 
                                out of the box.
                            </p>
                            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white transition-colors">
                                Explore Metrics <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                        <div className="relative h-48 bg-black/40 rounded-xl border border-white/5 overflow-hidden flex items-end px-6 pb-2 gap-1 group-hover:gap-1.5 transition-all">
                             {[...Array(40)].map((_, i) => (
                                <motion.div 
                                    key={i}
                                    className="flex-1 bg-purple-500/20 rounded-t-sm"
                                    initial={{ height: 10 }}
                                    animate={{ height: `${20 + ((i * 13) % 80)}%` }}
                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.05, repeatType: "reverse" }}
                                />
                             ))}
                        </div>
                    </div>

                    {/* Infrastructure Card */}
                    <div className="col-span-12 lg:col-span-6 glass rounded-3xl p-10 group border border-white/10 shadow-2xl">
                        <Lock className="w-8 h-8 text-blue-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-bold mb-4">Hardened Security.</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Every environment is isolated with network policies and strict resource quotas. 
                            Built-in RBAC ensures your team only has access to what they need.
                        </p>
                    </div>

                    {/* Developer Experience Card */}
                    <div className="col-span-12 lg:col-span-6 glass rounded-3xl p-10 group border border-white/10 shadow-2xl">
                        <LayoutGrid className="w-8 h-8 text-amber-400 mb-6 group-hover:scale-110 transition-transform" />
                        <h3 className="text-2xl font-bold mb-4">Project Management.</h3>
                        <p className="text-slate-500 leading-relaxed">
                            Organize your infrastructure into Teams and Projects. Manage multiple 
                            environments (Dev, Staging, Production) from a single control plane.
                        </p>
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
