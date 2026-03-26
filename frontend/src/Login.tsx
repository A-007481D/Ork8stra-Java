import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Github, Loader2, Command, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import Ork8straLogo from "./components/Ork8straLogo";

export default function Login() {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("");
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

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch("/api/v1/auth/login", {
                method: "POST",
                body: JSON.stringify({ username, password }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const data = await res.json();
                localStorage.setItem("token", data.accessToken);
                localStorage.setItem("user", JSON.stringify({ username: data.username || username }));
                window.location.href = "/dashboard";
            } else {
                setError("Invalid email or password");
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
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Brand Top */}
                <Link to="/" className="flex items-center gap-4 z-10 w-fit group hover:opacity-80 transition-opacity">
                    <Ork8straLogo className="w-10 h-10" />
                    <span className="text-2xl font-black tracking-tighter text-white">
                        ork8stra
                    </span>
                </Link>

                {/* Quote/Testimonial Middle */}
                <div className="relative z-10 max-w-md">
                    <div className="mb-6 opacity-50">
                        <Command className="w-10 h-10" />
                    </div>
                    <blockquote className="text-2xl font-black leading-[1.1] tracking-[-0.04em] mb-10 text-white selection:bg-blue-600">
                        "Ork8stra completely removed the friction from our deployment pipeline. It feels like cheating."
                    </blockquote>
                    <div className="flex items-center gap-4">
                        {/* <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black">SJ</div> */}
                        <div>
                            <div className="font-black text-white uppercase tracking-widest text-xs">Sarah Jenkins</div>
                            <div className="text-slate-500 text-[10px] font-bold  tracking-widest">Principal Engineer, Acme Corp</div>
                        </div>
                    </div>
                </div>

                {/* Status Bottom */}
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Systems Operational</span>
                </div>
            </motion.div>


            {/* RIGHT SIDE: LOGIN FORM */}
            <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                className="w-full lg:w-1/2 flex items-center justify-center p-20 relative"
            >
                <div className="w-full max-w-sm space-y-12">

                    <div className="text-center space-y-2">
                        <h1 className="text-5xl font-black tracking-[-0.05em] text-white">Welcome back</h1>
                        <p className="text-slate-500 text-sm font-medium lowercase tracking-tight">Enter your credentials to access the engine.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleGithubLogin}
                            className="w-full bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 text-white font-black text-xs uppercase tracking-widest py-4 rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 backdrop-blur-xl"
                        >
                            <Github className="w-4 h-4" />
                            Continue with GitHub
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5" /></div>
                            <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.2em]"><span className="bg-[#050505] px-4 text-slate-700">Or continue with email</span></div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Username</label>
                                    <input
                                        type="text"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-800 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all backdrop-blur-sm"
                                        placeholder="johndoe"
                                        required
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2 px-1">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                                        <a href="#" className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest transition-colors">Forgot?</a>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3.5 text-white text-sm placeholder:text-slate-800 focus:outline-none focus:border-blue-500/50 focus:bg-white/[0.04] transition-all backdrop-blur-sm"
                                        placeholder="••••••••"
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
                                type="submit"
                                className="w-full bg-white text-black font-black text-xs uppercase tracking-[0.2em] py-4 rounded-xl hover:bg-blue-50 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Initiate Session"}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-800">
                        No engine access? <Link to="/register" className="text-blue-500 hover:text-white transition-colors ml-2">Register Identity</Link>
                    </p>

                </div>
            </motion.div>

        </div>
    );
}
