"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";

const LandingHero = () => {
    return (
        <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">

            {/* Spotlight Effect */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 bg-grid-white [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
                <motion.div 
                    animate={{ 
                        x: [0, 100, -100, 0],
                        y: [0, -50, 50, 0]
                    }}
                    transition={{ 
                        duration: 20, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-blue-500/10 blur-[120px] rounded-full" 
                />
                <motion.div 
                    animate={{ 
                        x: [0, -150, 150, 0],
                        y: [0, 100, -100, 0]
                    }}
                    transition={{ 
                        duration: 25, 
                        repeat: Infinity, 
                        ease: "linear" 
                    }}
                    className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full" 
                />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="z-10 max-w-6xl"
            >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-10 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                    </span>
                    Infrastructure Reborn
                </div>

                <h1 className="text-8xl md:text-[10rem] font-black tracking-[ -0.08em] leading-[0.8] mb-12 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
                    Ork8stra. <br />
                    <span className="text-white/20 italic">Unbound.</span>
                </h1>

                <p className="text-xl md:text-2xl text-slate-400 mb-16 max-w-3xl mx-auto leading-relaxed font-medium lowercase tracking-tight">
                    The definitive engine for high-density architectures. 
                    Deterministic deployment at the absolute edge of performance.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                    <button className="group relative px-10 py-5 rounded-xl bg-white text-black font-bold text-lg hover:scale-105 transition-all shadow-2xl active:scale-95 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <span className="relative flex items-center gap-3">
                            Initialize Engine <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                    <button className="group px-10 py-5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-xl flex items-center gap-3 hover:border-white/20">
                        <BookOpen size={22} className="text-slate-500 group-hover:text-white transition-colors" />
                        Infrastructure Specs
                    </button>
                </div>
            </motion.div>
        </section>
    );
};

export default LandingHero;
