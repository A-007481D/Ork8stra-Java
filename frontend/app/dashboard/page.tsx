'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (!storedToken) {
            router.push('/login');
        } else {
            setToken(storedToken);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (!token) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="flex min-h-screen bg-gray-100 p-8">
            <div className="w-full max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Dashboard</h1>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                        Logout
                    </button>
                </div>
                <p className="text-lg mb-4">Welcome! You are authenticated.</p>
                <div className="p-4 bg-green-50 rounded border border-green-200">
                    <p className="font-mono text-sm break-all text-gray-600">
                        <strong>Current Token:</strong> {token}
                    </p>
                </div>
            </div>
        </div>
    );
}
