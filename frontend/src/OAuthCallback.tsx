import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from './contexts/AuthContext';

export default function OAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);
    const hasAttempted = useRef(false);

    useEffect(() => {
        const code = searchParams.get('code');

        if (!code) {
            setError('No authorization code found.');
            return;
        }

        if (hasAttempted.current) return;
        hasAttempted.current = true;

        const exchangeCode = async () => {
            try {
                const response = await fetch('/api/v1/auth/github/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ code }),
                });

                if (!response.ok) {
                    throw new Error('Failed to authenticate with GitHub');
                }

                const data = await response.json();

                localStorage.setItem('token', data.accessToken);
                localStorage.setItem('user', JSON.stringify({ username: data.username }));

                window.location.href = '/dashboard';
            } catch (err) {
                console.error('OAuth error:', err);
                setError('Authentication failed. Please try again.');
            }
        };

        exchangeCode();
    }, [searchParams, navigate, login]);

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans flex items-center justify-center overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center bg-[#0D0E12] p-12 rounded-2xl border border-white/10 shadow-2xl">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20 mb-8">
                    O
                </div>

                {error ? (
                    <div className="text-center space-y-4">
                        <h2 className="text-2xl font-bold text-red-400">Authentication Failed</h2>
                        <p className="text-slate-400">{error}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="mt-4 px-6 py-2 bg-[#1A1C20] hover:bg-[#22242A] border border-white/10 rounded-lg transition-colors"
                        >
                            Return to Login
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-6 flex flex-col items-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                        <div>
                            <h2 className="text-xl font-bold tracking-tight mb-2">Authenticating</h2>
                            <p className="text-slate-400 text-sm">Validating your GitHub credentials...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
