"use client";


import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import CommandPalette from "./CommandPalette";
import Navbar from "./Navbar";

export default function LandingPage() {
    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
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
                    <h1 className="text-8xl md:text-[10rem] font-black tracking-tight leading-none mb-4 selection:bg-white selection:text-black">
                        Infrastructure <span className="text-slate-800">unbound.</span>
                    </h1>
                    <p className="text-slate-600 text-xl font-medium tracking-tight">One command, infinite scale.</p>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.98, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 1 }}
                    className="z-10 w-full max-w-2xl"
                >
                    <CommandPalette />
                </motion.div>

                {/* The "Unfolding" Indicator */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.4 }}
                    transition={{ delay: 1, duration: 2 }}
                    className="absolute bottom-12 flex flex-col items-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-slate-700"
                >
                    <span>The Stream</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-slate-800 to-transparent" />
                </motion.div>
            </section>

            {/* ---------------------------------------------------------------------------
          THE STREAM: ORGANIC WORKFLOW VISUALIZATION
          --------------------------------------------------------------------------- */}
            <section className="relative py-64 px-6 z-10 bg-[#020202]">
                <div className="max-w-[1200px] mx-auto flex flex-col items-center">
                    
                    {/* The Path Stream (SVG) */}
                    <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-white/5 pointer-events-none overflow-hidden">
                        <motion.div 
                            className="absolute inset-0 bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.5)] h-64 blur-sm"
                            animate={{ top: ['-10%', '110%'] }}
                            transition={{ repeat: Infinity, duration: 6, ease: "linear" }}
                        />
                    </div>

                    <div className="space-y-96 w-full">
                        
                        {/* Point 1: Code */}
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-40"
                        >
                            <div className="lg:w-1/3 text-right order-2 lg:order-1">
                                <h3 className="text-4xl font-bold mb-4">Ingest</h3>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">Connect your repository. We watch for the intent to build, not just the code.</p>
                            </div>
                            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative z-20 order-1 lg:order-2 group">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-white text-xs font-black">REPO</div>
                            </div>
                            <div className="lg:w-1/3 order-3" /> {/* Spacer */}
                        </motion.div>

                        {/* Point 2: Build (Crystal Visualization) */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-40"
                        >
                            <div className="lg:w-1/3 order-1" /> {/* Spacer */}
                            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center relative z-20 group rotate-45">
                                <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="text-white text-[10px] font-black -rotate-45">FORGE</div>
                            </div>
                            <div className="lg:w-1/3 space-y-4 order-2">
                                <h3 className="text-4xl font-bold mb-4">Shimmer</h3>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">Images are packaged securely, optimized for the edge, and ready for instant distribution.</p>
                                <div className="flex gap-2">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                                    ))}
                                </div>
                            </div>
                        </motion.div>

                        {/* Point 3: Live Pulse */}
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            className="flex flex-col items-center gap-12"
                        >
                            <div className="w-32 h-32 rounded-full border border-white/5 flex items-center justify-center relative group">
                                <div className="absolute inset-0 bg-emerald-500/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="w-4 h-4 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_40px_rgba(16,185,129,0.8)]" />
                                <div className="absolute -top-12 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em]">Edge Live</div>
                            </div>
                            <div className="text-center max-w-lg">
                                <h3 className="text-4xl font-bold mb-4">Pulse</h3>
                                <p className="text-slate-500 text-lg leading-relaxed font-medium">Your application is globally reachable. No maintenance. No management. Just uptime.</p>
                            </div>
                        </motion.div>

                    </div>
                </div>
            </section>

            {/* ---------------------------------------------------------------------------
          THE CLI: COMMAND THE FUTURE
          --------------------------------------------------------------------------- */}
            <section className="py-64 px-6 text-center border-t border-white/5 bg-[#010101]">
                <h2 className="text-[5vw] font-black mb-16 tracking-tight leading-[0.9]">Master the <br /><span className="text-slate-800 italic">lifecycle.</span></h2>
                <Link to="/register" className="group relative px-20 py-8 bg-white text-black font-black text-2xl overflow-hidden inline-block transition-transform hover:scale-105 active:scale-95">
                    <span className="relative z-10">Deploy KubeLite</span>
                    <motion.div 
                        className="absolute inset-0 bg-slate-200 z-0"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.4 }}
                    />
                </Link>
            </section>

            {/* Elite Footer */}
            <footer className="py-40 px-6 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-20">
                <div className="space-y-4">
                    <h4 className="text-white font-black text-lg">KubeLite</h4>
                    <p className="text-slate-700 max-w-xs text-xs font-medium uppercase tracking-widest leading-loose">Automating the world's most sophisticated infrastructure, one command at a time.</p>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-24">
                    <div className="space-y-6">
                        <div className="text-slate-800 text-[10px] font-black uppercase tracking-widest">Platform</div>
                        <div className="flex flex-col gap-4 text-sm font-medium text-slate-500">
                            <Link to="#" className="hover:text-white transition-colors">Insights</Link>
                            <Link to="#" className="hover:text-white transition-colors">Pricing</Link>
                            <Link to="#" className="hover:text-white transition-colors">Safety</Link>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div className="text-slate-800 text-[10px] font-black uppercase tracking-widest">Connect</div>
                        <div className="flex flex-col gap-4 text-sm font-medium text-slate-500">
                            <Link to="#" className="hover:text-white transition-colors">YouTube</Link>
                            <Link to="#" className="hover:text-white transition-colors">X / Twitter</Link>
                            <Link to="#" className="hover:text-white transition-colors">GitHub</Link>
                        </div>
                    </div>
                    <div className="space-y-6 hidden lg:block">
                        <div className="text-slate-800 text-[10px] font-black uppercase tracking-widest">Status</div>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span className="text-xs font-bold text-slate-500">All Systems Operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
