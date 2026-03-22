import React, { useState } from 'react';
import { motion } from 'framer-motion';

import type { UserProfile } from '../types/index';
import { Button } from '../components/ui/Button';
import { Upload, User, Save, CheckCircle2, Building2 } from 'lucide-react';

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
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
    );

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto px-6 py-12"
        >
            <div className="mb-10 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
                    <p className="text-[#888]">Manage your personal information and organization settings.</p>
                </div>
                {success && (
                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-500/20 text-sm font-medium animate-in fade-in slide-in-from-top-4">
                        <CheckCircle2 className="w-4 h-4" />
                        Changes saved successfully
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Header */}
                <div className="md:col-span-1 border border-[#242424] bg-[#111] rounded-2xl p-8 flex flex-col items-center text-center shadow-xl">
                    <div className="relative group mb-6">
                        <div className="w-32 h-32 rounded-full ring-4 ring-[#242424] overflow-hidden bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-2xl group-hover:ring-purple-500/40 transition-all duration-300">
                            {profile.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                                (profile.displayName || profile.username).substring(0, 2).toUpperCase()
                            )}
                        </div>
                        <button className="absolute bottom-1 right-1 p-2 bg-white text-black rounded-full shadow-lg hover:bg-gray-200 transition-colors border-2 border-[#111]">
                            <Upload className="w-4 h-4" />
                        </button>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">{profile.displayName || profile.username}</h2>
                    <p className="text-sm text-[#666] mb-6">{profile.email}</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {profile.roles.map(role => (
                            <span key={role} className="px-2.5 py-1 bg-[#1A1A1A] border border-[#333] rounded-full text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                                {role}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Form Section */}
                <div className="md:col-span-2 space-y-6">
                    <div className="border border-[#242424] bg-[#111] rounded-2xl p-8 shadow-xl">
                        <h3 className="text-lg font-semibold text-[#E3E3E3] mb-6 flex items-center gap-2">
                            <User className="w-5 h-5 text-purple-400" />
                            Personal Details
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-[#666] uppercase mb-2 ml-1">Display Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="w-4 h-4 text-[#444]" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl pl-10 pr-4 py-3 text-sm text-[#E3E3E3] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                        placeholder="Add a display name"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-[#666] uppercase mb-2 ml-1">Avatar URL</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Upload className="w-4 h-4 text-[#444]" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={avatarUrl}
                                        onChange={(e) => setAvatarUrl(e.target.value)}
                                        className="w-full bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl pl-10 pr-4 py-3 text-sm text-[#E3E3E3] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all"
                                        placeholder="https://..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button 
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-white text-black hover:bg-white/90 font-bold px-8 shadow-lg shadow-white/5 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : (
                                    <span className="flex items-center gap-2">
                                        <Save className="w-4 h-4" />
                                        Save Changes
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>

                    <div className="border border-[#242424] bg-[#111] rounded-2xl p-8 shadow-xl">
                        <h3 className="text-lg font-semibold text-[#E3E3E3] mb-6 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-indigo-400" />
                            Organization Memberships
                        </h3>
                        <div className="space-y-3">
                            {profile.organizations.map(org => (
                                <div key={org.id} className="flex items-center justify-between p-4 bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl group hover:border-[#333] transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-[#222] border border-[#333] flex items-center justify-center text-[#E3E3E3] font-bold group-hover:bg-[#2C2C2C]">
                                            {org.name.substring(0, 1).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-[#E3E3E3]">{org.name}</p>
                                            <p className="text-xs text-[#666]">@{org.slug}</p>
                                        </div>
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold rounded-lg uppercase tracking-wider">
                                        {org.role.replace('ORG_', '')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default UserProfilePage;
