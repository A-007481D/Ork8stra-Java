import React, { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, Terminal, ArrowRight } from "lucide-react";
import Navbar from "./Navbar";
import LandingHero from "./LandingHero";
import Ork8straLogo from "./Ork8straLogo";

export default function LandingPage() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    const scaleY = useSpring(scrollYProgress, {
        stiffness: 100,
        damping: 30,
        restDelta: 0.001
    });

    return (
        <div ref={containerRef} className="min-h-screen w-full bg-[#020202] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
            <Navbar />
            <LandingHero />

            {/* THE STREAM: ORGANIC WORKFLOW VISUALIZATION */}
            <section className="relative py-40 lg:py-48 px-6 z-10">
                <div className="max-w-[1400px] mx-auto flex flex-col items-center">
                    
                    {/* The Path Stream (Reactive SVG) */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/5 pointer-events-none overflow-hidden">
                        <motion.div 
                            style={{ scaleY }}
                            className="absolute top-0 left-0 right-0 origin-top bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] h-full"
                        />
                    </div>

                    <div className="space-y-32 w-full">
                        
                        {/* Point 1: Integrate (The Terminal) */}
                        <StepSection
                            title="Integrate"
                            description="Connect your repository. We monitor intent, not just diffs. Instant recognition of builds, runtimes, and dependencies."
                            side="left"
                            mockup={
                                <div className="w-full aspect-video glass-card rounded-3xl p-8 font-mono text-xs text-slate-400 overflow-hidden relative intense-glow" style={{ '--glow-color': 'rgba(59, 130, 246, 0.15)' } as any}>
                                    <div className="flex gap-2 mb-8">
                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/30" />
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/30" />
                                    </div>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex gap-3">
                                            <span className="text-blue-500/70 font-bold">➜</span>
                                            <span className="text-white/80">git push ork8stra main</span>
                                        </div>
                                        <div className="text-slate-600 pl-6">Enumerating objects: 24, done.</div>
                                        <div className="text-slate-600 pl-6">Counting objects: 100% (24/24), done.</div>
                                        <div className="flex gap-3 items-center pl-6">
                                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                            <span className="text-blue-400 font-bold tracking-tight">ork8stra</span>
                                            <span className="text-slate-300">Detecting architecture: Microservices (Go/Rust)</span>
                                        </div>
                                        <div className="text-slate-500 mt-6 italic opacity-40 pl-6">// establishing secure tunnel to cluster node-04...</div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-500/5 to-transparent pointer-events-none" />
                                </div>
                            }
                        />

                        {/* Point 2: Sync (GitHub Both Ways) - Huly Style */}
                        <StepSection
                            title="Sync with GitHub"
                            description="Manage your tasks efficiently with Ork8stra's bidirectional GitHub synchronization. Full visibility into issues, PRs, and deployment states."
                            side="right"
                            mockup={
                                <div className="w-full aspect-video glass-card rounded-3xl p-6 relative overflow-hidden intense-glow" style={{ '--glow-color': 'rgba(249, 115, 22, 0.15)' } as any}>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-github flex items-center justify-center bg-white/10">
                                                <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                            </div>
                                            <span className="text-xs font-bold text-white/60 tracking-widest">GITHUB_SYNC</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400">ACTIVE</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'ORK-128', title: 'Optimize Kafka distribution logic', status: 'IN PROGRESS', glow: 'blue' },
                                            { id: 'ORK-129', title: 'Implement bidirectional sync', status: 'REVIEW', glow: 'purple' },
                                            { id: 'ORK-130', title: 'Stabilize telemetry pipelines', status: 'DONE', glow: 'emerald' }
                                        ].map(item => (
                                            <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 group hover:border-white/20 transition-all">
                                                <div className="flex gap-4 items-center">
                                                    <span className="text-[10px] font-black text-white/30">{item.id}</span>
                                                    <span className="text-xs font-medium text-white/80">{item.title}</span>
                                                </div>
                                                <div className={`px-2 py-0.5 rounded-full bg-${item.glow}-500/10 text-[8px] font-bold`}>{item.status}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-orange-500/10 blur-[60px]" />
                                </div>
                            }
                        />

                <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center bento-card p-16 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 group overflow-hidden relative">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-6">
                            <Terminal className="w-6 h-6 text-slate-400" />
                            <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Documentation & CLI</span>
                        </div>
                        <h3 className="text-3xl font-bold mb-6">Built for CLI integration.</h3>
                        <p className="text-slate-400 leading-relaxed mb-8 lowercase tracking-tight">
                            Manage your entire infrastructure from the terminal. Use `ork-ctl` 
                            to provision clusters, tail logs across multiple nodes, and 
                            trigger builds without leaving your IDE.
                        </p>
                        <div className="flex gap-4">
                            <Link to="/docs" className="inline-flex items-center gap-2 text-blue-400 font-bold hover:text-blue-300 transition-colors">
                                Browse the Docs <ArrowRight size={16} className="ml-1" />
                            </Link>
                            <span className="px-3 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-tight flex items-center">
                                Upcoming v2.1
                            </span>
                        </div>
                    </div>
                    <div className="relative h-72 bg-black/40 rounded-xl border border-white/5 p-6 font-mono text-[11px] text-blue-400/80 overflow-hidden group-hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center gap-2 mb-4 opacity-40">
                            <div className="w-2 h-2 rounded-full bg-red-500/50" />
                            <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                            <div className="w-2 h-2 rounded-full bg-green-500/50" />
                            <span className="ml-2">ork-ctl — 80×24</span>
                        </div>
                        <div className="space-y-1">
                            <div>$ ork-ctl deploy auth-service</div>
                            <div className="text-slate-500">→ Analysing project context...</div>
                            <div className="text-slate-500">→ Packaging build context (12.4MiB)...</div>
                            <div className="text-emerald-500">✓ Build successfully pushed to registry</div>
                            <div className="text-blue-400 animate-pulse">⠏ Rolling out to primary-cluster...</div>
                        </div>
                    </div>
                </div>

                    </div>
                </div>
            </section>

            {/* THE CLI: COMMAND THE FUTURE */}
            <section className="py-40 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="text-[4vw] font-black mb-20 tracking-[-0.06em] leading-[0.75] selection:bg-white selection:text-black">
                        Command the <br /><span className="text-white/50">Future.</span>
                    </h2>
                    <Link to="/register" className="group relative px-20 py-10 bg-white text-black font-black text-4xl overflow-hidden inline-block transition-transform hover:scale-105 active:scale-95 shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                        <span className="relative z-10 uppercase tracking-tighter">Enter the Platform</span>
                        <motion.div 
                            className="absolute inset-0 bg-blue-600 z-0"
                            initial={{ y: '101%' }}
                            whileHover={{ y: '0%' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </Link>
                </motion.div>
            </section>

            {/* Premium Elite Footer */}
            <footer className="relative mt-20 border-t border-white/5 bg-[#020202]/60 backdrop-blur-2xl overflow-hidden">
                {/* Subtle Background Grid Pattern */}
                <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" 
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />

                <div className="max-w-[1400px] mx-auto px-10 py-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 items-start">
                        
                        {/* Brand Column */}
                        <div className="space-y-12 col-span-1 lg:col-span-1">
                            <div className="flex items-center gap-4 group cursor-pointer">
                                <Ork8straLogo className="w-12 h-12" />
                                <h4 className="text-white font-black text-4xl tracking-tighter">ork8stra</h4>
                            </div>
                            <p className="text-slate-500 max-w-xs text-sm font-medium leading-relaxed lowercase tracking-tight">
                                The definitive infrastructure engine for modern engineering teams. 
                                Absolute control over the entire software lifecycle.
                            </p>
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                                    <svg className="w-5 h-5 fill-slate-400 group-hover:fill-white" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.041-1.416-4.041-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                                </div>
                                <div className="p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer">
                                    <svg className="w-5 h-5 fill-slate-400 group-hover:fill-white" viewBox="0 0 24 24"><path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.84 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/></svg>
                                </div>
                            </div>
                        </div>

                        {/* Product Columns */}
                        <div className="space-y-10">
                            <h5 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40">System</h5>
                            <ul className="space-y-6 text-sm font-medium text-slate-500">
                                <li><Link to="#" className="hover:text-white transition-colors">Core Engine</Link></li>
                                <li><Link to="#" className="hover:text-white transition-colors">Benchmarks</Link></li>
                                <li><Link to="#" className="hover:text-white transition-colors">Edge Network</Link></li>
                                <li><Link to="#" className="hover:text-white transition-colors">Infrastructure Specs</Link></li>
                            </ul>
                        </div>

                        <div className="space-y-10">
                            <h5 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40">Knowledge</h5>
                            <ul className="space-y-6 text-sm font-medium text-slate-500">
                                <li><Link to="#" className="hover:text-white transition-colors">Documentation</Link></li>
                                <li><Link to="#" className="hover:text-white transition-colors">API Reference</Link></li>
                                <li><Link to="#" className="hover:text-white transition-colors">CLI Manual</Link></li>
                                <li><Link to="#" className="hover:text-white transition-colors">Release Notes</Link></li>
                            </ul>
                        </div>

                        {/* Status Column */}
                        <div className="space-y-12">
                            <div className="space-y-4">
                                <h5 className="text-white text-xs font-black uppercase tracking-[0.3em] opacity-40">Operational Status</h5>
                                <motion.div 
                                    className="flex items-center gap-4 px-6 py-4 bg-white/[0.03] border border-white/10 rounded-2xl group cursor-pointer hover:border-emerald-500/30 transition-colors"
                                    whileHover={{ scale: 1.02 }}
                                >
                                    <div className="relative">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                                        <div className="absolute inset-0 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-40" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-none mb-1">Functional</span>
                                        <span className="text-xs font-bold text-white/60">Global Ops Nominal</span>
                                    </div>
                                </motion.div>
                            </div>
                            
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-white/5 space-y-4">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Newsletter</span>
                                <div className="flex gap-2">
                                    <input type="text" placeholder="engineering@org.com" className="bg-transparent border-b border-white/10 text-xs py-2 flex-1 focus:outline-none focus:border-blue-500 transition-colors" />
                                    <button className="text-xs font-bold text-white hover:text-blue-400 transition-colors">Subscribe</button>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Bottom Bar */}
                    <div className="mt-16 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.5em] text-center md:text-left">
                            © 2026 Ork8stra Platforms Inc. // Pure Infrastructure Intent
                        </div>
                        <div className="flex gap-10 text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
                            <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                            <Link to="#" className="hover:text-white transition-colors">Terms</Link>
                            <Link to="#" className="hover:text-white transition-colors">Security</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function StepSection({ title, description, side, mockup }: { title: string, description: string, side: 'left' | 'right' | 'center', mockup: React.ReactNode }) {
    if (side === 'center') {
        return (
            <div className="flex flex-col items-center gap-24">
                <motion.div 
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-100px" }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="max-w-4xl w-full"
                >
                    {mockup}
                </motion.div>
                <div className="text-center max-w-2xl px-6">
                    <h3 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter text-white">{title}</h3>
                    <p className="text-slate-500 text-lg font-medium leading-relaxed lowercase tracking-tight">{description}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-12 lg:gap-0 lg:flex-row lg:justify-between w-full px-6`}>
            <div className={`lg:w-[45%] ${side === 'left' ? 'lg:order-1 lg:text-right' : 'lg:order-2 lg:text-left'} space-y-8 order-2`}>
                <h3 className="text-5xl md:text-6xl font-black tracking-tighter text-white">{title}</h3>
                <p className="text-slate-500 text-lg font-medium leading-relaxed lowercase tracking-tight">
                    {description}
                </p>
                <div className={`flex ${side === 'left' ? 'lg:justify-end' : 'lg:justify-start'}`}>
                    <div className="flex items-center gap-3 text-white font-bold text-sm group cursor-pointer">
                        <span className="border-b border-white/20 pb-0.5 group-hover:border-white transition-colors">Explore Integration Path</span>
                        <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            </div>

            <motion.div 
                initial={{ opacity: 0, x: side === 'left' ? 60 : -60 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: "-100px" }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className={`lg:w-[48%] ${side === 'left' ? 'lg:order-2' : 'lg:order-1'} order-1 w-full`}
            >
                {mockup}
            </motion.div>
        </div>
    );
}
