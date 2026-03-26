"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import Ork8straLogo from "./Ork8straLogo";

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <>
            <motion.nav
                initial={{ y: -100 }}
                animate={{ y: 0 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled
                    ? "bg-[#020202]/80 backdrop-blur-xl border-b border-white/5 py-5"
                    : "bg-transparent py-8"
                    }`}
            >
                <div className="max-w-[1400px] mx-auto px-10 h-full flex items-center justify-between">

                    {/* LOGO */}
                    <Link to="/" className="flex items-center cursor-pointer group gap-4">
                        <Ork8straLogo className="w-10 h-10" />
                        <span className="text-white font-black text-2xl tracking-tighter">Ork8stra</span>
                    </Link>

                    {/* DESKTOP LINKS */}
                    <div className="hidden md:flex items-center gap-12">
                        <NavLink text="Features" />
                        <NavLink text="Documentation" />
                        <NavLink text="GitHub" />
                    </div>

                    {/* ACTIONS */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link to="/login" className="text-xs font-bold uppercase tracking-widest text-slate-500 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link to="/register" className="px-8 py-3.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-2xl">
                            Get Started
                        </Link>
                    </div>

                    {/* MOBILE TOGGLE */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden text-white"
                    >
                        {mobileMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </motion.nav>

            {/* MOBILE MENU */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="fixed top-[70px] left-0 ring-0 w-full bg-[#0F172A] border-b border-white/10 z-40 overflow-hidden md:hidden"
                    >
                        <div className="flex flex-col p-6 gap-4">
                            <a href="#" className="text-lg text-slate-300 font-medium">Products</a>
                            <a href="#" className="text-lg text-slate-300 font-medium">Solutions</a>
                            <a href="#" className="text-lg text-slate-300 font-medium">Documentation</a>
                            <a href="#" className="text-lg text-slate-300 font-medium">Pricing</a>
                            <div className="h-px bg-white/10 my-2" />
                            <button className="w-full py-3 rounded-lg bg-white/5 border border-white/10 text-white font-medium">
                                Sign In
                            </button>
                            <button className="w-full py-3 rounded-lg bg-blue-600 text-white font-medium">
                                Get Started
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function NavLink({ text, hasDropdown }: { text: string; hasDropdown?: boolean }) {
    return (
        <div className="relative group cursor-pointer flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">
                {text}
            </span>
            {hasDropdown && (
                <ChevronDown className="w-3 h-3 text-slate-700 group-hover:text-white transition-colors" />
            )}
        </div>
    );
}
