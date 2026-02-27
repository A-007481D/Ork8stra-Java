import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Github, CheckCircle2, Loader2, Command } from "lucide-react";

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

            {/* ---------------------------------------------------------------------------
          LEFT SIDE: VISUAL & BRANDING
         --------------------------------------------------------------------------- */}
            <div className="hidden lg:flex w-1/2 bg-[#0B0C10] border-r border-white/5 flex-col justify-between p-12 relative overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Brand Top */}
                <Link to="/" className="flex items-center gap-2 z-10 w-fit hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                        O
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        ork8stra
                    </span>
                </Link>

                {/* Quote/Testimonial Middle */}
                <div className="relative z-10 max-w-md">
                    <div className="mb-6 opacity-50">
                        <Command className="w-10 h-10" />
                    </div>
                    <blockquote className="text-2xl font-medium leading-relaxed tracking-tight mb-6 text-slate-200">
                        "Ork8stra completely removed the friction from our deployment pipeline. It feels like cheating."
                    </blockquote>
                    <div>
                        <div className="font-bold text-white">Sarah Jenkins</div>
                        <div className="text-slate-500">Principal Engineer, Acme Corp</div>
                    </div>
                </div>

                {/* Status Bottom */}
                <div className="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full w-fit border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Systems Operational</span>
                </div>
            </div>


            {/* ---------------------------------------------------------------------------
          RIGHT SIDE: LOGIN FORM
         --------------------------------------------------------------------------- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">

                <div className="w-full max-w-sm space-y-8">

                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
                        <p className="text-slate-400">Enter your credentials to access the flight deck.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleGithubLogin}
                            className="w-full bg-[#1A1C20] hover:bg-[#22242A] border border-white/10 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <Github className="w-5 h-5" />
                            Continue with GitHub
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#050505] px-2 text-slate-500">Or continue with email</span></div>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-[#0D0E12] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="johndoe"
                                    required
                                />
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="block text-sm font-medium text-slate-400">Password</label>
                                    <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</a>
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0D0E12] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-500 text-xs font-medium text-center">
                                    {error}
                                </div>
                            )}

                            <button
                                disabled={loading}
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-slate-500">
                        Don't have an account? <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors">Sign up</Link>
                    </p>

                </div>
            </div>

        </div>
    );
}
