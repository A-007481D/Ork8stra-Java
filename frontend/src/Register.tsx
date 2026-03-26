import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Github, CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import Ork8straLogo from "./components/Ork8straLogo";

export default function Register() {
    const [loading, setLoading] = useState(false);

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleGithubLogin = async () => {
        try {
            const res = await fetch("/api/v1/auth/github/url");
            if (res.ok) {
                const data = await res.json();
                window.location.href = data.url;
            } else {
                setError("Could not initiate GitHub login.");
            }
        } catch {
            setError("Unable to connect to server");
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/v1/auth/register", {
                method: "POST",
                body: JSON.stringify({ username, email, password }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.accessToken);
                localStorage.setItem("user", JSON.stringify({ username: data.username || username }));
                window.location.href = "/dashboard";
            } else {
                setError("Failed to create account. Please try again.");
            }
        } catch {
            setError("Unable to connect to server");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans flex overflow-hidden">

            {/* LEFT SIDE: VISUAL & BRANDING */}
            <motion.div 
                initial={{ x: -100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="hidden lg:flex w-1/2 bg-[#0B0C10] border-r border-white/5 flex-col justify-between p-20 relative overflow-hidden"
            >

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Brand Top */}
                <Link to="/" className="flex items-center gap-4 z-10 w-fit group hover:opacity-80 transition-opacity">
                    <Ork8straLogo className="w-10 h-10" />
                    <span className="text-2xl font-black tracking-tighter text-white">
                        ork8stra
                    </span>
                </Link>

                {/* Features Middle */}
                <div className="relative z-10 max-w-lg space-y-12">
                    <h2 className="text-5xl font-black leading-[1.1] tracking-[-0.05em] text-white">Join the modern era<br />of infrastructure.</h2>
                    <div className="space-y-6">
                        <FeatureRow text="Unlimited free deployments for hobbyists" />
                        <FeatureRow text="Global edge network included" />
                        <FeatureRow text="Automatic DDoS protection" />
                        <FeatureRow text="Git-based workflows" />
                    </div>
                </div>

                {/* Status Bottom */}
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Systems Operational</span>
                </div>

                {/* Footer Bottom */}
                <div className="text-sm text-slate-500">
                    © 2026 Ork8stra Inc.
                </div>
            </motion.div>


            {/* RIGHT SIDE: REGISTER FORM */}
            <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full lg:w-1/2 flex items-center justify-center p-20 relative"
            >
                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-700 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest">
                    <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>

                <div className="w-full max-w-sm space-y-12">

                    <div className="text-center space-y-2">
                        <h1 className="text-5xl font-black tracking-[-0.05em] text-white">Create an account</h1>
                        <p className="text-slate-500 text-sm font-medium lowercase tracking-tight">Get started with your 14-day Pro trial.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleGithubLogin}
                            className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 backdrop-blur-xl"
                        >
                            <Github className="w-4 h-4" />
                            Sign up with GitHub
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]"><span className="bg-[#050505] px-4 text-slate-700">Or sign up with email</span></div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Username</label>
                                    <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm focus:outline-none focus:border-blue-500/50 backdrop-blur-sm transition-all" placeholder="johndoe" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Email address</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-800 focus:outline-none focus:border-blue-500/50 backdrop-blur-sm transition-all"
                                        placeholder="engineer@company.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-800 focus:outline-none focus:border-blue-500/50 backdrop-blur-sm transition-all"
                                        placeholder="Min. 8 characters"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                className="w-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-blue-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Identity"}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-800">
                        Already authenticated? <Link to="/login" className="text-blue-500 hover:text-white transition-colors ml-2">Resume Session</Link>
                    </p>

                </div>
            </motion.div>

        </div>
    );
}

function FeatureRow({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-4 text-white/50 group cursor-default">
            <div className="w-8 h-8 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-center group-hover:border-blue-500/50 transition-colors">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-sm font-bold uppercase tracking-tight lowercase">{text}</span>
        </div>
    )
}
