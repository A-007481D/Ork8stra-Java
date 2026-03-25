"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

const LandingHero = () => {
    return (
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">

            {/* Huly style Radiant Light Beam */}
            <div className="absolute inset-0 z-0 flex justify-center pointer-events-none">
                <div className="relative w-full h-full flex justify-center">
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 0.8, height: "100%" }}
                        transition={{ duration: 2, ease: "circOut" }}
                        className="light-beam" 
                    />
                    <div className="beam-glow" />
                </div>
            </div>

            {/* Background Texture */}
            <div className="noise" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="z-10 max-w-6xl relative"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-10 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Infrastructure Reborn
                </div>

                <h1 className="text-8xl md:text-[10rem] font-black tracking-[-0.08em] leading-[0.8] mb-12 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
                    Ork8stra. <br />
                    <span className="text-white/20 italic">Unbound.</span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium lowercase tracking-tight">
                    The definitive engine for high-density architectures. 
                    Deterministic deployment at the absolute edge of performance.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32">
                    <button className="group relative px-10 py-5 rounded-xl bg-white text-black font-bold text-lg hover:scale-105 transition-all shadow-2xl active:scale-95 overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-3">
                            See in Action <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <button className="group px-10 py-5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-xl flex items-center gap-3 hover:border-white/20">
                        <BookOpen size={22} className="text-slate-500 group-hover:text-white transition-colors" />
                        Infrastructure Specs
                    </button>
                </div>

                {/* Floating Mockups: Tracker & Inbox */}
                <div className="relative w-full max-w-5xl mx-auto h-[400px] pointer-events-none mt-20">
                    {/* Tracker Mockup */}
                    <motion.div 
                        initial={{ opacity: 0, x: -100, y: 50 }}
                        whileInView={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className="absolute left-0 top-0 w-2/3 aspect-video glass-card rounded-3xl p-6 border-white/10 intense-glow z-20 overflow-hidden"
                        style={{ '--glow-color': 'rgba(59, 130, 246, 0.2)' } as any}
                    >
                        <div className="flex justify-between mb-8 border-b border-white/5 pb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-white/40">Tracker</span>
                            <div className="flex gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/40" />
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="w-24 h-12 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
                                <div className="flex-1 h-12 bg-white/5 rounded-lg border border-white/5" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5 p-3">
                                        <div className="w-full h-1 bg-blue-500/40 rounded-full mb-3" />
                                        <div className="w-2/3 h-2 bg-white/10 rounded mb-2" />
                                        <div className="w-1/2 h-2 bg-white/5 rounded" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Inbox Mockup */}
                    <motion.div 
                        initial={{ opacity: 0, x: 100, y: 100 }}
                        whileInView={{ opacity: 1, x: 0, y: 50 }}
                        transition={{ duration: 1, delay: 0.8 }}
                        className="absolute right-0 top-0 w-1/3 aspect-[3/4] glass-card rounded-3xl p-6 border-white/10 intense-glow z-30 overflow-hidden"
                        style={{ '--glow-color': 'rgba(168, 85, 247, 0.2)' } as any}
                    >
                        <div className="mb-6 border-b border-white/5 pb-4">
                            <span className="text-xs font-black uppercase tracking-widest text-white/40">Inbox</span>
                        </div>
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex gap-3 items-center">
                                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/10" />
                                    <div className="flex-1 space-y-1">
                                        <div className="w-2/3 h-1.5 bg-white/20 rounded" />
                                        <div className="w-full h-1 bg-white/5 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
};

export default LandingHero;
