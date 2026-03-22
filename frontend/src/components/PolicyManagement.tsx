import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Trash2, Key, Info } from 'lucide-react';
import { Button } from './ui/Button';
import type { Organization } from '../types/index';

interface Policy {
    id: string;
    name: string;
    description: string;
    permissions: string[];
}

interface PolicyManagementProps {
    org: Organization;
    token: string;
}

export default function PolicyManagement({ org, token }: PolicyManagementProps) {
    const [policies, setPolicies] = useState<Policy[]>([]);
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [permissions, setPermissions] = useState("");
    const [creating, setCreating] = useState(false);

    const fetchPolicies = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/policies`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPolicies(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [org.id, token]);

    useEffect(() => {
        fetchPolicies();
    }, [fetchPolicies]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/policies`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ 
                    name, 
                    description, 
                    permissions: permissions.split(',').map(p => p.trim()).filter(p => p !== "") 
                })
            });
            if (res.ok) {
                setName("");
                setDescription("");
                setPermissions("");
                fetchPolicies();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this policy?")) return;
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/policies/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchPolicies();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Create Policy Form */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6">
                <h2 className="text-lg font-semibold text-[#E3E3E3] mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    Create IAM Policy
                </h2>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-[#666] mb-1.5 uppercase tracking-wider">Policy Name</label>
                            <input
                                type="text"
                                className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#E3E3E3] focus:border-purple-500 outline-none transition-colors"
                                placeholder="e.g. DatabaseAdmin"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[#666] mb-1.5 uppercase tracking-wider">Description</label>
                            <input
                                type="text"
                                className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#E3E3E3] focus:border-purple-500 outline-none transition-colors"
                                placeholder="Full access to DB resources"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#666] mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
                            Permissions (comma separated)
                            <div className="group relative">
                                <Info className="w-3.5 h-3.5 text-[#444] cursor-help" />
                                <div className="absolute left-0 bottom-full mb-1.5 w-64 p-2 bg-black border border-[#333] rounded text-[10px] text-[#888] invisible group-hover:visible z-50">
                                    Format: service:action (e.g. deploy:create, infra:view)
                                    Use * for all actions.
                                </div>
                            </div>
                        </label>
                        <input
                            type="text"
                            className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#E3E3E3] focus:border-purple-500 outline-none transition-colors"
                            placeholder="deploy:view, deploy:edit, infra:*"
                            value={permissions}
                            onChange={e => setPermissions(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={creating} className="bg-purple-600 hover:bg-purple-500">
                            {creating ? "Creating..." : "Create Policy"}
                        </Button>
                    </div>
                </form>
            </div>

            {/* Policies List */}
            <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-[#161616]">
                    <h3 className="text-[#E3E3E3] font-medium flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#888]" />
                        Active Policies ({policies.length})
                    </h3>
                </div>
                <div className="divide-y divide-[#222]">
                    {loading ? (
                        <div className="p-8 text-center text-[#666]">Loading policies...</div>
                    ) : policies.length === 0 ? (
                        <div className="p-8 text-center text-[#666]">No policies found.</div>
                    ) : (
                        policies.map((policy) => (
                            <div key={policy.id} className="p-4 flex items-center justify-between hover:bg-[#161616] transition-colors">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[#E3E3E3] font-medium">{policy.name}</span>
                                        <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold border border-purple-500/20">
                                            {policy.permissions.length} PERMS
                                        </span>
                                    </div>
                                    <div className="text-xs text-[#666] mt-1">{policy.description || 'No description provided'}</div>
                                    <div className="flex flex-wrap gap-1.5 mt-2">
                                        {policy.permissions.map((p, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-[#1A1A1A] border border-[#222] rounded text-[10px] text-[#AAA] font-mono">
                                                {p}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDelete(policy.id)}
                                    className="p-2 text-[#666] hover:text-red-500 transition-colors" 
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
