import React, { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import CommandPalette from "./CommandPalette";
import Navbar from "./Navbar";

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

            {/* ---------------------------------------------------------------------------
          HERO: THE COMMAND SOURCE
          --------------------------------------------------------------------------- */}
            <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.03)_0%,transparent_70%)]" />
                </div>

                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                    className="z-10 text-center mb-16"
                >
                    <h1 className="text-8xl md:text-[8rem] xl:text-[11rem] font-black tracking-tighter leading-[0.85] mb-8 selection:bg-white selection:text-black">
                        Infrastructure <br /><span className="text-slate-900">unbound.</span>
                    </h1>
                    <p className="text-slate-500 text-lg md:text-2xl font-medium tracking-tight max-w-2xl mx-auto px-4 lowercase">
                        The definitive engine for high-density applications. 
                        One command, limitless orchestration.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="z-10 w-full max-w-2xl px-4"
                >
                    <CommandPalette />
                </motion.div>

                {/* The Scroll Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ delay: 1, duration: 2 }}
                    className="absolute bottom-12 flex flex-col items-center gap-4 text-[9px] font-black uppercase tracking-[0.4em] text-slate-800"
                >
                    <span>Scroll to Unfold</span>
                    <div className="w-[1px] h-16 bg-gradient-to-b from-slate-900 to-transparent" />
                </motion.div>
            </section>

            {/* ---------------------------------------------------------------------------
          THE STREAM: ORGANIC WORKFLOW VISUALIZATION
          --------------------------------------------------------------------------- */}
            <section className="relative py-48 lg:py-80 px-6 z-10">
                <div className="max-w-[1400px] mx-auto flex flex-col items-center">
                    
                    {/* The Path Stream (Reactive SVG) */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/5 pointer-events-none overflow-hidden">
                        <motion.div 
                            style={{ scaleY }}
                            className="absolute top-0 left-0 right-0 origin-top bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 shadow-[0_0_40px_rgba(59,130,246,0.2)] h-full"
                        />
                    </div>

                    <div className="space-y-[80vh] w-full">
                        
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

                        {/* Point 3: Deploy (The Global Map) */}
                        <StepSection
                            title="Distribute"
                            description="Production is a state of being, not a destination. Your apps live on the edge, responding with sub-millisecond latency worldwide."
                            side="center"
                            mockup={
                                <div className="w-full aspect-video glass-card rounded-[40px] p-12 relative overflow-hidden intense-glow" style={{ '--glow-color': 'rgba(16, 185, 129, 0.15)' } as any}>
                                    <div className="flex flex-col items-center justify-center h-full relative z-10">
                                        <div className="relative w-full h-full max-w-md">
                                            {[
                                                { t: '10%', l: '15%' }, { t: '50%', l: '5%' }, 
                                                { t: '15%', l: '75%' }, { t: '70%', l: '90%' },
                                                { t: '80%', l: '25%' }
                                            ].map((pos, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
                                                    transition={{ repeat: Infinity, duration: 3, delay: i * 0.6 }}
                                                    className="absolute w-6 h-6 bg-emerald-500/10 rounded-full border border-emerald-500/20"
                                                    style={{ top: pos.t, left: pos.l }}
                                                />
                                            ))}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600/20 tracking-tighter mb-4">99.9</div>
                                                    <div className="text-[12px] font-bold text-slate-500 uppercase tracking-[0.4em]">Global Uptime Assurance</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            }
                        />

                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------------------
          THE CLI: COMMAND THE FUTURE
          --------------------------------------------------------------------------- */}
            <section className="py-80 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="max-w-4xl mx-auto"
                >
                    <h2 className="text-[12vw] font-black mb-20 tracking-[-0.06em] leading-[0.75] selection:bg-white selection:text-black">
                        Command the <br /><span className="text-white/10">Future.</span>
                    </h2>
                    <Link to="/register" className="group relative px-20 py-10 bg-white text-black font-black text-4xl overflow-hidden inline-block transition-transform hover:scale-105 active:scale-95 shadow-[0_0_80px_rgba(255,255,255,0.1)]">
                        <span className="relative z-10 uppercase tracking-tighter">Enter the Engine</span>
                        <motion.div 
                            className="absolute inset-0 bg-blue-600 z-0"
                            initial={{ y: '101%' }}
                            whileHover={{ y: '0%' }}
                            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        />
                    </Link>
                </motion.div>
            </section>

            {/* Elite Footer */}
            <footer className="py-60 px-6 border-t border-white/5 flex flex-col items-center gap-32 max-w-[1400px] mx-auto">
                <div className="w-full flex flex-col md:flex-row justify-between items-start gap-24">
                    <div className="space-y-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-2xl shadow-2xl">O</div>
                            <h4 className="text-white font-black text-5xl tracking-tighter">ork8stra</h4>
                        </div>
                        <p className="text-slate-500 max-w-sm text-sm font-medium leading-relaxed lowercase">
                            The definitive platform for engineering teams who demand absolute control over their infrastructure lifecycle.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-24 lg:gap-40">
                        <div className="space-y-10">
                            <div className="text-white text-xs font-bold uppercase tracking-[0.3em]">Engine</div>
                            <div className="flex flex-col gap-6 text-sm font-medium text-slate-500">
                                <Link to="#" className="hover:text-white transition-colors">Architecture</Link>
                                <Link to="#" className="hover:text-white transition-colors">Benchmarks</Link>
                                <Link to="#" className="hover:text-white transition-colors">Edge Network</Link>
                            </div>
                        </div>
                        <div className="space-y-10">
                            <div className="text-white text-xs font-bold uppercase tracking-[0.3em]">Resources</div>
                            <div className="flex flex-col gap-6 text-sm font-medium text-slate-500">
                                <Link to="#" className="hover:text-white transition-colors">Documentation</Link>
                                <Link to="#" className="hover:text-white transition-colors">API Reference</Link>
                                <Link to="#" className="hover:text-white transition-colors">Community</Link>
                            </div>
                        </div>
                        <div className="space-y-10 hidden lg:block">
                            <div className="text-white text-xs font-bold uppercase tracking-[0.3em]">Status</div>
                            <div className="flex items-center gap-3 px-5 py-3 glass rounded-full ring-1 ring-emerald-500/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Global Ops Nominal</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="text-[10px] font-bold text-slate-800 uppercase tracking-[0.8em] text-center w-full pt-20 border-t border-white/5">
                    © 2026 Ork8stra Platforms Inc. // Pure Infrastructure Intent
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
                    <h3 className="text-6xl md:text-8xl font-black mb-10 tracking-tighter text-white">{title}</h3>
                    <p className="text-slate-500 text-xl font-medium leading-relaxed lowercase tracking-tight">{description}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-16 lg:gap-0 lg:flex-row lg:justify-between w-full px-6`}>
            <div className={`lg:w-[42%] ${side === 'left' ? 'lg:order-1 lg:text-right' : 'lg:order-2 lg:text-left'} space-y-10 order-2`}>
                <h3 className="text-6xl md:text-8xl font-black tracking-tighter text-white">{title}</h3>
                <p className="text-slate-500 text-xl font-medium leading-relaxed lowercase tracking-tight">
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
