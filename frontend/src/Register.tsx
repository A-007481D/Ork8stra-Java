import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Github, CheckCircle2, Loader2 } from "lucide-react";

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

            {/* ---------------------------------------------------------------------------
          LEFT SIDE: VISUAL & BRANDING
         --------------------------------------------------------------------------- */}
            <div className="hidden lg:flex w-1/2 bg-[#0B0C10] border-r border-white/5 flex-col justify-between p-12 relative overflow-hidden">

                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/5 blur-[100px] rounded-full pointer-events-none" />

                {/* Brand Top */}
                <Link to="/" className="flex items-center gap-2 z-10 w-fit hover:opacity-80 transition-opacity">
                    <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                        O
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">
                        ork8stra
                    </span>
                </Link>

                {/* Features Middle */}
                <div className="relative z-10 max-w-md space-y-8">
                    <h2 className="text-3xl font-bold tracking-tight">Join the modern era<br />of infrastructure.</h2>
                    <div className="space-y-4">
                        <FeatureRow text="Unlimited free deployments for hobbyists" />
                        <FeatureRow text="Global edge network included" />
                        <FeatureRow text="Automatic DDoS protection" />
                        <FeatureRow text="Git-based workflows" />
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="text-sm text-slate-500">
                    © 2026 Ork8stra Inc.
                </div>
            </div>


            {/* ---------------------------------------------------------------------------
          RIGHT SIDE: REGISTER FORM
         --------------------------------------------------------------------------- */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative">

                <Link to="/" className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" /> Back to Home
                </Link>

                <div className="w-full max-w-sm space-y-8">

                    <div className="text-center">
                        <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
                        <p className="text-slate-400">Get started with your 14-day Pro trial.</p>
                    </div>

                    <div className="space-y-4">
                        <button
                            type="button"
                            onClick={handleGithubLogin}
                            className="w-full bg-[#1A1C20] hover:bg-[#22242A] border border-white/10 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-3 transition-all active:scale-95"
                        >
                            <Github className="w-5 h-5" />
                            Sign up with GitHub
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-[#050505] px-2 text-slate-500">Or sign up with email</span></div>
                        </div>

                        <form onSubmit={handleRegister} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Username</label>
                                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required className="w-full bg-[#0D0E12] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50" placeholder="johndoe" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Email address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-[#0D0E12] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="engineer@company.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1.5">Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-[#0D0E12] border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                    placeholder="Min. 8 characters"
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
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all shadow-lg shadow-blue-900/20 active:scale-95 flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Account"}
                            </button>
                        </form>
                    </div>

                    <p className="text-center text-sm text-slate-500">
                        Already have an account? <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors">Sign in</Link>
                    </p>

                </div>
            </div>

        </div>
    );
}

function FeatureRow({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 text-slate-300">
            <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <CheckCircle2 className="w-3 h-3" />
            </div>
            <span>{text}</span>
        </div>
    )
}
