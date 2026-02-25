
import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

interface CreateOrganizationModalProps {
    isOpen: boolean;
    onClose: () => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onCreated: (newOrg: any) => void;
    token: string;
}

export default function CreateOrganizationModal({ isOpen, onClose, onCreated, token }: CreateOrganizationModalProps) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch("/api/v1/orgs", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ name })
            });

            if (res.ok) {
                const newOrg = await res.json();
                onCreated(newOrg);
                onClose();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#333] w-full max-w-md rounded-xl shadow-2xl overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center">
                    <h2 className="text-[#E3E3E3] font-medium flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-500" />
                        New Organization
                    </h2>
                    <button onClick={onClose}><X className="w-5 h-5 text-[#666] hover:text-[#CCC]" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-[#888] mb-1.5 uppercase tracking-wider">Organization Name</label>
                        <input
                            className="w-full bg-[#1A1A1A] border border-[#333] rounded-md px-3 py-2 text-sm text-[#E3E3E3] focus:border-[#555] outline-none"
                            placeholder="e.g. Acme Corp"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-[#888]">Cancel</Button>
                        <Button type="submit" disabled={loading} className="bg-white text-black hover:bg-[#E3E3E3]">
                            {loading ? "Creating..." : "Create Organization"}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}
