import React, { useState } from 'react';
import projectsApi from '../../api/projects';
import { useToast } from '../../contexts/ToastContext';
import type { Project } from '../../types';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface CreateProjectModalProps {
    onClose: () => void;
    onSuccess: (project: Project) => void;
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showToast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSubmitting(true);
        try {
            const project = await projectsApi.create({ name });
            onSuccess(project);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to create project';
            showToast('error', msg);
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <Card className="w-full max-w-md bg-[#111] border-[#222] shadow-2xl">
                <CardHeader className="flex justify-between items-center pb-4 border-b border-[#222]">
                    <CardTitle className="text-white">Create New Project</CardTitle>
                    <button onClick={onClose} className="text-[#666] hover:text-white transition-colors">
                        ✕
                    </button>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Project Name</Label>
                            <Input
                                id="projectName"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. my-awesome-app"
                                autoFocus
                                required
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-[#666]">
                                This will create a dedicated Kubernetes namespace.
                            </p>
                        </div>

                        <div className="flex gap-3 justify-end pt-2">
                            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" isLoading={isSubmitting} className="bg-blue-600 hover:bg-blue-500 text-white">
                                Create Project
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
