
import React, { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Shield, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import type { Organization } from '../types/index';

interface Member {
    user_id: string;
    email: string;
    role: string;
}

interface SettingsMembersProps {
    org: Organization;
    token: string;
}

export default function SettingsMembers({ org, token }: SettingsMembersProps) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [inviting, setInviting] = useState(false);

    const fetchMembers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/v1/orgs/${org.id}/members`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setMembers(data);
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
            const res = await fetch(`/api/v1/orgs/${org.id}/invites`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, role: inviteRole })
            });
            if (res.ok) {
                setInviteEmail("");
                fetchMembers();
            } else {
                const err = await res.text();
                alert("Failed to invite: " + err); // Simple alert for now
            }
        } catch (e) {
            console.error(e);
        } finally {
            setInviting(false);
        }
    };

    return (
        <div className="p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-[#E3E3E3] mb-2">Organization Members</h1>
                <p className="text-[#888]">Manage access and roles for <span className="text-white font-medium">{org.name}</span>.</p>
            </div>

            {/* Invite Section */}
            <div className="bg-[#111] border border-[#333] rounded-xl p-6 mb-8">
                <h2 className="text-lg font-semibold text-[#E3E3E3] mb-4 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    Invite Member
                </h2>
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
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                            <option value="owner">Owner</option>
                        </select>
                    </div>
                    <Button type="submit" disabled={inviting} className="h-[42px] px-6">
                        {inviting ? "Inviting..." : "Send Invite"}
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
                            <div key={member.user_id} className="p-4 flex items-center justify-between hover:bg-[#161616] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#333] to-[#222] flex items-center justify-center text-[#BBB] font-medium border border-[#333]">
                                        {member.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="text-[#E3E3E3] font-medium">{member.email}</div>
                                        <div className="text-xs text-[#666] flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {/* Placeholder for actions like Remove or Change Role */}
                                    {member.role !== 'owner' && (
                                        <button className="p-2 text-[#666] hover:text-red-500 transition-colors" title="Remove Member">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
