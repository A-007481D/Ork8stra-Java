"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Loader2, Layers } from "lucide-react";

export default function CreateProjectModal({
    isOpen,
    onClose,
    onComplete,
    token,
    teamID
}: {
    isOpen: boolean;
    onClose: () => void;
    onComplete: () => void;
    token: string;
    teamID: string;
}) {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        setError("");

        try {
            const res = await fetch("/api/v1/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, team_id: teamID })
            });

            if (!res.ok) {
                throw new Error("Failed to create project");
            }

            onComplete();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Failed to create project. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#0A0A0A] w-full max-w-md rounded-xl border border-white/10 shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#050505]">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <Layers className="w-4 h-4 text-[#00E5FF]" />
                        New Project
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wide">
                            Project Name
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. My Awesome App"
                            className="w-full bg-[#111] border border-white/10 rounded-lg p-3 text-white focus:border-[#00E5FF] focus:outline-none text-sm placeholder:text-slate-600"
                        />
                    </div>

                    {error && (
                        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white text-sm font-medium px-4 py-2 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={!name.trim() || isSubmitting}
                            className={`px-6 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${name.trim() && !isSubmitting
                                ? "bg-[#00E5FF] text-black hover:bg-[#00B8CC] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                                : "bg-white/5 text-slate-500 cursor-not-allowed"
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                "Create Project"
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
