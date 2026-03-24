import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Building2, ShieldCheck, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { motion } from 'framer-motion';

const AcceptInvitation: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');
    
    const [status, setStatus] = useState<'loading' | 'confirm' | 'success' | 'error'>('loading');
    const [error, setError] = useState<string | null>(null);
    const [orgName, setOrgName] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setError('Missing invitation token.');
            return;
        }
        
        // In a real app, we might want to fetch invitation details first
        // to show which organization the user is joining.
        setStatus('confirm');
    }, [token]);

    const handleAccept = async () => {
        setStatus('loading');
        try {
            const res = await fetch(`/api/v1/invitations/accept?token=${token}`, {
                method: 'POST'
            });
            
            if (res.ok) {
                const org = await res.json();
                setOrgName(org.name);
                setStatus('success');
                setTimeout(() => {
                    navigate('/');
                }, 3000);
            } else {
                const msg = await res.text();
                setStatus('error');
                setError(msg || 'Failed to accept invitation. It may have expired or been revoked.');
            }
        } catch (err) {
            setStatus('error');
            setError('Network error. Please try again later.');
        }
    };

    return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <Card className="bg-[#141414] border-[#242424] shadow-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-purple-600 to-blue-600" />
                    
                    <CardHeader className="text-center pt-8">
                        <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
                            <Building2 className="w-8 h-8 text-purple-400" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">Join Organization</CardTitle>
                    </CardHeader>

                    <CardContent className="text-center px-8 pb-8">
                        {status === 'loading' && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
                                <p className="text-[#666]">Processing invitation...</p>
                            </div>
                        )}

                        {status === 'confirm' && (
                            <div className="space-y-6 py-4">
                                <p className="text-[#999] leading-relaxed">
                                    You have been invited to join an organization on the Kubelite platform. 
                                    Accepting this invitation will grant you access to their shared resources and deployments.
                                </p>
                                <Button 
                                    onClick={handleAccept}
                                    className="w-full bg-purple-600 hover:bg-purple-500 text-white py-6 text-lg font-bold group"
                                >
                                    Accept Invitation
                                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                    <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Welcome Aboard!</h3>
                                <p className="text-[#666]">
                                    You have successfully joined {orgName || 'the organization'}. 
                                    Redirecting you to the dashboard...
                                </p>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                    <ShieldAlert className="w-6 h-6 text-red-400" />
                                </div>
                                <h3 className="text-xl font-bold text-white">Invitation Error</h3>
                                <p className="text-red-400/80 text-sm">
                                    {error}
                                </p>
                                <Button 
                                    variant="outline"
                                    onClick={() => navigate('/')}
                                    className="mt-4 border-[#333] text-[#666] hover:text-white"
                                >
                                    Go back to safety
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

export default AcceptInvitation;
