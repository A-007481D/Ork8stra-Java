import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import Button from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';

export default function Login() {
    const { login, isLoading } = useAuth();
    const { showToast } = useToast();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username || !password) {
            showToast('error', 'Please enter both username and password');
            return;
        }

        setIsSubmitting(true);
        try {
            await login({ username, password });
            showToast('success', 'Welcome back to the cockpit');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Login failed. Check your credentials.';
            showToast('error', msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decor similar to GOrk8stra login */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-md border-white/10 bg-[#0B0C10] shadow-2xl">
                <CardHeader className="text-center pb-6 space-y-4">
                    <div className="mx-auto w-12 h-12 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                        O
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Welcome back
                        </CardTitle>
                        <CardDescription className="text-slate-400 mt-2">
                            Enter your credentials to access the flight deck.
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                disabled={isSubmitting || isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <a href="#" className="text-xs text-blue-400 hover:text-blue-300">Forgot password?</a>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={isSubmitting || isLoading}
                            />
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isSubmitting || isLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
                        >
                            Sign In
                        </Button>

                        <div className="text-center text-sm text-slate-500 mt-4">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                Sign up
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
