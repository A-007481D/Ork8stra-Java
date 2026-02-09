import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/Card';
import projectsApi from './api/projects';
// import applicationsApi from './api/applications';

export default function Dashboard() {
    const { user } = useAuth();
    const [projectCount, setProjectCount] = useState(0);
    // const [appCount, setAppCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const projects = await projectsApi.getAll();
                setProjectCount(projects.length);

                // TODO: potential N+1 query issue here if we fetch apps for every project
                // for now kept simple
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="p-10 md:p-14 min-h-full bg-[#0F0F0F] text-[#E3E3E3]">
            <header className="flex justify-between items-center mb-10">
                <div>
                    <h1 className="text-3xl font-bold mb-2 text-white">Welcome back, {user?.username}</h1>
                    <p className="text-[#888] text-lg">System status: <span className="text-emerald-500">Operational</span></p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                <Card className="bg-[#141414] border-[#2C2C2C] hover:border-[#3A3A3A] transition-colors">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#E3E3E3]">Total Projects</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-cyan-400">
                            {isLoading ? '...' : projectCount}
                        </div>
                        <div className="text-xs text-[#666] mt-2">Active workspaces</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#141414] border-[#2C2C2C] hover:border-[#3A3A3A] transition-colors">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#E3E3E3]">Applications</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-400">
                            {/* {isLoading ? '...' : appCount} */}
                            0
                        </div>
                        <div className="text-xs text-[#666] mt-2">Deployed services</div>
                    </CardContent>
                </Card>

                <Card className="bg-[#141414] border-[#2C2C2C] hover:border-[#3A3A3A] transition-colors">
                    <CardHeader>
                        <CardTitle className="text-lg text-[#E3E3E3]">System Health</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-500">100%</div>
                        <div className="text-xs text-[#666] mt-2">All systems normal</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card className="bg-[#141414] border-[#2C2C2C]">
                <CardHeader>
                    <CardTitle className="text-[#E3E3E3]">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-[#666] text-sm italic">
                        No recent builds or deployments found.
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
