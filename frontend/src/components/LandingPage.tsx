import React, { useRef } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
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
            <section className="relative py-32 lg:py-64 px-6 z-10">
                <div className="max-w-[1400px] mx-auto flex flex-col items-center">
                    
                    {/* The Path Stream (Reactive SVG) */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/5 pointer-events-none overflow-hidden">
                        <motion.div 
                            style={{ scaleY }}
                            className="absolute top-0 left-0 right-0 origin-top bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500 shadow-[0_0_20px_rgba(59,130,246,0.3)] h-full"
                        />
                    </div>

                    <div className="space-y-[60vh] lg:space-y-[80vh] w-full">
                        
                        {/* Point 1: Integrate (The Terminal) */}
                        <StepSection
                            title="Integrate"
                            description="Connect your repository. We monitor intent, not just diffs. Instant recognition of builds, runtimes, and dependencies."
                            side="left"
                            mockup={
                                <div className="w-full aspect-video bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/5 p-4 md:p-6 font-mono text-[10px] md:text-xs text-slate-400 overflow-hidden relative shadow-2xl">
                                    <div className="flex gap-1.5 mb-6">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20" />
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/20" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <span className="text-emerald-500">➜</span>
                                            <span className="text-blue-400 font-bold">~</span>
                                            <span>git push kubelite main</span>
                                        </div>
                                        <div className="text-slate-600">Enumerating objects: 102, done.</div>
                                        <div className="text-slate-600">Counting objects: 100% (102/102), done.</div>
                                        <div className="flex gap-2">
                                            <span className="text-purple-400">kubelite</span>
                                            <span className="text-slate-300 animate-pulse">Detecting runtime: Node.js (v20)</span>
                                        </div>
                                        <div className="text-slate-500 mt-4 opacity-50 italic">// initializing platform connection...</div>
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none" />
                                </div>
                            }
                        />

                        {/* Point 2: Build (The Crystal) */}
                        <StepSection
                            title="Build"
                            description="Infrastructure at a molecular level. We package your source into optimized, immutable image layers ready for global distribution."
                            side="right"
                            mockup={
                                <div className="w-full aspect-square md:aspect-video bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/5 flex items-center justify-center relative overflow-hidden group shadow-2xl">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_70%)]" />
                                    <div className="relative w-24 h-24 md:w-32 md:h-32">
                                        <motion.div 
                                            animate={{ rotate: 360 }}
                                            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                                            className="absolute inset-0 border border-purple-500/30 rounded-3xl"
                                        />
                                        <motion.div 
                                            animate={{ rotate: -360 }}
                                            transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
                                            className="absolute inset-2 border border-blue-500/20 rounded-2xl"
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-8 h-8 md:w-12 md:h-12 bg-white rounded flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.4)]">
                                                <div className="w-4 h-4 md:w-6 md:h-6 bg-black rounded-sm animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-6 left-6 right-6 flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-700">
                                        <span>Layer 04 // Optimized</span>
                                        <span>99.2% Reduced</span>
                                    </div>
                                </div>
                            }
                        />

                        {/* Point 3: Deploy (The Global Map) */}
                        <StepSection
                            title="Deploy"
                            description="Production is a state of being, not a destination. Your apps live on the edge, responding with sub-millisecond latency worldwide."
                            side="center"
                            mockup={
                                <div className="w-full aspect-video bg-black/40 backdrop-blur-3xl rounded-2xl border border-white/5 p-8 relative overflow-hidden shadow-2xl">
                                    <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />
                                    <div className="flex flex-col items-center justify-center h-full relative z-10">
                                        <div className="relative w-full h-full max-w-sm">
                                            {[
                                                { t: '15%', l: '20%' }, { t: '40%', l: '10%' }, 
                                                { t: '25%', l: '70%' }, { t: '60%', l: '85%' },
                                                { t: '75%', l: '30%' }
                                            ].map((pos, i) => (
                                                <motion.div 
                                                    key={i}
                                                    initial={{ scale: 0, opacity: 0 }}
                                                    animate={{ scale: [1, 2], opacity: [0.8, 0] }}
                                                    transition={{ repeat: Infinity, duration: 2, delay: i * 0.4 }}
                                                    className="absolute w-4 h-4 bg-emerald-500/20 rounded-full"
                                                    style={{ top: pos.t, left: pos.l }}
                                                />
                                            ))}
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <div className="text-5xl md:text-7xl font-black text-emerald-500 tracking-tighter mb-2">99.9</div>
                                                    <div className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em]">Uptime Confidence</div>
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
            <section className="py-64 px-6 text-center border-t border-white/5">
                <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-[10vw] font-black mb-16 tracking-tighter leading-[0.8] selection:bg-white selection:text-black"
                >
                    Master the <br /><span className="text-slate-900 border-b-8 border-slate-900 pb-2">lifecycle.</span>
                </motion.h2>
                <Link to="/register" className="group relative px-24 py-10 bg-white text-black font-black text-3xl overflow-hidden inline-block transition-transform hover:scale-105 active:scale-95 shadow-2xl">
                    <span className="relative z-10 uppercase tracking-tighter">Deploy Now</span>
                    <motion.div 
                        className="absolute inset-0 bg-slate-200 z-0"
                        initial={{ x: '-101%' }}
                        whileHover={{ x: '0%' }}
                        transition={{ duration: 0.3, ease: 'circOut' }}
                    />
                </Link>
            </section>

            {/* Elite Footer */}
            <footer className="py-40 px-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-24 max-w-[1400px] mx-auto">
                <div className="space-y-6 text-center md:text-left">
                    <h4 className="text-white font-black text-4xl tracking-tighter">KubeLite</h4>
                    <p className="text-slate-800 max-w-sm text-[10px] font-black uppercase tracking-[0.2em] leading-relaxed">
                        Automating the world's most sophisticated infrastructure, <br />one command at a time.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-32">
                    <div className="space-y-8">
                        <div className="text-slate-900 text-[11px] font-black uppercase tracking-widest">Engine</div>
                        <div className="flex flex-col gap-5 text-sm font-bold text-slate-600">
                            <Link to="#" className="hover:text-white transition-colors">Insights</Link>
                            <Link to="#" className="hover:text-white transition-colors">Pricing</Link>
                            <Link to="#" className="hover:text-white transition-colors">Docs</Link>
                        </div>
                    </div>
                    <div className="space-y-8">
                        <div className="text-slate-900 text-[11px] font-black uppercase tracking-widest">Connect</div>
                        <div className="flex flex-col gap-5 text-sm font-bold text-slate-600">
                            <Link to="#" className="hover:text-white transition-colors">YouTube</Link>
                            <Link to="#" className="hover:text-white transition-colors">X / Twitter</Link>
                            <Link to="#" className="hover:text-white transition-colors">GitHub</Link>
                        </div>
                    </div>
                    <div className="space-y-8 hidden lg:block">
                        <div className="text-slate-900 text-[11px] font-black uppercase tracking-widest">Network</div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/5 rounded-full border border-emerald-500/10">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-500/80 uppercase">All Nodes Operational</span>
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
            <div className="flex flex-col items-center gap-20">
                <motion.div 
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-100px" }}
                    className="max-w-2xl w-full"
                >
                    {mockup}
                </motion.div>
                <div className="text-center max-w-xl">
                    <h3 className="text-7xl font-black mb-6 tracking-tighter">{title}</h3>
                    <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed lowercase">{description}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center gap-12 lg:gap-0 lg:flex-row lg:justify-between w-full`}>
            <div className={`lg:w-[45%] ${side === 'left' ? 'lg:order-1 lg:text-right' : 'lg:order-2 lg:text-left'} space-y-6 order-2`}>
                <h3 className="text-7xl font-black tracking-tighter text-white">{title}</h3>
                <p className="text-slate-500 text-lg md:text-xl font-medium leading-relaxed lowercase">
                    {description}
                </p>
            </div>

            <motion.div 
                initial={{ opacity: 0, x: side === 'left' ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ margin: "-100px" }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className={`lg:w-[45%] ${side === 'left' ? 'lg:order-2' : 'lg:order-1'} order-1 w-full`}
            >
                {mockup}
            </motion.div>
        </div>
    );
}
