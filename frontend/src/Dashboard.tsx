import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
    const navigate = useNavigate();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            navigate('/');
        } else {
            setToken(storedToken);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    if (!token) {
        return <div className="p-8 text-white bg-gray-900 min-h-screen">Loading...</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-900 text-white p-8">
            <div className="w-full max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-12 border-b border-gray-800 pb-6">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">Mission Control</h1>
                        <p className="text-gray-400">System Status: Operational</p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-600/20 text-red-400 border border-red-900 rounded hover:bg-red-600/30 transition-colors"
                    >
                        Abort Session
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                        <h3 className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">Auth Token</h3>
                        <div className="font-mono text-xs text-green-400 break-all p-4 bg-black/50 rounded border border-gray-700">
                            {token}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
