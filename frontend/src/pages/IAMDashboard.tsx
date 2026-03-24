import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Key, Activity, Search, 
  ChevronRight, Building2, Clock, Filter,
  ShieldCheck, ShieldAlert, Zap, Lock,
  CheckCircle, XCircle, UserPlus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

interface IAMSummary {
  totalUsers: number;
  activeOrganizations: number;
  totalPolicies: number;
  pendingInvitations: number;
  auditLogCount: number;
}

interface UserIdentity {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  enabled: boolean;
  memberships: {
    organizationId: string;
    organizationName: string;
    role: string;
  }[];
}

interface Policy {
  id: string;
  name: string;
  description: string;
  document: string;
  organizationId?: string;
}

interface Team {
  id: string;
  name: string;
  organizationId: string;
  createdAt: string;
}

interface TeamMember {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
  policyIds: string[];
}

interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  resource: string;
  details: string;
  status: string;
  ipAddress: string;
  createdAt: string;
}

interface OrgInvitation {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  status: 'PENDING' | 'PENDING_APPROVAL' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';
  createdAt: string;
  expiresAt: string;
}

const IAMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'teams' | 'policies' | 'audit' | 'invitations'>('overview');
  const [summary, setSummary] = useState<IAMSummary | null>(null);
  const [users, setUsers] = useState<UserIdentity[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [invitations, setInvitations] = useState<OrgInvitation[]>([]);
  
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [policyDocText, setPolicyDocText] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview' || !summary) {
        const res = await fetch('/api/v1/iam/summary');
        if (res.ok) setSummary(await res.json());
        else if (res.status === 403) {
          setError('Access Denied: You do not have the Platform Admin privileges required to view global IAM telemetry.');
          setLoading(false);
          return;
        }
      }
      
      const endpoints: Record<string, string> = {
        users: '/api/v1/iam/users',
        policies: '/api/v1/iam/policies',
        teams: '/api/v1/iam/teams',
        audit: '/api/v1/iam/audit-logs',
        invitations: '/api/v1/iam/invitations'
      };

      if (endpoints[activeTab]) {
        const res = await fetch(endpoints[activeTab]);
        if (res.ok) {
          const data = await res.json();
          if (activeTab === 'users') setUsers(data);
          if (activeTab === 'policies') setPolicies(data);
          if (activeTab === 'teams') setTeams(data);
          if (activeTab === 'audit') setAuditLogs(data);
          if (activeTab === 'invitations') setInvitations(data);
        } else if (res.status === 403) {
          setError('Access Denied: This administrative module requires Platform Admin clearance.');
        }
      }
      
    } catch (err) {
      console.error('Failed to fetch IAM data:', err);
      setError('Platform synchronization failed. The security engine may be undergoing maintenance.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveInvite = async (orgId: string, inviteId: string) => {
    try {
      const res = await fetch(`/api/v1/organizations/${orgId}/invitations/${inviteId}/approve`, { method: 'POST' });
      if (res.ok) fetchData();
      else alert('Failed to approve invitation.');
    } catch (err) {
      console.error('Approval error:', err);
    }
  };

  const handleRejectInvite = async (orgId: string, inviteId: string) => {
    try {
      const res = await fetch(`/api/v1/organizations/${orgId}/invitations/${inviteId}/reject`, { method: 'POST' });
      if (res.ok) fetchData();
      else alert('Failed to reject invitation.');
    } catch (err) {
      console.error('Rejection error:', err);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/members`);
      if (res.ok) setTeamMembers(await res.json());
      else if (res.status === 403) setError('Permission Denied: Insufficient privileges to view team membership.');
    } catch (err) {
      console.error('Failed to fetch team members:', err);
    }
  };

  const handleAttachPolicy = async (teamId: string, userId: string, policyId: string) => {
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/members/${userId}/policies/${policyId}`, {
        method: 'POST'
      });
      if (res.ok) fetchTeamMembers(teamId);
      else if (res.status === 403) alert('Security Violation: You do not have permission to modify policy attachments.');
    } catch (err) {
      console.error('Failed to attach policy:', err);
    }
  };

  const handleDetachPolicy = async (teamId: string, userId: string, policyId: string) => {
    try {
      const res = await fetch(`/api/v1/teams/${teamId}/members/${userId}/policies/${policyId}`, {
        method: 'DELETE'
      });
      if (res.ok) fetchTeamMembers(teamId);
      else if (res.status === 403) alert('Security Violation: You do not have permission to revoke policy attachments.');
    } catch (err) {
      console.error('Failed to detach policy:', err);
    }
  };

  const handleSavePolicy = async () => {
    if (!editingPolicy) return;
    try {
      const res = await fetch(`/api/v1/organizations/${editingPolicy.organizationId}/policies/${editingPolicy.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingPolicy.name,
          description: editingPolicy.description,
          document: policyDocText
        })
      });
      if (res.ok) {
        setEditingPolicy(null);
        fetchData();
      } else if (res.status === 403) {
        alert('Security Violation: Policy modification failed due to insufficient administrative clearance.');
      }
    } catch (err) {
      console.error('Failed to save policy:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'users', label: 'Identity Hub', icon: Users },
    { id: 'teams', label: 'Teams & Groups', icon: ShieldCheck },
    { id: 'policies', label: 'Policy Templates', icon: Key },
    { id: 'invitations', label: 'Invitations', icon: UserPlus },
    { id: 'audit', label: 'Security Audit', icon: Activity },
  ] as const;

  const renderInvitations = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Organization Join Requests & Invites</h2>
          <p className="text-[#666] text-sm mt-1">Review and approve pending organization invitations and join requests.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="border-[#333] text-[#999] gap-2">
            <Filter className="w-4 h-4" /> Filter
          </Button>
        </div>
      </div>

      <div className="bg-[#111] border border-[#222] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#1a1a1a] border-b border-[#222]">
            <tr>
              <th className="px-6 py-4 text-[#666] font-medium text-xs uppercase tracking-wider">Target Email</th>
              <th className="px-6 py-4 text-[#666] font-medium text-xs uppercase tracking-wider">Organization ID</th>
              <th className="px-6 py-4 text-[#666] font-medium text-xs uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-[#666] font-medium text-xs uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-[#666] font-medium text-xs uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222]">
            {invitations.map((invite) => (
              <tr key={invite.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-6 py-4">
                  <span className="text-white font-medium">{invite.email}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[#666] text-sm tabular-nums">{invite.organizationId}</span>
                </td>
                <td className="px-6 py-4">
                  <Badge variant="outline" className="border-purple-500/30 text-purple-400 capitalize">
                    {invite.role.replace('ORG_', '').toLowerCase()}
                  </Badge>
                </td>
                <td className="px-6 py-4">
                  <Badge 
                    variant="outline" 
                    className={
                      invite.status === 'PENDING_APPROVAL' ? "border-yellow-500/30 text-yellow-500" :
                      invite.status === 'PENDING' ? "border-blue-500/30 text-blue-500" :
                      invite.status === 'ACCEPTED' ? "border-green-500/30 text-green-500" :
                      "border-red-500/30 text-red-500"
                    }
                  >
                    {invite.status.replace('_', ' ')}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    {invite.status === 'PENDING_APPROVAL' && (
                      <>
                        <Button 
                          onClick={() => handleApproveInvite(invite.organizationId, invite.id)}
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Approve
                        </Button>
                        <Button 
                          onClick={() => handleRejectInvite(invite.organizationId, invite.id)}
                          size="sm" 
                          variant="outline" 
                          className="border-red-500/30 text-red-500 hover:bg-red-500/10 gap-1.5"
                        >
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </Button>
                      </>
                    )}
                    {invite.status === 'PENDING' && (
                      <Button 
                        onClick={() => handleRejectInvite(invite.organizationId, invite.id)}
                        size="sm" 
                        variant="outline" 
                        className="border-[#333] text-[#666] hover:text-white"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {invitations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <Zap className="w-8 h-8 text-[#222]" />
                    <p className="text-[#444] font-medium">No pending security invitations found.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && !summary && users.length === 0 && policies.length === 0 && auditLogs.length === 0 && invitations.length === 0 && !error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-[#666] animate-pulse font-medium">Validating Security Credentials...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[500px]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#141414] border border-red-500/20 p-8 rounded-xl max-w-lg text-center shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
          <div className="relative z-10">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Security Access Denied</h2>
            <p className="text-[#888] mb-8 leading-relaxed">
              {error}
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => window.location.href = '/'} className="bg-white text-black hover:bg-[#ddd]">
                Return to Dashboard
              </Button>
              <Button onClick={fetchData} variant="outline" className="border-[#333] text-[#666] hover:text-white hover:border-[#444]">
                Try Again
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">IAM Center</h1>
        </div>
        <p className="text-[#999] max-w-2xl">
          Centralized Identity and Access Management. Manage global users, define platform-wide policy templates, 
          and audit security events across all organizations.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#242424]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id ? 'text-white' : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-purple-400' : ''}`} />
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-500"
              />
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && summary && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard label="Total Users" value={summary.totalUsers} icon={Users} color="blue" />
              <StatCard label="Active Organizations" value={summary.activeOrganizations} icon={Building2} color="green" />
              <StatCard label="Policy Templates" value={summary.totalPolicies} icon={Key} color="purple" />
              <StatCard label="Pending Invites" value={summary.pendingInvitations} icon={Clock} color="orange" />
              
              <Card className="lg:col-span-4 bg-[#141414] border-[#242424]">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    Security Posture: Optimized
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-[#242424]">
                    <div>
                      <h4 className="text-white font-medium">Automatic Guard Duty</h4>
                      <p className="text-xs text-[#666]">Platform-wide security policies are being enforced across {summary.activeOrganizations} organizations.</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Active
                    </Badge>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-lg">
                    <div className="flex gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-full h-fit mt-1">
                        <Zap className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-1">Global platform privileges acquired.</h3>
                        <p className="text-[#999] text-sm leading-relaxed mb-4">
                          You are currently in the Platform Administration view. Any users created or invited will now 
                          be visible here for cross-organization auditing and management.
                        </p>
                        <div className="flex gap-3">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white" onClick={() => setActiveTab('audit')}>
                            View Audit Stream
                          </Button>
                          <Button size="sm" variant="outline" className="border-[#333] text-[#999] hover:text-white" onClick={() => setActiveTab('policies')}>
                            Policy Manager
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="relative w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#444]" />
                  <input
                    type="text"
                    placeholder="Search global users by email or ID..."
                    className="w-full bg-[#141414] border border-[#242424] rounded-md py-2 pl-10 pr-4 text-sm text-[#E3E3E3] focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <Button className="bg-[#1f1f1f] text-[#E3E3E3] hover:bg-[#252525] border border-[#333]">
                  <Filter className="w-4 h-4 mr-2" />
                  Advanced Filter
                </Button>
              </div>

              <div className="bg-[#141414] border border-[#242424] rounded-lg overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-[#1a1a1a] border-b border-[#242424]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Organizations</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Joined</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#1a1a1a]/50 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/5 flex items-center justify-center text-white font-bold text-sm">
                              {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-white">{user.username}</div>
                              <div className="text-xs text-[#666]">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2 max-w-sm">
                            {user.memberships.map((m) => (
                              <Badge key={m.organizationId} variant="outline" className="bg-[#0F0F0F] border-[#242424] text-xs text-[#999] group-hover:text-[#E3E3E3]">
                                {m.organizationName}
                              </Badge>
                            ))}
                            {user.memberships.length === 0 && (
                              <span className="text-xs italic text-[#444]">None</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit text-[11px] font-medium">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            {user.enabled ? 'Active' : 'Disabled'}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-[#666]">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-[#444] hover:text-white transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'policies' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Global Policy Templates</h3>
                  <p className="text-xs text-[#666]">Pre-defined reusable cross-organization permission sets.</p>
                </div>
                <Button className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {policies.map((policy) => (
                  <Card key={policy.id} className="bg-[#141414] border-[#242424] hover:border-purple-500/30 transition-all group">
                    <CardHeader className="pb-2">
                       <div className="flex items-center justify-between">
                          <Lock className="w-5 h-5 text-purple-400" />
                          <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Template</Badge>
                       </div>
                       <CardTitle className="text-white mt-4">{policy.name}</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <p className="text-sm text-[#888] line-clamp-2">{policy.description}</p>
                        <div className="flex flex-wrap gap-2 min-h-[24px]">
                           {policy.document ? (
                             <Badge variant="outline" className="text-[10px] bg-purple-500/5 border-purple-500/10 text-purple-400">
                                JSON Document Active
                             </Badge>
                           ) : (
                             <span className="text-[10px] text-[#444] italic">Empty definition</span>
                           )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full border-[#333] text-[#999] group-hover:bg-[#1f1f1f] group-hover:text-white"
                          onClick={() => {
                            setEditingPolicy(policy);
                            setPolicyDocText(policy.document || "");
                          }}
                        >
                           Edit Definition
                        </Button>
                     </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-[#555] uppercase tracking-wider">All Teams</h3>
                  <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">{teams.length}</Badge>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team);
                        fetchTeamMembers(team.id);
                      }}
                      className={`w-full text-left p-4 rounded-lg border transition-all group ${
                        selectedTeam?.id === team.id 
                          ? 'bg-purple-500/5 border-purple-500/50' 
                          : 'bg-[#141414] border-[#242424] hover:border-[#333]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-white group-hover:text-purple-400 transition-colors">{team.name}</div>
                        <ChevronRight className={`w-4 h-4 transition-transform ${selectedTeam?.id === team.id ? 'rotate-90 text-purple-400' : 'text-[#444]'}`} />
                      </div>
                      <div className="text-[10px] text-[#555] mt-1 font-mono">ID: {team.id.substring(0, 8)}...</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-8">
                {selectedTeam ? (
                  <div className="space-y-6">
                    <div className="p-6 bg-[#141414] border border-[#242424] rounded-lg">
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h3 className="text-xl font-bold text-white">{selectedTeam.name} Members</h3>
                          <p className="text-xs text-[#666]">Managing granular access for {teamMembers.length} users in this team.</p>
                        </div>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white">
                          <Plus className="w-3.5 h-3.5 mr-2" />
                          Add Member
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {teamMembers.map((member) => (
                          <div key={member.id} className="p-4 bg-[#0F0F0F] border border-[#242424] rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-xs font-bold text-purple-400 border border-purple-500/20">
                                  {member.username.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-white">{member.username}</div>
                                  <div className="text-[10px] text-[#666]">{member.email} • {member.role}</div>
                                </div>
                              </div>
                              <Badge variant="outline" className="text-[9px] uppercase border-[#333] text-[#555]">
                                {member.role}
                              </Badge>
                            </div>

                            <div className="pt-4 border-t border-[#1f1f1f]">
                              <div className="text-[10px] font-bold text-[#444] uppercase mb-2">Assigned Policies</div>
                              <div className="flex flex-wrap gap-2">
                                {member.policyIds.map(pid => {
                                  const policyName = policies.find(p => p.id === pid)?.name || 'Unknown Policy';
                                  return (
                                    <Badge 
                                      key={pid} 
                                      className="bg-purple-500/10 text-purple-400 border-purple-500/20 pr-1 group"
                                    >
                                      {policyName}
                                      <button 
                                        onClick={() => handleDetachPolicy(selectedTeam.id, member.userId, pid)}
                                        className="ml-1.5 hover:text-white transition-colors"
                                      >
                                        ×
                                      </button>
                                    </Badge>
                                  );
                                })}
                                <select 
                                  className="bg-[#1a1a1a] border border-[#333] text-[10px] text-[#666] rounded px-2 py-0.5 focus:outline-none focus:border-purple-500/50"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAttachPolicy(selectedTeam.id, member.userId, e.target.value);
                                      e.target.value = '';
                                    }
                                  }}
                                >
                                  <option value="">+ Add Policy</option>
                                  {policies
                                    .filter(p => !member.policyIds.includes(p.id))
                                    .map(p => (
                                      <option key={p.id} value={p.id}>{p.name}</option>
                                    ))
                                  }
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                        {teamMembers.length === 0 && (
                          <div className="py-12 text-center border-2 border-dashed border-[#242424] rounded-lg">
                            <Users className="w-12 h-12 text-[#242424] mx-auto mb-3" />
                            <p className="text-[#666] text-sm font-medium">No members found in this team.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 bg-[#141414] border border-[#242424] border-dashed rounded-lg text-center">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                      <ShieldCheck className="w-8 h-8 text-purple-400/50" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">Select a team to manage</h3>
                    <p className="text-[#666] text-sm max-w-xs">
                      Choose a team from the left sidebar to audit its members and assign granular platform-wide policies.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'invitations' && renderInvitations()}

          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Security Audit Stream</h3>
                  <p className="text-xs text-[#666]">Real-time monitoring of all authorization events across organizations.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="border-[#333] text-[#888] hover:text-white">
                    Export CSV
                  </Button>
                  <Button className="bg-[#1f1f1f] text-white border border-[#333]">
                    <Clock className="w-4 h-4 mr-2" />
                    Last 24 Hours
                  </Button>
                </div>
              </div>

              <div className="bg-[#141414] border border-[#242424] rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-[#1a1a1a] border-b border-[#242424]">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">User</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Action</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Resource</th>
                      <th className="px-6 py-4 text-xs font-semibold text-[#555] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#242424]">
                    {auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-[#1a1a1a]/50 transition-colors">
                        <td className="px-6 py-4 text-xs text-[#666] font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-white font-medium">{log.username}</span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs text-nowrap">
                            {log.action}
                          </code>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#888]">
                          {log.details || log.resource}
                        </td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] font-bold ${
                              log.status === 'SUCCESS' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20'
                            }`}
                          >
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
      {/* Policy Editor Modal */}
      <AnimatePresence>
        {editingPolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#141414] border border-[#242424] rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b border-[#242424] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Edit Policy Document</h3>
                  <p className="text-xs text-[#666]">{editingPolicy.name}</p>
                </div>
                <button 
                  onClick={() => setEditingPolicy(null)}
                  className="p-2 text-[#444] hover:text-white transition-colors"
                >
                  <ShieldAlert className="w-5 h-5 rotate-45" />
                </button>
              </div>

              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                <div className="bg-[#0F0F0F] rounded-lg border border-[#242424] flex flex-col h-[500px]">
                  <div className="px-4 py-2 border-b border-[#242424] flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500/50" />
                    <div className="w-3 h-3 rounded-full bg-orange-500/50" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
                    <span className="text-[10px] text-[#444] font-mono ml-2">policy-document.json</span>
                  </div>
                  <textarea
                    value={policyDocText}
                    onChange={(e) => setPolicyDocText(e.target.value)}
                    className="flex-1 bg-transparent p-6 text-sm font-mono text-purple-300 focus:outline-none resize-none custom-scrollbar"
                    placeholder='{ "Statement": [ ... ] }'
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-purple-500/5 border border-purple-500/10 rounded-lg">
                    <h4 className="text-[10px] font-bold text-purple-400 uppercase mb-1">Editor Tip</h4>
                    <p className="text-[11px] text-[#777]">Use wildcards like <code className="text-purple-300">*</code> for broad permissions across resources.</p>
                  </div>
                  <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase mb-1">Reference</h4>
                    <p className="text-[11px] text-[#777]">Documents follow AWS IAM JSON structure (Effect, Action, Resource).</p>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-[#242424] flex justify-end gap-3 bg-[#111]">
                <Button 
                  variant="outline" 
                  className="border-[#242424] text-[#888] hover:text-white"
                  onClick={() => setEditingPolicy(null)}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                  onClick={handleSavePolicy}
                >
                  Save Policy
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatCard = ({ label, value, icon: Icon, color }: any) => {
  const colorMap = {
    blue: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    green: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    orange: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  } as any;

  return (
    <Card className="bg-[#141414] border-[#242424] hover:border-[#333] transition-colors group shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-semibold text-[#666] uppercase tracking-wider">{label}</CardTitle>
        <Icon className={`w-4 h-4 ${colorMap[color].split(' ')[0]} group-hover:scale-110 transition-transform`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
      </CardContent>
    </Card>
  );
};

const Plus = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
);

export default IAMDashboard;
