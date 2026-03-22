import React, { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Shield, Trash2, Link as LinkIcon, Copy, Check } from 'lucide-react';
import { Button } from './ui/Button';
import PolicyManagement from './PolicyManagement';
import type { Organization } from '../types/index';

interface Member {
    userId: number;
    username: string;
    email: string;
    displayName: string | null;
    avatarUrl: string | null;
    role: string;
}

interface Invitation {
    id: string;
    email: string | null;
    role: string;
    token: string;
    status: string;
    expiresAt: string;
}

interface SettingsMembersProps {
    org: Organization;
    token: string;
}

export default function SettingsMembers({ org, token }: SettingsMembersProps) {
    const [activeTab, setActiveTab] = useState<'MEMBERS' | 'INVITATIONS' | 'POLICIES'>('MEMBERS');
    const [members, setMembers] = useState<Member[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [inviting, setInviting] = useState(false);
    const [generatingLink, setGeneratingLink] = useState(false);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const [memRes, invRes] = await Promise.all([
                fetch(`/api/v1/orgs/${org.id}/members`, { headers: { "Authorization": `Bearer ${token}` } }),
                fetch(`/api/v1/orgs/${org.id}/members/invitations`, { headers: { "Authorization": `Bearer ${token}` } })
            ]);
            
            if (memRes.ok) {
                const data = await memRes.json();
                setMembers(data);
            }
            if (invRes.ok) {
                const data = await invRes.json();
                setInvitations(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [org.id, token]);

    useEffect(() => {
        fetchMembers();
    }, [fetchMembers]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviting(true);
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Authorization": `Bearer ${token}`
                },
                body: new URLSearchParams({ email: inviteEmail, role: inviteRole.toUpperCase().startsWith('ORG_') ? inviteRole : `ORG_${inviteRole.toUpperCase()}` })
            });
            if (res.ok) {
                setInviteEmail("");
                fetchMembers();
            } else {
                const err = await res.text();
                alert("Failed to add member: " + err);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setInviting(false);
        }
    };

    const handleGenerateLink = async () => {
        setGeneratingLink(true);
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/members/invite-link?role=${inviteRole.toUpperCase().startsWith('ORG_') ? inviteRole : `ORG_${inviteRole.toUpperCase()}`}`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMembers();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingLink(false);
        }
    };

    const copyToClipboard = (text: string) => {
        const link = `${window.location.origin}/join/org/${text}`;
        navigator.clipboard.writeText(link);
        setCopiedToken(text);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handleRemove = async (userId: number) => {
        if (!confirm("Are you sure you want to remove this member?")) return;
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/members/${userId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                fetchMembers();
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-[#E3E3E3] mb-2">Access Management</h1>
                    <p className="text-[#888]">Manage members, invitations, and security policies for <span className="text-white font-medium">{org.name}</span>.</p>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-[#111] border border-[#333] p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('MEMBERS')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'MEMBERS' ? 'bg-[#222] text-white shadow-sm' : 'text-[#666] hover:text-[#AAA]'}`}
                    >
                        Members
                    </button>
                    <button 
                        onClick={() => setActiveTab('INVITATIONS')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'INVITATIONS' ? 'bg-[#222] text-white shadow-sm' : 'text-[#666] hover:text-[#AAA]'}`}
                    >
                        Invitations/Links
                    </button>
                    <button 
                        onClick={() => setActiveTab('POLICIES')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'POLICIES' ? 'bg-[#222] text-white shadow-sm' : 'text-[#666] hover:text-[#AAA]'}`}
                    >
                        Cloud IAM
                    </button>
                </div>
            </div>

            {activeTab === 'MEMBERS' && (
                <>
                    {/* Invite Section */}
                    <div className="bg-[#111] border border-[#333] rounded-xl p-6 mb-8">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-semibold text-[#E3E3E3] flex items-center gap-2">
                                <Mail className="w-5 h-5 text-blue-500" />
                                Onboard Developer
                            </h2>
                            <div className="flex gap-2">
                                <Button 
                                    onClick={handleGenerateLink} 
                                    disabled={generatingLink}
                                    className="bg-[#1A1A1A] border border-[#333] hover:bg-[#222] text-[#AAA] h-9 px-4 text-xs flex items-center gap-2"
                                >
                                    <LinkIcon className="w-3.5 h-3.5" />
                                    {generatingLink ? "Generating..." : "Generate Join Link"}
                                </Button>
                            </div>
                        </div>
                        <form onSubmit={handleInvite} className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-[#666] mb-1.5 uppercase tracking-wider">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#E3E3E3] focus:border-blue-500 outline-none transition-colors"
                                    placeholder="colleague@example.com"
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="w-48">
                                <label className="block text-xs font-semibold text-[#666] mb-1.5 uppercase tracking-wider">Role</label>
                                <select
                                    className="w-full bg-[#1A1A1A] border border-[#333] rounded-lg px-4 py-2.5 text-sm text-[#E3E3E3] focus:border-blue-500 outline-none transition-colors appearance-none"
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                >
                                    <option value="ORG_MEMBER">Member</option>
                                    <option value="ORG_ADMIN">Admin</option>
                                    <option value="ORG_VIEWER">Viewer</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={inviting} className="h-[42px] px-6">
                                {inviting ? "Sending..." : "Invite Member"}
                            </Button>
                        </form>
                    </div>

                    {/* Members List */}
                    <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-[#161616]">
                            <h3 className="text-[#E3E3E3] font-medium flex items-center gap-2">
                                <Users className="w-4 h-4 text-[#888]" />
                                Active Members ({members.length})
                            </h3>
                        </div>
                        <div className="divide-y divide-[#222]">
                            {loading ? (
                                <div className="p-8 text-center text-[#666]">Loading members...</div>
                            ) : members.length === 0 ? (
                                <div className="p-8 text-center text-[#666]">No members found.</div>
                            ) : (
                                members.map((member) => (
                                    <div key={member.userId} className="p-4 flex items-center justify-between hover:bg-[#161616] transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 flex items-center justify-center text-[#E3E3E3] font-bold border border-white/5 overflow-hidden">
                                                {member.avatarUrl ? (
                                                    <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (member.displayName || member.username).charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <div className="text-[#E3E3E3] font-medium">{member.displayName || member.username}</div>
                                                <div className="text-xs text-[#666] flex items-center gap-2">
                                                    <span className="flex items-center gap-1">
                                                        <Mail className="w-3 h-3" />
                                                        {member.email}
                                                    </span>
                                                    <span className="w-1 h-1 rounded-full bg-[#333]" />
                                                    <span className="flex items-center gap-1 text-blue-400">
                                                        <Shield className="w-3 h-3" />
                                                        {member.role.replace('ORG_', '')}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {member.role !== 'ORG_OWNER' && (
                                                <button 
                                                    onClick={() => handleRemove(member.userId)}
                                                    className="p-2 text-[#666] hover:text-red-500 transition-colors" 
                                                    title="Remove Member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'INVITATIONS' && (
                <div className="bg-[#111] border border-[#333] rounded-xl overflow-hidden animate-fade-in">
                    <div className="px-6 py-4 border-b border-[#222] flex justify-between items-center bg-[#161616]">
                        <h3 className="text-[#E3E3E3] font-medium flex items-center gap-2">
                            <Mail className="w-4 h-4 text-[#888]" />
                            Pending Invitations & Join Links ({invitations.length})
                        </h3>
                    </div>
                    <div className="divide-y divide-[#222]">
                        {invitations.length === 0 ? (
                            <div className="p-8 text-center text-[#666]">No pending invitations.</div>
                        ) : (
                            invitations.map((inv) => (
                                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-[#161616] transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border border-white/5 ${inv.email ? 'bg-blue-500/10 text-blue-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                                            {inv.email ? <Mail className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                        </div>
                                        <div>
                                            <div className="text-[#E3E3E3] font-medium">{inv.email || "Reusable Join Link"}</div>
                                            <div className="text-xs text-[#666] flex items-center gap-2">
                                                <span className="flex items-center gap-1 text-blue-400">
                                                    <Shield className="w-3 h-3" />
                                                    {inv.role.replace('ORG_', '')}
                                                </span>
                                                <span className="w-1 h-1 rounded-full bg-[#333]" />
                                                <span className="text-[#444]">Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => copyToClipboard(inv.token)}
                                            className="px-3 py-1.5 bg-[#1A1A1A] border border-[#333] rounded text-[10px] text-[#AAA] font-bold flex items-center gap-1.5 hover:text-white transition-colors"
                                        >
                                            {copiedToken === inv.token ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            {copiedToken === inv.token ? "Copied" : "Copy Link"}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'POLICIES' && (
                <PolicyManagement org={org} token={token} />
            )}
        </div>
    );
}
