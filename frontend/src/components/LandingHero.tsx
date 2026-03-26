"use client";

import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import DashboardPreview from "./DashboardPreview";

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
                className="z-10 max-w-7xl relative w-full pt-44 pb-20"
            >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-32">
                    <div className="text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-10 backdrop-blur-sm">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Infrastructure Reborn
                        </div>

                        <h1 className="text-6xl md:text-8xl font-black tracking-[-0.08em] leading-[0.9] mb-8 bg-gradient-to-b from-white via-white to-white/30 bg-clip-text text-transparent">
                            Ork8stra. <br />
                            <span className="text-white/20 italic font-medium">Unbound.</span>
                        </h1>

                        <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-xl leading-relaxed font-medium lowercase tracking-tight">
                            The definitive engine for high-density architectures. 
                            Deterministic deployment at the absolute edge of performance.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button className="group relative px-8 py-4 rounded-xl bg-white text-black font-bold text-base hover:scale-105 transition-all shadow-2xl active:scale-95 overflow-hidden w-full sm:w-auto text-center">
                                <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                                <span className="relative flex items-center justify-center gap-3">
                                    Initialize Ork8stra <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </button>
                            <button className="group px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all backdrop-blur-xl flex items-center justify-center gap-3 hover:border-white/20 w-full sm:w-auto">
                                <BookOpen size={20} className="text-slate-500 group-hover:text-white transition-colors" />
                                View Documentation
                            </button>
                        </div>
                    </div>

                    <div className="relative hidden lg:block">
                        <div className="absolute inset-0 bg-blue-500/10 blur-[100px] rounded-full" />
                        <div className="relative z-10 scale-110 translate-x-10">
                            <DashboardPreview />
                        </div>
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-white/5 bg-white/[0.01] rounded-2xl backdrop-blur-sm">
                    <QuickMetric label="Build Latency" value="< 1.2s" subValue="Kaniko-native" />
                    <QuickMetric label="Cluster Overhead" value="< 0.8%" subValue="Ultra-light" />
                    <QuickMetric label="Max Deployments" value="Unlimited" subValue="Self-managed" />
                    <QuickMetric label="System Availability" value="99.9%" subValue="High-availability" />
                </div>
            </motion.div>
        </section>
    );
};

const QuickMetric = ({ label, value, subValue }: { label: string, value: string, subValue: string }) => (
    <div className="flex flex-col items-center text-center">
        <span className="text-slate-600 text-[9px] font-black uppercase tracking-[0.2em] mb-3">{label}</span>
        <span className="text-3xl font-bold text-white tracking-tighter mb-1">{value}</span>
        <span className="text-slate-500 text-[10px] font-medium">{subValue}</span>
    </div>
);

export default LandingHero;
