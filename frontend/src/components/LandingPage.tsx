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
          HERO SECTION: REDUCED TO ESSENTIALS
          --------------------------------------------------------------------------- */}
            <section className="relative pt-64 pb-48 px-6 max-w-[1000px] mx-auto text-center z-10">
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-7xl md:text-9xl font-bold tracking-tight text-white mb-10">
                        Click, click, <span className="text-slate-700">done.</span>
                    </h1>
                </motion.div>

                {/* Simplified Command Palette as a discrete bar */}
                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="max-w-xl mx-auto mb-40"
                >
                    <CommandPalette />
                </motion.div>
            </section>

            {/* ---------------------------------------------------------------------------
          PRO PLATFORM WORKFLOW (RENDER-INSPIRED)
          --------------------------------------------------------------------------- */}
            <section className="relative pb-64 px-6 max-w-[1200px] mx-auto z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-8">
                    
                    {/* STEP 1: DEFINE */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center font-bold text-sm">1</div>
                            <h3 className="text-2xl font-bold">Select a service</h3>
                        </div>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Choose what you need to run your apps, APIs, workers, or scheduled tasks.
                        </p>
                        <div className="p-4 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-1">
                            {[
                                { name: 'Static site', active: false },
                                { name: 'Web service', active: true },
                                { name: 'Private service', active: false },
                                { name: 'Background Worker', active: false },
                                { name: 'Cron Job', active: false }
                            ].map((item) => (
                                <div key={item.name} className={`px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${item.active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:bg-white/5'}`}>
                                    <span className="text-sm font-medium">{item.name}</span>
                                    {item.active && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* STEP 2: DEPLOY */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center font-bold text-sm">2</div>
                            <h3 className="text-2xl font-bold">Deploy your code</h3>
                        </div>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Connect your repository. We build and deploy on the right runtime.
                        </p>
                        <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-6 font-mono text-[11px]">
                             <div className="space-y-3">
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-600 uppercase">Branch</span>
                                    <span className="text-slate-300">main</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-600 uppercase">Build Cmd</span>
                                    <span className="text-slate-300">npm run build</span>
                                </div>
                                <div className="flex justify-between border-b border-white/5 pb-2">
                                    <span className="text-slate-600 uppercase">Start Cmd</span>
                                    <span className="text-slate-300">npm start</span>
                                </div>
                             </div>
                             <div className="w-full h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 font-bold hover:bg-white/10 transition-colors uppercase tracking-widest text-[10px]">
                                Manual Deploy
                             </div>
                        </div>
                    </div>

                    {/* STEP 3: DONE */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-md bg-purple-600 flex items-center justify-center font-bold text-sm">3</div>
                            <h3 className="text-2xl font-bold">KubeLite does the rest</h3>
                        </div>
                        <p className="text-slate-500 text-lg leading-relaxed">
                            Instant networking, scaling, previews, and zero-downtime rollouts.
                        </p>
                        <div className="p-6 bg-[#0A0A0A] rounded-xl border border-white/5 space-y-4">
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-4 items-center">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-white uppercase mb-1 tracking-tighter">Automatic Deploy live</div>
                                    <div className="text-[9px] text-slate-600 font-mono">1:20:58 PM - Success</div>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-white/5 border border-white/5 flex gap-4 items-center animate-pulse">
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <div className="flex-1">
                                    <div className="text-[10px] font-bold text-white uppercase mb-1 tracking-tighter">Preview Env: FE-Fix</div>
                                    <div className="text-[9px] text-slate-600 font-mono">Building...</div>
                                </div>
                            </div>
                            <div className="pt-4 text-center">
                                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest cursor-pointer hover:underline underline-offset-4">View live site ↗</span>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            {/* FINAL CTA: THE "CLICK" */}
            <section className="py-64 px-6 text-center border-t border-white/5">
                <h2 className="text-6xl font-bold mb-12 tracking-tight">Ready? <br />It only takes a click.</h2>
                <Link to="/register" className="px-16 py-6 rounded-2xl bg-white text-black font-black text-xl hover:scale-105 transition-transform inline-block">
                    Start a New Service
                </Link>
            </section>

            {/* Minimal Footer */}
            <footer className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 font-medium">
                <div className="flex items-center gap-8 text-sm text-slate-500">
                    <span>© 2026 KubeLite Inc.</span>
                    <Link to="#" className="hover:text-white transition-colors">Safety</Link>
                    <Link to="#" className="hover:text-white transition-colors">Privacy</Link>
                </div>
                <div className="flex items-center gap-12 text-sm">
                    <Link to="#" className="hover:text-white transition-colors">YouTube</Link>
                    <Link to="#" className="hover:text-white transition-colors">X / Twitter</Link>
                    <Link to="#" className="hover:text-white transition-colors">GitHub</Link>
                    <Link to="#" className="text-slate-400 hover:text-white transition-colors">System Status</Link>
                </div>
            </footer>
        </div>
    );
}
