
import { useState, useEffect } from 'react';
import { X, Trash2, Plus, AlertTriangle, Terminal, GitBranch, Server } from 'lucide-react';
import type { Service } from '../types/index';
import { Button } from './ui/Button';
import { motion } from 'framer-motion';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: Service;
    token: string;
    onUpdate: () => void;
    onDelete: () => void;
}

export default function SettingsModal({ isOpen, onClose, service, token, onUpdate, onDelete }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'env'>('general');

    // Form State
    const [branch, setBranch] = useState(service.branch);
    const [port, setPort] = useState(service.port?.toString() || "");
    const [buildCommand, setBuildCommand] = useState(service.build_command || "");
    const [startCommand, setStartCommand] = useState(service.start_command || "");

    // Env Vars State
    const [envVars, setEnvVars] = useState<{ key: string, value: string }[]>([]);

    useEffect(() => {
        // Parse existing env vars natively from the mapped object
        if (service.env && typeof service.env === 'object') {
            const arr = Object.keys(service.env).map(k => ({ key: k, value: service.env![k] }));
            setEnvVars(arr);
        } else if (service.env_vars && typeof service.env_vars === 'string') {
            // Fallback for legacy stringified data
            try {
                const parsed = JSON.parse(service.env_vars);
                const arr = Object.keys(parsed).map(k => ({ key: k, value: parsed[k] }));
                setEnvVars(arr);
            } catch (e) {
                setEnvVars([]);
            }
        } else {
            setEnvVars([]);
        }
    }, [service.env, service.env_vars, isOpen]);

    const handleSave = async () => {
        try {
            // Convert Env array to object mapping
            const envObj: Record<string, string> = {};
            envVars.forEach(e => {
                if (e.key) envObj[e.key] = e.value;
            });

            // Map UI configuration exactly to the Spring Boot CreateApplicationRequest DTO
            const body = {
                gitRepoUrl: service.repo_url, // Ensure we don't drop the repo URL
                buildBranch: branch,
                envVars: envObj
            };

            const res = await fetch(`/api/v1/apps/${service.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                onUpdate();
                onClose();
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this application? This action cannot be undone.")) return;

        // Execute the prop-injected REST logic from Dashboard.tsx
        onDelete();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#111] border border-[#333] w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[85vh]"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#222]">
                    <div>
                        <h2 className="text-[#E3E3E3] font-medium text-lg">Service Settings</h2>
                        <p className="text-[#666] text-xs">{service.name}</p>
                    </div>
                    <button onClick={onClose} className="text-[#666] hover:text-[#E3E3E3] transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Tabs */}
                    <div className="w-48 border-r border-[#222] p-4 space-y-1">
                        <button
                            onClick={() => setActiveTab('general')}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${activeTab === 'general' ? 'bg-[#222] text-[#E3E3E3]' : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#CCC]'}`}
                        >
                            <Server className="w-4 h-4" />
                            General
                        </button>
                        <button
                            onClick={() => setActiveTab('env')}
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-colors ${activeTab === 'env' ? 'bg-[#222] text-[#E3E3E3]' : 'text-[#888] hover:bg-[#1A1A1A] hover:text-[#CCC]'}`}
                        >
                            <Terminal className="w-4 h-4" />
                            Environment
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {activeTab === 'general' && (
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">Git Configuration</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <span className="block text-xs text-[#666] mb-1">Branch</span>
                                            <div className="flex items-center gap-2 bg-[#1A1A1A] border border-[#333] rounded-md px-3 py-2">
                                                <GitBranch className="w-4 h-4 text-[#555]" />
                                                <input
                                                    className="bg-transparent border-none outline-none text-sm text-[#E3E3E3] w-full"
                                                    value={branch}
                                                    onChange={e => setBranch(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">Build & Runtime</label>
                                    <div className="space-y-4">
                                        <div>
                                            <span className="block text-xs text-[#666] mb-1">Container Port</span>
                                            <input
                                                className="bg-[#1A1A1A] border border-[#333] rounded-md px-3 py-2 text-sm text-[#E3E3E3] w-32 focus:border-[#555] outline-none"
                                                type="number"
                                                value={port}
                                                onChange={e => setPort(e.target.value)}
                                            />
                                            <p className="text-[10px] text-[#555] mt-1">The port your application listens on internally.</p>
                                        </div>
                                        <div>
                                            <span className="block text-xs text-[#666] mb-1">Build Command (Optional)</span>
                                            <input
                                                className="bg-[#1A1A1A] border border-[#333] rounded-md px-3 py-2 text-sm text-[#E3E3E3] w-full focus:border-[#555] outline-none font-mono placeholder:text-[#333]"
                                                placeholder="npm run build"
                                                value={buildCommand}
                                                onChange={e => setBuildCommand(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <span className="block text-xs text-[#666] mb-1">Start Command (Optional)</span>
                                            <input
                                                className="bg-[#1A1A1A] border border-[#333] rounded-md px-3 py-2 text-sm text-[#E3E3E3] w-full focus:border-[#555] outline-none font-mono placeholder:text-[#333]"
                                                placeholder="npm start"
                                                value={startCommand}
                                                onChange={e => setStartCommand(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-[#222]">
                                    <label className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        Danger Zone
                                    </label>
                                    <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-between">
                                        <div>
                                            <h4 className="text-red-200 text-sm font-medium">Delete Service</h4>
                                            <p className="text-red-300/50 text-xs">Permanently remove this service and all deployments.</p>
                                        </div>
                                        <Button variant="destructive" size="sm" onClick={handleDelete} className="bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white border-red-500/30">
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'env' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-semibold text-[#888] uppercase tracking-wider">Environment Variables</label>
                                    <Button size="sm" variant="secondary" onClick={() => setEnvVars([...envVars, { key: '', value: '' }])} className="h-7 text-xs">
                                        <Plus className="w-3 h-3 mr-1" /> Add Variable
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {envVars.map((env, idx) => (
                                        <div key={idx} className="flex items-center gap-2 group">
                                            <input
                                                className="bg-[#1A1A1A] border border-[#333] rounded px-3 py-2 text-sm text-[#E3E3E3] w-1/3 font-mono placeholder:text-[#444] focus:border-[#555] outline-none transition-colors"
                                                placeholder="KEY"
                                                value={env.key}
                                                onChange={e => {
                                                    const newVars = [...envVars];
                                                    newVars[idx].key = e.target.value;
                                                    setEnvVars(newVars);
                                                }}
                                            />
                                            <span className="text-[#444]">=</span>
                                            <input
                                                className="bg-[#1A1A1A] border border-[#333] rounded px-3 py-2 text-sm text-[#E3E3E3] w-full font-mono placeholder:text-[#444] focus:border-[#555] outline-none transition-colors"
                                                placeholder="VALUE"
                                                value={env.value}
                                                onChange={e => {
                                                    const newVars = [...envVars];
                                                    newVars[idx].value = e.target.value;
                                                    setEnvVars(newVars);
                                                }}
                                            />
                                            <button
                                                onClick={() => setEnvVars(envVars.filter((_, i) => i !== idx))}
                                                className="p-2 text-[#444] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {envVars.length === 0 && (
                                        <div className="text-center py-8 border border-dashed border-[#222] rounded-lg text-[#444] text-sm">
                                            No environment variables defined
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-[#555]">
                                    Secrets are encrypted at rest. Changes take effect on next deployment.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-[#222] bg-[#111] flex justify-end gap-3 rounded-b-xl">
                    <Button variant="ghost" onClick={onClose} className="text-[#888] hover:text-[#E3E3E3]">Cancel</Button>
                    <Button onClick={handleSave} className="bg-white text-black hover:bg-[#E3E3E3]">Save Changes</Button>
                </div>
            </motion.div>
        </div>
    );
}
