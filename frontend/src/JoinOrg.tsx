import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function JoinOrg() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'ERROR'>('LOADING');
    const [error, setError] = useState("");
    const [orgName, setOrgName] = useState("");

    useEffect(() => {
        const join = async () => {
            const authToken = localStorage.getItem("token");
            if (!authToken) {
                navigate(`/register?joinToken=${token}`);
                return;
            }

            try {
                const res = await fetch(`/api/v1/orgs/join/${token}`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${authToken}` }
                });

                if (res.ok) {
                    const data = await res.json();
                    setOrgName(data.name);
                    setStatus('SUCCESS');
                    setTimeout(() => navigate('/dashboard'), 2000);
                } else {
                    const msg = await res.text();
                    setError(msg || "Failed to join organization. The link may be expired or invalid.");
                    setStatus('ERROR');
                }
            } catch (e) {
                setError("Unable to connect to server");
                setStatus('ERROR');
            }
        };

        join();
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
            <div className="w-full max-w-md bg-[#0D0E12] border border-white/5 rounded-2xl p-8 shadow-2xl text-center">
                {status === 'LOADING' && (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                        <h1 className="text-xl font-bold text-white">Joining Organization...</h1>
                        <p className="text-slate-400">Please wait while we process your invitation.</p>
                    </div>
                )}

                {status === 'SUCCESS' && (
                    <div className="space-y-4 animate-fade-in">
                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                        <h1 className="text-xl font-bold text-white">Welcome to {orgName}!</h1>
                        <p className="text-slate-400">You have successfully joined the organization. Redirecting to your dashboard...</p>
                        <Link to="/dashboard" className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm font-medium mt-4">
                            Go to Dashboard <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                )}

                {status === 'ERROR' && (
                    <div className="space-y-4 animate-fade-in">
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <h1 className="text-xl font-bold text-white">Unable to join</h1>
                        <p className="text-red-400/80 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{error}</p>
                        <div className="pt-4 flex flex-col gap-2">
                            <Link to="/dashboard" className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4">
                                Back to Dashboard
                            </Link>
                            <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
