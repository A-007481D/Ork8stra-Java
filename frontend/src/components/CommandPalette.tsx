"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Terminal, Zap, Globe, Cpu, ChevronRight } from "lucide-react";

const COMMANDS = [
    { id: "deploy", label: "deploy [app-name]", icon: <Zap className="w-4 h-4 text-blue-400" />, desc: "Roll out a new version" },
    { id: "logs", label: "logs [app-name]", icon: <Terminal className="w-4 h-4 text-slate-400" />, desc: "Tail real-time build logs" },
    { id: "scale", label: "scale [app-name] --replicas 5", icon: <Cpu className="w-4 h-4 text-purple-400" />, desc: "Adjust instance count" },
    { id: "region", label: "region add [region-id]", icon: <Globe className="w-4 h-4 text-emerald-400" />, desc: "Deploy to global edge" },
];

export default function CommandPalette() {
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isFocused, setIsFocused] = useState(false);
    const [output, setOutput] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const filteredCommands = COMMANDS.filter(cmd => 
        cmd.label.toLowerCase().includes(query.toLowerCase())
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
        } else if (e.key === "ArrowUp") {
            setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === "Enter") {
            executeCommand(filteredCommands[selectedIndex]);
        }
    };

    const executeCommand = (cmd: typeof COMMANDS[0]) => {
        if (!cmd) return;
        const timestamp = new Date().toLocaleTimeString([], { hour12: false });
        setOutput(prev => [`[${timestamp}] Executing: ${cmd.label}`, ...prev].slice(0, 3));
        setQuery("");
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className={`relative glass rounded-2xl transition-all duration-300 ${isFocused ? 'ring-2 ring-blue-500/50 shadow-[0_0_50px_-12px_rgba(59,130,246,0.5)]' : 'shadow-2xl'}`}>
                {/* Input Area */}
                <div className="flex items-center gap-4 px-6 h-16 border-b border-white/5">
                    <Search className={`w-5 h-5 transition-colors ${isFocused ? 'text-blue-400' : 'text-slate-500'}`} />
                    <input 
                        ref={inputRef}
                        type="text"
                        placeholder="Type a command or search..."
                        className="flex-1 bg-transparent border-none text-white placeholder-slate-600 outline-none text-lg font-medium"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 border border-white/10 text-[10px] text-slate-500 font-mono">
                        <span className="text-[12px]">⌘</span> K
                    </div>
                </div>

                {/* Suggestions */}
                <AnimatePresence>
                    {(isFocused || query) && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="p-2"
                        >
                            {filteredCommands.map((cmd, idx) => (
                                <div 
                                    key={cmd.id}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                    onClick={() => executeCommand(cmd)}
                                    className={`flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors ${
                                        idx === selectedIndex ? "bg-white/5" : "hover:bg-white/[0.02]"
                                    }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-2 rounded-lg ${idx === selectedIndex ? 'bg-white/10' : 'bg-white/5'}`}>
                                            {cmd.icon}
                                        </div>
                                        <div>
                                            <div className="text-sm font-bold text-white tracking-tight">{cmd.label}</div>
                                            <div className="text-xs text-slate-500">{cmd.desc}</div>
                                        </div>
                                    </div>
                                    {idx === selectedIndex && (
                                        <ChevronRight className="w-4 h-4 text-blue-400" />
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Simulated Output Terminal Overlay */}
                <div className="bg-black/40 px-6 py-4 rounded-b-2xl border-t border-white/5 font-mono text-[11px] text-blue-400/60 transition-opacity">
                    {output.length > 0 ? (
                        output.map((line, i) => <div key={i} className="mb-1 last:mb-0">{line}</div>)
                    ) : (
                        <div className="opacity-30 italic">Terminal ready. Try 'deploy' or 'scale'...</div>
                    )}
                </div>
            </div>
        </div>
    );
}
