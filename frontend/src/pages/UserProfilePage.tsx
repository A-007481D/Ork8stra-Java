import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import type { UserProfile } from '../types/index';
import { Button } from '../components/ui/Button';
import { 
    Upload, CheckCircle2, Building2, Shield, Mail, 
    Lock, Key, Settings, ArrowRight, ChevronRight, History, Smartphone
} from 'lucide-react';

interface UserProfilePageProps {
    profile: UserProfile | null;
    onUpdate: () => void;
    token: string;
}

const UserProfilePage: React.FC<UserProfilePageProps> = ({ profile, onUpdate, token }) => {
    const [displayName, setDisplayName] = useState(profile?.displayName || '');
    const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || '');
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/v1/profile', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ displayName, avatarUrl })
            });
            if (res.ok) {
                setSuccess(true);
                onUpdate();
                setTimeout(() => setSuccess(false), 3000);
            }
        } catch (e) {
            console.error('Failed to update profile', e);
        } finally {
            setSaving(false);
        }
    };

    if (!profile) return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
    );

    return (
        <div className="min-h-full bg-[#050505] p-8 lg:p-12 relative">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-6xl mx-auto"
            >
                {/* Clean Professional Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-[#222] pb-10">
                    <div className="flex items-center gap-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-tr from-[#1A1A1A] to-[#222] flex items-center justify-center border border-[#333] shadow-xl group-hover:border-purple-500/50 transition-all">
                                {profile.avatarUrl ? (
                                    <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-[#E3E3E3]">
                                        {(profile.displayName || profile.username).substring(0, 2).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <button className="absolute -bottom-2 -right-2 p-2 bg-white text-black rounded-lg shadow-xl hover:bg-zinc-200 transition-colors border-2 border-[#050505]">
                                <Upload className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight leading-none mb-2">
                                {profile.displayName || profile.username}
                            </h1>
                            <div className="flex flex-col gap-1">
                                <p className="text-[#666] text-sm flex items-center gap-2">
                                    <Mail className="w-3.5 h-3.5" /> {profile.email}
                                </p>
                                <p className="text-[#444] text-[11px] font-mono uppercase tracking-widest">
                                    Account ID: {profile.id.substring(0, 8)}...
                                </p>
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {success && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="flex items-center gap-2 text-emerald-500 bg-emerald-500/5 px-4 py-2 rounded-lg border border-emerald-500/20 text-sm font-medium"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Changes saved
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Primary Settings Block */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-[#E3E3E3] mb-8 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-purple-400" />
                                Profile Settings
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider ml-1">Display Name</label>
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-sm text-[#E3E3E3] focus:outline-none focus:border-purple-500/50 transition-colors shadow-inner"
                                        placeholder="Full Name"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#666] uppercase tracking-wider ml-1">Avatar URL</label>
                                    <input 
                                        type="text" 
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full bg-[#0A0A0A] border border-[#222] rounded-xl px-4 py-3 text-sm text-[#E3E3E3] focus:outline-none focus:border-indigo-500/50 transition-colors shadow-inner"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-8 border-t border-[#1A1A1A] flex justify-end">
                                <Button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="bg-white text-black hover:bg-zinc-200 font-bold px-8 py-2 rounded-xl"
                                >
                                    {saving ? 'Saving...' : 'Update Profile'}
                                </Button>
                            </div>
                        </div>

                        {/* Organizations & Access Block */}
                        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-[#E3E3E3] mb-8 flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-indigo-400" />
                                Organization Memberships
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {profile.organizations.map(org => (
                                    <div key={org.id} className="flex items-center justify-between p-4 bg-[#0A0A0A] border border-[#222] rounded-xl group hover:border-[#333] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-[#888] font-bold group-hover:text-white transition-colors">
                                                {org.name.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-[#E3E3E3]">{org.name}</p>
                                                <p className="text-[10px] text-[#555] font-mono">@{org.slug}</p>
                                            </div>
                                        </div>
                                        <span className="px-2 py-0.5 bg-[#1A1A1A] border border-[#2C2C2C] text-[#AAA] text-[9px] font-bold rounded-md uppercase tracking-widest">
                                            {org.role.replace('ORG_', '')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Secondary Context Block */}
                    <div className="space-y-8">
                        {/* System Access / Roles */}
                        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-[#E3E3E3] mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-blue-400" />
                                System Roles
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.roles.map(role => (
                                    <span key={role} className="px-3 py-1 bg-[#0A0A0A] border border-[#222] rounded-lg text-[10px] font-bold text-[#666] uppercase tracking-widest flex items-center gap-2">
                                        <Lock className="w-3 h-3" /> {role}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Security Actions */}
                        <div className="bg-[#111] border border-[#222] rounded-2xl p-8 shadow-sm">
                            <h3 className="text-sm font-bold text-[#E3E3E3] mb-6 flex items-center gap-2">
                                <Lock className="w-4 h-4 text-emerald-400" />
                                Security
                            </h3>
                            <div className="space-y-4">
                                <button className="w-full text-left px-4 py-3 bg-[#0A0A0A] border border-[#222] rounded-xl text-sm text-[#888] hover:text-white hover:border-[#333] transition-all flex items-center justify-between group">
                                    <span className="flex items-center gap-2"><Key className="w-4 h-4" /> Change Password</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="w-full text-left px-4 py-3 bg-[#0A0A0A] border border-[#222] rounded-xl text-sm text-[#888] hover:text-white hover:border-[#333] transition-all flex items-center justify-between group">
                                    <span className="flex items-center gap-2"><Smartphone className="w-4 h-4" /> Two-Factor Auth</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Audit Link */}
                        <div className="p-6 bg-purple-500/5 border border-dashed border-purple-500/20 rounded-2xl flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
                                <History className="w-4 h-4" /> Access Logs
                            </div>
                            <p className="text-[10px] text-[#555] leading-relaxed">View a detailed log of all authentication events and sensitive actions performend by your account.</p>
                            <button className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                View Audit Trail <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default UserProfilePage;
