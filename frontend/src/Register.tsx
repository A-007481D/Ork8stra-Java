import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { useAuth } from './contexts/AuthContext';
import { useToast } from './contexts/ToastContext';
import Button from './components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './components/ui/Card';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';

export default function Register() {
    const { register, isLoading } = useAuth();
    const { showToast } = useToast();

    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!username || !email || !password || !confirmPassword) {
            showToast('error', 'All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            showToast('error', 'Passwords do not match');
            return;
        }

        if (password.length < 8) {
            showToast('error', 'Password must be at least 8 characters');
            return;
        }

        setIsSubmitting(true);
        try {
            await register({ username, email, password });
            showToast('success', 'Account created! Welcome aboard.');
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Registration failed. Try a different username.';
            showToast('error', msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-[#050505] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decor */}
            <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[10%] left-[10%] w-[30%] h-[30%] rounded-full bg-indigo-600/5 blur-[100px] rounded-full pointer-events-none" />

            <Card className="w-full max-w-lg border-white/10 bg-[#0B0C10] shadow-2xl">
                <CardHeader className="text-center pb-6 space-y-2">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        Join <span className="text-blue-500">Ork8stra</span>
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Create your workspace and start deploying within seconds.
                    </CardDescription>
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
                                placeholder="jdoe"
                                required
                                disabled={isSubmitting || isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@example.com"
                                required
                                disabled={isSubmitting || isLoading}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
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

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    disabled={isSubmitting || isLoading}
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="lg"
                            isLoading={isSubmitting || isLoading}
                            className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 mt-2"
                        >
                            Create Account
                        </Button>

                        <div className="text-center text-sm text-slate-500 mt-4">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                                Sign In
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
