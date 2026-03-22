import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, Key, Activity, Search, 
  AlertCircle, 
  ChevronRight, Building2, Clock, Filter 
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

const IAMDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'policies' | 'audit'>('overview');
  const [summary, setSummary] = useState<IAMSummary | null>(null);
  const [users, setUsers] = useState<UserIdentity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview' || !summary) {
        const res = await fetch('/api/v1/iam/summary');
        if (res.ok) setSummary(await res.json());
      }
      if (activeTab === 'users') {
        const res = await fetch('/api/v1/iam/users');
        if (res.ok) setUsers(await res.json());
      }
      setError(null);
    } catch (err) {
      console.error('Failed to fetch IAM data:', err);
      setError('Failed to load IAM Center data. Ensure you have PLATFORM_ADMIN privileges.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'users', label: 'Identity Hub', icon: Users },
    { id: 'policies', label: 'Policy Templates', icon: Key },
    { id: 'audit', label: 'Security Audit', icon: Activity },
  ] as const;

  if (loading && !summary && users.length === 0) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-[#666] animate-pulse">Initializing Identity Hub...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-lg max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
          <p className="text-[#999] mb-4">{error}</p>
          <Button onClick={fetchData} variant="outline" className="border-red-500/50 text-red-500 hover:bg-red-500/10">
            Retry Connection
          </Button>
        </div>
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
                    <Activity className="w-5 h-5 text-purple-400" />
                    System Status Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-[#0F0F0F] rounded-lg border border-[#242424]">
                    <div>
                      <h4 className="text-white font-medium">Security Audit Feed</h4>
                      <p className="text-xs text-[#666]">Total authorization events captured: {summary.auditLogCount}</p>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                      Live Protection
                    </Badge>
                  </div>
                  
                  <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-lg">
                    <div className="flex gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-full h-fit mt-1">
                        <Shield className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold mb-1">Professional IAM Controls</h3>
                        <p className="text-[#999] text-sm leading-relaxed mb-4">
                          You are currently in the Global Platform Administration view. 
                          This center allows you to transcend organization boundaries to maintain consistency, 
                          security, and compliance across the entire enterprise.
                        </p>
                        <div className="flex gap-3">
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white">
                            View Audit Strategy
                          </Button>
                          <Button size="sm" variant="outline" className="border-[#333] text-[#999] hover:text-white">
                            Documentation
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

          {(activeTab === 'policies' || activeTab === 'audit') && (
            <div className="bg-[#141414] border border-dashed border-[#242424] rounded-lg p-12 text-center">
              <div className="bg-purple-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Module Under Development</h3>
              <p className="text-[#999] max-w-md mx-auto mb-6">
                The {activeTab === 'policies' ? 'Policy Manager' : 'Security Audit'} module is currently being architected. 
                Soon you'll be able to manage global templates and view real-time authorization flows here.
              </p>
              <Button onClick={() => setActiveTab('overview')} className="bg-[#1f1f1f] text-[#E3E3E3] hover:bg-[#252525] border border-[#333]">
                Return to Overview
              </Button>
            </div>
          )}
        </motion.div>
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
    <Card className="bg-[#141414] border-[#242424] hover:border-[#333] transition-colors group">
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

export default IAMDashboard;
